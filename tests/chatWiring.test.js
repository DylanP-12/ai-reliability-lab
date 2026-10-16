import test from 'node:test';
import assert from 'node:assert/strict';
import { runConversation } from '../core/runConversation.js';

test('runConversation passes key and every model/config setting to chat (L037 smoke-run bug)', async () => {
  const seen = [];
  const chat = async (args) => {
    seen.push(args);
    return {
      text: 'ok',
      usage: { prompt_tokens: 1, completion_tokens: 1, reasoning_tokens: 0 },
      latency_ms: 1, reasoning_text: null, refusal_signal: null,
      upstream_provider: 'mock', model_fingerprint: null, finish_reason: 'stop', attempts: 1,
    };
  };

  await runConversation({
    scenario: { conversation_id: 'C001', category: 'test', turns: [{ turn_index: 1, prompt_text: 'hi' }] },
    model: { model_id: 'm1', or_model: 'vendor/m1', provider_pin: 'ProviderX', reasoning_enabled: false },
    repetition: 1,
    config: {
      run_id: 'r1', dataset_version: 'ds-test', temperature: 0.7, seed: 1,
      max_output_tokens: 800, request_timeout_ms: 120000, max_attempts: 3, system_prompt: null,
    },
    apiKey: 'test-key',
    onTurn: () => {},
    chat,
  });

  const { messages, ...settings } = seen[0]; // messages are covered by the §11 tests
  assert.deepEqual(settings, {
    or_model: 'vendor/m1',
    provider_pin: 'ProviderX',
    reasoning_enabled: false,
    temperature: 0.7,
    max_tokens: 800,
    timeout_ms: 120000,
    max_attempts: 3,
    apiKey: 'test-key',
  });
});