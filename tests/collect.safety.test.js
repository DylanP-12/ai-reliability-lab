// tests/collect.safety.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dispatch } from '../cli/dispatch.js';
import { expandUnits, scheduleUnits } from '../cli/expandUnits.js';

// ---- fixtures (copied from collect.resume.test.js) ----
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

function readLines(path) {
  return readFileSync(path, 'utf8').split('\n').filter((l) => l.trim());
}

// Every unit costs exactly $1.00: output price is $1,000,000 per M tokens,
// each reply is 1 token, and the input price is 0. Cap is $3.00.
function setupPriced() {
  const scenarios = [makeScenario('C001'), makeScenario('C002')];
  const priced = { price_in_per_m: 0, price_out_per_m: 1_000_000 };
  const models = [{ ...makeModel('m1'), ...priced }, { ...makeModel('m2'), ...priced }];
  const config = { ...baseConfig, repetitions: 2, max_output_tokens: 1, spend_cap_usd: 3 };
  const schedule = scheduleUnits(expandUnits(scenarios, models, config), config.seed);
  const dir = mkdtempSync(join(tmpdir(), 'collect-safety-'));
  return { scenarios, models, config, schedule, dir, outPath: join(dir, 'responses.jsonl') };
}

// ---- tests ----
test('cap halts: $1 per unit, $3 cap, exactly 3 units run', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setupPriced();
  const { chat, calls } = countingChat();
  try {
    const result = await dispatch({ schedule, scenarios, models, config, apiKey: 'k', outPath, chat });
    assert.equal(result.ran, 3);
    assert.equal(readLines(outPath).length, 3);
    assert.equal(calls(), 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cap fails closed: unknown model stops the run before any call', async () => {
  const { scenarios, config, dir, outPath } = setupPriced();

  // The schedule names a model, m9, that we never give to dispatch.
  const schedule = scheduleUnits(expandUnits(scenarios, [makeModel('m9')], config), config.seed);
  const { chat, calls } = countingChat();
  try {
    // models is EMPTY on purpose: dispatch cannot find m9 for the very first unit.
    const result = await dispatch({ schedule, scenarios, models: [], config, apiKey: 'k', outPath, chat });

    assert.equal(result.ran, 0);
    assert.equal(calls(), 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('failure isolation: unit 2 of 5 fails, all 5 still run', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setupPriced();
  const roomyConfig = { ...config, spend_cap_usd: 100 };   // so the cap does not interfere
  const five = schedule.slice(0, 5);

  // A chat that works, except the 2nd call throws.
  const { chat: okChat } = countingChat();
  let n = 0;
  const chat = async (...args) => {
    n++;
    if (n === 2) throw new Error('boom');
    return okChat(...args);
  };

  try {
    const result = await dispatch({ schedule: five, scenarios, models, config: roomyConfig, apiKey: 'k', outPath, chat });
    const records = readLines(outPath).map((l) => JSON.parse(l));

    assert.equal(result.ran, 5);                                              // your guess: units the loop got through
    assert.equal(records.length, 5);                                          // your guess: lines in the file
    assert.equal(records.filter((r) => r.status === 'failed').length, 1);     // your guess: failed records
    assert.equal(records.filter((r) => r.status === 'complete').length, 4);   // your guess: complete records
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('spacing: one wait of spacing_ms after each unit that ran', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setupPriced();
  const spacedConfig = { ...config, spend_cap_usd: 100, spacing_ms: 250 };
  const four = schedule.slice(0, 4);
  const { chat } = countingChat();

  // A sleep that never waits: it only writes down what it was asked to wait for.
  const delays = [];
  const sleepFn = async (ms) => { delays.push(ms); };

  try {
    await dispatch({ schedule: four, scenarios, models, config: spacedConfig, apiKey: 'k', outPath, chat, sleepFn });

    // HINT: 4 units ran, and each was followed by one wait. What does each wait equal?
        assert.deepEqual(delays, [250, 250, 250, 250]);   // replace the contents of the array
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});



test('stop request: loop stops between units, file stays valid', async () => {
  const { scenarios, models, config, schedule, dir, outPath } = setupPriced();
  const roomyConfig = { ...config, spend_cap_usd: 100 };
  const { chat, calls } = countingChat();

  // Says "stop" once two API calls have been made.
  const shouldStop = () => calls() >= 2;

  try {
    const result = await dispatch({ schedule, scenarios, models, config: roomyConfig, apiKey: 'k', outPath, chat, shouldStop });

    assert.equal(result.ran, 2);              // your guess: units that ran

    const lines = readLines(outPath);
    assert.equal(lines.length, 2);            // your guess: lines in the file
    lines.forEach((l) => JSON.parse(l));      // throws if any line is a half-written record
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});