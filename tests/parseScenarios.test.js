import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCsv, parseScenarios, serializeScenarios, csvField } from '../core/parseScenarios.js';const SIMPLE = `a,b,c
d,e,f
`;

test('SIMPLE: plain grid, no quotes', () => {
  assert.deepEqual(parseCsv(SIMPLE), [
    ['a', 'b', 'c'],
    ['d', 'e', 'f'],
  ]);
});

const QUOTED_COMMA = `C001,1,"Never, ever suggest peanuts",SCORE,safety
`;

test('QUOTED_COMMA: comma survives inside quotes', () => {
  assert.deepEqual(parseCsv(QUOTED_COMMA), [
    ['C001', '1', 'Never, ever suggest peanuts', 'SCORE', 'safety'],
  ]);
});

const MULTILINE = `C002,1,"Line one
Line two",SCORE,safety
`;

test('MULTILINE: quoted field spans two lines', () => {
  assert.deepEqual(parseCsv(MULTILINE), [
    ['C002', '1', 'Line one\nLine two', 'SCORE', 'safety'],
  ]);
});

const ESCAPED_QUOTES = `C003,1,"she said ""stop""",SCORE,safety
`;

test('ESCAPED_QUOTES: doubled quotes become one literal quote', () => {
  assert.deepEqual(parseCsv(ESCAPED_QUOTES), [
    ['C003', '1', 'she said "stop"', 'SCORE', 'safety'],
  ]);
});

const CRLF = `a,b\r\nc,d\r\n`;

test('CRLF: Windows line endings normalize like LF', () => {
  assert.deepEqual(parseCsv(CRLF), [
    ['a', 'b'],
    ['c', 'd'],
  ]);
});

const NO_TRAILING_NEWLINE = `a,b\nc,d`;

test('NO_TRAILING_NEWLINE: last row flushes without a final newline', () => {
  assert.deepEqual(parseCsv(NO_TRAILING_NEWLINE), [
    ['a', 'b'],
    ['c', 'd'],
  ]);
});

const EMPTY_FIELDS = `a,,c
`;

test('EMPTY_FIELDS: two commas in a row means an empty field, not a skip', () => {
  assert.deepEqual(parseCsv(EMPTY_FIELDS), [
    ['a', '', 'c'],
  ]);
});

const ALL_TRAPS = `C004,1,"Say ""hi"", then
pause",SCORE,safety
`;

test('ALL_TRAPS: quoted comma + embedded newline + escaped quotes together', () => {
  assert.deepEqual(parseCsv(ALL_TRAPS), [
    ['C004', '1', 'Say "hi", then\npause', 'SCORE', 'safety'],
  ]);
});

const GOOD_TWO_SCENARIOS = readFileSync('tests/fixtures/good-two-scenarios.csv', 'utf8');

test('GOOD_TWO_SCENARIOS: two valid scenarios, checkpoints derived correctly', () => {
  assert.deepEqual(parseScenarios(GOOD_TWO_SCENARIOS, { allowedCategories: ['alpha', 'beta'] }), [
    {
  conversation_id: "C001",
  category: "alpha",
  turn_count: 3,
  turns: [
    { turn_index: 1, prompt_text: "Hi there", evaluation_note: "" },
    { turn_index: 2, prompt_text: "Something happened today.\nCan you help me think about it?", evaluation_note: "SCORE" },
    { turn_index: 3, prompt_text: "Thanks, bye", evaluation_note: "" },
  ],
  checkpoints: [2],
},
    {
  conversation_id: "C002",
  category: "beta",
  turn_count: 2,
  turns: [
    { turn_index: 1, prompt_text: "Hello again", evaluation_note: "" },
    { turn_index: 2, prompt_text: "How are you feeling right now?", evaluation_note: "Check tone and warmth" },
  ],
  checkpoints: [2],
}
  ]);
});

const BAD_CATEGORY = readFileSync('tests/fixtures/bad-category.csv', 'utf8');

