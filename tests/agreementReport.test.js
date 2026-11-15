// tests/agreementReport.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAgreementReport } from '../core/agreementReport.js';

const rubric = { rubric_version: 'v1', scale: ['no', 'yes', 'partial'],   // deliberately out of order
  criteria: [{ id: 'setup_respected', weight: 1, critical: true, values: { yes: 1, partial: 0.5, no: 0 } }] };
const human = (unit, verdict, s) => ({ unit_id: unit, turn_index: 3, overall_verdict: verdict, scores: { setup_respected: s } });
const ai = (judge, unit, verdict, s, extra = {}) => ({ eval_id: `${judge}:${unit}`, judge_model_id: judge, judge_repetition: 1,
  unit_id: unit, turn_index: 3, status: 'complete', parse_ok: true, overall_verdict: verdict, scores: { setup_respected: s }, ...extra });

const humanEvals = [human('u1', 'pass', 'yes'), human('u2', 'fail', 'no'), human('u3', 'pass', 'partial')];

test('one block per judge, never pooled, and the counts match the pairs', () => {
  const report = buildAgreementReport({ humanEvals, rubric, aiEvals: [
    ai('j-a', 'u1', 'pass', 'yes'), ai('j-a', 'u2', 'pass', 'partial'), ai('j-a', 'u3', 'pass', 'partial'),
    ai('j-b', 'u1', 'pass', 'yes'), ai('j-b', 'u2', 'fail', 'no'), ai('j-b', 'u3', 'pass', 'partial'),
  ] });
  assert.deepEqual(report.map(r => r.judge), ['j-a r1', 'j-b r1']);
  assert.equal(report[0].verdict.n, 3);
  assert.equal(report[0].verdict.agreed, 2);
  assert.equal(report[0].verdict.aStricter, 1);        // human failed u2, judge passed it
  assert.equal(report[1].verdict.agreed, 3);
});

test('exclusions carry a reason and never enter n', () => {
  const [r] = buildAgreementReport({ humanEvals, rubric, aiEvals: [
    ai('j-a', 'u1', 'pass', 'yes'),
    ai('j-a', 'u2', null, null, { parse_ok: false }),     // unparseable
  ] });                                                   // u3 never judged
  assert.deepEqual(r.excluded, { not_judged: 1, unparseable: 1 });
  assert.equal(r.verdict.n, 1);
});

test('scale order comes from the rubric values, not from the order it is written in', () => {
  const [r] = buildAgreementReport({ humanEvals: [human('u1', 'pass', 'yes')], rubric,
    aiEvals: [ai('j-a', 'u1', 'pass', 'partial')] });
  assert.equal(r.criteria.setup_respected.bStricter, 1);  // judge said partial, human said yes: judge stricter
});