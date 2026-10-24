import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCompleteEvalIds } from '../cli/appendRecord.js';

function writeLines(records) {
  const dir = mkdtempSync(join(tmpdir(), 'evals-'));
  const path = join(dir, 'evaluations.jsonl');
  writeFileSync(path, records.map(r => JSON.stringify(r)).join('\n') + '\n');
  return path;
}

test('missing file means nothing is done', () => {
  const done = loadCompleteEvalIds(join(tmpdir(), 'does-not-exist.jsonl'));
  assert.equal(done.size, 0);
});

test('complete evals count as done, even when parse_ok is false', () => {
  const path = writeLines([
    { eval_id: 'e1', status: 'complete', parse_ok: true },
    { eval_id: 'e2', status: 'complete', parse_ok: false },
  ]);
  const done = loadCompleteEvalIds(path);
  assert.ok(done.has('e1'));
  assert.ok(done.has('e2'));
});

test('failed evals are not done, so they get retried', () => {
  const path = writeLines([{ eval_id: 'e3', status: 'failed' }]);
  assert.equal(loadCompleteEvalIds(path).has('e3'), false);
});