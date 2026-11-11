// tests/demoRun.test.js
import { DEMO_MODELS } from '../app/src/lib/demoModels.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDemoRecord, checkDemoRun, DEMO_LIMITS, DEMO_CONFIG } from '../app/src/lib/demoRun.js';

const models = [{ model_id: 'm1', price_in_per_m: 1.0, price_out_per_m: 2.0 },
                { model_id: 'pricey', price_in_per_m: 1000, price_out_per_m: 1000 }];
const scen = (n) => ({ scenario_id: 'S', turns: Array.from({ length: n }, () => ({ prompt_text: 'x'.repeat(30) })) });

test('projection re-sends history every turn', () => {
  const r = projectDemoRecord(scen(3), 'm1', { maxTokens: 100 });
  assert.deepEqual(r.turns.map(t => t.usage.prompt_tokens), [10, 120, 230]);
});

test('small run passes with a positive estimate', () => {
  const r = checkDemoRun({ scenario: scen(2), model: models[0], models });
  assert.equal(r.ok, true);
  assert.ok(r.estimateUSD > 0);
});

test('unknown model fails closed: blocked, not $0', () => {
  const r = checkDemoRun({ scenario: scen(2), model: { model_id: 'ghost' }, models });
  assert.equal(r.ok, false);
  assert.equal(r.estimateUSD, null);
});

test('too many turns blocked', () => {
  assert.equal(checkDemoRun({ scenario: scen(DEMO_LIMITS.maxTurns + 1), model: models[0], models }).ok, false);
});

test('over-budget estimate blocked', () => {
  assert.equal(checkDemoRun({ scenario: scen(2), model: models[1], models }).ok, false);
});

test('DEMO_CONFIG uses the runner field names, so the token cap reaches the request', () => {
  assert.equal(DEMO_CONFIG.max_output_tokens, DEMO_LIMITS.maxTokens);
  assert.equal(DEMO_CONFIG.max_tokens, undefined);
  assert.ok(DEMO_CONFIG.request_timeout_ms > 0);
});

test('every demo model can be routed and estimated', () => {
  assert.ok(DEMO_MODELS.length >= 1);
  const s = { scenario_id: 'S', turns: [{ prompt_text: 'hi' }] };
  for (const m of DEMO_MODELS) {
    assert.ok(m.or_model && m.provider_pin, `${m.model_id} missing routing`);
    const r = checkDemoRun({ scenario: s, model: m, models: DEMO_MODELS });
    assert.ok(r.estimateUSD > 0, `${m.model_id} cannot be estimated`);
  }
});