// core/latest.js
// Pure. The ONE place the "a retried record replaces the earlier one" rule lives.
// Later records in the input win. Callers filter by status AFTER taking the latest.

export function latestPerUnit(records) {
  const byUnit = new Map();
  for (const record of records) byUnit.set(record.unit_id, record);
  return [...byUnit.values()];
}

export function latestPerEval(records) {
  const byEval = new Map();
  for (const record of records) byEval.set(record.eval_id, record);
  return [...byEval.values()];
}