// scripts/verifyExactlyOnce.js
// Proves every scheduled unit_id appears in a responses file exactly once.
// Usage: node scripts/verifyExactlyOnce.js tmp/drill/responses.jsonl
import { readFileSync } from 'node:fs';
import { parseScenarios } from '../core/parseScenarios.js';
import { expandUnits, scheduleUnits } from '../cli/expandUnits.js';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/verifyExactlyOnce.js <responses.jsonl>');
  process.exit(1);
}

// Rebuild the schedule from scratch, the same way collect.js does.
const config = JSON.parse(readFileSync('config/run.config.json', 'utf8'));
const models = JSON.parse(readFileSync('config/models.json', 'utf8'));
const meta = JSON.parse(readFileSync('data/scenarios.meta.json', 'utf8'));
const scenarios = parseScenarios(readFileSync('data/scenarios.csv', 'utf8'), { allowedCategories: meta.categories });
const scheduled = scheduleUnits(expandUnits(scenarios, models, config), config.seed).map(u => u.unit_id);

// Read every unit_id from the file.
const ids = readFileSync(path, 'utf8').trim().split('\n').map(line => JSON.parse(line).unit_id);

const seen = new Set(ids);
const scheduledSet = new Set(scheduled);
const missing = scheduled.filter(id => !seen.has(id));
const extra = [...seen].filter(id => !scheduledSet.has(id));
const duplicates = ids.length - seen.size;

console.log(`scheduled: ${scheduled.length}   lines: ${ids.length}   distinct ids: ${seen.size}`);
console.log(`missing: ${missing.length}   extra: ${extra.length}   duplicates: ${duplicates}`);
const ok = missing.length === 0 && extra.length === 0 && duplicates === 0 && ids.length === scheduled.length;
console.log(ok ? 'PASS: every scheduled unit appears exactly once' : 'FAIL');
process.exit(ok ? 0 : 1);