function assertNonEmptyString(name, value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function assertField(name, value) {
  assertNonEmptyString(name, value);
  if (value.includes(':')) {
    throw new Error(`${name} must not contain a colon`);
  }
}

export function buildUnitId({ run_id, conversation_id, model_id, repetition }) {
  assertField('run_id', run_id);
  assertField('conversation_id', conversation_id);
  assertField('model_id', model_id);

  if (!Number.isInteger(repetition) || repetition < 1) {
    throw new Error('repetition must be an integer >= 1');
  }
   // Zero-padded to a fixed width so IDs sort correctly as plain text (r03 < r12), not just numerically


  return `${run_id}:${conversation_id}:${model_id}:r${String(repetition).padStart(2, '0')}`;
}

export function buildEvalId({ score_run_id, unit_id, turn_index, judge_model_id, judge_repetition }) {
  assertField('score_run_id', score_run_id);

assertNonEmptyString('unit_id', unit_id);

  assertField('judge_model_id', judge_model_id);

  if (!Number.isInteger(turn_index) || turn_index < 1) {
    throw new Error('turn_index must be an integer >= 1');
  }
  if (!Number.isInteger(judge_repetition) || judge_repetition < 1) {
    throw new Error('judge_repetition must be an integer >= 1');
  }

  return `${score_run_id}:${unit_id}:t${turn_index}:${judge_model_id}:j${judge_repetition}`;
}