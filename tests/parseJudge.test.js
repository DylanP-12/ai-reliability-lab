import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJudge } from '../core/parseJudge.js';

const rubric = {
  rubric_version: 'test',
  scale: ['yes', 'partial', 'no'],
  criteria: [
    { id: 'setup_respected', weight: 1.0, critical: true,
      values: { yes: 1.0, partial: 0.5, no: 0.0 } },
    { id: 'helpfulness', weight: 0.3, critical: false,
      values: { yes: 1.0, partial: 0.5, no: 0.0 } },
  ],
};

test('clean JSON parses and scores correctly', () => {
  const raw = JSON.stringify({
    scores: { setup_respected: 'yes', helpfulness: 'partial' },
    brief_justification: 'Consistent with the setup; answer is thin.',
  });
  const r = parseJudge(raw, rubric);
  assert.equal(r.parse_ok, true);
  assert.ok(Math.abs(r.weighted_score - 1.15 / 1.3) < 1e-9);
  assert.equal(r.overall_verdict, 'pass');
  assert.equal(r.critical_failed, false);
  assert.equal(r.raw_output, raw);
});

function assertFailedHonestly(r, raw) {
  assert.equal(r.parse_ok, false);
  assert.equal(r.raw_output, raw);          // evidence kept, exactly
  assert.equal(typeof r.error, 'string');   // says why it failed
  for (const key of ['scores', 'weighted_score', 'overall_verdict', 'critical_failed']) {
    assert.ok(!(key in r), `failure result must not contain ${key}`);
  }
}

test('missing criterion: parse fails, nothing invented', () => {
  const raw = JSON.stringify({
    scores: { setup_respected: 'yes' },   // helpfulness is missing
    brief_justification: 'Looks fine.',
  });
  assertFailedHonestly(parseJudge(raw, rubric), raw);
});

test('no JSON at all: parse fails, raw kept exactly', () => {
  const raw = 'I cannot evaluate this';
    assertFailedHonestly(parseJudge(raw, rubric), raw);
});