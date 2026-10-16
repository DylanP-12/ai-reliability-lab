// core/validateConfig.js - fail closed on a bad run config, before any spend.
// Pure: takes the parsed object, returns it unchanged or throws listing every problem.
export function validateConfig(config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Invalid run config: must be a JSON object.');
  }
  const errors = [];
  const isPosInt = (v) => Number.isInteger(v) && v > 0;

  if (typeof config.run_id !== 'string' || config.run_id.trim() === '') {
    errors.push('run_id must be a non-empty string');
  }
  if (!Number.isInteger(config.seed)) errors.push('seed must be an integer');
  if (!isPosInt(config.repetitions)) errors.push('repetitions must be a positive integer');
  if (!(Number.isFinite(config.spend_cap_usd) && config.spend_cap_usd > 0)) {
    errors.push('spend_cap_usd must be a positive number');
  }
  if (!(Number.isInteger(config.spacing_ms) && config.spacing_ms >= 0)) {
    errors.push('spacing_ms must be a non-negative integer');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid run config:\n  - ${errors.join('\n  - ')}`);
  }
  return config;
}