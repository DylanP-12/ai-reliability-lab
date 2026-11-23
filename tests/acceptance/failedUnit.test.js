// tests/acceptance/failedUnit.test.js
// Gap closed in L063: "Failed/missing units carry an explicit reason end to end, never zero-filled".
// A real failure from runConversation goes through the real prep functions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runConversation } from '../../core/runConversation.js';
import { toIndexEntry, buildScores, buildDegradation } from '../../cli/prepare-app-data.js';

const scenario = {
  conversation_id: 'C001', category: 'test', checkpoints: [2],
  turns: [
    { turn_index: 1, prompt_text: 'P1', evaluation_note: '' },
    { turn_index: 2, prompt_text: 'P2', evaluation_note: 'SCORE' },
    { turn_index: 3, prompt_text: 'P3', evaluation_note: '' },
  ],
};
const model = { model_id: 'model-a', or_model: 'vendor/model-a', provider_pin: null, reasoning_enabled: false };
const config = { run_id: 'run-test', dataset_version: 'ds-test', temperature: 0, seed: 1, max_output_tokens: 100, system_prompt: null };

const ok = () => ({
  text: 'ok', reasoning_text: null,
  usage: { prompt_tokens: 1, completion_tokens: 1, reasoning_tokens: 0, total_tokens: 2 },
  upstream_provider: 'mock', model_fingerprint: 'fp', finish_reason: 'stop',
  latency_ms: 1, attempts: 1, raw: {},
});

// Fails on the 2nd call, the way the real client reports a server error.
function failingOnTurn2() {
  let calls = 0;
  return async () => {
    calls += 1;
    if (calls === 2) throw Object.assign(new Error('upstream 503'), { classification: 'server_error', retryable: true });
    return ok();
  };
}

test('ACCEPT/integrity: a failed unit keeps its reason from runner to index and scores, and is never counted as a zero', async () => {
  const failed = await runConversation({ scenario, model, repetition: 1, config, chat: failingOnTurn2() });
  const good = await runConversation({ scenario, model, repetition: 2, config, chat: async () => ok() });

  // Runner: the failure is recorded, with its reason.
  assert.equal(failed.status, 'failed');
  assert.equal(failed.error?.classification, 'server_error');
  assert.equal(good.status, 'complete');

  // Index: the reason survives into what the app shows.
  const entry = toIndexEntry(failed);
  assert.equal(entry.status, 'failed');
  assert.equal(entry.failure.classification, 'server_error');

  // Scores: one passing judge result for the good unit only; the failed unit has none.
  const evals = [{
    eval_id: 'e1', unit_id: good.unit_id, turn_index: 2, judge_model_id: 'judge-x', judge_repetition: 1,
    status: 'complete', parse_ok: true, overall_verdict: 'pass', weighted_score: 1,
  }];
  const scores = buildScores([failed, good], evals);
  const group = scores.groups.find(g => g.conversation_id === 'C001' && g.model_id === 'model-a');
  assert.equal(group.units_total, 2);
  assert.equal(group.units_failed, 1);
  assert.equal(group.units_scored, 1);
  assert.deepEqual(group.failed_unit_ids, [failed.unit_id]);

  // The failed unit carries no score of any kind: not 0, not null-as-score, just no checkpoints.
  assert.deepEqual(group.units.find(u => u.unit_id === failed.unit_id), { unit_id: failed.unit_id, status: 'failed', checkpoints: [] });

  // The rate is 1 of 1, not 1 of 2. A zero-filled failure would make it 0.5.
  const cp = group.checkpoints.find(c => c.turn_index === 2);
  assert.equal(cp.denominator, 1);
  assert.equal(cp.rate, 1);

  // Degradation curve: same rule, and the failure is still counted, not hidden.
  const point = buildDegradation(scores).models.find(m => m.model_id === 'model-a').points.find(p => p.turn_index === 2);
  assert.equal(point.denominator, 1);
  assert.equal(point.rate, 1);
  assert.equal(point.units_failed, 1);
});