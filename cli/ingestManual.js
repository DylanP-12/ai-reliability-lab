// cli/ingestManual.js (Node-only)
// Turns hand-collected response files into records in their OWN file.
// Never writes responses.jsonl. Re-running adds zero records.
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseCsv, parseScenarios } from '../core/parseScenarios.js';
import { parseManualFilename, splitResponses } from '../core/parseManualFile.js';
import { buildManualRecord } from '../core/buildManualRecord.js';
import { appendRecord, loadCompleteUnitIds } from './appendRecord.js';

export function loadSessionLog(path) {
  const rows = parseCsv(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
    .filter(r => r.some(cell => cell !== ''));
  const [header, ...body] = rows;
  return body.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

export async function ingestManual({ manualDir, logRows, scenarios, runId, datasetVersion, outPath }) {
  const files = readdirSync(manualDir).filter(f => f.endsWith('.txt')).sort();
  if (files.length === 0) throw new Error(`no .txt files in ${manualDir}`);

  // Build every record first: if any file is bad, nothing is written.
  const records = [];
  for (const f of files) {
    const { conversationId, modelId, repetition } = parseManualFilename(f);
    const scenario = scenarios.find(s => s.conversation_id === conversationId);
    if (!scenario) throw new Error(`${f}: unknown conversation_id "${conversationId}"`);
    const repLabel = `r${String(repetition).padStart(2, '0')}`;
    const logRow = logRows.find(r =>
      r.conversation_id === conversationId && r.model_id === modelId && r.repetition === repLabel);
    if (!logRow) throw new Error(`${f}: no row in session-log.csv for ${conversationId} / ${modelId} / ${repLabel}`);
    const responses = splitResponses(readFileSync(`${manualDir}/${f}`, 'utf8'), f);
    records.push(await buildManualRecord({
      scenario, modelId, repetition, responses, runId, datasetVersion,
      collectedAt: logRow.collected_at_utc,
    }));
  }

  // Resume: a unit already in the file is skipped, never rewritten.
  const done = loadCompleteUnitIds(outPath);
  let ingested = 0;
  let present = 0;
  for (const record of records) {
    if (done.has(record.unit_id)) { present++; continue; }
    appendRecord(outPath, record);
    ingested++;
  }
  return { outPath, ingested, present };
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

export async function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  if (!a['run-id'] || a['run-id'] === true) {
    throw new Error('missing required option: --run-id (use one fixed id for the whole manual study)');
  }
  const config = JSON.parse(readFileSync('config/run.config.json', 'utf8'));
  const meta = JSON.parse(readFileSync('data/scenarios.meta.json', 'utf8'));
  const csvText = readFileSync('data/scenarios.csv', 'utf8').replace(/^\uFEFF/, '');
  const scenarios = parseScenarios(csvText, { allowedCategories: meta.categories });
  const r = await ingestManual({
    manualDir: 'manual',
    logRows: loadSessionLog('manual/session-log.csv'),
    scenarios,
    runId: a['run-id'],
    datasetVersion: config.dataset_version,
    outPath: 'data/responses.manual.jsonl',
  });
  console.log(`-> ${r.outPath}`);
  console.log(`  ingested: ${r.ingested}   already present: ${r.present}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e.message); process.exitCode = 1; });
}