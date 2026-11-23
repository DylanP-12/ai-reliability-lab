// tests/acceptance/timestamps.test.js
// Gap closed in L063: "All timestamps ISO-8601 UTC".
// Part 1 walks a real runConversation record. Part 2 guards every producer in core/ and cli/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runConversation } from '../../core/runConversation.js';

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const TIME_KEY = /(_at|_ts|At)$/;   // started_at, request_ts, createdAt, ...

// Collect every timestamp-named field anywhere in an object, with its path.
function findTimestamps(value, path = 'record', found = []) {
  if (Array.isArray(value)) value.forEach((v, i) => findTimestamps(v, `${path}[${i}]`, found));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (TIME_KEY.test(k)) found.push([`${path}.${k}`, v]);
      else findTimestamps(v, `${path}.${k}`, found);
    }
  }
  return found;
}

const fakeChat = async () => ({
  text: 'ok', reasoning_text: null,
  usage: { prompt_tokens: 1, completion_tokens: 1, reasoning_tokens: 0, total_tokens: 2 },
  upstream_provider: 'mock', model_fingerprint: 'fp', finish_reason: 'stop',
  latency_ms: 1, attempts: 1, raw: {},
});

test('ACCEPT/integrity: every timestamp in a conversation record is ISO-8601 UTC', async () => {
  const record = await runConversation({
    scenario: {
      conversation_id: 'C001', category: 'test', checkpoints: [2],
      turns: [
        { turn_index: 1, prompt_text: 'P1', evaluation_note: '' },
        { turn_index: 2, prompt_text: 'P2', evaluation_note: 'SCORE' },
      ],
    },
    model: { model_id: 'model-a', or_model: 'vendor/model-a', provider_pin: null, reasoning_enabled: false },
    repetition: 1,
    config: { run_id: 'run-test', dataset_version: 'ds-test', temperature: 0, seed: 1, max_output_tokens: 100, system_prompt: null },
    chat: fakeChat,
  });

  const stamps = findTimestamps(record);
  // Not vacuous: started_at + finished_at + request_ts and response_ts on each of 2 turns.
  assert.ok(stamps.length >= 6, `expected at least 6 timestamp fields, found ${stamps.length}: ${stamps.map(s => s[0]).join(', ')}`);
  for (const [path, v] of stamps) {
    assert.equal(typeof v, 'string', `${path} is not a string`);
    assert.match(v, ISO_UTC, `${path} = ${v} is not ISO-8601 UTC`);
    assert.ok(!Number.isNaN(Date.parse(v)), `${path} = ${v} does not parse`);
  }
});

test('ACCEPT/integrity: core/ and cli/ only ever make times with new Date().toISOString()', () => {
  for (const dir of ['core', 'cli']) {
    for (const name of readdirSync(dir).filter(f => f.endsWith('.js'))) {
      const src = readFileSync(join(dir, name), 'utf8');
      const dates = src.match(/new Date\([^)]*\)(\.\w+\(\))?/g) ?? [];
      for (const d of dates) {
        assert.equal(d, 'new Date().toISOString()', `${dir}/${name}: "${d}" makes a time some other way`);
      }
      assert.doesNotMatch(src, /toLocale(Date|Time)?String|getTimezoneOffset|toUTCString/,
        `${dir}/${name} formats a time in a non-ISO way`);
    }
  }
});