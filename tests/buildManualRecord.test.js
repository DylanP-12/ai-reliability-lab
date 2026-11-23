import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManualRecord } from '../core/buildManualRecord.js';
import { runConversation, sha256 } from '../core/runConversation.js';

const scenario = {
  conversation_id: 'C001',
  category: 'test',
  checkpoints: [2],
  turns: [
    { turn_index: 1, prompt_text: 'first prompt' },
    { turn_index: 2, prompt_text: 'second, "quoted" prompt' },
  ],
};

const base = {
  scenario,
  modelId: 'meta-ai',
  repetition: 1,
  responses: ['one', 'two'],
  runId: 'gen-manual-test',
  datasetVersion: 'v1',
  collectedAt: '2026-11-16T00:00:00Z',
};

test('ACCEPT/manual: schema drift guard: manual record keys match a live runConversation record', async () => {
  const mockChat = async () => ({
    text: 'ok', usage: { prompt_tokens: 1, completion_tokens: 1 }, latency_ms: 1,
    reasoning_text: null, refusal_signal: null, upstream_provider: 'x',
    model_fingerprint: null, finish_reason: 'stop', attempts: 1,
  });
  const live = await runConversation({
    scenario,
    model: { model_id: 'meta-ai', or_model: 'x/y', provider_pin: 'p', reasoning_enabled: false },
    repetition: 1,
    config: { run_id: 'gen-manual-test', dataset_version: 'v1', temperature: 0, seed: 1,
              max_output_tokens: 10, request_timeout_ms: 1000, max_attempts: 1 },
    apiKey: 'test-key-not-real',
    chat: mockChat,
  });
  const manual = await buildManualRecord(base);
  assert.deepEqual(Object.keys(manual).sort(), Object.keys(live).sort());
  assert.deepEqual(Object.keys(manual.turns[0]).sort(), Object.keys(live.turns[0]).sort());
});

test('ACCEPT/manual: response text survives byte-identical (emoji, quote, newline, trailing space)', async () => {
  const nasty = 'Hi \u{1F44B} she said "ok"\nline two with a trailing space ';
  const rec = await buildManualRecord({ ...base, responses: [nasty, nasty] });
  assert.strictEqual(rec.turns[0].response_text, nasty);
});

// TODO (you write these five):
// 1. prompt_text and prompt_hash come from the scenario, not from the input
// 2. wrong response count throws, and the message states expected vs found
// 3. usage, latency_ms, attempts, model_fingerprint are null, and upstream_provider is 'manual'
// 4. is_checkpoint is true only on turn 2 for this scenario
// 5. a single-turn scenario works with no special case

test('prompt_text and prompt_hash come from the scenario, not the input', async () => {
  const rec = await buildManualRecord(base);
  assert.strictEqual(rec.turns[1].prompt_text, scenario.turns[1].prompt_text);
  assert.strictEqual(rec.turns[1].prompt_hash, await sha256(scenario.turns[1].prompt_text));
});

test('wrong response count throws, stating expected vs found', async () => {
  await assert.rejects(
    () => buildManualRecord({ ...base, responses: ['only one'] }),
    /expected 2.*found 1/
  );
});
test('ACCEPT/manual: unmeasured fields are null, never zero, and the provider is manual', async () => {
  const t = (await buildManualRecord(base)).turns[0];
  assert.strictEqual(t.usage, null);
  assert.strictEqual(t.latency_ms, null);
  assert.strictEqual(t.attempts, null);
  assert.strictEqual(t.model_fingerprint, null);
  assert.strictEqual(t.upstream_provider, 'manual');
});

test('checkpoint flags follow the scenario: turn 1 false, turn 2 true', async () => {
  const rec = await buildManualRecord(base);
  assert.strictEqual(rec.turns[0].is_checkpoint, false);
  assert.strictEqual(rec.turns[1].is_checkpoint, true);
});

test('a single-turn scenario works with no special case', async () => {
  const oneTurn = {
    conversation_id: 'C009',
    category: 'test',
    checkpoints: [],
    turns: [{ turn_index: 1, prompt_text: 'only prompt' }],
  };
  const rec = await buildManualRecord({ ...base, scenario: oneTurn, responses: ['only'] });
  assert.strictEqual(rec.turns.length, 1);
  assert.strictEqual(rec.turns[0].response_text, 'only');
  assert.strictEqual(rec.turns[0].is_checkpoint, false);
});