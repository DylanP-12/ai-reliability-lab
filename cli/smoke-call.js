// cli/smoke-call.js
import { readFileSync } from 'node:fs';
import { chatCompletion } from '../core/llmClient.js';

const apiKey = process.env.OPENROUTER_API_KEY;

// TODO 1: guard clause — if there's no key, print an error to console.error
// and exit the process with a non-zero code. (Look back at the lesson's
// guided task step 2 for the exact wording if you want to match it.)

if (!apiKey) {
  console.error('No OPENROUTER_API_KEY in .env');
  process.exit(1);
}


const models = JSON.parse(readFileSync('./config/models.json', 'utf-8'));
const model = models.find(m => m.model_id === 'deepseek-v3.1');

// TODO 2: build the messages array. One user turn only:
// "Reply with exactly: ok"

const messages = [
  { role: 'user', content: 'Reply with exactly: ok' }
];



const result = await chatCompletion({
  or_model: model.or_model,
  messages,
  provider_pin: model.provider_pin,
  reasoning_enabled: model.reasoning_enabled,
  temperature: 0,
  max_tokens: 10,
  timeout_ms: 30000,
  max_attempts: 1,
  apiKey,
});

console.log('Response text:', result.text);

// TODO 3: provenance report — one console.log line per field:
// upstream_provider, model_fingerprint, finish_reason, usage,
// attempts, request_ts, response_ts.
// Do NOT print `result.raw` in full here if you're worried about size —
// that's fine either way, raw contains no secrets. Just never print
// anything from `options`/headers.

console.log('upstream_provider:', result.upstream_provider);
console.log('model_fingerprint:', result.model_fingerprint);
console.log('finish_reason:', result.finish_reason);
console.log('usage:', result.usage);
console.log('attempts:', result.attempts);
console.log('request_ts:', result.request_ts);
console.log('response_ts:', result.response_ts);