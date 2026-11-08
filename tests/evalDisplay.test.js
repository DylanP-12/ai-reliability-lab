import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEvalDisplay } from '../cli/prepare-app-data.js';

const base = {
  eval_id: 'e1', unit_id: 'u1', turn_index: 8, judge_model_id: 'judge-a',
  judge_repetition: 1, rubric_version: 'v1',
  usage: { prompt_tokens: 10 }, upstream_provider: 'SECRET-PROVIDER',
  model_fingerprint: 'SECRET-FP', latency_ms: 5,
};
const SCORE_KEYS = ['scores', 'weighted_score', 'overall_verdict', 'critical_failed'];

test('unparseable: keeps raw text and reason, has no score of any kind', () => {
  const d = toEvalDisplay({
    ...base, status: 'complete', parse_ok: false,
    raw_output: 'I cannot evaluate this.', error: 'no JSON object found',
    weighted_score: 0, overall_verdict: 'fail', // sneaky defaults must NOT pass through
  });
  assert.equal(d.parse_ok, false);
  assert.equal(d.raw_output, 'I cannot evaluate this.');
  assert.equal(d.error_reason, 'no JSON object found');
  for (const k of SCORE_KEYS) assert.ok(!(k in d), `unparseable eval leaked ${k}`);
});

test('failed call: reason from classification, no score', () => {
  const d = toEvalDisplay({ ...base, status: 'failed', error: { classification: 'timeout' } });
  assert.equal(d.error_reason, 'timeout');
  for (const k of SCORE_KEYS) assert.ok(!(k in d));
});

test('scored: carries scores, verdict, critical flag and raw text', () => {
  const d = toEvalDisplay({
    ...base, status: 'complete', parse_ok: true,
    scores: { a: 'no', b: 'yes' }, weighted_score: 0.5,
    overall_verdict: 'fail', critical_failed: true, raw_output: '{...}',
  });
  assert.deepEqual(d.scores, { a: 'no', b: 'yes' });
  assert.equal(d.overall_verdict, 'fail');
  assert.equal(d.critical_failed, true);
  assert.equal(d.raw_output, '{...}');
});

test('whitelist: private fields never reach the browser', () => {
  const d = toEvalDisplay({ ...base, status: 'complete', parse_ok: true, scores: {}, raw_output: '' });
  const text = JSON.stringify(d);
  for (const secret of ['SECRET-PROVIDER', 'SECRET-FP', 'prompt_tokens', 'latency_ms']) {
    assert.ok(!text.includes(secret), `leaked ${secret}`);
  }
});