// cli/score.js — batch scoring runner (L041)
import { buildEvalId } from '../core/ids.js';

// Pure: records + config in, list of eval units out. No file access.
export function expandEvalUnits(records, config) {
  const units = [];

  for (const record of records) {
    if (record.status !== 'complete') continue;

    for (const turn of record.turns) {
      if (!turn.is_checkpoint) continue;

      for (const judge of config.judges) {
        if (config.exclude_self_judge && judge.model_id === record.model_id) continue;

        for (let jrep = 1; jrep <= config.judge_repetitions; jrep++) {
          units.push({
            eval_id: buildEvalId({
              score_run_id: config.score_run_id,
              unit_id: record.unit_id,
              turn_index: turn.turn_index,
              judge_model_id: judge.model_id,
              judge_repetition: jrep,
            }),
            unit_id: record.unit_id,
            model_id: record.model_id,
            turn_index: turn.turn_index,
            judge_model_id: judge.model_id,
            judge_repetition: jrep,
          });
        }
      }
    }
  }

  return units;
}