// cli/buildRubric.js
// Reads config/rubric.<version>.csv, validates it, writes config/rubric.<version>.json.
// Usage: node cli/buildRubric.js v1
import { readFileSync, writeFileSync } from 'node:fs';
import { parseRubricCsv } from '../core/parseRubricCsv.js';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node cli/buildRubric.js <version>   (e.g. v1)');
  process.exit(1);
}

const csvPath = `config/rubric.${version}.csv`;
const jsonPath = `config/rubric.${version}.json`;

const rubric = parseRubricCsv(readFileSync(csvPath, 'utf8'), { rubricVersion: version });
writeFileSync(jsonPath, JSON.stringify(rubric, null, 2) + '\n');

const critical = rubric.criteria.filter(c => c.critical).map(c => c.id);
console.log(`Wrote ${jsonPath}`);
console.log(`  criteria: ${rubric.criteria.length}`);
console.log(`  critical: ${critical.join(', ')}`);
console.log(`  scale:    ${rubric.scale.join(' / ')}`);