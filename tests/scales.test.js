import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linearScale } from '../app/src/lib/scales.js';

test('x scale runs left to right', () => {
  const x = linearScale({ domain: [0, 10], range: [48, 752] });
  assert.equal(x(0), 48);
  assert.equal(x(10), 752);
  assert.equal(x(5), 400);
});

test('y scale is inverted: rate 0 at the bottom, 1 at the top', () => {
  const y = linearScale({ domain: [0, 1], range: [352, 48] });
  assert.equal(y(0), 352);   // the LARGER pixel value, i.e. lower on screen
  assert.equal(y(1), 48);
  assert.equal(y(0.5), 200);
});

test('empty domain throws instead of returning NaN', () => {
  assert.throws(() => linearScale({ domain: [8, 8], range: [0, 100] }), /empty domain/);
});