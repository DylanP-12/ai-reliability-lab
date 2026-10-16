import { chatCompletion } from './llmClient.js';
import { buildUnitId } from './ids.js';

export async function sha256(input) {
  // A string is turned into UTF-8 bytes; raw bytes (e.g. readFile with no encoding) are hashed as-is.
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return 'sha256:' + [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Runs a single scenario against a single model, for one repetition.
 * Builds a fresh messages[] history and returns a full turn-by-turn record.
 */
export async function runConversation({
    scenario,
  model,
  repetition,
  config,
  apiKey,
  onTurn,
  chat = chatCompletion, // injectable seam — L032 swaps this for a mock
}) {
  const record = {
    unit_id: buildUnitId({
  run_id: config.run_id,
  conversation_id: scenario.conversation_id,

  model_id: model.model_id,
  repetition,
}),
    conversation_id: scenario.conversation_id,
    category: scenario.category,
    reasoning_enabled: model.reasoning_enabled,
    repetition,
    
    turns: [],
    status: 'pending',
    started_at: new Date().toISOString(),
      run_id: config.run_id,
  dataset_version: config.dataset_version,
      temperature: config.temperature,
    seed: config.seed,
    max_output_tokens: config.max_output_tokens,
        model_id: model.model_id,
    or_model: model.or_model,
    provider_pin: model.provider_pin,
  };
record.system_prompt_hash = config.system_prompt
  ? await sha256(config.system_prompt)
  : null;
    const messages = config.system_prompt ? [{ role: 'system', content: config.system_prompt }] : [];

let currentTurnIndex = null;
try {
  for (const turn of scenario.turns) {
   currentTurnIndex = turn.turn_index;
    messages.push({ role: 'user', content: turn.prompt_text });
    const request_ts = new Date().toISOString();
const result = await chat({ messages });
const response_ts = new Date().toISOString();
    messages.push({ role: 'assistant', content: result.text });
     const turnRecord = {
      turn_index: turn.turn_index,
      prompt_text: turn.prompt_text,
      prompt_hash: await sha256(turn.prompt_text),
      response_text: result.text,
      usage: result.usage,
      latency_ms: result.latency_ms,
      reasoning_text: result.reasoning_text,
      refusal_signal: result.refusal_signal,
      upstream_provider: result.upstream_provider,
      model_fingerprint: result.model_fingerprint,
      finish_reason: result.finish_reason,
      attempts: result.attempts,
      is_checkpoint: scenario.checkpoints.includes(turn.turn_index),
      request_ts,
response_ts,
    };
    record.turns.push(turnRecord);
    onTurn?.(turnRecord);
  
  }
      record.status = 'complete';
} catch (err) {
  record.status = 'failed';
  record.error = {
    stage: 'generation',
    turn_index: currentTurnIndex,
    classification: err.classification ?? 'unknown',
    message: err.message,
  };
}
  // The loop (four beats per turn):
  //   1. push user    — messages.push({ role: 'user', content: turn.prompt_text })
  //   2. send         — result = await chat({ messages, ... })
  //   3. push assistant — messages.push({ role: 'assistant', content: result.text })
  //   4. record       — capture turn fields into record.turns[]; call onTurn?.(turnRecord)

  record.finished_at = new Date().toISOString();
  return record;
}
