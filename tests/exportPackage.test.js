import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExportPackage, loadExportInput } from '../app/src/lib/exportPackage.js';
// Adversarial text, written as escapes so no editor can alter it:
// composed e-acute, decomposed e + combining accent, emoji, quotes, LF, CRLF, trailing spaces.
const NFC = 'caf\u00e9';
const NFD = 'cafe\u0301';
const TRICKY = `${NFC} ${NFD} \u2615 \u{1F642} said "hi" \nline two\r\nends with spaces   `;

const UNIT_A = 'gen-2026-08-11:C002:claude-haiku-5.5:r03';   // r03 padding on purpose
const UNIT_B = 'gen-2026-08-11:C004:gpt-5.4-mini:r06';
const CANARY = 'sk-or-CANARY';
const NOTE = 'NOTE-CANARY';

function makeInput() {
  const unitIds = [UNIT_A, UNIT_B];
  return {
    exportedAt: '2026-11-11T20:00:00.000Z',
    manifest: {
      run_id: 'gen-2026-08-11', dataset_version: 'ds-v1', dataset_hash: 'sha256:abc',
      seed: 20260811, models: ['m1'], repetitions: 10, unit_count: 2, complete_count: 2,
      failed_count: 0, started_at: '2026-08-11T00:00:00Z', finished_at: '2026-08-11T01:00:00Z',
    },
    index: unitIds.map((id) => ({
      unit_id: id, conversation_id: id.split(':')[1], model_id: 'm1', category: 'c', repetition: 3,
      reasoning_enabled: false, status: 'complete', turn_count: 1, checkpoint_turns: [1],
      file: `conversations/${id.replaceAll(':', '_')}.json`,   // filename form, must never be used as an id
      api_key: CANARY, evaluation_note: NOTE,                    // extras that must not leak
    })),
    conversations: unitIds.map((id) => ({
      unit_id: id,
      turns: [{ turn_index: 1, prompt_text: 'p1', response_text: TRICKY, is_checkpoint: true,
                reasoning_text: CANARY, evaluation_note: NOTE }],
    })),
    evaluations: unitIds.map((id) => ({
      unit_id: id,
      evaluations: [{
        eval_id: `${id}:t1:judge-x:j01`, turn_index: 1, judge_model_id: 'judge-x', judge_repetition: 1,
        rubric_version: 'v1', status: 'complete', parse_ok: true, raw_output: TRICKY,
        scores: {}, weighted_score: 1, overall_verdict: 'pass', critical_failed: false,
      }],
    })),
    scores: { combine_rule: 'majority of overall_verdict', groups: [] },
    scenarios: [{
      conversation_id: 'C002', category: 'c', turn_count: 1, checkpoints: [1], evaluation_note: NOTE,
      turns: [{ turn_index: 1, prompt_text: 'p1', evaluation_note: NOTE }],
    }],
    rubric: { rubric_version: 'v1', criteria: [] },
    // planted secrets, handed to the builder on purpose: it must not carry them out
    keyStore: { getItem: () => CANARY },
    env: { OPENROUTER_API_KEY: CANARY },
  };
}

test('Export response text byte-identical', () => {
  assert.notEqual(NFC, NFD);   // guard the fixture: the two forms must stay different
  const input = makeInput();
  const pkg = buildExportPackage(input);

  for (const unit of pkg.units) {
    assert.equal(unit.turns[0].response_text, TRICKY);
    assert.equal(unit.evaluations[0].raw_output, TRICKY);
  }
  // the downloaded file is JSON, so prove it survives serialization too
  const reread = JSON.parse(JSON.stringify(pkg));
  assert.equal(reread.units[0].turns[0].response_text, TRICKY);
  assert.ok(reread.units[0].turns[0].response_text.includes('e\u0301'));   // still decomposed
  assert.ok(reread.units[0].turns[0].response_text.endsWith('   '));       // trailing spaces kept
});

test('Exported IDs match source exactly', () => {
  const input = makeInput();
  const pkg = buildExportPackage(input);

  assert.deepEqual(pkg.units.map((u) => u.unit_id), input.index.map((e) => e.unit_id));
  assert.deepEqual(
    pkg.units.flatMap((u) => u.evaluations.map((e) => e.eval_id)),
    input.evaluations.flatMap((e) => e.evaluations.map((x) => x.eval_id)),
  );
  assert.ok(pkg.units[0].unit_id.includes(':r03'));      // padding intact
  assert.ok(!pkg.units[0].unit_id.includes('_C002_'));   // never the filename form
});

test('export fails closed when an indexed unit has no transcript', () => {
  const input = makeInput();
  input.conversations[1] = { ...input.conversations[1], unit_id: 'gen-2026-08-11:C004:gpt-5.4-mini:r6' };
  assert.throws(() => buildExportPackage(input), /no transcript for/);
});

test('export: no secret anywhere in the package', () => {
  const text = JSON.stringify(buildExportPackage(makeInput()));
  assert.equal(text.includes('CANARY'), false);
});

test('export: no private evaluation_note anywhere in the package', () => {
  const text = JSON.stringify(buildExportPackage(makeInput()));
  assert.equal(text.includes(NOTE), false);
  assert.equal(text.includes('"evaluation_note"'), false);   // a leaked field, not a mention in prose
});
test('export: manifest is present and complete, and the README says how to check it', () => {
  const pkg = buildExportPackage(makeInput());
  for (const f of ['run_id', 'dataset_version', 'dataset_hash', 'seed', 'models', 'unit_count']) {
    assert.notEqual(pkg.manifest[f], undefined, f);
  }
  assert.ok(pkg.readme.includes('dataset_hash'));
  const input = makeInput();
  delete input.manifest.dataset_hash;
  assert.throws(() => buildExportPackage(input), /dataset_hash/);
});


test('loader pairs each unit with its own transcript and evaluations', async () => {
  const input = makeInput();
  const store = {
    getManifest: async () => input.manifest, getIndex: async () => input.index,
    getScores: async () => input.scores, getScenarios: async () => input.scenarios,
    getRubric: async () => input.rubric,
    getConversation: async (id) => input.conversations.find((c) => c.unit_id === id),
    getEvaluations: async (id) => input.evaluations.find((e) => e.unit_id === id).evaluations,
  };
  const pkg = buildExportPackage({ ...(await loadExportInput(store)), exportedAt: input.exportedAt });
  assert.deepEqual(pkg.units.map((u) => u.unit_id), input.index.map((e) => e.unit_id));
  assert.equal(pkg.units[1].evaluations[0].eval_id, input.evaluations[1].evaluations[0].eval_id);
});