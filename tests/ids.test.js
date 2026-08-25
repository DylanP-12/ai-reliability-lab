import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUnitId, buildEvalId } from '../core/ids.js';

test('buildUnitId matches spec example exactly', () => {
  assert.equal(
    buildUnitId({ run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 3 }),
    'gen-2026-08-11:C001:ds-v31-chat:r03'
  );
});

test('buildUnitId pads repetition correctly for r12', () => {
  assert.equal(
    buildUnitId({ run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 12 }),
    'gen-2026-08-11:C001:ds-v31-chat:r12'
  );
});

test('buildUnitId is deterministic', () => {
  const input = { run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 3 };
  assert.equal(
    buildUnitId(input),
    buildUnitId(input)
  );
});

test('buildUnitId rejects empty run_id', () => {
  assert.throws(() => buildUnitId({ run_id: '', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 3 }));
});

test('buildUnitId rejects model_id containing a colon', () => {
  assert.throws(() => buildUnitId({ run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31:chat', repetition: 3 }));
});

test('buildEvalId matches spec example exactly', () => {
  const unitId = buildUnitId({ run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 3 });
  assert.equal(
    buildEvalId({ score_run_id: 'score-2026-08-25', unit_id: unitId, turn_index: 12, judge_model_id: 'judge-a', judge_repetition: 1 }),
    'score-2026-08-25:gen-2026-08-11:C001:ds-v31-chat:r03:t12:judge-a:j1'
  );
});

test('buildUnitId rejects repetition of 0', () => {
  assert.throws(() => buildUnitId({ run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 0 }));
});

test('buildUnitId rejects repetition of 1.5', () => {
  assert.throws(() => buildUnitId({ run_id: 'gen-2026-08-11', conversation_id: 'C001', model_id: 'ds-v31-chat', repetition: 1.5 }));
});