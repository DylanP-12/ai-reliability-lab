// cli/validate-scenarios.js: validate a scenarios CSV from the command line (L053).
// Calls the SAME core function as the browser's import panel, so both report the same problems.
import { readFileSync } from 'node:fs';
import { parseScenarios } from '../core/parseScenarios.js';

const [csvPath, metaPath = 'data/scenarios.meta.json'] = process.argv.slice(2);
if (!csvPath) {
  console.error('Usage: node cli/validate-scenarios.js <file.csv> [meta.json]');
  process.exit(2);
}

const { categories } = JSON.parse(readFileSync(metaPath, 'utf8'));
const text = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');   // strip a BOM, like the browser

try {
  const scenarios = parseScenarios(text, { allowedCategories: categories });
  const checkpoints = scenarios.reduce((n, s) => n + s.checkpoints.length, 0);
  console.log(`Valid: ${scenarios.length} scenarios, ${checkpoints} checkpoints.`);
} catch (err) {
  if (!Array.isArray(err.problems)) throw err;   // a bug, not a CSV problem
  const problems = [...err.problems].sort((a, b) => a.row - b.row);   // same order as the browser
  console.log(`${problems.length} problem(s):`);
  for (const p of problems) console.log(`  row ${p.row}  ${p.field}  ${p.message}`);
  process.exit(1);
}