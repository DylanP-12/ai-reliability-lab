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