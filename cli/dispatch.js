// cli/dispatch.js - the resumable dispatch loop (Node-only: writes via appendRecord)
import { runConversation } from '../core/runConversation.js';
import { appendRecord, loadCompleteUnitIds } from './appendRecord.js';

export async function dispatch({ schedule, scenarios, models, config, apiKey, outPath, chat }) {
  // Build the resume Set ONCE, before the loop
const done = loadCompleteUnitIds(outPath);  let ran = 0;
  let skipped = 0;

  for (const unit of schedule) {
    // Resume: skip any unit whose full identity is already complete
if (done.has(unit.unit_id)) {    skipped++;
          continue;
    }

    const scenario = scenarios.find((s) => s.conversation_id === unit.conversation_id);
    const model = models.find((m) => m.model_id === unit.model_id);

    const record = await runConversation({
      scenario,
      model,
      repetition: unit.repetition,
      config,
      apiKey,
      chat,
    });

    // Append INSIDE the loop, right after each unit, never after all of them
appendRecord(outPath, record);    ran++;
  }

  return { ran, skipped };
}