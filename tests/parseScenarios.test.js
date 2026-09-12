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