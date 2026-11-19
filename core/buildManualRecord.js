import { buildUnitId } from './ids.js';
import { sha256 } from './runConversation.js';

export async function buildManualRecord({
  scenario,
  modelId,
  repetition,
  responses,
  runId,
  datasetVersion,
  collectedAt,
}) {
  // The count must match. A mismatch means a missed or doubled paste.
  if (responses.length !== scenario.turns.length) {
    throw new Error(
      `${scenario.conversation_id}: expected ${scenario.turns.length} responses, found ${responses.length}`
    );
  }

  const turns = [];
  for (const [i, turn] of scenario.turns.entries()) {
    turns.push({
      turn_index: turn.turn_index,
      prompt_text: turn.prompt_text,          // from the dataset, never from the input
      prompt_hash: await sha256(turn.prompt_text),
      response_text: responses[i],                        // the supplied text, untouched
      is_checkpoint: scenario.checkpoints.includes(turn.turn_index),
      usage: null,
      is_checkpoint: scenario.checkpoints.includes(turn.turn_index),
      upstream_provider: 'manual',
      // Everything below was never measured: null, never 0.
      usage: null,
      latency_ms: null,
      attempts: null,
      model_fingerprint: null,
      finish_reason: null,
      reasoning_text: null,
      refusal_signal: null,
      request_ts: null,
      response_ts: null,
    });
  }

  return {
    unit_id: buildUnitId({ run_id: runId, conversation_id: scenario.conversation_id, model_id: modelId, repetition }),
    run_id: runId,
    conversation_id: scenario.conversation_id,
    category: scenario.category,
    dataset_version: datasetVersion,
    model_id: modelId,
    repetition,
   or_model: null,
provider_pin: null,
temperature: null,
seed: null,
max_output_tokens: null,
reasoning_enabled: null,
system_prompt_hash: null,
    started_at: collectedAt,
    finished_at: null,
    status: 'complete',
    turns,
  };
}