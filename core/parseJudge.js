function extractJsonText(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;          // no { anywhere in the text
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth = depth + 1;
    if (text[i] === '}') depth = depth - 1;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;                            // opened but never closed
}

function validateScores(parsed, rubric) {
  const scores = parsed.scores;
  if (typeof scores !== 'object' || scores === null || Array.isArray(scores)) {
    return 'scores is missing or not an object';
  }
  const ids = rubric.criteria.map(c => c.id);
  const keys = Object.keys(scores);
  for (const id of ids) {
    if (!keys.includes(id)) return `missing criterion: ${id}`;
  }
  for (const key of keys) {
    if (!ids.includes(key)) return `unknown criterion: ${key}`;
  }
  for (const id of ids) {
    if (!rubric.scale.includes(scores[id])) return `invalid value for ${id}: ${scores[id]}`;
  }
  return null;   // null means "no problems found"
}

function scoreResult(scores, rubric) {
  let earned = 0;
  let totalWeight = 0;
  let criticalFailed = false;
  for (const c of rubric.criteria) {
    const value = c.values[scores[c.id]];               // e.g. 'partial' -> 0.5
    earned = earned + value * c.weight;
    totalWeight = totalWeight + c.weight;
    const lowest = Math.min(...Object.values(c.values));
    if (c.critical && value === lowest) criticalFailed = true;
  }
  return {
    weighted_score: earned/ totalWeight,
    overall_verdict: criticalFailed ? 'fail' : 'pass',
    critical_failed: criticalFailed,
  };
}

export function parseJudge(rawText, rubric) {
  const jsonText = extractJsonText(rawText);
  if (jsonText === null) {
    return { parse_ok: false, raw_output: rawText, error: 'no JSON object found' };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return { parse_ok: false, raw_output: rawText, error: `invalid JSON: ${e.message}` };
  }
    const problem = validateScores(parsed, rubric);
  if (problem !== null) {
    return { parse_ok: false, raw_output: rawText, error: problem };
  }
    const s = scoreResult(parsed.scores, rubric);
  return {
    parse_ok: true,
    scores: parsed.scores,
    weighted_score: s.weighted_score,
    overall_verdict: s.overall_verdict,
    critical_failed: s.critical_failed,
    raw_output: rawText,
  };
}

