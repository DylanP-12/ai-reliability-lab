// core/parseHumanSheet.js
// Pure: a returned rater sheet + its private key + the rubric in, validated rows out.
// Joins by blind_ref (key lookup), never by position, so a sorted sheet gives the same result.
import { parseCsv } from './parseScenarios.js';
import { parseJudge } from './parseJudge.js';
import { sheetColumnsFor } from './buildHumanSheet.js';

const VERDICTS = ['pass', 'fail'];

// Turn the grid into objects. row = the line number a spreadsheet would show (header is 1).
function toRecords(grid, header) {
  return grid.slice(1)
    .map((cells, i) => ({ cells, row: i + 2 }))
    .filter(({ cells }) => !(cells.length === 1 && cells[0] === ''))   // ignore a stray empty line
    .map(({ cells, row }) => ({ row, ...Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? '').trim()])) }));
}

function checkHeader(header, rubric, problems) {
  const expected = sheetColumnsFor(rubric);
  if (header.join(',') !== expected.join(',')) {
    problems.push(`header is "${header.join(',')}" but this rubric needs "${expected.join(',')}"`);
  }
}

function checkRubricVersion(key, rubric, problems) {
  if (key.rubric_version !== rubric.rubric_version) {
    problems.push(`key was built for rubric ${key.rubric_version}, but the rubric on disk is ${rubric.rubric_version}`);
  }
}

function checkSheetId(records, key, problems) {
  for (const r of records) {
    if (r.sheet_id !== key.sheet_id) {
      problems.push(`row ${r.row} (${r.blind_ref}): sheet_id "${r.sheet_id}" does not match key "${key.sheet_id}"`);
    }
  }
}

function checkKnownRefs(records, key, problems) {
  for (const r of records) {
    if (!(r.blind_ref in key.items)) {
      problems.push(`row ${r.row}: blind_ref "${r.blind_ref}" is not in the key for this sheet`);
    }
  }
}

function checkDuplicateRefs(records, problems) {
  const rowsByRef = new Map();
  for (const r of records) {
    if (!rowsByRef.has(r.blind_ref)) rowsByRef.set(r.blind_ref, []);
    rowsByRef.get(r.blind_ref).push(r.row);
  }
  for (const [ref, rows] of rowsByRef) {
    if (rows.length > 1) problems.push(`blind_ref "${ref}" appears ${rows.length} times, on rows ${rows.join(', ')}`);
  }
}

function checkValues(records, rubric, problems) {
  for (const r of records) {
    for (const c of rubric.criteria) {
      const v = r[c.id];
      if (v !== '' && !rubric.scale.includes(v)) {
        problems.push(`row ${r.row} (${r.blind_ref}): ${c.id} is "${v}", allowed: ${rubric.scale.join(', ')} or blank`);
      }
    }
    if (r.verdict !== '' && !VERDICTS.includes(r.verdict)) {
      problems.push(`row ${r.row} (${r.blind_ref}): verdict is "${r.verdict}", allowed: pass, fail or blank`);
    }
  }
}

// A row with every score blank is "not graded"; some blank is "incomplete". Neither is a zero.
function classify(r, rubric) {
  const blanks = rubric.criteria.filter(c => r[c.id] === '').map(c => c.id);
  if (blanks.length === rubric.criteria.length) return { status: 'skipped', reason: 'not graded' };
  if (blanks.length > 0) return { status: 'skipped', reason: `incomplete: ${blanks.join(', ')} blank` };
  return { status: 'graded' };
}

export function parseHumanSheet({ csvText, key, rubric }) {
  const text = csvText.startsWith('\ufeff') ? csvText.slice(1) : csvText;   // Excel "CSV UTF-8" adds a BOM
  const grid = parseCsv(text);
  const header = (grid[0] ?? []).map(h => h.trim());
  const problems = [];

  checkHeader(header, rubric, problems);
  checkRubricVersion(key, rubric, problems);
  if (problems.length) throw new Error(`human sheet rejected:\n- ${problems.join('\n- ')}`);  // wrong shape: row checks would be noise

  const records = toRecords(grid, header);
  checkSheetId(records, key, problems);
  checkKnownRefs(records, key, problems);
  checkDuplicateRefs(records, problems);
  checkValues(records, rubric, problems);
  if (problems.length) throw new Error(`human sheet rejected:\n- ${problems.join('\n- ')}`);

  const rows = [];
  const skipped = [];
  for (const r of records) {
    const c = classify(r, rubric);
    if (c.status === 'skipped') { skipped.push({ blind_ref: r.blind_ref, reason: c.reason, rater_note: r.rater_note }); continue; }
    const scores = Object.fromEntries(rubric.criteria.map(cr => [cr.id, r[cr.id]]));
    const judged = parseJudge(JSON.stringify({ scores }), rubric);       // same verdict rule as the AI judges
    if (!judged.parse_ok) throw new Error(`row ${r.row} (${r.blind_ref}): ${judged.error}`);  // checkValues should make this unreachable
    const { unit_id, turn_index } = key.items[r.blind_ref];               // THE JOIN: by key, never by position
    rows.push({
      blind_ref: r.blind_ref, unit_id, turn_index, scores,
      weighted_score: judged.weighted_score, overall_verdict: judged.overall_verdict, critical_failed: judged.critical_failed,
      typed_verdict: r.verdict, verdict_mismatch: r.verdict !== '' && r.verdict !== judged.overall_verdict,
      rater_note: r.rater_note, raw_row: r,
    });
  }

  const present = new Set(records.map(r => r.blind_ref));
  const missing = Object.keys(key.items).filter(ref => !present.has(ref));
  return { rows, skipped, missing };
}