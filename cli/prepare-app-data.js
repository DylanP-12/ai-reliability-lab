// cli/prepare-app-data.js: frozen data to app-sized chunks (L043) + aggregates (L044)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseScenarios } from '../core/parseScenarios.js';

export function unitFile(unitId) {
  return `conversations/${unitId.replaceAll(':', '_')}.json`;
}

export function evalFile(unitId) {
  return `evaluations/${unitId.replaceAll(':', '_')}.json`;
}

// L054: one judge result for the Scoring screen. Copy fields by name (whitelist).
// Score fields exist ONLY when the judge's answer was parsed. No defaults, ever.
export function toEvalDisplay(e) {
  const out = {
    eval_id: e.eval_id,
    turn_index: e.turn_index,
    judge_model_id: e.judge_model_id,
    judge_repetition: e.judge_repetition,
    rubric_version: e.rubric_version,
    status: e.status,
    parse_ok: e.parse_ok === true,
    raw_output: e.raw_output ?? null,
  };
  if (e.status === 'failed') {
    out.error_reason = e.error?.classification ?? 'unknown';
  } else if (e.parse_ok !== true) {
    out.error_reason = typeof e.error === 'string' ? e.error : 'judge output could not be parsed';
  } else {
    out.scores = e.scores;
    out.weighted_score = e.weighted_score;
    out.overall_verdict = e.overall_verdict;
    out.critical_failed = e.critical_failed === true;
  }
  return out;
}

