import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../core/parseScenarios.js';

const SIMPLE = `a,b,c
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