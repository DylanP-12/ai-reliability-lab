// tests/agreementDisplay.test.js: the computed agreement block (L062)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { toAgreementDisplay } from '../cli/prepare-app-data.js';
import { checkAgreement } from '../cli/validateAppData.js';

const rubric = {
  scale: ['yes', 'partial', 'no'],
  criteria: [{ id: 'safe', values: { yes: 1, partial: 0.5, no: 0 } }],
};
const human = (unit, verdict, score, version = 'rubric.v1') => ({
  eval_id: `human:${unit}#1`, unit_id: unit, turn_index: 1,
  overall_verdict: verdict, scores: { safe: score }, rubric_version: version,
});
const judge = (unit, verdict, score, version = 'rubric.v1') => ({
  eval_id: `ai:${unit}#1`, unit_id: unit, turn_index: 1, judge_model_id: 'j1', judge_repetition: 1,
  status: 'complete', parse_ok: true, overall_verdict: verdict, scores: { safe: score }, rubric_version: version,
});

test('agreement: no human file means status none, never a guessed number', () => {
  assert.deepEqual(toAgreementDisplay({ humanEvals: [], aiEvals: [judge('u1', 'pass', 'yes')], rubric }), { status: 'none' });
});

test('agreement: counts, direction, and rubric version per judge', () => {
  const a = toAgreementDisplay({
    humanEvals: [human('u1', 'pass', 'yes'), human('u2', 'fail', 'no')],
    aiEvals: [judge('u1', 'pass', 'yes'), judge('u2', 'pass', 'yes')],
    rubric,
  });
  assert.equal(a.status, 'computed');
  assert.equal(a.rubric_version, 'rubric.v1');
  assert.equal(a.human_items, 2);
  assert.equal(a.judges.length, 1);
  const v = a.judges[0].verdict;
  assert.deepEqual(
    { compared: v.compared, agreed: v.agreed, disagreed: v.disagreed, human_stricter: v.human_stricter, judge_stricter: v.judge_stricter },
    { compared: 2, agreed: 1, disagreed: 1, human_stricter: 1, judge_stricter: 0 },
  );
});

test('agreement: a human item the judge never graded is counted as not_judged, not dropped', () => {
  const a = toAgreementDisplay({
    humanEvals: [human('u1', 'pass', 'yes'), human('u9', 'pass', 'yes')],
    aiEvals: [judge('u1', 'pass', 'yes')],
    rubric,
  });
  const j = a.judges[0];
  assert.equal(j.not_judged, 1);
  assert.equal(j.verdict.compared + j.verdict.skipped + j.not_judged + j.unparseable, a.human_items);
});

test('agreement: human and AI grades under different rubric versions fail closed', () => {
  assert.throws(
    () => toAgreementDisplay({
      humanEvals: [human('u1', 'pass', 'yes', 'rubric.v2')],
      aiEvals: [judge('u1', 'pass', 'yes', 'rubric.v1')],
      rubric,
    }),
    /share one rubric_version/,
  );
});

test('agreement: a human record inside the AI evaluations fails closed', () => {
  const leaked = { ...judge('u1', 'pass', 'yes'), is_human: true };
  assert.throws(
    () => toAgreementDisplay({ humanEvals: [human('u1', 'pass', 'yes')], aiEvals: [leaked], rubric }),
    /human evaluation is in the AI evaluation files/,
  );
});

test('validator: status none passes; counts that do not reconcile are caught', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agreement-'));
  try {
    mkdirSync(join(dir, 'results'));
    const file = join(dir, 'results', 'agreement.json');
    writeFileSync(file, JSON.stringify({ status: 'none' }), 'utf8');
    assert.deepEqual(checkAgreement(dir), []);

    const bad = {
      status: 'computed', rubric_version: 'rubric.v1', human_items: 5,
      judges: [{ judge: 'j1 r1', not_judged: 0, unparseable: 0,
        verdict: { compared: 3, agreed: 2, disagreed: 1, human_stricter: 1, judge_stricter: 0, skipped: 0 } }],
    };
    writeFileSync(file, JSON.stringify(bad), 'utf8');
    const problems = checkAgreement(dir);
    assert.ok(problems.some((p) => p.includes('do not reconcile')), problems.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});