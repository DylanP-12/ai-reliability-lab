// tests/rubricFrozen.test.js
// Rubric v1 is FROZEN once any run scores against it.
// Changing criteria requires bumping to v2 and updating this test. That friction is intentional.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseRubricCsv } from '../core/parseRubricCsv.js';

const json = JSON.parse(readFileSync(new URL('../config/rubric.v1.json', import.meta.url), 'utf8'));
const csv = readFileSync(new URL('../config/rubric.v1.csv', import.meta.url), 'utf8');

const PINNED_CRITERIA_HASH = '5bf65ecdba250dc8f1f9ae08ee523fbdcf651c95ace33bb1ae243d617ffa384c';

const hashOf = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('FROZEN: rubric.v1.json says rubric_version v1', () => {
  assert.equal(json.rubric_version, 'v1');
});

test('FROZEN: rubric.v1 criteria match the pinned hash', () => {
  assert.equal(hashOf(json.criteria), PINNED_CRITERIA_HASH);
});

test('FROZEN: rubric.v1.json matches what the CSV produces (no hand edits, no stale JSON)', () => {
  assert.deepEqual(parseRubricCsv(csv, { rubricVersion: 'v1' }), json);
});