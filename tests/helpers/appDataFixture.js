// tests/helpers/appDataFixture.js
// One complete, FAKE input set for prepareAppData, written to a temp folder (L064).
// Rule: a test never falls through to prepareAppData's defaults. Those point at
// real, gitignored study data: present on the researcher's laptop, absent in CI.
// The only shared inputs are committed files (rubric, manifest), identical on every clone.
// Not a *.test.js file, so node --test does not run it as a test.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Adversarial on purpose: accent, emoji, tab, newline, and trailing spaces.
export const TRICKY = 'Caf\u00e9 \u2615 \u{1F600}\tTabbed  \nSecond line  ';
export const FAKE_KEY = 'sk-or-v1-FAKEKEY0123456789abcdef0123456789';

export const OK_UNIT = 'run-x:FIX1:modelA:r01';
export const FAIL_UNIT = 'run-x:FIX1:modelA:r02';
export const RETRY_UNIT = 'run-x:FIX1:modelA:r03';

function turn(i, prompt, response, isCheckpoint) {
  return {
    turn_index: i,
    prompt_text: prompt,
    response_text: response,
    is_checkpoint: isCheckpoint,
    upstream_provider: 'ProviderSecretName',
  };
}

function base(unitId, repetition) {
  return {
    unit_id: unitId, conversation_id: 'FIX1', model_id: 'modelA', category: 'format',
    repetition, reasoning_enabled: false,
  };
}

// A fake judge result for the checkpoint (turn 2), shaped like a real eval record.
function evalRecord(unitId, verdict) {
  const pass = verdict === 'pass';
  return {
    eval_id: `score-fix:${unitId}:t2:judgeA:j1`,
    score_run_id: 'score-fix',
    unit_id: unitId,
    turn_index: 2,
    judge_model_id: 'judgeA',
    judge_repetition: 1,
    worker_model_id: 'modelA',
    rubric_version: 'v1',
    judge_or_model: 'vendor/judge-a',
    request_ts: '2026-01-01T00:00:00.000Z',
    status: 'complete',
    parse_ok: true,
    scores: pass
      ? { setup_respected: 'yes', helpfulness: 'partial' }
      : { setup_respected: 'no', helpfulness: 'yes' },
    weighted_score: pass ? 0.85 : 0.25,
    overall_verdict: verdict,
    critical_failed: !pass,
    raw_output: '{"scores":"fake judge output"}',
    usage: { prompt_tokens: 100, completion_tokens: 20 },
    latency_ms: 500,
    upstream_provider: 'JudgeHost',
    model_fingerprint: null,
    finish_reason: 'stop',
    attempts: 1,
    response_ts: '2026-01-01T00:00:01.000Z',
  };
}

const jsonl = (records) => records.map((r) => JSON.stringify(r)).join('\n') + '\n';

export function buildFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'prep-test-'));
  const records = [
    {
      ...base(OK_UNIT, 1), status: 'complete', debug_auth: FAKE_KEY,
      turns: [turn(1, 'Hello', 'Hi there', false), turn(2, 'Second prompt', TRICKY, true)],
    },
    {
      ...base(FAIL_UNIT, 2), status: 'failed', turns: [],
      error: { stage: 'generation', turn_index: 1, classification: 'auth', message: 'status 401' },
    },
    {
      ...base(RETRY_UNIT, 3), status: 'failed', turns: [],
      error: { stage: 'generation', turn_index: 1, classification: 'rate_limit', message: 'status 429' },
    },
    {
      ...base(RETRY_UNIT, 3), status: 'complete',
      turns: [turn(1, 'Hello', 'Hi again', false), turn(2, 'Second prompt', 'Retry worked', true)],
    },
  ];
  writeFileSync(join(dir, 'responses.jsonl'), jsonl(records), 'utf8');
  writeFileSync(join(dir, 'evaluations.jsonl'),
    jsonl([evalRecord(OK_UNIT, 'pass'), evalRecord(RETRY_UNIT, 'fail')]), 'utf8');
  writeFileSync(join(dir, 'models.json'), JSON.stringify([
    { model_id: 'modelA', label: 'Model A', or_model: 'vendor/model-a', provider_pin: 'somehost',
      api_key: FAKE_KEY, reasoning_enabled: false, family: 'fam', weights: 'open',
      price_in_per_m: 1, price_out_per_m: 2 },
  ]), 'utf8');
  writeFileSync(join(dir, 'scenarios.csv'),
    'conversation_id,turn_index,prompt_text,evaluation_note,category\n' +
    'FIX1,1,Hello,,format\n' +
    'FIX1,2,Second prompt,CANARY_PRIVATE_NOTE_7731,format\n', 'utf8');
  writeFileSync(join(dir, 'scenarios.meta.json'), JSON.stringify({ categories: ['format'] }), 'utf8');
  return dir;
}

// EVERY prepareAppData input, explicit. Optional Phase R inputs point at a path
// that cannot exist, so a researcher's real manual/human files never leak in.
export function fixturePaths(dir) {
  const absent = join(dir, '__absent_on_purpose__');
  return {
    responsesPath: join(dir, 'responses.jsonl'),
    evaluationsPath: join(dir, 'evaluations.jsonl'),
    modelsPath: join(dir, 'models.json'),
    scenariosPath: join(dir, 'scenarios.csv'),
    metaPath: join(dir, 'scenarios.meta.json'),
    manualResponsesPath: `${absent}.manual.jsonl`,
    manualEvaluationsPath: `${absent}.manual-evals.jsonl`,
    humanEvaluationsPath: `${absent}.human.jsonl`,
    calibrationPath: `${absent}.calibration.json`,
    // Committed, fixed files: identical on every clone, so safe to share.
    rubricPath: 'config/rubric.v1.json',
    manifestPath: 'data/manifest.smoke.json',
  };
}