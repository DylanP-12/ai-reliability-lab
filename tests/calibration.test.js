import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCalibrationDisplay } from '../cli/prepare-app-data.js';

const good = () => ({
  status: 'practice',
  as_of: '2026-10-25',
  rater: 'developer, blind, single rater',
  rubric_version: 'rubric.v1',
  checkpoints_compared: 7,
  checkpoints_agreed: 7,
  criteria_compared: 14,
  criteria_agreed: 14,
  excluded: 0,
  disagreements: { rubric_ambiguity: 0, judge_error: 0, hard_case: 0 },
  limitations: ['Practice check, not the study expert.'],
});

test('calibration: no source file becomes an explicit "none"', () => {
  assert.deepEqual(toCalibrationDisplay(null), { status: 'none' });
});

test('calibration: allowlist keeps the counts and drops anything else', () => {
  const out = toCalibrationDisplay({ ...good(), rater_email: 'someone@example.com' });
  assert.equal(out.checkpoints_agreed, 7);
  assert.equal('rater_email' in out, false);
});

test('calibration: impossible or unfinished records fail closed', () => {
  assert.throws(() => toCalibrationDisplay({ ...good(), checkpoints_agreed: 8 }), /exceeds/);
  assert.throws(() => toCalibrationDisplay({ ...good(), as_of: 'YYYY-MM-DD' }), /as_of/);
  assert.throws(() => toCalibrationDisplay({ ...good(), checkpoints_agreed: 6 }), /bucket/);
  assert.throws(() => toCalibrationDisplay({ ...good(), excluded: undefined }), /whole number/);
});