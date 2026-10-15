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