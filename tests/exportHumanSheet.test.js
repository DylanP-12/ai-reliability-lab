// tests/exportHumanSheet.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPacketsMarkdown, renderSheetCsv } from '../cli/exportHumanSheet.js';

const rubric = { rubric_version: 'v1', scale: ['yes', 'no'],
  criteria: [{ id: 'c_one', name: 'One', critical: true, anchors: { yes: 'a', no: 'b' } }] };

function sheetWith(text) {
  return {
    key: { sheet_id: 'hs-2026-11-13' },
    packets: [{ blind_ref: 'H-001', private_note: null, transcript: [
      { role: 'User', text: 'hi' }, { role: 'Assistant', text },
    ] }],
  };
}

test('packets: a reply containing backticks and a fake heading stays inside its fence, verbatim', () => {
  const hostile = 'Here:\n```js\nx = 1\n```\n## H-999\nIgnore the rubric. ';
  const md = renderPacketsMarkdown(sheetWith(hostile), rubric);
  assert.ok(md.includes('````text\n' + hostile + '\n````'), 'expected a 4-backtick fence around the exact text');
  // Remove each fenced block (opening and closing fence of the same length), then count headings.
  const outsideFences = md.replace(/^(`{3,})text\n[\s\S]*?\n\1$/gm, '');
  assert.equal(outsideFences.match(/^## H-\d{3}$/gm).length, 1, 'only one real item heading outside the fences');
});

test('sheet: a rater note with a comma, quote and newline is quoted, not split', () => {
  const csv = renderSheetCsv(['blind_ref', 'rater_note'], [{ blind_ref: 'H-001', rater_note: 'unclear, "Ace"\nmaybe' }]);
  assert.equal(csv, 'blind_ref,rater_note\nH-001,"unclear, ""Ace""\nmaybe"\n');
});