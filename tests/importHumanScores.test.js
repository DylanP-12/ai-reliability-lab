// tests/importHumanScores.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { importHumanScores } from '../cli/importHumanScores.js';

// The 24 fields of a real AI eval record (from evaluations.smoke.jsonl), in order.
const AI_EVAL_KEYS = ['eval_id', 'score_run_id', 'unit_id', 'turn_index', 'judge_model_id', 'judge_repetition',
  'worker_model_id', 'rubric_version', 'judge_or_model', 'request_ts', 'status', 'parse_ok', 'scores',
  'weighted_score', 'overall_verdict', 'critical_failed', 'raw_output', 'usage', 'latency_ms',
  'upstream_provider', 'model_fingerprint', 'finish_reason', 'attempts', 'response_ts'];

const rubric = {
  rubric_version: 'v1', scale: ['yes', 'partial', 'no'],
  criteria: [
    { id: 'setup_respected', weight: 1, critical: true, values: { yes: 1, partial: 0.5, no: 0 } },
    { id: 'helpfulness', weight: 0.3, critical: false, values: { yes: 1, partial: 0.5, no: 0 } },
  ],
};
const UNITS = ['gen-x:C001:model-a:r01', 'gen-x:C001:model-b:r01'];
const SHEET = ['sheet_id,blind_ref,setup_respected,helpfulness,verdict,rater_note',
  'hs-2026-01-01,H-001,yes,partial,pass,',
  'hs-2026-01-01,H-002,,,,ran out of time'].join('\n') + '\n';

function setup({ rule = 'rehearsal-all', sheet = SHEET, responseUnits = UNITS } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'human-import-'));
  const dataDir = join(dir, 'data');
  mkdirSync(dataDir);
  const p = { sheetPath: join(dir, 'sheet.csv'), keyPath: join(dir, 'key.json'), rubricPath: join(dir, 'rubric.json'),
              responsesPath: join(dataDir, 'responses.smoke.jsonl'), dataDir };
  writeFileSync(p.keyPath, JSON.stringify({ sheet_id: 'hs-2026-01-01', rule, rubric_version: 'v1',
    items: { 'H-001': { unit_id: UNITS[0], turn_index: 3 }, 'H-002': { unit_id: UNITS[1], turn_index: 3 } } }));
  writeFileSync(p.rubricPath, JSON.stringify(rubric));
  writeFileSync(p.sheetPath, sheet);
  writeFileSync(p.responsesPath, responseUnits.map(u => JSON.stringify({ unit_id: u, model_id: u.split(':')[2] })).join('\n') + '\n');
  writeFileSync(join(dataDir, 'evaluations.smoke.jsonl'), '{"eval_id":"ai-1","note":"frozen AI evaluation"}\n');
  return p;
}
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const lines = path => readFileSync(path, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));

test('human record has exactly the AI eval schema, with null provenance and no fake zeros', () => {
  const p = setup();
  const r = importHumanScores(p);
  assert.equal(r.imported, 1);
  const [rec] = lines(r.outPath);
  assert.deepEqual(Object.keys(rec), AI_EVAL_KEYS);
  assert.equal(rec.judge_model_id, 'human-r1');
  assert.equal(rec.worker_model_id, 'model-a');
  for (const f of ['usage', 'latency_ms', 'upstream_provider', 'model_fingerprint', 'finish_reason', 'attempts', 'request_ts', 'response_ts']) {
    assert.equal(rec[f], null, `${f} must be null for a human rater`);
  }
  assert.deepEqual(JSON.parse(rec.raw_output).verdict, 'pass');
});

test('blank row is skipped with its reason and never written', () => {
  const p = setup();
  const r = importHumanScores(p);
  assert.deepEqual(r.skipped.map(s => [s.blind_ref, s.reason]), [['H-002', 'not graded']]);
  assert.ok(lines(r.outPath).every(rec => rec.unit_id !== UNITS[1]));
});

test('re-running an import adds zero records', () => {
  const p = setup();
  const first = importHumanScores(p);
  const before = sha(first.outPath);
  const second = importHumanScores(p);
  assert.equal(second.imported, 0);
  assert.equal(second.present, 1);
  assert.equal(sha(second.outPath), before);
});

test('read-only proof: frozen files are byte-identical, and the human file is the only new file', () => {
  const p = setup();
  const frozenEvals = join(p.dataDir, 'evaluations.smoke.jsonl');
  const hashes = { evals: sha(frozenEvals), responses: sha(p.responsesPath) };
  const filesBefore = readdirSync(p.dataDir).sort();
  importHumanScores(p);
  assert.equal(sha(frozenEvals), hashes.evals);
  assert.equal(sha(p.responsesPath), hashes.responses);
  assert.deepEqual(readdirSync(p.dataDir).sort(), [...filesBefore, 'evaluations.human.rehearsal.jsonl'].sort());
});

test('the key decides the file: a study sheet goes to evaluations.human.jsonl', () => {
  const r = importHumanScores(setup({ rule: 'study-r01' }));
  assert.match(r.outPath, /evaluations\.human\.jsonl$/);
});

test('an unknown key rule is refused and nothing is written', () => {
  const p = setup({ rule: 'mystery' });
  assert.throws(() => importHumanScores(p), /mystery/);
  assert.deepEqual(readdirSync(p.dataDir).sort(), ['evaluations.smoke.jsonl', 'responses.smoke.jsonl']);
});

test('a unit missing from the responses file fails closed and writes nothing', () => {
  const p = setup({ responseUnits: [UNITS[1]] });
  assert.throws(() => importHumanScores(p), new RegExp(UNITS[0]));
  assert.equal(existsSync(join(p.dataDir, 'evaluations.human.rehearsal.jsonl')), false);
});