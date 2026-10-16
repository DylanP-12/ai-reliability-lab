// scripts/showFailures.js - status and error per line. Never prints conversation text.
import { readFileSync } from 'node:fs';

const path = process.argv[2] ?? 'data/responses.smoke.jsonl';
for (const line of readFileSync(path, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  console.log(r.unit_id, '|', r.status);
  console.log('  error:', JSON.stringify(r.error ?? null));
  console.log('  fields:', Object.keys(r).join(', '));
}