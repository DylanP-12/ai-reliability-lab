import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, chatCompletion } from '../core/llmClient.js';
import { classify, LlmError, backoffDelay } from '../core/llmClient.js';

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



test('classify: 429 is rate_limit, retryable', () => {
  const { classification, retryable } = classify(429);
  assert.equal(classification, 'rate_limit');
  assert.equal(retryable, true);
});

test('classify: 500-599 is server_error, retryable', () => {
  assert.equal(classify(500).classification, 'server_error');
  assert.equal(classify(503).classification, 'server_error');
  assert.equal(classify(500).retryable, true);
});

test('classify: 401 is auth, not retryable', () => {
  const { classification, retryable } = classify(401);
  assert.equal(classification, 'auth');
  assert.equal(retryable, false);
});

test('classify: 403 is auth, not retryable', () => {
  assert.equal(classify(403).classification, 'auth');
  assert.equal(classify(403).retryable, false);
});

test('classify: 404 is bad_request, not retryable', () => {
  assert.equal(classify(404).classification, 'bad_request');
  assert.equal(classify(404).retryable, false);
});

test('classify: plain 400 is bad_request, not retryable', () => {
  const { classification, retryable } = classify(400, 'missing field: temperature');
  assert.equal(classification, 'bad_request');
  assert.equal(retryable, false);
});

test('classify: 400 with context/token wording is context_overflow, not retryable', () => {
  const { classification, retryable } = classify(400, 'This model\'s maximum context length is 8192 tokens');
  assert.equal(classification, 'context_overflow');
  assert.equal(retryable, false);
});

test('classify: unrecognized status is unknown, not retryable', () => {
  assert.equal(classify(418).classification, 'unknown');
  assert.equal(classify(418).retryable, false);
});


test('backoffDelay: attempt 1 falls within 0.5x-1.5x of base', () => {
  const base = 500;
  const delay = backoffDelay(1, base);
  assert.ok(delay >= base * 0.5 && delay <= base * 1.5,
    `expected ${delay} to be within [${base * 0.5}, ${base * 1.5}]`);
});

test('backoffDelay: attempt 2 falls within 0.5x-1.5x of 2x base (doubled)', () => {
  const base = 500;
  const delay = backoffDelay(2, base);
  const expected = base * 2; // exponential doubling before jitter
  assert.ok(delay >= expected * 0.5 && delay <= expected * 1.5,
    `expected ${delay} to be within [${expected * 0.5}, ${expected * 1.5}]`);
});

test('backoffDelay: attempt 3 falls within 0.5x-1.5x of 4x base', () => {
  const base = 500;
  const delay = backoffDelay(3, base);
  const expected = base * 4;
  assert.ok(delay >= expected * 0.5 && delay <= expected * 1.5,
    `expected ${delay} to be within [${expected * 0.5}, ${expected * 1.5}]`);
});

test('backoffDelay: repeated calls are not all identical (jitter is live)', () => {
  const delays = Array.from({ length: 10 }, () => backoffDelay(1, 500));
  const allSame = delays.every(d => d === delays[0]);
  assert.equal(allSame, false);
});


function mockSequence(responses) {
  let call = 0;
  return async (url, options) => {
    const behavior = responses[Math.min(call, responses.length - 1)];
    call++;

    if (behavior.throw) {
      throw behavior.throw;
    }

    if (behavior.hang) {
      // never resolves on its own — only settles if something aborts it
      return new Promise((resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    }

    return {
      ok: behavior.status >= 200 && behavior.status < 300,
      status: behavior.status,
      json: async () => behavior.body ?? cannedBody,
    };
  };
}

test('chatCompletion: 429,429,200 succeeds with attempts:3 and two recorded delays', async () => {
  const delays = [];
  const transport = mockSequence([{ status: 429 }, { status: 429 }, { status: 200, body: cannedBody }]);

  const result = await chatCompletion({
    ...baseParams,
    transport,
    max_attempts: 5,
    backoffBase: 500,
    sleepFn: async (ms) => { delays.push(ms); },
  });

  assert.equal(result.attempts, 3);
  assert.equal(result.text, cannedBody.choices[0].message.content);
  assert.equal(delays.length, 2);
  assert.ok(delays[0] >= 250 && delays[0] <= 750, `delay[0]=${delays[0]}`);
  assert.ok(delays[1] >= 500 && delays[1] <= 1500, `delay[1]=${delays[1]}`);
});

test('chatCompletion: 500x3 with max_attempts 3 throws server_error with attempts:3', async () => {
  const delays = [];
  const transport = mockSequence([{ status: 500 }, { status: 500 }, { status: 500 }]);

  await assert.rejects(
    () => chatCompletion({
      ...baseParams, transport, max_attempts: 3, backoffBase: 500,
      sleepFn: async (ms) => { delays.push(ms); },
    }),
    (err) => {
      assert.equal(err.classification, 'server_error');
      assert.equal(err.attempts, 3);
      return true;
    }
  );
  assert.equal(delays.length, 2);
});

test('chatCompletion: 401 throws auth immediately with attempts:1 and zero delays', async () => {
  const delays = [];
  const transport = mockSequence([{ status: 401 }]);

  await assert.rejects(
    () => chatCompletion({
      ...baseParams, transport, max_attempts: 5,
      sleepFn: async (ms) => { delays.push(ms); },
    }),
    (err) => {
      assert.equal(err.classification, 'auth');
      assert.equal(err.attempts, 1);
      return true;
    }
  );
  assert.equal(delays.length, 0);
});

test('chatCompletion: 400 with context-length body throws context_overflow, not retried', async () => {
  const transport = mockSequence([
    { status: 400, body: { error: { message: 'maximum context length is 8192 tokens' } } },
  ]);

  await assert.rejects(
    () => chatCompletion({ ...baseParams, transport, max_attempts: 5 }),
    (err) => {
      assert.equal(err.classification, 'context_overflow');
      assert.equal(err.attempts, 1);
      return true;
    }
  );
});

test('chatCompletion: transport throw then success recovers with attempts:2', async () => {
  const transport = mockSequence([{ throw: new TypeError('fetch failed') }, { status: 200, body: cannedBody }]);

  const result = await chatCompletion({ ...baseParams, transport, max_attempts: 5, sleepFn: async () => {} });

  assert.equal(result.attempts, 2);
  assert.equal(result.text, cannedBody.choices[0].message.content);
});

test('chatCompletion: hang triggers timeout then recovers on retry', async () => {
  const transport = mockSequence([{ hang: true }, { status: 200, body: cannedBody }]);

  const result = await chatCompletion({
    ...baseParams, transport, max_attempts: 2, timeout_ms: 50, sleepFn: async () => {},
  });

  assert.equal(result.attempts, 2);
  assert.equal(result.text, cannedBody.choices[0].message.content);
});

test('chatCompletion: success result still carries full provenance (regression guard)', async () => {
  const transport = mockSequence([{ status: 200, body: cannedBody }]);
  const result = await chatCompletion({ ...baseParams, transport, max_attempts: 3 });

  assert.equal(result.attempts, 1);
  assert.deepEqual(result.usage, cannedBody.usage);
  assert.deepEqual(result.raw, cannedBody);
  assert.ok(!Number.isNaN(Date.parse(result.request_ts)));
});