import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, chatCompletion } from '../core/llmClient.js';

const baseParams = {
  or_model: 'deepseek/deepseek-chat-v3.1',
  messages: [{ role: 'user', content: 'hello' }],
  provider_pin: 'deepinfra',
  reasoning_enabled: false,
  temperature: 0.7,
  max_tokens: 800,
  apiKey: 'test-key-123',
};

test('buildRequest: URL is the chat completions endpoint', () => {
  const { url } = buildRequest(baseParams);
  assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
});

test('buildRequest: method is POST', () => {
  const { options } = buildRequest(baseParams);
  assert.equal(options.method, 'POST');
});

test('buildRequest: Authorization header is exactly "Bearer <key>"', () => {
  const { options } = buildRequest(baseParams);
  assert.equal(options.headers['Authorization'], 'Bearer test-key-123');
});

test('buildRequest: Content-Type header is application/json', () => {
  const { options } = buildRequest(baseParams);
  assert.equal(options.headers['Content-Type'], 'application/json');
});

test('buildRequest: X-OpenRouter-Metadata header is enabled', () => {
  const { options } = buildRequest(baseParams);
  assert.equal(options.headers['X-OpenRouter-Metadata'], 'enabled');
});

test('buildRequest: body includes messages verbatim', () => {
  const { options } = buildRequest(baseParams);
  const body = JSON.parse(options.body);
  assert.deepEqual(body.messages, baseParams.messages);
});

test('buildRequest: body includes temperature and max_tokens', () => {
  const { options } = buildRequest(baseParams);
  const body = JSON.parse(options.body);
  assert.equal(body.temperature, 0.7);
  assert.equal(body.max_tokens, 800);
});

test('buildRequest: provider pin present in verified syntax', () => {
  const { options } = buildRequest(baseParams);
  const body = JSON.parse(options.body);
  assert.deepEqual(body.provider, { only: ['deepinfra'], allow_fallbacks: false });
});

test('buildRequest: reasoning field omitted when reasoning_enabled is false', () => {
  const { options } = buildRequest(baseParams);
  const body = JSON.parse(options.body);
  assert.equal('reasoning' in body, false);
});

test('buildRequest: reasoning field present when reasoning_enabled is true', () => {
  const { options } = buildRequest({ ...baseParams, reasoning_enabled: true });
  const body = JSON.parse(options.body);
  assert.deepEqual(body.reasoning, { enabled: true });
});

function mockTransport(cannedBody, { status = 200, delayMs = 5 } = {}) {
  return async (url, options) => {
    await new Promise(r => setTimeout(r, delayMs));
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => cannedBody,
    };
  };
}

const cannedBody = {
  id: 'gen-xxxx',
  choices: [{ message: { content: 'hello from the model' }, finish_reason: 'stop' }],
  usage: {
    prompt_tokens: 50, completion_tokens: 30, total_tokens: 80,
    completion_tokens_details: { reasoning_tokens: 0 },
  },
  system_fingerprint: 'fp_xxxx',
};

test('chatCompletion: text matches canned content', async () => {
  const result = await chatCompletion({ ...baseParams, transport: mockTransport(cannedBody) });
  assert.equal(result.text, cannedBody.choices[0].message.content);
});

test('chatCompletion: usage passes through untouched', async () => {
  const result = await chatCompletion({ ...baseParams, transport: mockTransport(cannedBody) });
  assert.deepEqual(result.usage, cannedBody.usage);
});

test('chatCompletion: latency_ms is at least the mock delay', async () => {
  const result = await chatCompletion({ ...baseParams, transport: mockTransport(cannedBody, { delayMs: 10 }) });
  assert.ok(result.latency_ms >= 10, `expected latency_ms (${result.latency_ms}) >= 10`);
});

test('chatCompletion: timestamps are valid ISO and ordered', async () => {
  const result = await chatCompletion({ ...baseParams, transport: mockTransport(cannedBody) });
  assert.ok(!Number.isNaN(Date.parse(result.request_ts)), 'request_ts should be valid ISO');
  assert.ok(!Number.isNaN(Date.parse(result.response_ts)), 'response_ts should be valid ISO');
  assert.ok(result.request_ts <= result.response_ts, 'request_ts should be <= response_ts');
});

test('chatCompletion: missing openrouter_metadata yields upstream_provider null', async () => {
  const result = await chatCompletion({ ...baseParams, transport: mockTransport(cannedBody) });
  assert.equal(result.upstream_provider, null);
});

test('chatCompletion: raw deepEquals the canned body', async () => {
  const result = await chatCompletion({ ...baseParams, transport: mockTransport(cannedBody) });
  assert.deepEqual(result.raw, cannedBody);
});


test('chatCompletion: spy confirms outgoing messages match what was passed', async () => {
  const calls = [];
  const inner = mockTransport(cannedBody);
  const spying = async (url, options) => {
    calls.push({ url, options });
    return inner(url, options);
  };

  const history = [
    { role: 'user', content: 'turn 1' },
    { role: 'assistant', content: 'reply 1' },
    { role: 'user', content: 'turn 2' },
  ];

  await chatCompletion({ ...baseParams, messages: history, transport: spying });

  const sentBody = JSON.parse(calls[0].options.body);
 assert.deepEqual(sentBody.messages, history);
});