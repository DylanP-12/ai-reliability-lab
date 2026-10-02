import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runConversation } from '../core/runConversation.js';

// ── Test fixtures ──

// Builds a scenario with one turn per prompt.
function makeScenario(prompts, { notes = [] } = {}) {
  return {
    conversation_id: 'C001',
    category: 'test',
    checkpoints: [],
    turns: prompts.map((prompt_text, i) => ({
      turn_index: i + 1,
      prompt_text,
      evaluation_note: notes[i] ?? '',
    })),
  };
}

function makeModel(model_id) {
  return {
    model_id,
    or_model: `vendor/${model_id}`,
    provider_pin: null,
    reasoning_enabled: false,
  };
}

const baseConfig = {
  run_id: 'run-test',
  dataset_version: 'ds-test',
  temperature: 0,
  seed: 1,
  max_output_tokens: 100,
  system_prompt: null,
};

// ── §11 conversation integrity ──

// A mock chat client that snapshots every messages array it is sent.
function capturingChat(tag = '') {
  const sent = [];
  const chat = async ({ messages }) => {
    sent.push(structuredClone(messages));
    const n = sent.length;
    const label = tag ? `${tag}-R${n}` : `R${n}`;
    return {
      text: label,
      reasoning_text: `SECRET-THOUGHT-${n}`,
      usage: { prompt_tokens: 1, completion_tokens: 1, reasoning_tokens: 0, total_tokens: 2 },
      upstream_provider: 'mock',
      model_fingerprint: 'fp',
      finish_reason: 'stop',
      latency_ms: 1,
      attempts: 1,
      raw: {},
    };
  };
  return { chat, sent };
}

test('wiring check: capturing client sees one call per turn', async () => {
  const capture = capturingChat();
  const record = await runConversation({
    scenario: makeScenario(['P1', 'P2', 'P3']),
    model: makeModel('model-a'),
    repetition: 1,
    config: baseConfig,
    chat: capture.chat,
  });
  assert.equal(record.status, 'complete');
  assert.equal(capture.sent.length, 3);
});

test('§11-1 exact composition: each turn sends exactly the prior history plus the new prompt', async () => {
  const capture = capturingChat();
  await runConversation({
    scenario: makeScenario(['P1', 'P2', 'P3']),
    model: makeModel('model-a'),
    repetition: 1,
    config: baseConfig,
    chat: capture.chat,
  });

  const u = (content) => ({ role: 'user', content });
  const a = (content) => ({ role: 'assistant', content });

  assert.deepEqual(capture.sent[0], [u('P1')]);
  assert.deepEqual(capture.sent[1], [u('P1'), a('R1'), u('P2')]);
  assert.deepEqual(capture.sent[2], [u('P1'), a('R1'), u('P2'), a('R2'), u('P3')]);
});


test('§11-2 no cross-model contamination', async () => {
  const captureA = capturingChat('A');
  const captureB = capturingChat('B');
  const scenario = makeScenario(['P1', 'P2']);

  await runConversation({
    scenario, model: makeModel('model-a'), repetition: 1,
    config: baseConfig, chat: captureA.chat,
  });
  await runConversation({
    scenario, model: makeModel('model-b'), repetition: 1,
    config: baseConfig, chat: captureB.chat,
  });

  assert.equal(captureB.sent[0].length, 1);
  const trafficB = JSON.stringify(captureB.sent);
   assert.ok(!trafficB.includes('A-R1'), 'model-b traffic must not contain model-a replies');
});

test('§11-3 no cross-repetition contamination (shared client)', async () => {
  const shared = capturingChat();
  const scenario = makeScenario(['P1', 'P2']);
  const model = makeModel('model-a');

  await runConversation({ scenario, model, repetition: 1, config: baseConfig, chat: shared.chat });
  const repTwoFirstCallIndex = shared.sent.length; // where rep 2's calls start
  await runConversation({ scenario, model, repetition: 2, config: baseConfig, chat: shared.chat });

  assert.equal(shared.sent[repTwoFirstCallIndex].length, 1);
  const rep2Traffic = JSON.stringify(shared.sent.slice(repTwoFirstCallIndex));
  assert.ok(!rep2Traffic.includes('R1'), 'rep 2 traffic must not contain rep 1 replies');
});

test('§11-4 single-turn scenario, no special case', async () => {
  const capture = capturingChat();
  const record = await runConversation({
    scenario: makeScenario(['P1']),
    model: makeModel('model-a'),
    repetition: 1,
    config: baseConfig,
    chat: capture.chat,
  });

  assert.deepEqual(capture.sent[0], [{ role: 'user', content: 'P1' }]);
  assert.equal(capture.sent.length, 1);
  assert.equal(record.status, 'complete');
});


test('§11-5 reasoning_text never enters outgoing history', async () => {
  const capture = capturingChat();
  await runConversation({
    scenario: makeScenario(['P1', 'P2']),
    model: makeModel('model-a'),
    repetition: 1,
    config: baseConfig,
    chat: capture.chat,
  });

  const traffic = JSON.stringify(capture.sent);
  assert.ok(!traffic.includes('SECRET-THOUGHT'), 'reasoning_text must never appear in outgoing messages');
});

test('§11-6 evaluation_note never enters outgoing history', async () => {
  const capture = capturingChat();
  await runConversation({
    scenario: makeScenario(['P1', 'P2'], { notes: ['secret-note-A', 'secret-note-B'] }),
    model: makeModel('model-a'),
    repetition: 1,
    config: baseConfig,
    chat: capture.chat,
  });

  const traffic = JSON.stringify(capture.sent);
  assert.ok(!traffic.includes('secret-note'), 'evaluation_note must never appear in outgoing messages');
});