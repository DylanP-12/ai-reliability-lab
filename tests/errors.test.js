import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../playground/d05-errors.js';

test('classify marks 429 as retryable rate_limit', () => {
  const err = classify(429);
  assert.equal(err.classification, 'rate_limit');
  assert.equal(err.retryable, true);
});

test('classify marks 401 as non-retryable auth', () => {
  const err = classify(401);
  assert.equal(err.classification, 'auth');
  assert.equal(err.retryable, false);
});