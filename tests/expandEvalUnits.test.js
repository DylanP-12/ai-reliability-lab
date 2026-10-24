import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandEvalUnits } from '../cli/expandEvalUnits.js';
// Two complete records. m-b is also a judge (self-judge case).
const records = [
  { unit_id: 'gen-x:C001:m-a:r01', model_id: 'm-a', status: 'complete',
    turns: [
      { turn_index: 3, is_checkpoint: true },
      { turn_index: 4, is_checkpoint: false },
      { turn_index: 6, is_checkpoint: true },
    ] },
  { unit_id: 'gen-x:C001:m-b:r01', model_id: 'm-b', status: 'complete',
    turns: [
      { turn_index: 3, is_checkpoint: true },
      { turn_index: 6, is_checkpoint: true },
    ] },
];

const baseConfig = {
  score_run_id: 'sr-01',
  judges: [{ model_id: 'judge-a' }, { model_id: 'm-b' }],
  judge_repetitions: 3,
};

test('self-judge excluded when flag is on: 18 units', () => {
  const units = expandEvalUnits(records, { ...baseConfig, exclude_self_judge: true });
  assert.equal(units.length, 18);
  const selfPairs = units.filter(u => u.judge_model_id === u.model_id);
  assert.equal(selfPairs.length, 0);
});

test('self-judge present when flag is off: 24 units', () => {
  const units = expandEvalUnits(records, { ...baseConfig, exclude_self_judge: false });
  assert.equal(units.length, 24);
});

test('only checkpoint turns produce units', () => {
  const units = expandEvalUnits(records, { ...baseConfig, exclude_self_judge: true });
  assert.ok(units.every(u => u.turn_index !== 4));
});

test('every eval_id is unique and well-formed', () => {
  const units = expandEvalUnits(records, { ...baseConfig, exclude_self_judge: true });
  const ids = units.map(u => u.eval_id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('sr-01:gen-x:C001:m-a:r01:t6:judge-a:j1'));
});