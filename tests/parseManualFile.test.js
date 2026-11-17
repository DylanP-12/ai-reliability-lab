import test from 'node:test';
import assert from 'node:assert/strict';
import { parseManualFilename, splitResponses } from '../core/parseManualFile.js';

test('filename: a hyphenated model id parses', () => {
  assert.deepEqual(parseManualFilename('C001__meta-ai__r01.txt'),
    { conversationId: 'C001', modelId: 'meta-ai', repetition: 1 });
});

test('filename: wrong shapes are refused', () => {
  const bad = ['C001-meta-ai-r01.txt', 'C001__meta-ai.txt', 'C001__meta-ai__01.txt',
               'C001__meta-ai__r01.md', '__meta-ai__r01.txt'];
  for (const name of bad) assert.throws(() => parseManualFilename(name), /bad manual filename/);
});

test('split: CRLF gives the same result as LF', () => {
  const lf = '--- RESPONSE 1 ---\nhi \n--- RESPONSE 2 ---\nyo\n';
  assert.deepEqual(splitResponses(lf.replace(/\n/g, '\r\n')), splitResponses(lf));
});

test('split: trailing spaces, inner blank lines and a response ending in a newline are kept', () => {
  const text = '--- RESPONSE 1 ---\nline one  \n\nline three\n\n--- RESPONSE 2 ---\nend\n';
  assert.deepEqual(splitResponses(text), ['line one  \n\nline three\n', 'end']);
});

test('split: bad files are refused with a reason', () => {
  const cases = [
    ['--- RESPONSE 2 ---\nhi\n', /expected RESPONSE 1, found RESPONSE 2/],
    ['--- RESPONSE 1 ---\n   \n', /blank/],
    ['', /no RESPONSE blocks/],
    ['oops\n--- RESPONSE 1 ---\nhi\n', /text before the first RESPONSE marker/],
  ];
  for (const [text, pattern] of cases) assert.throws(() => splitResponses(text), pattern);
});