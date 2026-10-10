import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandUnits, scheduleUnits } from '../cli/expandUnits.js';
import { buildUnitId } from '../core/ids.js';

// Small hand-built inputs: 2 scenarios x 3 models x 2 repetitions = 12 units
const scenarios = [
  { conversation_id: 'C001' },
  { conversation_id: 'C002' },
];
const models = [
  { model_id: 'm-a' },
  { model_id: 'm-b' },
  { model_id: 'm-c' },
];
const config = { run_id: 'test-run', repetitions: 2 };
const SEED = 20260811;

// ---------- expandUnits ----------

test('expandUnits: count is scenarios x models x repetitions', () => {
  const units = expandUnits(scenarios, models, config);
  assert.equal(units.length, 2 * 3 * 2);
});

test('expandUnits: every unit_id is unique', () => {
  const units = expandUnits(scenarios, models, config);
  const ids = new Set(units.map((u) => u.unit_id));
  assert.equal(ids.size, units.length);
});

test('expandUnits: unit_id matches buildUnitId of its parts', () => {
  const units = expandUnits(scenarios, models, config);
  const unit = units.find(
    (u) => u.conversation_id === 'C002' && u.model_id === 'm-b' && u.repetition === 2
  );
  assert.ok(unit, 'expected a unit for C002 / m-b / repetition 2');
  assert.equal(
    unit.unit_id,
    buildUnitId({ run_id: 'test-run', conversation_id: 'C002', model_id: 'm-b', repetition: 2 })
  );
  assert.equal(unit.unit_id, 'test-run:C002:m-b:r02');
});

test('expandUnits: each unit carries conversation_id, model_id, repetition', () => {
  const units = expandUnits(scenarios, models, config);
  for (const u of units) {
    assert.equal(typeof u.conversation_id, 'string');
    assert.equal(typeof u.model_id, 'string');
    assert.ok(Number.isInteger(u.repetition) && u.repetition >= 1 && u.repetition <= 2);
  }
});

// ---------- scheduleUnits ----------

test('scheduleUnits: same seed gives an identical schedule', () => {
  const units = expandUnits(scenarios, models, config);
  const a = scheduleUnits(units, SEED);
  const b = scheduleUnits(units, SEED);
  assert.deepEqual(a, b);
});

test('scheduleUnits: dispatch_index is 0..N-1, matching position', () => {
  const scheduled = scheduleUnits(expandUnits(scenarios, models, config), SEED);
  scheduled.forEach((u, i) => assert.equal(u.dispatch_index, i));
});

test('scheduleUnits: same unit_ids before and after (nothing lost or invented)', () => {
  const units = expandUnits(scenarios, models, config);
  const scheduled = scheduleUnits(units, SEED);
  const before = units.map((u) => u.unit_id).sort();
  const after = scheduled.map((u) => u.unit_id).sort();
  assert.deepEqual(after, before);
});

test("scheduleUnits: does not change the caller's units", () => {
  const units = expandUnits(scenarios, models, config);
  const snapshot = structuredClone(units);
  scheduleUnits(units, SEED);
  assert.deepEqual(units, snapshot);
});

test('scheduleUnits: golden order for seed 20260811', () => {
  // golden: locks the schedule. Captured once from this exact fixture.
  // If this fails, the shuffle or the expansion order changed, and every
  // past run's schedule can no longer be reproduced. Investigate, don't re-capture.
  const expected = [
    'test-run:C002:m-c:r02',
    'test-run:C001:m-c:r02',
    'test-run:C001:m-a:r01',
    'test-run:C002:m-b:r02',
    'test-run:C002:m-b:r01',
    'test-run:C001:m-b:r01',
    'test-run:C002:m-c:r01',
    'test-run:C002:m-a:r01',
    'test-run:C001:m-a:r02',
    'test-run:C002:m-a:r02',
    'test-run:C001:m-b:r02',
    'test-run:C001:m-c:r01',
  ];
  const scheduled = scheduleUnits(expandUnits(scenarios, models, config), SEED);
  assert.deepEqual(scheduled.map((u) => u.unit_id), expected);
});