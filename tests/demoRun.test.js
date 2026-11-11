// tests/demoRun.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDemoRecord, checkDemoRun, DEMO_LIMITS } from '../app/src/lib/demoRun.js';

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