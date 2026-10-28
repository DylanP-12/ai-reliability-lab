import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareAppData, unitFile } from '../cli/prepare-app-data.js';

// Adversarial on purpose: accent, emoji, tab, newline, and trailing spaces.
const TRICKY = 'Caf\u00e9 \u2615 \u{1F600}\tTabbed  \nSecond line  ';
const FAKE_KEY = 'sk-or-v1-FAKEKEY0123456789abcdef0123456789';

const OK_UNIT = 'run-x:FIX1:modelA:r01';
const FAIL_UNIT = 'run-x:FIX1:modelA:r02';
const RETRY_UNIT = 'run-x:FIX1:modelA:r03';

function turn(i, prompt, response, isCheckpoint) {
  return {
    turn_index: i,
    prompt_text: prompt,
    response_text: response,
    is_checkpoint: isCheckpoint,
    upstream_provider: 'ProviderSecretName',
  };
}

function base(unitId, repetition) {
  return {
    unit_id: unitId, conversation_id: 'FIX1', model_id: 'modelA', category: 'format',
    repetition, reasoning_enabled: false,
  };
}

function buildFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'prep-test-'));
  const records = [
    {
      ...base(OK_UNIT, 1), status: 'complete', debug_auth: FAKE_KEY,
      turns: [turn(1, 'Hello', 'Hi there', false), turn(2, 'Second prompt', TRICKY, true)],
    },
    {
      ...base(FAIL_UNIT, 2), status: 'failed', turns: [],
      error: { stage: 'generation', turn_index: 1, classification: 'auth', message: 'status 401' },
    },
    {
      ...base(RETRY_UNIT, 3), status: 'failed', turns: [],
      error: { stage: 'generation', turn_index: 1, classification: 'rate_limit', message: 'status 429' },
    },
    {
      ...base(RETRY_UNIT, 3), status: 'complete',
      turns: [turn(1, 'Hello', 'Hi again', false), turn(2, 'Second prompt', 'Retry worked', true)],
    },
  ];
  writeFileSync(join(dir, 'responses.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  writeFileSync(join(dir, 'models.json'), JSON.stringify([
    { model_id: 'modelA', label: 'Model A', or_model: 'vendor/model-a', provider_pin: 'somehost',
      api_key: FAKE_KEY, reasoning_enabled: false, family: 'fam', weights: 'open',
      price_in_per_m: 1, price_out_per_m: 2 },
  ]), 'utf8');
  writeFileSync(join(dir, 'scenarios.csv'),
    'conversation_id,turn_index,prompt_text,evaluation_note,category\n' +
    'FIX1,1,Hello,,format\n' +
    'FIX1,2,Second prompt,CANARY_PRIVATE_NOTE_7731,format\n', 'utf8');
  writeFileSync(join(dir, 'scenarios.meta.json'), JSON.stringify({ categories: ['format'] }), 'utf8');
  return dir;
}

function runPrep() {
  const dir = buildFixture();
  const outDir = join(dir, 'out');
  prepareAppData({
    responsesPath: join(dir, 'responses.jsonl'),
    modelsPath: join(dir, 'models.json'),
    scenariosPath: join(dir, 'scenarios.csv'),
    metaPath: join(dir, 'scenarios.meta.json'),
    outDir,
  });
  return outDir;
}

function readAllOutputs(outDir) {
  return readdirSync(outDir, { recursive: true })
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ name, text: readFileSync(join(outDir, name), 'utf8') }));
}

function readIndex(outDir) {
  return JSON.parse(readFileSync(join(outDir, 'index.json'), 'utf8'));
}

test('byte-identity: derived response_text === frozen source, character for character', () => {
  const outDir = runPrep();
  const convo = JSON.parse(readFileSync(join(outDir, unitFile(OK_UNIT)), 'utf8'));
  assert.equal(convo.turns[1].response_text, TRICKY);
});

test('no secrets: a planted key (env, frozen record, models config) appears in no output file', () => {
  const saved = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = FAKE_KEY;
  try {
    const outDir = runPrep();
    const files = readAllOutputs(outDir);
    assert.ok(files.length >= 4, 'expected index, models, scenarios, and a conversation file');
    for (const { name, text } of files) {
      assert.ok(!text.includes(FAKE_KEY), `${name} contains the planted key`);
      assert.ok(!/sk-[A-Za-z0-9_-]{10,}/.test(text), `${name} has a secret-shaped string`);
      assert.ok(!/Bearer\s/i.test(text), `${name} has an auth header shape`);
      assert.ok(!text.includes('ProviderSecretName'), `${name} leaks the provider name`);
      assert.ok(!text.includes('somehost'), `${name} leaks provider_pin`);
      assert.ok(!text.includes('vendor/model-a'), `${name} leaks or_model`);
    }
  } finally {
    if (saved === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = saved;
  }
});

test('no private notes: scenarios.json has no evaluation_note field and no canary text anywhere', () => {
  const outDir = runPrep();
  const scenarios = JSON.parse(readFileSync(join(outDir, 'scenarios.json'), 'utf8'));
  assert.equal(scenarios.length, 1);
  for (const scenario of scenarios) {
    for (const t of scenario.turns) {
      assert.ok(!('evaluation_note' in t), `turn ${t.turn_index} still has evaluation_note`);
    }
  }
  assert.deepEqual(scenarios[0].checkpoints, [2]);
  for (const { name, text } of readAllOutputs(outDir)) {
    assert.ok(!text.includes('evaluation_note'), `${name} mentions evaluation_note`);
    assert.ok(!text.includes('CANARY_PRIVATE_NOTE_7731'), `${name} leaks the private note text`);
  }
});

test('failed unit honest: stays in the index with status and reason, never a fake score', () => {
  const outDir = runPrep();
  const entry = readIndex(outDir).find((e) => e.unit_id === FAIL_UNIT);
  assert.ok(entry, 'failed unit was dropped from index.json');
  assert.equal(entry.status, 'failed');
  assert.deepEqual(entry.failure, { classification: 'auth', turn_index: 1 });
  assert.equal(entry.turn_count, 0);
  assert.ok(!Object.keys(entry).some((k) => /score/i.test(k)), 'failed unit carries a score field');
});

test('retry: when a unit has several records, the last one wins and there is one entry', () => {
  const outDir = runPrep();
  const entries = readIndex(outDir).filter((e) => e.unit_id === RETRY_UNIT);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].status, 'complete');
  assert.ok(!('failure' in entries[0]), 'superseded failure leaked into the final entry');
});

test('lazy shape: index has no transcript text, and every entry points at a real file', () => {
  const outDir = runPrep();
  const indexText = readFileSync(join(outDir, 'index.json'), 'utf8');
  assert.ok(!indexText.includes('response_text'));
  assert.ok(!indexText.includes('prompt_text'));
  assert.ok(!indexText.includes('Tabbed'));
  for (const entry of readIndex(outDir)) {
    assert.ok(existsSync(join(outDir, entry.file)), `missing file for ${entry.unit_id}`);
  }
});