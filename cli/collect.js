// cli/collect.js - batch generation runner
// Plan: load inputs, expand units, schedule them, print a plan summary.
// Dispatch (only with --go): append-only + resume, spend cap, spacing, failure isolation, graceful Ctrl-C.
// Dry run:  node cli/collect.js
// Real run: node --env-file=.env cli/collect.js --go   (spends money, up to the cap)
import { readFileSync, mkdirSync } from 'node:fs';
import { parseScenarios } from '../core/parseScenarios.js';
import { estimateTurnCostUSD } from '../core/cost.js';
import { chatCompletion } from '../core/llmClient.js';
import { expandUnits, scheduleUnits } from './expandUnits.js';
import { dispatch } from './dispatch.js';
import { sha256 } from '../core/runConversation.js';
import { buildManifest, writeManifest, tallyResponses } from './writeManifest.js';
import { validateConfig } from '../core/validateConfig.js';

// ---------- 1. Load inputs (all file reading happens here, in cli) ----------
const config = validateConfig(JSON.parse(readFileSync('config/run.config.json', 'utf8')));
const models = JSON.parse(readFileSync('config/models.json', 'utf8'));
const meta = JSON.parse(readFileSync('data/scenarios.meta.json', 'utf8'));
const csvBytes = readFileSync('data/scenarios.csv');   // raw bytes, read once
const csvText = csvBytes.toString('utf8');              // the same text as before, for parsing
const datasetHash = await sha256(csvBytes);             // fingerprint of exactly these bytes
const scenarios = parseScenarios(csvText, { allowedCategories: meta.categories });
// ---------- 2. Plan: expand -> shuffle(seed) -> dispatch_index ----------
const units = expandUnits(scenarios, models, config);
const fullSchedule = scheduleUnits(units, config.seed); // seed comes from config, never a literal

// --max-units N: take the first N in dispatch order (smoke run). Fails closed on a bad N.
const maxIdx = process.argv.indexOf('--max-units');
let maxUnits = null;
if (maxIdx !== -1) {
  maxUnits = Number(process.argv[maxIdx + 1]);
  if (!Number.isInteger(maxUnits) || maxUnits <= 0) {
    console.error('--max-units needs a positive whole number, e.g. --max-units 4');
    process.exit(1);
  }
}
const schedule = maxUnits ? fullSchedule.slice(0, maxUnits) : fullSchedule;

// ---------- 3. Rough cost estimate (assumed sizes, for the plan only) ----------
const ASSUMED_PROMPT_TOKENS = 40;
const ASSUMED_REPLY_TOKENS = 200;

function roughUnitCostUSD(scenario, model) {
  let total = 0;
  for (let k = 1; k <= scenario.turn_count; k++) {
    // Turn k re-sends every earlier prompt and reply, plus the new prompt.
    const usage = {
      prompt_tokens: k * ASSUMED_PROMPT_TOKENS + (k - 1) * ASSUMED_REPLY_TOKENS,
      completion_tokens: ASSUMED_REPLY_TOKENS,
      reasoning_tokens: 0,
    };
    total += estimateTurnCostUSD(usage, model);
  }
  return total;
}

let estimatedUSD = 0;
for (const u of schedule) {
  const scenario = scenarios.find((s) => s.conversation_id === u.conversation_id);
  const model = models.find((m) => m.model_id === u.model_id);
  estimatedUSD += roughUnitCostUSD(scenario, model);
}

// ---------- 4. Summary ----------
console.log(`run_id: ${config.run_id}   seed: ${config.seed}`);
console.log(`dataset_hash: ${datasetHash}`);
console.log(
  `${scenarios.length} scenarios x ${models.length} models x ${config.repetitions} repetitions = ${fullSchedule.length} units` +
  (maxUnits ? `, running the first ${schedule.length} (--max-units)` : '')
);
console.log('first 3 in dispatch order:');
for (const u of schedule.slice(0, 3)) {
  console.log(`  ${u.dispatch_index}  ${u.unit_id}`);
}
console.log(`rough estimated cost: $${estimatedUSD.toFixed(2)}   (spend cap: $${config.spend_cap_usd})`);

// ---------- 5. Dispatch: --go is real (spends money); --mock is the offline drill ----------
const GO = process.argv.includes('--go');
const MOCK = process.argv.includes('--mock');

if (GO && MOCK) {
  console.error('Choose one: --go (real, spends money) or --mock (offline drill). Not both.');
  process.exit(1);
}
if (!GO && !MOCK) {
  console.log('\nDry run: nothing was sent. Add --go to start collecting (spends money, up to the cap).');
  process.exit(0);
}

// A slow fake model for the kill/resume drill: no network, no key, no cost.
async function slowMockChat() {
  await new Promise(resolve => setTimeout(resolve, 150));
  return {
    text: 'mock reply',
    usage: { prompt_tokens: 10, completion_tokens: 5, reasoning_tokens: 0 },
    latency_ms: 150,
    reasoning_text: null,
    refusal_signal: null,
    upstream_provider: 'mock',
    model_fingerprint: null,
    finish_reason: 'stop',
    attempts: 1,
  };
}

// Safe defaults: everything starts as the mock drill. Only --go switches to real.
let apiKey = null;
let chat = slowMockChat;
let runConfig = { ...config, spacing_ms: 0 }; // a fake model needs no request spacing
let outPath = 'tmp/drill/responses.jsonl';
let manifestPath = 'tmp/drill/manifest.json';

if (GO) {
  apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('No OPENROUTER_API_KEY. Run: node --env-file=.env cli/collect.js --go');
    process.exit(1);
  }
  chat = chatCompletion;
  runConfig = config;
  const suffix = maxUnits ? '.smoke' : '';
  outPath = `data/responses${suffix}.jsonl`;
  manifestPath = `data/manifest${suffix}.json`;
} else {
  mkdirSync('tmp/drill', { recursive: true });
  console.log('\nMOCK DRILL: fake model, no network, writing to tmp/drill/');
}

// Ctrl-C only sets a flag. dispatch checks it between units, so the file is always whole.
let stopping = false;
process.on('SIGINT', () => {
  stopping = true;
  console.log('\nFinishing current unit, then stopping...');
});

const startedAt = new Date().toISOString();

let result;
try {
  result = await dispatch({
    schedule,
    scenarios,
    models,
    config: runConfig,
    apiKey,
    outPath,
    chat,
    shouldStop: () => stopping,
  });
} finally {
  // Every way out of dispatch passes through here: normal end, cap stop,
  // Ctrl-C, or an unexpected error. So a partial run gets a manifest too.
  // Counts come from the file (all sessions), not from dispatch (this session only).
  const tally = await tallyResponses(outPath);
  const manifest = buildManifest({
    config: runConfig,
    models,
    datasetHash,
    counts: {
      unit_count: schedule.length,
      complete_count: tally.complete_count,
      failed_count: tally.failed_count,
    },
    startedAt,
    finishedAt: new Date().toISOString(),
  });
  await writeManifest(manifestPath, manifest);
  console.log(`\nManifest: ${tally.complete_count}/${schedule.length} complete, ${tally.failed_count} failed, ${tally.line_count} lines in file`);
}

console.log(`Done. ran: ${result.ran}   skipped (already complete): ${result.skipped}   spent: $${result.spent.toFixed(2)}`);