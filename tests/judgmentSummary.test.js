import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeJudgments } from '../app/src/lib/judgmentSummary.js';

const pass = { status: 'complete', parse_ok: true, overall_verdict: 'pass', critical_failed: false };
const critFail = { status: 'complete', parse_ok: true, overall_verdict: 'fail', critical_failed: true };
const unparsed = { status: 'complete', parse_ok: false, overall_verdict: 'fail' }; // sneaky leftover verdict
const failedCall = { status: 'failed', parse_ok: false };

test('all judges agree: no disagreement flag', () => {
  const s = summarizeJudgments([pass, pass]);
  assert.equal(s.pass, 2);
  assert.equal(s.disagree, false);
  assert.equal(s.critical_disputed, false);
});

test('2 pass vs 1 critical fail: disagreement AND disputed, not a quiet pass', () => {
  const s = summarizeJudgments([pass, pass, critFail]);
  assert.equal(s.pass, 2);
  assert.equal(s.fail, 1);
  assert.equal(s.disagree, true);
  assert.equal(s.critical_disputed, true);
});

test('unparseable and failed calls never vote, even with a leftover verdict', () => {
  const s = summarizeJudgments([pass, unparsed, failedCall]);
  assert.equal(s.pass, 1);
  assert.equal(s.fail, 0);
  assert.equal(s.not_scored, 2);
  assert.equal(s.disagree, false);
});