// cli/dispatch.js - the resumable dispatch loop (Node-only: writes via appendRecord)
import { runConversation } from '../core/runConversation.js';
import { appendRecord, loadCompleteUnitIds } from './appendRecord.js';
import { estimateConversationCostUSD } from '../core/cost.js';

// Real sleep for real runs. Tests pass their own sleepFn so they never wait.
const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Worst-case cost of running one unit: output side plus input side.
function estimateNext(unit, scenario, model, config) {
  const turns = scenario.turns.length;
  const worstCaseCompletionTokens = turns * config.max_output_tokens;
  const outputCost = (worstCaseCompletionTokens / 1_000_000) * model.price_out_per_m;

  let historyTokens = 0;
  let inputTokens = 0;
  for (const turn of scenario.turns) {
    // rough size of this prompt: about 1 token per 3 characters (deliberately high)
    const promptTokens = Math.ceil(turn.prompt_text.length / 3);
    inputTokens += historyTokens + promptTokens;
    historyTokens += promptTokens + config.max_output_tokens;
  }
  const inputCost = (inputTokens / 1_000_000) * model.price_in_per_m;

  return outputCost + inputCost;
}

export async function dispatch({ schedule, scenarios, models, config, apiKey, outPath, chat, sleepFn = realSleep, shouldStop = () => false }) {
  // Build the resume Set ONCE, before the loop
  const done = loadCompleteUnitIds(outPath);
  let ran = 0;
  let skipped = 0;
  let spent = 0;

    for (const unit of schedule) {
    // Ctrl-C (or anything else) asked us to stop: leave BEFORE starting a new unit
    if (shouldStop()) {
      console.log('Stop requested. Stopping after the last saved unit.');
      break;
    }

    // Resume: skip any unit whose full identity is already complete
    if (done.has(unit.unit_id)) {
      skipped++;
      continue;
    }

    const scenario = scenarios.find((s) => s.conversation_id === unit.conversation_id);
    const model = models.find((m) => m.model_id === unit.model_id);

    // Cap check: BEFORE any money moves, and it fails closed
    if (!model) {
      console.log(`Unknown model "${unit.model_id}". Stopping so the spend cap can't be bypassed.`);
      break;
    }
    const estimate = estimateNext(unit, scenario, model, config);
    if (spent + estimate > config.spend_cap_usd) {
      console.log(`Spend cap reached ($${spent.toFixed(2)} spent, next unit ~$${estimate.toFixed(2)}, cap $${config.spend_cap_usd}). Stopping cleanly.`);
      break;
    }

    const record = await runConversation({
      scenario,
      model,
      repetition: unit.repetition,
      config,
      apiKey,
      chat,
    });

    // Append INSIDE the loop, right after each unit, never after all of them
    appendRecord(outPath, record);
    ran++;
    spent += estimateConversationCostUSD(record, models);

    // Space AFTER persisting and accounting: one wait per unit that ran
    await sleepFn(config.spacing_ms);
  }

  return { ran, skipped };
}