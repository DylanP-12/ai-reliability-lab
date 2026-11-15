// tests/agreement.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementStats } from '../core/agreement.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);
const pairs = list => list.map(([a, b]) => ({ a, b }));
const PF = ['pass', 'fail'];
const YPN = ['yes', 'partial', 'no'];

test('perfect agreement: kappa 1, AC1 1', () => {
  const s = agreementStats(pairs([['pass', 'pass'], ['fail', 'fail'], ['pass', 'pass'], ['fail', 'fail']]), PF);
  assert.equal(s.agreed, 4);
  near(s.kappa, 1);
  near(s.ac1, 1);
});

test('agreement exactly at chance: kappa 0 and AC1 0', () => {
  // 2 of 4 agree; each rater says pass half the time, so chance alone predicts 50%.
  const s = agreementStats(pairs([['pass', 'pass'], ['pass', 'fail'], ['fail', 'pass'], ['fail', 'fail']]), PF);
  assert.equal(s.agreed, 2);
  near(s.kappa, 0);
  near(s.ac1, 0);
});

test('the skew case: 19 of 20 agree, kappa collapses to 0, AC1 stays high', () => {
  // Human passes 19 and fails 1; judge passes all 20. Chance alone predicts 95% agreement.
  const list = Array.from({ length: 19 }, () => ['pass', 'pass']).concat([['fail', 'pass']]);
  const s = agreementStats(pairs(list), PF);
  assert.equal(s.n, 20);
  assert.equal(s.agreed, 19);
  near(s.kappa, 0);                                 // (0.95 - 0.95) / (1 - 0.95)
  near(s.ac1, (0.95 - 0.04875) / (1 - 0.04875));    // = 0.9475..., chance term 2 x 0.975 x 0.025
  assert.ok(s.ac1 > 0.9);
  assert.equal(s.aStricter, 1);                     // the one disagreement: human fail, judge pass
  assert.equal(s.bStricter, 0);
});

test('weighted kappa treats a near miss (yes/partial) as smaller than a far miss (yes/no)', () => {
  const base = [['yes', 'yes'], ['partial', 'partial'], ['no', 'no']];
  const nearMiss = agreementStats(pairs([...base, ['yes', 'partial']]), YPN);
  const farMiss = agreementStats(pairs([...base, ['yes', 'no']]), YPN);
  near(nearMiss.kappa, farMiss.kappa);              // unweighted kappa cannot tell them apart
  assert.ok(nearMiss.kappaWeighted > farMiss.kappaWeighted);
});

test('excluded pairs (skipped or unparseable) are counted separately and never enter n', () => {
  const s = agreementStats(pairs([['pass', 'pass'], [null, 'fail'], ['fail', null], ['fail', 'fail']]), PF);
  assert.equal(s.n, 2);
  assert.equal(s.excluded, 2);
});

test('one label used for everything: kappa is null (undefined), never NaN or a flattering 1', () => {
  const s = agreementStats(pairs([['pass', 'pass'], ['pass', 'pass'], ['pass', 'pass']]), PF);
  assert.equal(s.kappa, null);
  assert.equal(s.agreed, 3);
});