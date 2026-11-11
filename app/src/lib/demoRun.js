// app/src/lib/demoRun.js  (pure: no I/O)
import { estimateConversationCostUSD } from '../../../core/cost.js';

export const DEMO_LIMITS = Object.freeze({ maxTurns: 12, maxTokens: 300, maxEstimateUSD: 0.05 });

// Field names must match what core/runConversation.js reads
export const DEMO_CONFIG = Object.freeze({
  run_id: 'demo',                 // marks the record as demo, not a study run
  dataset_version: 'demo',
  temperature: 0,
  seed: null,
  max_output_tokens: DEMO_LIMITS.maxTokens,
  request_timeout_ms: 30000,
  max_attempts: 2,
  system_prompt: '',              // if your study config has a system_prompt, copy it here so the demo behaves like the study
});

const CHARS_PER_TOKEN = 3; // pessimistic on purpose: overestimate, never under
const tok = (s) => Math.ceil((s ?? '').length / CHARS_PER_TOKEN);

export function projectDemoRecord(scenario, modelId, { maxTokens = DEMO_LIMITS.maxTokens, systemPrompt = '' } = {}) {
  let history = tok(systemPrompt);
  const turns = scenario.turns.map((t) => {
    history += tok(t.prompt_text);
    const usage = { prompt_tokens: history, completion_tokens: maxTokens };
    history += maxTokens; // assume the reply fills its budget and is re-sent next turn
    return { usage };
  });
  return { model_id: modelId, turns };
}

export function checkDemoRun({ scenario, model, models }) {
  const problems = [];
  if (!scenario) problems.push('Pick a scenario.');
  if (!model) problems.push('Pick a model.');
  if (problems.length) return { ok: false, problems, estimateUSD: null };

  if (scenario.turns.length > DEMO_LIMITS.maxTurns)
    problems.push(`Scenario has ${scenario.turns.length} turns; demo limit is ${DEMO_LIMITS.maxTurns}.`);

  let estimateUSD = null;
  try {
    estimateUSD = estimateConversationCostUSD(projectDemoRecord(scenario, model.model_id), models);
  } catch (err) {
    problems.push(`Cannot estimate cost (${err.message}). Run blocked.`); // fail closed
  }
  if (estimateUSD !== null && estimateUSD > DEMO_LIMITS.maxEstimateUSD)
    problems.push(`Estimate $${estimateUSD.toFixed(4)} exceeds demo cap $${DEMO_LIMITS.maxEstimateUSD}.`);

  return { ok: problems.length === 0, problems, estimateUSD };
}