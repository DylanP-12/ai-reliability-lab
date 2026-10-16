import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../core/validateConfig.js';

const GOOD = { run_id: 'smoke1', seed: 20260811, repetitions: 1, spend_cap_usd: 5, spacing_ms: 1000 };

test('validateConfig: a good config passes through unchanged', () => {
  assert.deepEqual(validateConfig({ ...GOOD }), GOOD);
});

test('validateConfig: missing spend_cap_usd fails closed', () => {
  const { spend_cap_usd, ...noCap } = GOOD;
  assert.throws(() => validateConfig(noCap), /spend_cap_usd/);
});

test('validateConfig: cap as a string "5" is rejected, and all problems are listed', () => {
  const bad = { ...GOOD, spend_cap_usd: '5', repetitions: 0 };
  assert.throws(() => validateConfig(bad), /spend_cap_usd[\s\S]*repetitions|repetitions[\s\S]*spend_cap_usd/);
});