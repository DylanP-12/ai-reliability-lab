import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ingestManual } from '../cli/ingestManual.js';

const scenarios = [{
  conversation_id: 'C001', category: 'test', checkpoints: [2],
  turns: [{ turn_index: 1, prompt_text: 'p1' }, { turn_index: 2, prompt_text: 'p2' }],
}];
const logRows = [
  { conversation_id: 'C001', model_id: 'meta-ai', repetition: 'r01', collected_at_utc: '2026-11-16T10:00:00Z' },
];
const good = '--- RESPONSE 1 ---\nHi \u{1F44B} "ok" \n--- RESPONSE 2 ---\nbye \n';

function setup(files, rows = logRows) {
  const manualDir = mkdtempSync(join(tmpdir(), 'manual-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(manualDir, name), text);
  const outDir = mkdtempSync(join(tmpdir(), 'out-'));
  const args = { manualDir, logRows: rows, scenarios, runId: 'gen-manual-test', datasetVersion: 'v1',
                 outPath: join(outDir, 'responses.manual.jsonl') };
  return { args, outDir };
}
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

test('ACCEPT/manual: response text goes through a real file unchanged (emoji, quote, trailing space)', async () => {
  const { args } = setup({ 'C001__meta-ai__r01.txt': good });
  await ingestManual(args);
  const rec = JSON.parse(readFileSync(args.outPath, 'utf8').trim());
  assert.strictEqual(rec.turns[0].response_text, 'Hi \u{1F44B} "ok" ');
  assert.strictEqual(rec.turns[1].response_text, 'bye ');
  assert.strictEqual(rec.started_at, '2026-11-16T10:00:00Z');
});

test('re-running adds zero records', async () => {
  const { args } = setup({ 'C001__meta-ai__r01.txt': good });
  const first = await ingestManual(args);
  const second = await ingestManual(args);
  assert.strictEqual(first.ingested, 1);
  assert.strictEqual(second.ingested, 0);
  assert.strictEqual(second.present, 1);
  assert.strictEqual(readFileSync(args.outPath, 'utf8').trim().split('\n').length, 1);
});

test('ACCEPT/manual: read-only proof: a frozen responses file is byte-identical and only the manual file is written', async () => {
  const { args, outDir } = setup({ 'C001__meta-ai__r01.txt': good });
  const frozen = join(outDir, 'responses.jsonl');
  writeFileSync(frozen, '{"unit_id":"x"}\n');
  const before = sha(frozen);
  await ingestManual(args);
  assert.strictEqual(sha(frozen), before);
  assert.deepEqual(readdirSync(outDir).sort(), ['responses.jsonl', 'responses.manual.jsonl']);
});

test('one bad file means nothing is written, even for the good file', async () => {
  const { args } = setup({
    'C001__meta-ai__r01.txt': good,
    'C999__meta-ai__r01.txt': good,
  });
  await assert.rejects(() => ingestManual(args), /unknown conversation_id "C999"/);
  assert.strictEqual(existsSync(args.outPath), false);
});

test('a file with no session-log row is refused and nothing is written', async () => {
  const { args } = setup({ 'C001__meta-ai__r01.txt': good }, []);
  await assert.rejects(() => ingestManual(args), /session-log/);
  assert.strictEqual(existsSync(args.outPath), false);
});