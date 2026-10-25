// cli/score.js - scoring CLI (L041)
// Plan: load inputs, expand eval units, print a plan summary.
// Dry run:  node cli/score.js --responses data/responses.smoke.jsonl
// Mock:     node cli/score.js --responses data/responses.smoke.jsonl --mock
// Real run: node --env-file=.env cli/score.js --responses data/responses.smoke.jsonl --go
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { parseScenarios } from '../core/parseScenarios.js';
import { chatCompletion } from '../core/llmClient.js';
import { expandEvalUnits } from './expandEvalUnits.js';
import { scoreDispatch } from './scoreDispatch.js';

const fail = (msg) => { console.error(msg); process.exit(1); };
const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1];
};

// ---------- 1. Load inputs (all file reading happens here, in cli) ----------
const responsesPath = argValue('--responses');
if (!responsesPath || !existsSync(responsesPath)) {
  fail('Pass the responses file to score, e.g. --responses data/responses.smoke.jsonl');
}
const config = JSON.parse(readFileSync('config/score.config.json', 'utf8'));
const models = JSON.parse(readFileSync('config/models.json', 'utf8'));
const rubric = JSON.parse(readFileSync('config/rubric.v1.json', 'utf8'));
const meta = JSON.parse(readFileSync('data/scenarios.meta.json', 'utf8'));
const scenarios = parseScenarios(readFileSync('data/scenarios.csv', 'utf8'), { allowedCategories: meta.categories });

// ---------- 2. Fail closed on bad setup, before anything runs ----------
const required = ['score_run_id', 'judges', 'judge_repetitions', 'exclude_self_judge', 'spend_cap_usd',
  'spacing_ms', 'judge_temperature', 'judge_max_output_tokens', 'request_timeout_ms', 'max_attempts'];
const missing = required.filter((k) => !(k in config));
if (missing.length) fail(`config/score.config.json is missing: ${missing.join(', ')}`);

for (const j of config.judges) {
  const m = models.find((x) => x.model_id === j.model_id);
  if (!m) fail(`Judge "${j.model_id}" is not in config/models.json.`);
  if (m.can_judge !== true) fail(`Judge "${j.model_id}" is not marked can_judge in config/models.json.`);
}
const noAnchors = rubric.criteria.filter((c) => !c.anchors);
if (noAnchors.length) fail(`Rubric criteria without anchors: ${noAnchors.map((c) => c.id).join(', ')}`);

// Read responses ONCE, read-only. Keep only complete records.
const records = readFileSync(responsesPath, 'utf8')
  .split('\n').filter((line) => line.trim())
  .map((line) => JSON.parse(line))
  .filter((r) => r.status === 'complete');

for (const r of records) {
  if (!scenarios.find((s) => s.conversation_id === r.conversation_id)) {
    fail(`Response ${r.unit_id} uses scenario ${r.conversation_id}, which is not in data/scenarios.csv.`);
  }
}

// ---------- 3. Plan ----------
const units = expandEvalUnits(records, config);
let checkpoints = 0;
for (const r of records) checkpoints += r.turns.filter((t) => t.is_checkpoint).length;

const ASSUMED_PROMPT_TOKENS = 1000;  // rubric + anchors + one checkpoint turn
const ASSUMED_REPLY_TOKENS = 150;    // a short JSON answer
let estimatedUSD = 0;
for (const u of units) {
  const judge = models.find((m) => m.model_id === u.judge_model_id);
  estimatedUSD += (ASSUMED_PROMPT_TOKENS / 1_000_000) * judge.price_in_per_m
                + (ASSUMED_REPLY_TOKENS / 1_000_000) * judge.price_out_per_m;
}

console.log(`score_run_id: ${config.score_run_id}   rubric: ${rubric.rubric_version}`);
console.log(`responses: ${responsesPath}   (${records.length} complete records, ${checkpoints} checkpoints)`);
console.log(`judges: ${config.judges.map((j) => j.model_id).join(', ')}   x ${config.judge_repetitions} rep(s)   self-judge ${config.exclude_self_judge ? 'excluded' : 'ALLOWED'}`);
console.log(`${units.length} evals planned`);
console.log('first 3 evals:');
for (const u of units.slice(0, 3)) console.log(`  ${u.eval_id}`);
console.log(`rough estimated cost: $${estimatedUSD.toFixed(2)}   (spend cap: $${config.spend_cap_usd})`);

// ---------- 4. Dispatch: --go is real (spends money); --mock is the offline drill ----------
const GO = process.argv.includes('--go');
const MOCK = process.argv.includes('--mock');
if (GO && MOCK) fail('Choose one: --go (real, spends money) or --mock (offline drill). Not both.');
if (!GO && !MOCK) {
  console.log('\nDry run: nothing was sent. Add --go to start scoring (spends money, up to the cap).');
  process.exit(0);
}

// A fake judge for the drill: valid JSON, every criterion at the first scale value.
async function mockJudge() {
  const scores = {};
  for (const c of rubric.criteria) scores[c.id] = rubric.scale[0];
  return {
    text: JSON.stringify({ scores, brief_justification: 'mock' }),
    usage: { prompt_tokens: 10, completion_tokens: 5, reasoning_tokens: 0 },
    latency_ms: 0, upstream_provider: 'mock', model_fingerprint: null, finish_reason: 'stop', attempts: 1,
  };
}

let apiKey = null;
let chat = mockJudge;
let runConfig = { ...config, spacing_ms: 0 };
let evaluationsPath = 'tmp/drill/evaluations.jsonl';

if (GO) {
  apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) fail('No OPENROUTER_API_KEY. Run: node --env-file=.env cli/score.js --responses <file> --go');
  chat = chatCompletion;
  runConfig = config;
  evaluationsPath = responsesPath.replace('responses', 'evaluations');  // responses.smoke.jsonl -> evaluations.smoke.jsonl
} else {
  mkdirSync('tmp/drill', { recursive: true });
  console.log('\nMOCK DRILL: fake judge, no network, writing to tmp/drill/');
}

// Belt and braces: the output may never be the input.
if (evaluationsPath === responsesPath) fail(`Refusing to write to the responses file: ${responsesPath}`);

// Ctrl-C only sets a flag. The loop checks it between evals, so the file is always whole.
let stopping = false;
process.on('SIGINT', () => {
  stopping = true;
  console.log('\nFinishing current eval, then stopping...');
});

const result = await scoreDispatch({
  units, records, scenarios, models, rubric, config: runConfig, apiKey,
  evaluationsPath, chat, shouldStop: () => stopping,
});

console.log(`Done. ran: ${result.ran}   skipped (already done): ${result.skipped}   spent: $${result.spent.toFixed(4)}   -> ${evaluationsPath}`);