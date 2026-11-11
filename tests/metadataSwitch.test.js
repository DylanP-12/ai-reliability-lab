import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest } from '../core/llmClient.js';
import { runConversation } from '../core/runConversation.js';
import { DEMO_CONFIG } from '../app/src/lib/demoRun.js';

const base = { or_model: 'x/y', messages: [{ role: 'user', content: 'hi' }], provider_pin: 'p',
  reasoning_enabled: false, temperature: 0, max_tokens: 5, apiKey: 'k' };

test('metadata header is on by default (study keeps provenance)', () => {
  const { options } = buildRequest(base);
  assert.equal(options.headers['X-OpenRouter-Metadata'], 'enabled');
});

test('metadata:false omits only that header', () => {
  const { options } = buildRequest({ ...base, metadata: false });
  assert.ok(!('X-OpenRouter-Metadata' in options.headers));
  assert.equal(options.headers['Authorization'], 'Bearer k');
  assert.equal(options.headers['Content-Type'], 'application/json');
});

async function seenMetadata(config) {
  const seen = [];
  const chat = async (args) => {
    seen.push(args);
    return { text: 'ok', reasoning_text: null, usage: { prompt_tokens: 1, completion_tokens: 1 },
      upstream_provider: null, model_fingerprint: null, finish_reason: 'stop', latency_ms: 1, attempts: 1 };
  };
  await runConversation({
    scenario: { conversation_id: 'T', turns: [{ turn_index: 1, prompt_text: 'hi' }] },
    model: { model_id: 'm', or_model: 'x/y', provider_pin: 'p', reasoning_enabled: false },
    repetition: 1, config, apiKey: 'k', chat,
  });
  return seen[0]?.metadata;
}

test('runner passes metadata:true when config does not mention it (study path unchanged)', async () => {
  const { openrouter_metadata, ...studyLike } = DEMO_CONFIG;
  assert.equal(await seenMetadata(studyLike), true);
});

test('runner passes metadata:false from DEMO_CONFIG to chat', async () => {
  assert.equal(await seenMetadata(DEMO_CONFIG), false);
});