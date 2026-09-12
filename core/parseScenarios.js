export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }   // escaped quote: append one literal ", skip both
        else inQuotes = false;                              // real closing quote
      } else {
        field += c;                                          // inside quotes: everything is data, even , and \n
      }
    } else {
      if (c === '"' && field === '') inQuotes = true;        // opening quote, only valid at field start
      else if (c === ',') { row.push(field); field = ''; }    // end field
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }  // end field + row
      else if (c === '\r') { /* swallow; \n handles the row */ }
      else field += c;                                        // ordinary character
    }
  }

  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }  // flush last row if no trailing \n
  return rows;
}

export function parseScenarios(csvText, { allowedCategories } = {}) {
  const EXPECTED_HEADER = 'conversation_id,turn_index,prompt_text,evaluation_note,category';
  const problems = [];
  const rows = parseCsv(csvText);

  // Rule 1: header
  const headerLine = rows[0].join(',');
  if (headerLine !== EXPECTED_HEADER) {
    problems.push(`Header must be "${EXPECTED_HEADER}", found "${headerLine}"`);
  }

  const dataRows = rows.slice(1).filter((r) => !(r.length === 1 && r[0] === ''));
  const parsed = [];

  dataRows.forEach((r, idx) => {
    const rowNum = idx + 2; // header is row 1, data starts at row 2

    // Rule 2: field count
    if (r.length !== 5) {
      problems.push(`Row ${rowNum}: expected 5 fields, found ${r.length}`);
      return; // can't safely destructure a malformed row — skip further checks on it
    }

    const [conversation_id, turnIndexRaw, prompt_text, evaluation_note, category] = r;

    // Rule 3: turn_index must be a real integer (parseInt('2x') === 2 is the trap)
    const turn_index = Number.parseInt(turnIndexRaw, 10);
    if (!Number.isInteger(turn_index) || String(turn_index) !== turnIndexRaw) {
      problems.push(`Row ${rowNum}: turn_index "${turnIndexRaw}" is not a valid integer`);
      return;
    }

    // Rule 6: blank prompt_text
    if (prompt_text.trim() === '') {
      problems.push(`Row ${rowNum} (${conversation_id}): prompt_text is blank`);
    }

    parsed.push({ conversation_id, turn_index, prompt_text, evaluation_note, category, rowNum });
  });

  // Group by conversation_id
  const groups = new Map();
  for (const row of parsed) {
    if (!groups.has(row.conversation_id)) groups.set(row.conversation_id, []);
    groups.get(row.conversation_id).push(row);
  }

  const scenarios = [];

  for (const [convId, turns] of groups) {
    // Rule 4: duplicates
    const seen = new Set();
    for (const t of turns) {
      if (seen.has(t.turn_index)) problems.push(`${convId}: duplicate turn_index ${t.turn_index}`);
      seen.add(t.turn_index);
    }

    const sorted = [...turns].sort((a, b) => a.turn_index - b.turn_index);

    // Rule 5: gaps — note the boundary case: sorted[0] must be exactly 1,
    // not just "each turn is one more than the last." [3,4,5] is internally
    // consecutive but never starts at 1 — a real bug if you skip this check.
    if (sorted.length > 0 && sorted[0].turn_index !== 1) {
      problems.push(`${convId}: turn_index must start at 1, found ${sorted[0].turn_index}`);
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].turn_index !== sorted[i - 1].turn_index + 1) {
        problems.push(`${convId}: gap in turn_index — expected ${sorted[i - 1].turn_index + 1}, found ${sorted[i].turn_index}`);
      }
    }

    // Rule 7: category non-blank, and — only if allowedCategories was supplied — a member of it
for (const t of sorted) {
  if (t.category.trim() === '') {
    problems.push(`${convId}: category is blank`);
  }
  if (allowedCategories && !allowedCategories.includes(t.category)) {
    problems.push(`${convId}: category "${t.category}" is not in allowed list`);
  }
}

    // Rule 8: consistency — every row in this conversation shares one category
  const firstCategory = sorted[0]?.category;
for (const t of sorted) {
  if (t.category !== firstCategory) {
    problems.push(`${convId}: inconsistent category — found both "${firstCategory}" and "${t.category}"`);
  }
}

    const checkpoints = sorted
      .filter((t) => t.evaluation_note.trim() !== '')
      .map((t) => t.turn_index);

    scenarios.push({
      conversation_id: convId,
      category: sorted[0]?.category,
      turn_count: sorted.length,
      turns: sorted.map(({ turn_index, prompt_text, evaluation_note }) => ({ turn_index, prompt_text, evaluation_note })),
      checkpoints,
    });
  }

  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }

  return scenarios;
}

export function csvField(value) {
  const s = String(value);
  if (/[",\r\n]/.test(s) || s !== s.trim()) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}

export function serializeScenarios(scenarios) {
  const header = 'conversation_id,turn_index,prompt_text,evaluation_note,category';
  const lines = [header];

  for (const scenario of scenarios) {
    for (const turn of scenario.turns) {
      const row = [
        csvField(scenario.conversation_id),
        csvField(turn.turn_index),   // blank A
        csvField(turn.prompt_text
),   // blank B
        csvField(turn.evaluation_note
),   // blank C
        csvField(scenario.category

),   // blank D
      ].join(',');
      lines.push(row);
    }
  }

  return lines.join('\n') + '\n';
}