test('BAD_CATEGORY: category not in allowed list throws', () => {
  assert.throws(
    () => parseScenarios(BAD_CATEGORY, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /gamma/);  // something identifying WHICH VALUE was rejected
      assert.match(err.message, /category/);  // something identifying WHICH RULE fired (rule name or "category")
      return true;
    }
  );
});

const BAD_HEADER = readFileSync('tests/fixtures/bad-header.csv', 'utf8');

test('BAD_HEADER: wrong header throws', () => {
  assert.throws(
    () => parseScenarios(BAD_HEADER, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /Header/);
      return true;
    }
  );
});

const BAD_FIELD_COUNT = readFileSync('tests/fixtures/bad-field-count.csv', 'utf8');

test('BAD_FIELD_COUNT: wrong number of fields throws', () => {
  assert.throws(
    () => parseScenarios(BAD_FIELD_COUNT, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /5 fields/);
      return true;
    }
  );
});

const BAD_DUPLICATE_TURN = readFileSync('tests/fixtures/bad-duplicate-turn.csv', 'utf8');

test('BAD_DUPLICATE_TURN: repeated turn_index throws', () => {
  assert.throws(
    () => parseScenarios(BAD_DUPLICATE_TURN, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /duplicate/);
      return true;
    }
  );
});

const BAD_GAP = readFileSync('tests/fixtures/bad-gap.csv', 'utf8');

test('BAD_GAP: non-contiguous turn_index throws', () => {
  assert.throws(
    () => parseScenarios(BAD_GAP, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /gap/);
      return true;
    }
  );
});

const BAD_BLANK_PROMPT = readFileSync('tests/fixtures/bad-blank-prompt.csv', 'utf8');

test('BAD_BLANK_PROMPT: empty prompt_text throws', () => {
  assert.throws(
    () => parseScenarios(BAD_BLANK_PROMPT, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /blank/);
      return true;
    }
  );
});

const BAD_CATEGORY_CONSISTENCY = readFileSync('tests/fixtures/bad-category-consistency.csv', 'utf8');

test('BAD_CATEGORY_CONSISTENCY: mismatched categories in one conversation throws', () => {
  assert.throws(
    () => parseScenarios(BAD_CATEGORY_CONSISTENCY, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /inconsistent/);
      return true;
    }
  );
});

const BAD_MULTI_ERROR = readFileSync('tests/fixtures/bad-multi-error.csv', 'utf8');

test('BAD_MULTI_ERROR: collect-all reports all three problems at once', () => {
  assert.throws(
    () => parseScenarios(BAD_MULTI_ERROR, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /duplicate/);
      assert.match(err.message, /blank/);
      assert.match(err.message, /gamma/);
      return true;
    }
  );
});

const BAD_GAP_START = readFileSync('tests/fixtures/bad-gap-start.csv', 'utf8');

test('BAD_GAP_START: scenario not starting at turn_index 1 throws', () => {
  assert.throws(
    () => parseScenarios(BAD_GAP_START, { allowedCategories: ['alpha', 'beta'] }),
    (err) => {
      assert.match(err.message, /start at 1/);
      return true;
    }
  );
});


test('round-trip: object -> csv -> object preserves data with commas, quotes, newlines', () => {
  const original = [
    {
      conversation_id: 'C001',
      category: 'demo',
      turn_count: 1,
      turns: [
        { turn_index: 1, prompt_text: 'He said, "hi"\nthen left', evaluation_note: 'SCORE' }
      ],
      checkpoints: [1],
    }
  ];

  const csv = serializeScenarios(original);
  const result = parseScenarios(csv);

  assert.deepEqual(result, original);
});

test('round-trip: plain scenario with no special characters needs no quoting', () => {
  const original = [
    {
      conversation_id: 'C002',
      category: 'demo',
      turn_count: 1,
      turns: [
        { turn_index: 1, prompt_text: 'Hello there', evaluation_note: 'SCORE' }
      ],
      checkpoints: [1],
    }
  ];

  const csv = serializeScenarios(original);

  // Assert the output is genuinely UNquoted — proves csvField isn't over-quoting
  assert.equal(csv.includes('"'), false);

  const result = parseScenarios(csv);
  assert.deepEqual(result, original);
});

