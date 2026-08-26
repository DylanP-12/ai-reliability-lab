import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, shuffle } from '../core/seededRandom.js';

test('shuffle is deterministic for the same seed', () => {
  const a = shuffle([1,2,3,4,5,6,7,8,9,10], 123);
  const b = shuffle([1,2,3,4,5,6,7,8,9,10], 123);
  assert.deepEqual(a, b);
});

test('shuffle matches the golden value for seed 20260811', () => {
  const result = shuffle([1,2,3,4,5,6,7,8,9,10], 20260811);
  assert.deepEqual(result, [8, 5, 9, 2, 3, 6, 1, 7, 10, 4]); // golden: locks cross-version determinism
});

test('shuffle does not mutate the original array', () => {
  const original = [1,2,3,4,5,6,7,8,9,10];
  const copy = [...original];
  shuffle(original, 42);
  assert.deepEqual(original, copy);
});

test('different seeds produce different orders', () => {
  const a = shuffle([1,2,3,4,5,6,7,8,9,10], 1);
  const b = shuffle([1,2,3,4,5,6,7,8,9,10], 2);
  assert.notDeepEqual(a, b);
});

test('shuffle produces a permutation of the input', () => {
  const input = [1,2,3,4,5,6,7,8,9,10];
  const result = shuffle(input, 999);
  assert.deepEqual(
    result.sort((a, b) => a - b),
    [...input].sort((a, b) => a - b)
  );
});

test('shuffle spreads elements across positions (sanity check)', () => {
  const positions = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const result = shuffle([0,1,2,3,4,5,6,7,8,9], seed);
    const pos = result.indexOf(0);
    positions.add(pos);
  }
  assert.ok(positions.size >= 5);
});