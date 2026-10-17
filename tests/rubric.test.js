// tests/rubric.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRubricCsv } from '../core/parseRubricCsv.js';

const GOOD = readFileSync(new URL('./fixtures/rubric/good.csv', import.meta.url), 'utf8');
const parse = (text) => parseRubricCsv(text, { rubricVersion: 'v1' });

// Make a bad CSV by changing one exact piece of GOOD.
// Throws if the piece isn't found, so a typo here can't create a test that passes vacuously.
function breakGood(find, replace) {
  if (!GOOD.includes(find)) throw new Error(`breakGood: "${find}" not found in good.csv`);
  return GOOD.replace(find, replace);
}

test('GOOD: two criteria parse into the expected rubric', () => {
  const r = parse(GOOD);
  assert.equal(r.rubric_version, 'v1');
  assert.deepEqual(r.scale, ['yes', 'partial', 'no']);
  assert.equal(r.criteria.length, 2);
  assert.deepEqual(r.criteria[0], {
    id: 'safety', name: 'Safety', weight: 1, critical: true,
    values: { yes: 1, partial: 0.5, no: 0 },
    anchors: { yes: 'Safe, fully.', partial: 'Mostly safe.', no: 'Unsafe.' },
  });
  assert.equal(r.criteria[1].critical, false);
});

test('BAD_WEIGHT_CONSISTENCY: one criterion with two weights throws, naming the line', () => {
  const bad = breakGood('safety,Safety,1.0,TRUE,partial', 'safety,Safety,0.5,TRUE,partial');
  assert.throws(() => parse(bad), /line 3: criterion "safety" has weight 0\.5/);
});

test('BAD_CRITICAL_CONSISTENCY: one criterion with mixed critical values throws', () => {
  const bad = breakGood('safety,Safety,1.0,TRUE,partial', 'safety,Safety,1.0,FALSE,partial');
  assert.throws(() => parse(bad), /line 3: criterion "safety" has critical false/);
});

test('BAD_DUPLICATE_VALUE: a value used twice in one criterion throws', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,no', 'clarity,Clarity,0.3,FALSE,partial');
  assert.throws(() => parse(bad), /line 7: criterion "clarity" has value "partial" more than once/);
});

test('BAD_NO_CRITICAL: a rubric with no critical criterion throws', () => {
  const bad = GOOD.replaceAll(',TRUE,', ',FALSE,');
  assert.notEqual(bad, GOOD); // guard: the replace really happened
  assert.throws(() => parse(bad), /rubric has no critical criterion/);
});

test('BAD_HEADER: a wrong header throws before checking rows', () => {
  const bad = breakGood('criterion_id,criterion_name', 'criterion,criterion_name');
  assert.throws(() => parse(bad), /header must be/);
});

test('BAD_FIELD_COUNT: a row with a missing column throws, naming the line', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,yes,1.0,"Clear."', 'clarity,Clarity,0.3,FALSE,yes,1.0');
  assert.throws(() => parse(bad), /line 5: expected 7 fields, got 6/);
});

test('BAD_BLANK_ID: a blank criterion_id throws', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,yes', ',Clarity,0.3,FALSE,yes');
  assert.throws(() => parse(bad), /line 5: criterion_id is blank/);
});

test('BAD_WEIGHT_TEXT: a non-numeric weight throws', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,yes', 'clarity,Clarity,abc,FALSE,yes');
  assert.throws(() => parse(bad), /line 5: weight "abc" is not a number/);
});

test('BAD_CRITICAL_TEXT: critical that is not TRUE/FALSE throws', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,yes', 'clarity,Clarity,0.3,MAYBE,yes');
  assert.throws(() => parse(bad), /line 5: critical "MAYBE" must be TRUE or FALSE/);
});

test('BAD_BLANK_VALUE: a blank value throws', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,yes,', 'clarity,Clarity,0.3,FALSE,,');
  assert.throws(() => parse(bad), /line 5: value cannot be blank/);
});

test('BAD_SCORE_TEXT: a non-numeric value_score throws', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,yes,1.0', 'clarity,Clarity,0.3,FALSE,yes,abc');
  assert.throws(() => parse(bad), /line 5: value_score "abc" must be a number/);
});

test('BAD_SCORE_RANGE: a value_score above 1 throws', () => {
  const bad = breakGood('safety,Safety,1.0,TRUE,yes,1.0', 'safety,Safety,1.0,TRUE,yes,1.5');
  assert.throws(() => parse(bad), /line 2: value_score "1.5" must be between 0 and 1/);
});

test('BAD_BLANK_ANCHOR: a blank anchor throws', () => {
  const bad = breakGood('"Unsafe."', '""');
  assert.throws(() => parse(bad), /line 4: anchor cannot be blank/);
});

test('BAD_SCATTERED: a criterion whose rows are split up throws', () => {
  const bad = GOOD.trimEnd() + '\nsafety,Safety,1.0,TRUE,extra,0.2,"Extra row after clarity."\n';
  assert.throws(() => parse(bad), /line 8: criterion "safety" appears again after other criteria/);
});

test('BAD_VALUE_SET: criteria with different value sets throw', () => {
  const bad = breakGood('clarity,Clarity,0.3,FALSE,no', 'clarity,Clarity,0.3,FALSE,bad');
  assert.throws(() => parse(bad), /all criteria must share one scale/);
});

test('BAD_NO_VERSION: calling without rubricVersion fails closed', () => {
  assert.throws(() => parseRubricCsv(GOOD), /rubricVersion is required/);
});

test('BAD_MULTI_ERROR: collect-all reports every problem at once', () => {
  const bad = GOOD
    .replace('"Unsafe."', '""')
    .replace('safety,Safety,1.0,TRUE,yes,1.0', 'safety,Safety,1.0,TRUE,yes,1.5');
  assert.throws(() => parse(bad), (err) =>
    /2 problem\(s\)/.test(err.message) && /line 2:/.test(err.message) && /line 4:/.test(err.message));
});