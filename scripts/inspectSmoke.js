// scripts/inspectSmoke.js - provenance per turn for complete units. Prints no conversation text.
import { readFileSync } from 'node:fs';

const path = process.argv[2] ?? 'data/responses.smoke.jsonl';
const isIso = (s) => typeof s === 'string' && s.endsWith('Z') && !Number.isNaN(Date.parse(s));

for (const line of readFileSync(path, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  if (r.status !== 'complete') continue;
  console.log(`\n${r.unit_id}  pin=${JSON.stringify(r.provider_pin)}  temp=${r.temperature}`);
  let prev = -1;
  for (const t of r.turns) {
    const p = t.usage?.prompt_tokens;
    console.log(
      `  t${t.turn_index}  in=${p}${p > prev ? '' : ' <-- NOT GROWING'}  out=${t.usage?.completion_tokens}` +
      `  provider=${t.upstream_provider}  fp=${t.model_fingerprint}  finish=${t.finish_reason}` +
      `  attempts=${t.attempts}  hash=${t.prompt_hash ? 'yes' : 'NO'}` +
      `  ts=${isIso(t.request_ts) && isIso(t.response_ts) ? 'ok' : 'BAD'}  reply_chars=${t.response_text?.length}`
    );
    prev = p;
  }
}