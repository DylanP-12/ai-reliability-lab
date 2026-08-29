import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest } from '../core/llmClient.js';

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