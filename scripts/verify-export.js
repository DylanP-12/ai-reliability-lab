// Usage: node scripts/verify-export.js <export.json> [frozen responses.jsonl]
import { readFileSync } from 'node:fs';
import { readJsonl, latestPerUnit } from '../cli/prepare-app-data.js';

const [exportPath, frozenPath = 'data/responses.smoke.jsonl'] = process.argv.slice(2);
if (!exportPath) {
  console.error('usage: node scripts/verify-export.js <export.json> [responses.jsonl]');
  process.exit(2);
}

const pkg = JSON.parse(readFileSync(exportPath, 'utf8'));
const frozen = latestPerUnit(readJsonl(frozenPath));
const exported = new Map(pkg.units.map((u) => [u.unit_id, u]));
const problems = [];
let turnsChecked = 0;

if (pkg.units.length !== frozen.length) {
  problems.push(`unit count: export ${pkg.units.length}, frozen ${frozen.length}`);
}
for (const source of frozen) {
  const unit = exported.get(source.unit_id);
  if (!unit) { problems.push(`missing unit ${source.unit_id}`); continue; }
  for (const turn of source.turns) {
    const copy = unit.turns.find((t) => t.turn_index === turn.turn_index);
    if (!copy) { problems.push(`missing turn ${turn.turn_index} in ${source.unit_id}`); continue; }
    turnsChecked += 1;
    if (copy.response_text !== turn.response_text) {
      problems.push(`text differs: ${source.unit_id} turn ${turn.turn_index}`);
    }
  }
}

if (problems.length > 0) {
  console.error(`FAIL: ${problems.length} problem(s)\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`PASS: ${frozen.length} units, ${turnsChecked} turns: ids and response text identical to ${frozenPath}`);