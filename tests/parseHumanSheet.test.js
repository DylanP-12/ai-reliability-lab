// tests/parseHumanSheet.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHumanSheet } from '../core/parseHumanSheet.js';

const rubric = {
  rubric_version: 'v1',
  scale: ['yes', 'partial', 'no'],
  criteria: [
    { id: 'setup_respected', weight: 1, critical: true, values: { yes: 1, partial: 0.5, no: 0 } },
    { id: 'helpfulness', weight: 0.3, critical: false, values: { yes: 1, partial: 0.5, no: 0 } },
  ],
};
const key = {
  sheet_id: 'hs-2026-01-01', rubric_version: 'v1',
  items: {
    'H-001': { unit_id: 'gen-x:C001:model-a:r01', turn_index: 3 },
    'H-002': { unit_id: 'gen-x:C001:model-b:r01', turn_index: 3 },
    'H-003': { unit_id: 'gen-x:C002:model-a:r01', turn_index: 2 },
  },
};
const HEADER = 'sheet_id,blind_ref,setup_respected,helpfulness,verdict,rater_note';
const sheet = (...rows) => [HEADER, ...rows].join('\n') + '\n';
const parse = (csvText, k = key) => parseHumanSheet({ csvText, key: k, rubric });
// Everything except raw_row (which carries the sheet's row numbers), keyed by blind_ref.
const byRef = rows => Object.fromEntries(rows.map(({ raw_row, ...rest }) => [rest.blind_ref, rest]));

const GOOD = sheet(
  'hs-2026-01-01,H-001,yes,yes,pass,',
  'hs-2026-01-01,H-002,no,partial,fail,"peanut butter, twice"',
  'hs-2026-01-01,H-003,partial,no,,',
);

test('good sheet: every row joins to its unit through the key', () => {
  const { rows, skipped, missing } = parse(GOOD);
  assert.equal(rows.length, 3);
  assert.deepEqual(skipped, []);
  assert.deepEqual(missing, []);
  const r = byRef(rows);
  assert.equal(r['H-001'].unit_id, 'gen-x:C001:model-a:r01');
  assert.equal(r['H-003'].turn_index, 2);
  assert.equal(r['H-002'].rater_note, 'peanut butter, twice');
  assert.equal(r['H-002'].overall_verdict, 'fail');
  assert.equal(r['H-003'].overall_verdict, 'pass');          // partial on the critical criterion is not its lowest value
  assert.ok(Math.abs(r['H-003'].weighted_score - 0.5 / 1.3) < 1e-9);
});

test('sorted sheet: same rows in a different order give an identical result (key join, not positional)', () => {
  const sorted = sheet(
    'hs-2026-01-01,H-003,partial,no,,',
    'hs-2026-01-01,H-001,yes,yes,pass,',
    'hs-2026-01-01,H-002,no,partial,fail,"peanut butter, twice"',
  );
  assert.deepEqual(byRef(parse(sorted).rows), byRef(parse(GOOD).rows));
});

test('BOM and CRLF from an Excel "CSV UTF-8" save parse the same as plain LF', () => {
  const excel = '\ufeff' + GOOD.replace(/\n/g, '\r\n');
  assert.deepEqual(byRef(parse(excel).rows), byRef(parse(GOOD).rows));
});

test('blank row: skipped with a reason, never a zero, and the note is kept', () => {
  const { rows, skipped } = parse(sheet(
    'hs-2026-01-01,H-001,yes,yes,pass,',
    'hs-2026-01-01,H-003,,,,ran out of time',
  ));
  assert.deepEqual(rows.map(r => r.blind_ref), ['H-001']);
  assert.deepEqual(skipped, [{ blind_ref: 'H-003', reason: 'not graded', rater_note: 'ran out of time' }]);
});

test('half-filled row: skipped as incomplete, naming the blank criterion', () => {
  const { rows, skipped } = parse(sheet('hs-2026-01-01,H-002,yes,,pass,'));
  assert.equal(rows.length, 0);
  assert.equal(skipped[0].reason, 'incomplete: helpfulness blank');
});

test('a partial sheet is legal: refs not on the sheet are counted as missing', () => {
  const { missing } = parse(sheet('hs-2026-01-01,H-001,yes,yes,pass,'));
  assert.deepEqual(missing.sort(), ['H-002', 'H-003']);
});

test('typed verdict that disagrees with the derived one is flagged, not overwritten', () => {
  const { rows } = parse(sheet('hs-2026-01-01,H-003,partial,no,fail,'));
  assert.equal(rows[0].overall_verdict, 'pass');
  assert.equal(rows[0].typed_verdict, 'fail');
  assert.equal(rows[0].verdict_mismatch, true);
});

test('unknown blind_ref is rejected, naming the ref', () => {
  assert.throws(() => parse(sheet('hs-2026-01-01,H-099,yes,yes,pass,')), /H-099/);
});

test('duplicate blind_ref is rejected, naming both rows', () => {
  assert.throws(
    () => parse(sheet('hs-2026-01-01,H-001,yes,yes,pass,', 'hs-2026-01-01,H-001,no,no,fail,')),
    /H-001.*2 times.*rows 2, 3/,
  );
});

test('out-of-enum values are all reported at once, naming row, ref and column', () => {
  assert.throws(
    () => parse(sheet('hs-2026-01-01,H-001,Yes,yes,pass,', 'hs-2026-01-01,H-002,no,maybe,PASS,')),
    err => /row 2 \(H-001\): setup_respected is "Yes"/.test(err.message)
        && /row 3 \(H-002\): helpfulness is "maybe"/.test(err.message)
        && /row 3 \(H-002\): verdict is "PASS"/.test(err.message),
  );
});

test('stale key: a sheet_id that does not match the key is rejected', () => {
  assert.throws(() => parse(sheet('hs-2026-02-02,H-001,yes,yes,pass,')), /does not match key/);
});

test('rubric version mismatch between key and rubric is rejected', () => {
  assert.throws(() => parse(GOOD, { ...key, rubric_version: 'v2' }), /v2.*v1/);
});

test('old header without sheet_id is rejected before any row is checked', () => {
  const old = ['blind_ref,setup_respected,helpfulness,verdict,rater_note', 'H-001,yes,yes,pass,'].join('\n');
  assert.throws(() => parse(old), err => /header/.test(err.message) && !/row \d/.test(err.message));
});