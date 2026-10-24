// cli/scoreDispatch.js - the resumable scoring loop (Node-only: writes via appendRecord)
// Reads responses only as in-memory records. Its ONLY write is append(evaluationsPath, ...).
import { buildJudgePacket } from '../core/buildJudgePacket.js';
import { buildJudgePrompt } from '../core/buildJudgePrompt.js';
import { parseJudge } from '../core/parseJudge.js';
import { estimateTurnCostUSD } from '../core/cost.js';
import { appendRecord, loadCompleteEvalIds } from './appendRecord.js';

const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Worst-case cost of one judge call: whole prompt in (~1 token per 3 chars), max tokens out.
function estimateJudgeCall(messages, judge, config) {
  let chars = 0;
  for (const m of messages) chars += m.content.length;
  const inputTokens = Math.ceil(chars / 3);
  const inputCost = (inputTokens / 1_000_000) * judge.price_in_per_m;
  const outputCost = (config.judge_max_output_tokens / 1_000_000) * judge.price_out_per_m;
  return inputCost + outputCost;
}

export async function scoreDispatch({
  units, records, scenarios, models, rubric, config, apiKey, evaluationsPath, chat,
  append = appendRecord, sleepFn = realSleep, shouldStop = () => false,
}) {
  const done = loadCompleteEvalIds(evaluationsPath);
  const byUnitId = new Map(records.map((r) => [r.unit_id, r]));
  let ran = 0;
  let skipped = 0;
  let spent = 0;

  for (const unit of units) {
    if (shouldStop()) {
      console.log('Stop requested. Stopping after the last saved eval.');
      break;
    }
    if (done.has(unit.eval_id)) {
      skipped++;
      continue;
    }

    // Fail closed: an unknown judge has no price, so the cap can't be checked
    const judge = models.find((m) => m.model_id === unit.judge_model_id);
    if (!judge) {
      console.log(`Unknown judge model "${unit.judge_model_id}". Stopping so the spend cap can't be bypassed.`);
      break;
    }

    // Build what the judge sees: blinded packet -> fenced prompt
    const record = byUnitId.get(unit.unit_id);
    const scenario = scenarios.find((s) => s.conversation_id === record.conversation_id);
    const scenarioTurn = scenario.turns.find((t) => t.turn_index === unit.turn_index);
    const packet = buildJudgePacket({
      rubric,
      conversationRecord: record,
      turn_index: unit.turn_index,
      evaluation_note: scenarioTurn.evaluation_note,
    });
    const messages = buildJudgePrompt(packet);

    // Cap check BEFORE any money moves
    const estimate = estimateJudgeCall(messages, judge, config);
    if (spent + estimate > config.spend_cap_usd) {
      console.log(`Spend cap reached ($${spent.toFixed(2)} spent, next eval ~$${estimate.toFixed(4)}, cap $${config.spend_cap_usd}). Stopping cleanly.`);
      break;
    }

    const evalRecord = {
      eval_id: unit.eval_id,
      score_run_id: config.score_run_id,
      unit_id: unit.unit_id,
      turn_index: unit.turn_index,
      judge_model_id: unit.judge_model_id,
      judge_repetition: unit.judge_repetition,
      rubric_version: rubric.rubric_version,
      judge_or_model: judge.or_model,
      request_ts: new Date().toISOString(),
    };

    let result = null;
    try {
      result = await chat({
        or_model: judge.or_model,
        messages,
        provider_pin: judge.provider_pin,
        reasoning_enabled: judge.reasoning_enabled,
        temperature: config.judge_temperature,
        max_tokens: config.judge_max_output_tokens,
        timeout_ms: config.request_timeout_ms,
        max_attempts: config.max_attempts,
        apiKey,
      });
      // The call happened: status 'complete', whatever the parse says
      evalRecord.status = 'complete';
      Object.assign(evalRecord, parseJudge(result.text, rubric));
      evalRecord.usage = result.usage;
      evalRecord.latency_ms = result.latency_ms;
      evalRecord.upstream_provider = result.upstream_provider;
      evalRecord.model_fingerprint = result.model_fingerprint;
      evalRecord.finish_reason = result.finish_reason;
      evalRecord.attempts = result.attempts;
    } catch (err) {
      // The call itself failed: nothing to keep, so resume will retry it
      evalRecord.status = 'failed';
      evalRecord.error = {
        stage: 'judging',
        classification: err.classification ?? 'unknown',
        message: err.message,
      };
    }
    evalRecord.response_ts = new Date().toISOString();

    // Persist FIRST, then account. A bad usage object throws here (fail closed), after the save.
    append(evaluationsPath, evalRecord);
    ran++;
    if (result) spent += estimateTurnCostUSD(result.usage, judge);

    await sleepFn(config.spacing_ms);
  }

  return { ran, skipped, spent };
}