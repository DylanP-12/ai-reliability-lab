// cli/importHumanScores.js
// Validates a returned rater sheet and appends human evaluations to their OWN file.
// Never writes evaluations.smoke.jsonl or responses.*.jsonl. Re-running adds zero records.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseHumanSheet } from '../core/parseHumanSheet.js';
import { buildHumanEvalRecord } from '../core/buildHumanEvalRecord.js';
import { appendRecord, loadCompleteEvalIds } from './appendRecord.js';
import { readJsonl } from './prepare-app-data.js';
import { buildAgreementReport } from '../core/agreementReport.js';
// The key decides the destination, so a practice sheet can never land in the calibration file.
const OUT_BY_RULE = {
  'rehearsal-all': 'evaluations.human.rehearsal.jsonl',
  'study-r01': 'evaluations.human.jsonl',
};

export function importHumanScores({ sheetPath, keyPath, rubricPath, responsesPath, dataDir }) {
  const key = JSON.parse(readFileSync(keyPath, 'utf8'));
  const rubric = JSON.parse(readFileSync(rubricPath, 'utf8'));
  const outName = OUT_BY_RULE[key.rule];
  if (!outName) throw new Error(`key rule "${key.rule}" has no human evaluations file; refusing to import`);
  const outPath = `${dataDir}/${outName}`;

  const { rows, skipped, missing } = parseHumanSheet({ csvText: readFileSync(sheetPath, 'utf8'), key, rubric });
  const workerByUnit = new Map(readJsonl(responsesPath).map(r => [r.unit_id, r.model_id]));

  // Build every record first: if any row fails, nothing is written.
  const records = rows.map(row => buildHumanEvalRecord(row, {
    sheetId: key.sheet_id, rubricVersion: rubric.rubric_version, workerModelId: workerByUnit.get(row.unit_id),
  }));

  const done = loadCompleteEvalIds(outPath);
  let imported = 0;
  let present = 0;
  for (const record of records) {
    if (done.has(record.eval_id)) { present++; continue; }
    appendRecord(outPath, record);
    imported++;
  }
  const mismatches = rows.filter(r => r.verdict_mismatch).map(r => r.blind_ref);
  return { outPath, imported, present, skipped, missing, mismatches };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error(`bad argument near "${argv[i]}"`);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { args[argv[i].slice(2)] = true; continue; }
    args[argv[i].slice(2)] = next;
    i++;
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  if (!a['sheet-id']) throw new Error('missing required option: --sheet-id');
  const id = a['sheet-id'];
  const r = importHumanScores({
    sheetPath: `export/human/human-sheet-${id}.csv`,
    keyPath: `export/human/human-key-${id}.json`,
    rubricPath: a.rubric ?? 'config/rubric.v1.json',
    responsesPath: a.responses ?? 'data/responses.smoke.jsonl',
    dataDir: 'data',
  });
  console.log(`sheet ${id} -> ${r.outPath}`);
  console.log(`  imported: ${r.imported}   already present: ${r.present}`);
  console.log(`  skipped: ${r.skipped.length}${r.skipped.map(s => `\n    ${s.blind_ref}: ${s.reason}`).join('')}`);
  console.log(`  not on the sheet: ${r.missing.length}${r.missing.length ? ' (' + r.missing.join(', ') + ')' : ''}`);
  console.log(`  typed verdict differs from derived: ${r.mismatches.length}${r.mismatches.length ? ' (' + r.mismatches.join(', ') + ')' : ''}`);

    if (!a.report) return;
  const key = JSON.parse(readFileSync(`export/human/human-key-${id}.json`, 'utf8'));
  const rubric = JSON.parse(readFileSync(a.rubric ?? 'config/rubric.v1.json', 'utf8'));
  const humanEvals = readJsonl(r.outPath).filter(e => e.score_run_id === `score-human-${id}`);
  const aiEvals = readJsonl(a.evals ?? 'data/evaluations.smoke.jsonl');
  const fmt = x => (x === null ? 'undefined (one label only)' : x.toFixed(2));
  const counts = s => `${s.agreed} of ${s.n} agreed (human stricter ${s.aStricter}, judge stricter ${s.bStricter})`;

  console.log(`\nAGREEMENT, sheet ${id}, rule ${key.rule}${key.rule === 'rehearsal-all' ? ': PRACTICE GRADES, NOT CALIBRATION' : ''}`);
  console.log(`human items: ${humanEvals.length}; skipped on the sheet: ${r.skipped.length}; one rater (human-r1)`);
  const report = buildAgreementReport({ humanEvals, aiEvals, rubric });
  if (report.length === 0) console.log('no AI evaluations to compare against');
  for (const j of report) {
    console.log(`\n${j.judge}  (excluded: ${j.excluded.not_judged} not judged, ${j.excluded.unparseable} unparseable)`);
    console.log(`  verdict: ${counts(j.verdict)}; kappa ${fmt(j.verdict.kappa)}, AC1 ${fmt(j.verdict.ac1)}`);
    for (const [cid, s] of Object.entries(j.criteria)) {
      console.log(`  ${cid}: ${counts(s)}; weighted kappa ${fmt(s.kappaWeighted)}, AC1 ${fmt(s.ac1)}`);
    }
  }
}


if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; }
}