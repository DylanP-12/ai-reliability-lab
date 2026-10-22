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
  throw new Error('not implemented: L040 (score)');
}

