// core/buildHumanEvalRecord.js
// Pure: one validated rater row in, one evaluation record out, in the SAME shape as an AI judge's.
// Measurements that do not exist for a human (usage, latency, provider...) are null, never 0.
import { buildEvalId } from './ids.js';

export const HUMAN_RATER_ID = 'human-r1';

export function buildHumanEvalRecord(row, { sheetId, rubricVersion, workerModelId }) {
  if (!workerModelId) throw new Error(`${row.blind_ref}: unit ${row.unit_id} is not in the responses file`);
  const score_run_id = `score-human-${sheetId}`;
  return {
    eval_id: buildEvalId({ score_run_id, unit_id: row.unit_id, turn_index: row.turn_index,
                           judge_model_id: HUMAN_RATER_ID, judge_repetition: 1 }),
    score_run_id,
    unit_id: row.unit_id,
    turn_index: row.turn_index,
    judge_model_id: HUMAN_RATER_ID,
    judge_repetition: 1,
    worker_model_id: workerModelId,
    rubric_version: rubricVersion,
    judge_or_model: null,          // no API route: a person graded this
    request_ts: null,
    status: 'complete',
    parse_ok: true,                // the sheet was validated before this point
    scores: row.scores,
    weighted_score: row.weighted_score,
    overall_verdict: row.overall_verdict,   // derived by parseJudge, same rule as the AI judges
    critical_failed: row.critical_failed,
    raw_output: JSON.stringify(row.raw_row), // what actually arrived: typed verdict and note included
    usage: null,
    latency_ms: null,
    upstream_provider: null,
    model_fingerprint: null,
    finish_reason: null,
    attempts: null,
    response_ts: null,
  };
}