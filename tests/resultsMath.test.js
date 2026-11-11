import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pooledCell, spreadFor, cellColors } from '../app/src/lib/resultsMath.js';

// Tiny scores.json-shaped group. Each unit lists its checkpoint outcomes; [] = failed unit.
function group(...unitOutcomes) {
  const units = unitOutcomes.map((outcomes) => ({
    status: outcomes.length === 0 ? 'failed' : 'complete',
    checkpoints: outcomes.map((outcome, i) => ({ turn_index: 5 + i, outcome })),
  }));
  const all = units.flatMap((u) => u.checkpoints);
  const count = (o) => all.filter((c) => c.outcome === o).length;
  return {
    units_scored: units.filter((u) => u.status !== 'failed').length,
    units_failed: units.filter((u) => u.status === 'failed').length,
    units,
    checkpoints: [{
      pass: count('pass'), fail: count('fail'), split: count('split'),
      no_valid_judgment: count('no_valid_judgment'), denominator: count('pass') + count('fail'),
    }],
  };
}

test('heatmap cell: not run, no result, and a pooled rate are three different things', () => {
  assert.equal(pooledCell(undefined).kind, 'not-run');
  const empty = pooledCell(group(['no_valid_judgment', 'split']));
  assert.equal(empty.kind, 'no-result');      // n = 0 is never a rate of 0
  assert.equal(empty.rate, undefined);
  const cell = pooledCell(group(['pass', 'fail'], ['pass', 'split']));
  assert.equal(cell.rate, 2 / 3);             // split left out of n
  assert.equal(cell.n, 3);
  assert.equal(cell.split, 1);
});

test('spread: same mean, different reliability', () => {
  const steady = spreadFor(group(['pass', 'fail'], ['pass', 'fail']));
  const erratic = spreadFor(group(['pass', 'pass'], ['fail', 'fail']));
  assert.equal(steady.point, 0.5);
  assert.equal(erratic.point, 0.5);
  assert.deepEqual([steady.min, steady.max], [0.5, 0.5]);
  assert.deepEqual([erratic.min, erratic.max], [0, 1]);
});

test('spread: one observation has no bar; failed units are counted, not rated', () => {
  const single = spreadFor(group(['pass', 'pass'], []));
  assert.equal(single.kind, 'single');
  assert.equal(single.n, 1);
  assert.equal(single.excluded, 1);
  assert.equal(single.min, undefined);
  assert.equal(spreadFor(group([])).kind, 'no-result');
});

test('colors: no-data is refused, and every step of the ramp has readable text', () => {
  for (const bad of [undefined, null, NaN, -0.1, 1.2]) {
    assert.throws(() => cellColors(bad), /rate must be/);
  }
  assert.equal(cellColors(0).fill, 'rgb(219, 234, 254)');
  assert.equal(cellColors(1).fill, 'rgb(30, 58, 138)');
  for (let i = 0; i <= 100; i += 1) {
    assert.ok(cellColors(i / 100).contrast >= 4.5, `contrast too low at rate ${i / 100}`);
  }
});