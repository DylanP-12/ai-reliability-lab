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

// One error carrying every problem. err.message keeps the CLI's text unchanged;
// err.problems gives the browser the structured list (L053).
function validationError(problems) {
  const err = new Error(problems.map((p) => p.message).join('\n'));
  err.problems = problems;
  return err;
}

export function parseScenarios(csvText, { allowedCategories } = {}) {
  const EXPECTED_HEADER = 'conversation_id,turn_index,prompt_text,evaluation_note,category';
  const problems = [];
  const add = (row, field, rule, message, conversation_id = null) =>
    problems.push({ row, conversation_id, field, rule, message });

  const rows = parseCsv(csvText);

  // Empty input: nothing to check, and rows[0] would be undefined below.
  if (rows.length === 0) {
    add(1, 'header', 'empty', 'File is empty: expected a header row');
    throw validationError(problems);
  }

  // Rule 1: header
  const headerLine = rows[0].join(',');
  if (headerLine !== EXPECTED_HEADER) {
    add(1, 'header', 'header', `Header must be "${EXPECTED_HEADER}", found "${headerLine}"`);
  }

  // Number rows by position in the file (header = row 1), THEN drop blank lines,
  // so "row N" is the Nth row a spreadsheet shows, even with blank lines in between.
  const dataRows = rows
    .map((r, i) => ({ r, rowNum: i + 1 }))
    .slice(1)
    .filter(({ r }) => !(r.length === 1 && r[0] === ''));
  const parsed = [];

  dataRows.forEach(({ r, rowNum }) => {

    // Rule 2: field count
    if (r.length !== 5) {
      add(rowNum, 'row', 'field-count', `Row ${rowNum}: expected 5 fields, found ${r.length}`);
      return; // can't safely destructure a malformed row
    }

    const [conversation_id, turnIndexRaw, prompt_text, evaluation_note, category] = r;

    // Rule 3: turn_index must be a real integer (parseInt('2x') === 2 is the trap)
    const turn_index = Number.parseInt(turnIndexRaw, 10);
    if (!Number.isInteger(turn_index) || String(turn_index) !== turnIndexRaw) {
      add(rowNum, 'turn_index', 'turn-index-integer',
        `Row ${rowNum}: turn_index "${turnIndexRaw}" is not a valid integer`, conversation_id);
      return;
    }

    // Rule 6: blank prompt_text
    if (prompt_text.trim() === '') {
      add(rowNum, 'prompt_text', 'blank-prompt',
        `Row ${rowNum} (${conversation_id}): prompt_text is blank`, conversation_id);
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
    // Rule 4: duplicates (reported on the row of the repeat)
    const seen = new Set();
    for (const t of turns) {
      if (seen.has(t.turn_index)) {
        add(t.rowNum, 'turn_index', 'duplicate', `${convId}: duplicate turn_index ${t.turn_index}`, convId);
      }
      seen.add(t.turn_index);
    }

    const sorted = [...turns].sort((a, b) => a.turn_index - b.turn_index);

    // Rule 5: gaps, checked on the FIRST row of each turn_index, so a duplicate
    // (already reported above) can't also show up as a fake gap.
    // Boundary case: must start at exactly 1; [3,4,5] is consecutive but wrong.
    const firstOfEach = sorted.filter((t, i) => i === 0 || t.turn_index !== sorted[i - 1].turn_index);
    if (firstOfEach.length > 0 && firstOfEach[0].turn_index !== 1) {
      add(firstOfEach[0].rowNum, 'turn_index', 'gap',
        `${convId}: turn_index must start at 1, found ${firstOfEach[0].turn_index}`, convId);
    }
    for (let i = 1; i < firstOfEach.length; i++) {
      const expected = firstOfEach[i - 1].turn_index + 1;
      if (firstOfEach[i].turn_index !== expected) {
        add(firstOfEach[i].rowNum, 'turn_index', 'gap',
          `${convId}: gap in turn_index — expected ${expected}, found ${firstOfEach[i].turn_index}`, convId);
      }
    }

    // Rule 7: category non-blank, and (only if allowedCategories was supplied) a member of it.
    // `else if`: a blank category is one problem, not also "not in allowed list".
    for (const t of sorted) {
      if (t.category.trim() === '') {
        add(t.rowNum, 'category', 'category-blank', `${convId}: category is blank`, convId);
      } else if (allowedCategories && !allowedCategories.includes(t.category)) {
        add(t.rowNum, 'category', 'category-allowed',
          `${convId}: category "${t.category}" is not in allowed list`, convId);
      }
    }

    // Rule 8: consistency, every row in this conversation shares one category
    const firstCategory = sorted[0]?.category;
    for (const t of sorted) {
      if (t.category !== firstCategory) {
        add(t.rowNum, 'category', 'category-consistency',
          `${convId}: inconsistent category — found both "${firstCategory}" and "${t.category}"`, convId);
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

  if (problems.length > 0) throw validationError(problems);
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