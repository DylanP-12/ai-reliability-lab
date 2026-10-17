// core/parseRubricCsv.js
// Pure: no fs, no Node-only imports. The CLI reads the file; this only checks text.
import { parseCsv } from './parseScenarios.js';

const HEADER = ['criterion_id', 'criterion_name', 'weight', 'critical', 'value', 'value_score', 'anchor'];

export function parseRubricCsv(csvText) {
  // Excel often adds an invisible BOM character at the start of a CSV. Strip it.
  const text = csvText.replace(/^\uFEFF/, '');
  // Drop fully blank lines (e.g. an extra Enter at the end of the file).
  const rows = parseCsv(text).filter(r => !(r.length === 1 && r[0].trim() === ''));

  // Rule: header matches exactly. If it doesn't, we can't trust any column, so stop now.
  const header = (rows[0] ?? []).map(h => h.trim());
  if (header.join(',') !== HEADER.join(',')) {
    throw new Error(`Rubric CSV: header must be "${HEADER.join(',')}", got "${header.join(',')}"`);
  }

  const problems = [];
  const records = [];

  rows.slice(1).forEach((fields, i) => {
    const line = i + 2; // +1 for the header, +1 because lines count from 1

    if (fields.length !== HEADER.length) {
      problems.push(`line ${line}: expected ${HEADER.length} fields, got ${fields.length}`);
      return; // can't read the columns, skip the other checks for this row
    }

    const [criterion_id, criterion_name, weightText, criticalText, value, scoreText, anchor] =
      fields.map(f => f.trim());

    // Rule: criterion_id is not blank
    if (criterion_id === '') problems.push(`line ${line}: criterion_id is blank`);

    // Rule: weight is a number
    const weight = Number(weightText);
    if (weightText === '' || !Number.isFinite(weight)) {
      problems.push(`line ${line}: weight "${weightText}" is not a number`);
    }

    // Rule: critical is TRUE or FALSE
    const critical = criticalText.toUpperCase() === 'TRUE';
    if (criticalText.toUpperCase() !== 'TRUE' && criticalText.toUpperCase() !== 'FALSE') {
      problems.push(`line ${line}: critical "${criticalText}" must be TRUE or FALSE`);
    }

    // Rule: value is not blank
    if (value === '') {
      problems.push(`line ${line}: value cannot be blank`);
    }

        // Rule: value_score is a number between 0 and 1
    const value_score = Number(scoreText);
    if (scoreText === '' || !Number.isFinite(value_score)) {
      problems.push(`line ${line}: value_score "${scoreText}" must be a number`);
    } else if (value_score < 0 || value_score > 1) {
      problems.push(`line ${line}: value_score "${scoreText}" must be between 0 and 1`);
    }

    // Rule: anchor is not blank
    if (anchor === '') {
      problems.push(`line ${line}: anchor cannot be blank`);
    }

    records.push({ line, criterion_id, criterion_name, weight, critical, value, value_score, anchor });
  });

  if (problems.length > 0) {
    throw new Error(`Rubric CSV has ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  }

  // TEMPORARY: return the raw records so we can look at them. Piece 3 replaces this.
  return records;
}