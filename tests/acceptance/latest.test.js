// tests/acceptance/latest.test.js
// Gap closed in L063: one rule for "a retried record replaces the earlier one",
// and every consumer uses it instead of keeping its own copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { latestPerUnit, latestPerEval } from '../../core/latest.js';

const CONSUMERS = [
  'cli/prepare-app-data.js',
  'cli/scoreDispatch.js',
  'core/buildHumanSheet.js',
  'core/agreementReport.js',
];

test('ACCEPT/integrity: a retried unit or eval is represented by its last record only', () => {
  const units = [
    { unit_id: 'u1', status: 'failed' },
    { unit_id: 'u2', status: 'complete' },
    { unit_id: 'u1', status: 'complete' },
  ];
  assert.deepEqual(
    latestPerUnit(units).map(r => [r.unit_id, r.status]),
    [['u1', 'complete'], ['u2', 'complete']],
  );
  const evals = [{ eval_id: 'e1', status: 'failed' }, { eval_id: 'e1', status: 'complete' }];
  assert.deepEqual(latestPerEval(evals), [evals[1]]);
});

test('ACCEPT/integrity: every consumer takes the latest record from core/latest.js and keeps no copy of its own', () => {
  for (const file of CONSUMERS) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /from ['"](\.\.\/core|\.)\/latest\.js['"]/, `${file} does not import core/latest.js`);
    assert.doesNotMatch(src, /function latestPer/, `${file} still defines its own latestPer* function`);
  }
});