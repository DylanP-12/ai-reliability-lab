import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, clamp } from '../playground/labmath.js';

test('mean of [1,2,3] is 2', () => {
  assert.equal(mean([1, 2, 3]), 2);
});

test('clamp pins below and above', () => {
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(99, 0, 10), 10);
});

test('mean of empty array throws RangeError', () => {
  assert.throws(() => mean([]), RangeError);
});