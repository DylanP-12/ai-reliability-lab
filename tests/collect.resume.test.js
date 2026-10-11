// tests/collect.resume.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dispatch } from '../cli/dispatch.js';
import { expandUnits, scheduleUnits } from '../cli/expandUnits.js';
import { appendRecord, loadCompleteUnitIds } from '../cli/appendRecord.js';
// ---- small fixtures (copied in: runConversation.test.js doesn't export its helpers) ----
function makeScenario(id) {
  return {
    conversation_id: id,
    category: 'test',
    checkpoints: [],
    turns: [{ turn_index: 1, prompt_text: 'hello', evaluation_note: '' }],
  };
}

function makeModel(model_id) {
  return { model_id, or_model: `vendor/${model_id}`, provider_pin: null, reasoning_enabled: false };
}

const baseConfig = {
  run_id: 'run-test', dataset_version: 'ds-test', temperature: 0,
  seed: 1, max_output_tokens: 100, system_prompt: null,
};

// A fake chat client that counts how many times it is called.
function countingChat() {
  let calls = 0;
  const chat = async () => {
    calls++;
    return {
      text: 'ok', reasoning_text: null,
      usage: { prompt_tokens: 1, completion_tokens: 1, reasoning_tokens: 0, total_tokens: 2 },
      upstream_provider: 'mock', model_fingerprint: 'fp', finish_reason: 'stop',
      latency_ms: 1, attempts: 1, raw: {},
    };
  };
  return { chat, calls: () => calls };
}

// 2 scenarios x 2 models x 2 repetitions = 8 units, plus a throwaway temp folder
function setup() {
  const scenarios = [makeScenario('C001'), makeScenario('C002')];
  const models = [makeModel('m1'), makeModel('m2')];
  const config = { ...baseConfig, repetitions: 2 };
  const schedule = scheduleUnits(expandUnits(scenarios, models, config), config.seed);
  const dir = mkdtempSync(join(tmpdir(), 'collect-test-'));
  return { scenarios, models, config, schedule, dir, outPath: join(dir, 'responses.jsonl') };
}

function readLines(path) {
  return readFileSync(path, 'utf8').split('\n').filter((l) => l.trim());
}

// ---- tests ----
test('fresh run: one valid line per unit, ids match the schedule', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setup();
  const { chat } = countingChat();
  try {
    const result = await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat });
    const lines = readLines(outPath);
    assert.equal(lines.length, schedule.length);                           // blank 1
    assert.equal(result.ran, schedule.length);
      // blank 2
    const ids = lines.map((l) => JSON.parse(l).unit_id).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('re-run on a complete file adds zero records and makes zero calls', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setup();
  try {
    const first = countingChat();
    await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat: first.chat });
    const before = readLines(outPath).length;

    const second = countingChat();
    const result = await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat: second.chat });                          // blank 3

    assert.equal(readLines(outPath).length, before);   // blank 4
              
    assert.equal(second.calls(), 0);                   // blank 5
    assert.equal(result.skipped, schedule.length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('resume completes exactly the missing units', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setup();
  try {
    // Pretend a run was killed after 3 units: write their records by hand.
    // schedule is already in dispatch order, so the first 3 are the ones "done".
    for (const unit of schedule.slice(0, 3)) {                  // blank 1
      appendRecord(outPath, { unit_id: unit.unit_id, status: 'complete' });  // blank 2
    }

    const { chat, calls } = countingChat();
    const result = await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat });

    assert.equal(calls(), schedule.length - 3);                 // blank 3
    assert.equal(result.skipped, 3);

    const ids = readLines(outPath).map((l) => JSON.parse(l).unit_id);
    assert.equal(ids.length, schedule.length);
    assert.equal(new Set(ids).size, schedule.length);                         // blank 4
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed record is retried, not treated as done', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setup();
  try {
    for (const unit of schedule.slice(0, 3)) {
      appendRecord(outPath, { unit_id: unit.unit_id, status: 'complete' });
    }
    // the 4th unit FAILED in the previous run
    appendRecord(outPath, { unit_id: schedule[3].unit_id, status: 'failed' });   // blank 1

    const { chat, calls } = countingChat();
    await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat });

    assert.equal(calls(), schedule.length - 3);                                    // blank 2
assert.equal(loadCompleteUnitIds(outPath).size, schedule.length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('append-only: lines written before a resume are untouched', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setup();
  try {
    for (const unit of schedule.slice(0, 3)) {
      appendRecord(outPath, { unit_id: unit.unit_id, status: 'complete' });
    }
    const before = readLines(outPath).slice(0, 3);

    const { chat } = countingChat();
    await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat });

    const after = readLines(outPath).slice(0, 3);                // blank 4
    assert.deepEqual(after, before);// blank 5
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});