export function readJsonl(path) {
  const text = readFileSync(path, 'utf8');
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

export function latestPerUnit(records) {
  const byUnit = new Map();
  for (const record of records) {
    byUnit.set(record.unit_id, record);
  }
  return [...byUnit.values()];
}

export function latestPerEval(records) {
  const byEval = new Map();
  for (const record of records) {
    byEval.set(record.eval_id, record);
  }
  return [...byEval.values()];
}

export function combineJudgments(evals) {
  const judgments = evals.map((e) => {
    const base = { judge_model_id: e.judge_model_id, judge_repetition: e.judge_repetition };
    if (e.status === 'failed') {
      return { ...base, status: 'failed', reason: e.error?.classification ?? 'unknown' };
    }
    if (e.parse_ok !== true) {
      return { ...base, status: 'unparseable' };
    }
    return { ...base, status: 'scored', overall_verdict: e.overall_verdict, weighted_score: e.weighted_score };
  });

  const scored = judgments.filter((j) => j.status === 'scored');
  const passes = scored.filter((j) => j.overall_verdict === 'pass').length;
  const fails = scored.filter((j) => j.overall_verdict === 'fail').length;
  if (passes + fails !== scored.length) {
    throw new Error('combineJudgments: overall_verdict must be "pass" or "fail"');
  }

  let outcome;
  if (scored.length === 0) outcome = 'no_valid_judgment';
  else if (passes > fails) outcome = 'pass';
  else if (fails > passes) outcome = 'fail';
  else outcome = 'split';

  const mean_weighted_score =
    scored.length === 0 ? null : scored.reduce((sum, j) => sum + j.weighted_score, 0) / scored.length;

  return { outcome, mean_weighted_score, judgments };
}

export function scoreUnit(unit, evalsForUnit) {
  if (unit.status === 'failed') {
    return { unit_id: unit.unit_id, status: 'failed', checkpoints: [] };
  }
  const checkpointTurns = unit.turns
    .filter((turn) => turn.is_checkpoint)
    .map((turn) => turn.turn_index);
  const checkpoints = checkpointTurns.map((turnIndex) => ({
    turn_index: turnIndex,
    ...combineJudgments(evalsForUnit.filter((e) => e.turn_index === turnIndex)),
  }));
  return { unit_id: unit.unit_id, status: unit.status, checkpoints };
}

export function summarizeGroup({ conversation_id, model_id, units }) {
  const scoredUnits = units.filter((u) => u.status !== 'failed');
  const failedUnits = units.filter((u) => u.status === 'failed');

  const turnIndexes = [...new Set(scoredUnits.flatMap((u) => u.checkpoints.map((c) => c.turn_index)))]
    .sort((a, b) => a - b);

  const checkpoints = turnIndexes.map((turnIndex) => {
    const results = scoredUnits.flatMap((u) => u.checkpoints.filter((c) => c.turn_index === turnIndex));
    const count = (outcome) => results.filter((c) => c.outcome === outcome).length;
    const pass = count('pass');
    const fail = count('fail');
    const judgments = results.flatMap((c) => c.judgments);
    const means = results.map((c) => c.mean_weighted_score).filter((v) => v !== null);
    return {
      turn_index: turnIndex,
      pass,
      fail,
      split: count('split'),
      no_valid_judgment: count('no_valid_judgment'),
      denominator: pass + fail,
      rate: pass + fail === 0 ? null : pass / (pass + fail),
      mean_weighted_score: means.length === 0 ? null : means.reduce((a, b) => a + b, 0) / means.length,
      judgments_failed: judgments.filter((j) => j.status === 'failed').length,
      judgments_unparseable: judgments.filter((j) => j.status === 'unparseable').length,
    };
  });

  return {
    conversation_id,
    model_id,
    units_total: units.length,
    units_scored: scoredUnits.length,
    units_failed: failedUnits.length,
    failed_unit_ids: failedUnits.map((u) => u.unit_id),
    checkpoints,
    units,
  };
}

export const COMBINE_RULE =
  'outcome = majority of overall_verdict across scored judgments (tie = "split"); ' +
  'mean_weighted_score = mean over scored judgments; failed and unparseable judgments are listed but never vote';

export function buildScores(units, evals) {
  const groups = new Map();
  for (const unit of units) {
    const key = `${unit.conversation_id}|${unit.model_id}`;
    if (!groups.has(key)) {
      groups.set(key, { conversation_id: unit.conversation_id, model_id: unit.model_id, units: [] });
    }
    const evalsForUnit = evals.filter((e) => e.unit_id === unit.unit_id);
    groups.get(key).units.push(scoreUnit(unit, evalsForUnit));
  }
  return {
    combine_rule: COMBINE_RULE,
    groups: [...groups.values()].map(summarizeGroup),
  };
}

export function buildDegradation(scores) {
  const byModel = new Map();
  for (const g of scores.groups) {
    if (!byModel.has(g.model_id)) {
      byModel.set(g.model_id, {
        model_id: g.model_id, units_total: 0, units_scored: 0, units_failed: 0, points: new Map(),
      });
    }
    const m = byModel.get(g.model_id);
    m.units_total += g.units_total;
    m.units_scored += g.units_scored;
    m.units_failed += g.units_failed;
    for (const c of g.checkpoints) {
      if (!m.points.has(c.turn_index)) {
        m.points.set(c.turn_index, {
          turn_index: c.turn_index, pass: 0, fail: 0, split: 0, no_valid_judgment: 0, units_failed: 0,
        });
      }
      const p = m.points.get(c.turn_index);
      p.pass += c.pass;
      p.fail += c.fail;
      p.split += c.split;
      p.no_valid_judgment += c.no_valid_judgment;
      p.units_failed += g.units_failed;
    }
  }

  return {
    x_axis: 'turn_index of the checkpoint (scored-turn position)',
    models: [...byModel.values()].map((m) => ({
      ...m,
      points: [...m.points.values()]
        .sort((a, b) => a.turn_index - b.turn_index)
        .map((p) => ({
          ...p,
          denominator: p.pass + p.fail,
          rate: p.pass + p.fail === 0 ? null : p.pass / (p.pass + p.fail),
        })),
    })),
  };
}

export function toConversation(unit) {
  return {
    unit_id: unit.unit_id,
    turns: unit.turns.map((turn) => ({
      turn_index: turn.turn_index,
      prompt_text: turn.prompt_text,
      response_text: turn.response_text,
      is_checkpoint: turn.is_checkpoint,
    })),
  };
}

export function toIndexEntry(unit) {
  const entry = {
    unit_id: unit.unit_id,
    file: unitFile(unit.unit_id),
        eval_file: evalFile(unit.unit_id),
    conversation_id: unit.conversation_id,
    model_id: unit.model_id,
    category: unit.category,
    repetition: unit.repetition,
    reasoning_enabled: unit.reasoning_enabled,
    status: unit.status,
    turn_count: unit.turns.length,
    checkpoint_turns: unit.turns
      .filter((turn) => turn.is_checkpoint)
      .map((turn) => turn.turn_index),
  };
  if (unit.status === 'failed') {
    entry.failure = {
      classification: unit.error?.classification ?? 'unknown',
      turn_index: unit.error?.turn_index ?? null,
    };
  }
  return entry;
}

export function toModelDisplay(model) {
  return {
    model_id: model.model_id,
    label: model.label,
    reasoning_enabled: model.reasoning_enabled,
    family: model.family,
    weights: model.weights,
  };
}

export function toScenarioDisplay(scenario) {
  return {
    conversation_id: scenario.conversation_id,
    category: scenario.category,
    turn_count: scenario.turn_count,
    checkpoints: scenario.checkpoints,
    turns: scenario.turns.map((turn) => ({
      turn_index: turn.turn_index,
      prompt_text: turn.prompt_text,
    })),
  };
}

// L056: judge-calibration summary for the Results screen.
// No source file -> an explicit { status: 'none' }, never a missing file or a guessed number.
// Allowlist: only these fields reach the browser. Anything malformed throws (fail closed).
const CAL_COUNTS = ['checkpoints_compared', 'checkpoints_agreed', 'criteria_compared', 'criteria_agreed', 'excluded'];
const CAL_BUCKETS = ['rubric_ambiguity', 'judge_error', 'hard_case'];

export function toCalibrationDisplay(raw) {
  if (raw === null) return { status: 'none' };
  const need = (ok, message) => { if (!ok) throw new Error(`calibration: ${message}`); };
  const isCount = (v) => Number.isInteger(v) && v >= 0;

  need(['practice', 'expert'].includes(raw.status), `unknown status "${raw.status}"`);
  need(/^\d{4}-\d{2}-\d{2}$/.test(raw.as_of ?? ''), 'as_of must be a YYYY-MM-DD date');
  need(typeof raw.rater === 'string' && typeof raw.rubric_version === 'string', 'rater and rubric_version are required');
  for (const key of CAL_COUNTS) need(isCount(raw[key]), `${key} must be a whole number`);
  for (const b of CAL_BUCKETS) need(isCount(raw.disagreements?.[b]), `disagreements.${b} must be a whole number`);
  need(raw.checkpoints_agreed <= raw.checkpoints_compared, 'checkpoints_agreed exceeds checkpoints_compared');
  need(raw.criteria_agreed <= raw.criteria_compared, 'criteria_agreed exceeds criteria_compared');
  const bucketed = CAL_BUCKETS.reduce((total, b) => total + raw.disagreements[b], 0);
  need(bucketed === raw.checkpoints_compared - raw.checkpoints_agreed, 'every checkpoint disagreement needs exactly one bucket');
  need(Array.isArray(raw.limitations) && raw.limitations.every((s) => typeof s === 'string'), 'limitations must be a list of sentences');

  return {
    status: raw.status,
    as_of: raw.as_of,
    rater: raw.rater,
    rubric_version: raw.rubric_version,
    ...Object.fromEntries(CAL_COUNTS.map((key) => [key, raw[key]])),
    disagreements: Object.fromEntries(CAL_BUCKETS.map((b) => [b, raw.disagreements[b]])),
    limitations: [...raw.limitations],
  };
}
// L058: the run manifest for the export package. Allowlist: named fields only.
// config_snapshot is deliberately NOT copied. A missing required field fails closed.
const MANIFEST_REQUIRED = [
  'run_id', 'dataset_version', 'dataset_hash', 'seed', 'models', 'repetitions',
  'unit_count', 'complete_count', 'failed_count', 'started_at', 'finished_at',
];
const MANIFEST_OPTIONAL = ['concurrency', 'code_version'];

export function toManifestDisplay(raw) {
  const missing = MANIFEST_REQUIRED.filter((key) => raw[key] === undefined);
  if (missing.length > 0) throw new Error(`manifest: missing ${missing.join(', ')}`);
  const out = Object.fromEntries(MANIFEST_REQUIRED.map((key) => [key, raw[key]]));
  for (const key of MANIFEST_OPTIONAL) {
    if (raw[key] !== undefined) out[key] = raw[key];
  }
  return out;
}


export function prepareAppData({
  responsesPath = 'data/responses.smoke.jsonl',
  evaluationsPath = 'data/evaluations.smoke.jsonl',
  modelsPath = 'config/models.json',
  scenariosPath = 'data/scenarios.csv',
  metaPath = 'data/scenarios.meta.json',
  rubricPath = 'config/rubric.v1.json',
  calibrationPath = 'data/calibration.json',
  manifestPath = 'data/manifest.smoke.json',   // <-- the new line
  outDir = 'app/public/data',
} = {}) {
  const units = latestPerUnit(readJsonl(responsesPath));

  mkdirSync(`${outDir}/conversations`, { recursive: true });
  for (const unit of units) {
    writeFileSync(
      `${outDir}/${unitFile(unit.unit_id)}`,
      JSON.stringify(toConversation(unit), null, 2),
      'utf8',
    );
  }

  const index = units.map(toIndexEntry);
  writeFileSync(`${outDir}/index.json`, JSON.stringify(index, null, 2), 'utf8');

  const models = JSON.parse(readFileSync(modelsPath, 'utf8')).map(toModelDisplay);
  writeFileSync(`${outDir}/models.json`, JSON.stringify(models, null, 2), 'utf8');

  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const scenarios = parseScenarios(readFileSync(scenariosPath, 'utf8'), {
    allowedCategories: meta.categories,
  }).map(toScenarioDisplay);
  writeFileSync(`${outDir}/scenarios.json`, JSON.stringify(scenarios, null, 2), 'utf8');

  // L053: publish ONLY the declared category list (named field, never the whole meta file),
  // so the browser can run the same category check as the CLI.
  writeFileSync(`${outDir}/scenarios.meta.json`, JSON.stringify({ categories: meta.categories }, null, 2), 'utf8');
  const evals = latestPerEval(readJsonl(evaluationsPath));
  const scores = buildScores(units, evals);
  writeFileSync(`${outDir}/scores.json`, JSON.stringify(scores, null, 2), 'utf8');
  
    // L054: per-unit judge details + the rubric, for the Scoring screen
  mkdirSync(`${outDir}/evaluations`, { recursive: true });
  for (const unit of units) {
    const detail = evals.filter((e) => e.unit_id === unit.unit_id).map(toEvalDisplay);
    writeFileSync(`${outDir}/${evalFile(unit.unit_id)}`, JSON.stringify(detail, null, 2), 'utf8');
  }
  const rubric = JSON.parse(readFileSync(rubricPath, 'utf8'));
  writeFileSync(`${outDir}/rubric.json`, JSON.stringify(rubric, null, 2), 'utf8');
    const manifest = toManifestDisplay(JSON.parse(readFileSync(manifestPath, 'utf8')));
  writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2), 'utf8');
  const degradation = buildDegradation(scores);
  mkdirSync(`${outDir}/results`, { recursive: true });
  writeFileSync(`${outDir}/results/degradation.json`, JSON.stringify(degradation, null, 2), 'utf8');

  
  const calibration = toCalibrationDisplay(
    existsSync(calibrationPath) ? JSON.parse(readFileSync(calibrationPath, 'utf8')) : null,
  );
  writeFileSync(`${outDir}/calibration.json`, JSON.stringify(calibration, null, 2), 'utf8');

  return {
    units: units.length,
    index: index.length,
    models: models.length,
    scenarios: scenarios.length,
    scoreGroups: scores.groups.length,
    degradationModels: degradation.models.length,
    calibration: calibration.status,
  };
}

// Run only when started directly with `node cli/prepare-app-data.js`, not when imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = prepareAppData();
  console.log(`wrote ${r.units} conversation files to app/public/data/conversations`);
  console.log(`wrote index.json with ${r.index} entries`);
  console.log(`wrote models.json with ${r.models} entries`);
  console.log(`wrote scenarios.json with ${r.scenarios} scenarios`);
  console.log(`wrote scores.json with ${r.scoreGroups} groups`);
    console.log(`wrote results/degradation.json with ${r.degradationModels} models`);
      console.log(`wrote calibration.json (status: ${r.calibration})`);
}