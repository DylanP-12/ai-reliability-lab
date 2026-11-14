// tests/buildHumanSheet.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHumanSheet } from '../core/buildHumanSheet.js';

const RUN = 'CANARY-RUN';
const MODELS = ['CANARY-MODEL-A', 'CANARY-MODEL-B'];

const scenarios = [
  { conversation_id: 'C001', turn_count: 2, checkpoints: [2], turns: [
    { turn_index: 1, prompt_text: 'p', evaluation_note: '' },
    { turn_index: 2, prompt_text: 'p', evaluation_note: 'SCORE' },
  ] },
  { conversation_id: 'C002', turn_count: 3, checkpoints: [2, 3], turns: [
    { turn_index: 1, prompt_text: 'p', evaluation_note: '' },
    { turn_index: 2, prompt_text: 'p', evaluation_note: 'SCORE' },
    { turn_index: 3, prompt_text: 'p', evaluation_note: 'Award no if peanuts appear' },
  ] },
];

const rubric = { rubric_version: 'test-v1', scale: ['yes', 'partial', 'no'],
  criteria: [{ id: 'c_one' }, { id: 'c_two' }, { id: 'c_three' }] };

function makeRecord(conv, model, rep, { status = 'complete', text = 'reply' } = {}) {
  const scenario = scenarios.find(s => s.conversation_id === conv);
  return {
    unit_id: `${RUN}:${conv}:${model}:r${String(rep).padStart(2, '0')}`,
    run_id: RUN, dataset_version: 'ds-test', conversation_id: conv,
    model_id: model, or_model: `CANARY-OR-${model}`, provider_pin: 'CANARY-PIN',
    repetition: rep, status,
    turns: scenario.turns.map(t => ({
      turn_index: t.turn_index,
      prompt_text: `${conv} prompt ${t.turn_index}`,
      response_text: `${text} ${conv} turn ${t.turn_index}`,
      is_checkpoint: scenario.checkpoints.includes(t.turn_index),
      upstream_provider: 'CANARY-UPSTREAM', model_fingerprint: 'CANARY-FP',
    })),
  };
}

function makeRecords() {
  const out = [];
  for (const model of MODELS) for (const conv of ['C001', 'C002']) for (const rep of [1, 2, 3]) {
    out.push(makeRecord(conv, model, rep));
  }
  return out;
}

const BASE = { scenarios, rubric, sheetId: 'hs-2026-11-13', seed: 20261113, createdAt: '2026-11-13T00:00:00.000Z' };
function build(overrides = {}) {
  return buildHumanSheet({ records: makeRecords(), rule: 'rehearsal-all', ...BASE, ...overrides });
}

function assertNoIdentity(value, records) {
  const canaries = new Set();
  for (const r of records) {
    for (const f of ['unit_id', 'run_id', 'model_id', 'or_model', 'provider_pin']) canaries.add(r[f]);
    for (const t of r.turns) { canaries.add(t.upstream_provider); canaries.add(t.model_fingerprint); }
  }
  const text = JSON.stringify(value);
  for (const c of canaries) assert.ok(!text.includes(c), `leaked identity: ${c}`);
}

// The model behind each blind ref, read through the private key (the key is allowed to know).
function modelsInRefOrder(sheet, records) {
  const byUnit = new Map(records.map(r => [r.unit_id, r.model_id]));
  return Object.keys(sheet.key.items).sort().map(ref => byUnit.get(sheet.key.items[ref].unit_id));
}

test('human packets contain no model, provider, run or unit identity', () => {
  const records = makeRecords();
  assertNoIdentity(build({ records }).packets, records);
});

test('score sheet columns and rows contain no identity', () => {
  const records = makeRecords();
  const sheet = build({ records });
  assertNoIdentity(sheet.sheetColumns, records);
  assertNoIdentity(sheet.sheetRows, records);
});

test('blind refs are opaque, sequential, and shared by packets and rows', () => {
  const { sheetRows, packets } = build();
  const refs = sheetRows.map(r => r.blind_ref);
  assert.ok(refs.every(r => /^H-\d{3}$/.test(r)));
  assert.deepEqual(refs, refs.map((_, i) => `H-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(packets.map(p => p.blind_ref), refs);
});

test('score columns come from the rubric, and every cell after blind_ref starts blank', () => {
  const { sheetColumns, sheetRows } = build();
  assert.deepEqual(sheetColumns, ['blind_ref', 'c_one', 'c_two', 'c_three', 'verdict', 'rater_note']);
  for (const row of sheetRows) for (const c of sheetColumns.slice(1)) assert.equal(row[c], '');
});

test('study-r01: repetition 1 only, equal items per model', () => {
  const records = makeRecords();
  const sheet = build({ records, rule: 'study-r01' });
  assert.ok(Object.values(sheet.key.items).every(i => i.unit_id.endsWith(':r01')));
  const models = modelsInRefOrder(sheet, records);
  assert.equal(models.length, 6);
  assert.equal(models.filter(m => m === MODELS[0]).length, 3);
  assert.equal(models.filter(m => m === MODELS[1]).length, 3);
});

test('study-r01 refuses an unbalanced sample and names the counts', () => {
  const records = makeRecords().filter(r =>
    !(r.model_id === MODELS[1] && r.conversation_id === 'C002' && r.repetition === 1));
  assert.throws(() => build({ records, rule: 'study-r01' }),
    err => /unbalanced/.test(err.message) && err.message.includes('"CANARY-MODEL-B":1'));
});

test('latest record per unit wins, and units that never completed are not sampled', () => {
  const records = makeRecords();
  const failedAttempt = makeRecord('C001', MODELS[0], 1, { status: 'failed', text: 'STALE-FAILED-TEXT' });
  const neverCompleted = makeRecord('C001', MODELS[0], 4, { status: 'failed', text: 'NEVER-COMPLETED' });
  const sheet = build({ records: [failedAttempt, ...records, neverCompleted] });
  const text = JSON.stringify(sheet.packets);
  assert.ok(!text.includes('STALE-FAILED-TEXT'));
  assert.ok(!text.includes('NEVER-COMPLETED'));
  const units = Object.values(sheet.key.items).map(i => i.unit_id);
  assert.equal(units.filter(u => u === failedAttempt.unit_id).length, 1);
  assert.equal(sheet.packets.length, 18);
});

test('same seed gives the same sheet; a different seed gives a different order', () => {
  const a = build(), b = build(), c = build({ seed: 7 });
  assert.deepEqual(a.key.items, b.key.items);
  assert.deepEqual(a.packets, b.packets);
  assert.notDeepEqual(a.key.items, c.key.items);
});

test('the order of lines in the input file does not change the sheet', () => {
  const records = makeRecords();
  assert.deepEqual(build({ records }).key.items, build({ records: [...records].reverse() }).key.items);
});

test('a string seed is refused, not silently coerced', () => {
  assert.throws(() => build({ seed: '20261113' }), /seed must be an integer/);
});

test('aggregate blinding: blind_ref order does not cluster by model', () => {
  const records = makeRecords();
  const models = modelsInRefOrder(build({ records }), records);
  const switches = models.slice(1).filter((m, i) => m !== models[i]).length;
  const firstHalf = models.slice(0, models.length / 2);
  assert.ok(switches >= 4, `only ${switches} model switches across ${models.length} refs: ${models.join(' ')}`);
  assert.ok(MODELS.every(m => firstHalf.includes(m)), 'the first half of the sheet is a single model');
});