test('csvField: quoting rules', () => {
  assert.equal(csvField('hello world'), 'hello world');
  assert.equal(csvField("it's fine"), "it's fine");
  assert.equal(csvField('a, b'), '"a, b"');
  assert.equal(csvField('line1\nline2'), '"line1\nline2"');
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
});

test('round-trip: real multi-turn fixture survives object -> csv -> object', () => {
  const original = parseScenarios(GOOD_TWO_SCENARIOS, { allowedCategories: ['alpha', 'beta'] });
  const csv = serializeScenarios(original);
  const result = parseScenarios(csv, { allowedCategories: ['alpha', 'beta'] });
  assert.deepEqual(result, original);
});

test('semantic stability: unnecessary quoting in input does not survive text round-trip, but meaning does', () => {
  const HANDWRITTEN = `conversation_id,turn_index,prompt_text,evaluation_note,category
"C001",1,"Hello there",SCORE,"demo"
`;

  const firstParse = parseScenarios(HANDWRITTEN, { allowedCategories: ['demo'] });
  const regeneratedCsv = serializeScenarios(firstParse);
  const secondParse = parseScenarios(regeneratedCsv, { allowedCategories: ['demo'] });

  // Direction 2 (byte-identity of TEXT) is NOT promised — and this proves it:
  assert.notEqual(regeneratedCsv, HANDWRITTEN);

  // Semantic stability IS promised — meaning survives even though bytes changed:
  assert.deepEqual(secondParse, firstParse);
});

// ---- L053: structured problems for the browser ----
const HEADER = 'conversation_id,turn_index,prompt_text,evaluation_note,category\n';
const THREE_ERRORS = HEADER +
  'C1,1,Hi,,tone\n' +
  'C1,2,Again,,tone\n' +
  'C1,2,Dup,SCORE,tone\n' +       // row 4: duplicate
  'C2,1,Hello,,format\n' +
  'C2,3,Skip,SCORE,format\n' +    // row 6: gap (no turn 2)
  'C3,1,Cat,SCORE,tonee\n';       // row 7: undeclared category

function thrownBy(csv, opts) {
  try { parseScenarios(csv, opts); } catch (err) { return err; }
  assert.fail('expected parseScenarios to throw');
}

test('problems are structured objects with row numbers', () => {
  const err = thrownBy(THREE_ERRORS, { allowedCategories: ['tone', 'format'] });
  assert.deepEqual(err.problems.map((p) => [p.row, p.rule]),
    [[4, 'duplicate'], [6, 'gap'], [7, 'category-allowed']]);
});

test('without allowedCategories, the category check degrades but the rest still run', () => {
  const err = thrownBy(THREE_ERRORS);
  assert.deepEqual(err.problems.map((p) => p.rule), ['duplicate', 'gap']);
});

test('err.message is still the joined text (CLI output unchanged)', () => {
  const err = thrownBy(THREE_ERRORS, { allowedCategories: ['tone', 'format'] });
  assert.equal(err.message, err.problems.map((p) => p.message).join('\n'));
});

test('a duplicate does not also report a fake gap', () => {
  const err = thrownBy(HEADER + 'C1,1,a,,tone\nC1,2,b,,tone\nC1,2,c,SCORE,tone\n');
  assert.deepEqual(err.problems.map((p) => p.rule), ['duplicate']);
});

test('empty input is a validation problem, not a TypeError', () => {
  const err = thrownBy('');
  assert.ok(Array.isArray(err.problems));
  assert.equal(err.problems[0].rule, 'empty');
});

test('row numbers count blank lines, matching the row a spreadsheet shows', () => {
  const err = thrownBy(HEADER + 'C1,1,a,,tone\n\nC1,3,b,SCORE,tone\n');  // blank line is row 3
  assert.deepEqual(err.problems.map((p) => [p.row, p.rule]), [[4, 'gap']]);
});