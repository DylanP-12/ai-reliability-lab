// scripts/readUnit.js - print one unit's conversation for private reading. Never paste this output.
import { readFileSync } from 'node:fs';

const want = process.argv[2];
let found = null;
for (const line of readFileSync('data/responses.smoke.jsonl', 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  if (r.status === 'complete' && r.unit_id.includes(want)) found = r;
}
if (!found) { console.error(`No complete unit matching "${want}"`); process.exit(1); }
for (const t of found.turns) {
  console.log(`\n=== turn ${t.turn_index}: USER ===\n${t.prompt_text}`);
  console.log(`\n=== turn ${t.turn_index}: MODEL (finish=${t.finish_reason}) ===\n${t.response_text}`);
}