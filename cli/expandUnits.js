// cli/expandUnits.js
// Pure: takes already-parsed scenarios, models, and config, and returns the unit list.
// No file reading here. collect.js does the I/O and passes the results in.
import { buildUnitId } from '../core/ids.js';
import { shuffle } from '../core/seededRandom.js';

export function expandUnits(scenarios, models, config) {
  const units = [];
  for (const scenario of scenarios) {
    for (const model of models) {
      for (let r = 1; r <= config.repetitions; r++) {
        units.push({
          unit_id: buildUnitId({
            run_id: config.run_id,
            conversation_id: scenario.conversation_id,
            model_id: model.model_id,
            repetition: r,
          }),
          conversation_id: scenario.conversation_id,
          model_id: model.model_id,
          repetition: r,
        });
      }
    }
  }
  return units;
}

export function scheduleUnits(units, seed) {
  const shuffled = shuffle(units, seed); // new array, same unit objects
  // Build a NEW object per unit: copy its fields, add dispatch_index.
  // Writing onto the shared objects would change the caller's units too.
  return shuffled.map((u, i) => ({ ...u, dispatch_index: i }));
}