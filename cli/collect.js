// cli/collect.js - batch generation runner
// L033: load inputs, expand units, schedule them, print a plan summary.
// L034 adds the dispatch loop (append-only + resume). L035 adds real costs, the spend cap, and spacing.
// Run from the repo root: node cli/collect.js
import { readFileSync } from 'node:fs';
import { parseScenarios } from '../core/parseScenarios.js';
import { estimateTurnCostUSD } from '../core/cost.js';
import { expandUnits, scheduleUnits } from './expandUnits.js';

// ---------- 1. Load inputs (all file reading happens here, in cli) ----------
const config = JSON.parse(readFileSync('config/run.config.json', 'utf8'));
const models = JSON.parse(readFileSync('config/models.json', 'utf8'));
const meta = JSON.parse(readFileSync('data/scenarios.meta.json', 'utf8'));
const csvText = readFileSync('data/scenarios.csv', 'utf8');
const scenarios = parseScenarios(csvText, { allowedCategories: meta.categories });

// ---------- 2. Plan: expand -> shuffle(seed) -> dispatch_index ----------
const units = expandUnits(scenarios, models, config);
const schedule = scheduleUnits(units, config.seed); // seed comes from config, never a literal

// ---------- 3. Rough cost estimate (assumed sizes; real usage arrives in L035) ----------
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
console.log(
  `${scenarios.length} scenarios x ${models.length} models x ${config.repetitions} repetitions = ${schedule.length} units`
);
console.log('first 3 in dispatch order:');
for (const u of schedule.slice(0, 3)) {
  console.log(`  ${u.dispatch_index}  ${u.unit_id}`);
}
console.log(`rough estimated cost: $${estimatedUSD.toFixed(2)}   (spend cap: $${config.spend_cap_usd})`);

// dispatch loop: L034