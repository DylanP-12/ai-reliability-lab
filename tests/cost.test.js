import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTurnCostUSD, estimateConversationCostUSD } from '../core/cost.js';

// Round numbers make hand verification trivial.
const fakeModel = {
  model_id: 'fake-model',
  price_in_per_m: 1.0,
  price_out_per_m: 2.0,
};

test('1,000,000 prompt tokens, 0 completion tokens costs exactly $1', () => {
  const usage = { prompt_tokens: 1_000_000, completion_tokens: 0 };
  const cost = estimateTurnCostUSD(usage, fakeModel);
  assert.strictEqual(cost, 1.0);
});

test('§3.5 example usage (142/210 tokens) matches hand-computed cost within tolerance', () => {
  const usage = { prompt_tokens: 142, completion_tokens: 210, reasoning_tokens: 0 };
  const cost = estimateTurnCostUSD(usage, fakeModel);
  const expected = 0.000562;
  assert.ok(Math.abs(cost - expected) < 1e-9);
});

test('reasoning tokens bill as output, same as equivalent completion tokens', () => {
  const usageWithReasoning = { prompt_tokens: 0, completion_tokens: 100, reasoning_tokens: 900 };
  const usageAllCompletion = { prompt_tokens: 0, completion_tokens: 1000, reasoning_tokens: 0 };

  const costWithReasoning = estimateTurnCostUSD(usageWithReasoning, fakeModel);
  const costAllCompletion = estimateTurnCostUSD(usageAllCompletion, fakeModel);

  assert.strictEqual(costWithReasoning, costAllCompletion);
});

test('estimateConversationCostUSD throws when model_id is not found in models', () => {
  const record = {
    model_id: 'does-not-exist',
    turns: [
      { usage: { prompt_tokens: 100, completion_tokens: 50 } },
    ],
  };
  const models = [fakeModel]; // only 'fake-model' exists, not 'does-not-exist'

  assert.throws(() => {
    estimateConversationCostUSD(record, models);
  });
});


test('estimateTurnCostUSD throws when usage is missing prompt_tokens', () => {
  const usage = { completion_tokens: 50 };

  assert.throws(() => {
    estimateTurnCostUSD(usage, fakeModel);
  });
});

test('estimateConversationCostUSD sums a 3-turn record correctly', () => {
  const record = {
    model_id: 'fake-model',
    turns: [
      { usage: { prompt_tokens: 1_000_000, completion_tokens: 0 } },        // $1.00
      { usage: { prompt_tokens: 0, completion_tokens: 500_000 } },          // $1.00
      { usage: { prompt_tokens: 500_000, completion_tokens: 500_000 } },    // $1.50
    ],
  };
  const models = [fakeModel];

  const cost = estimateConversationCostUSD(record, models);
  assert.strictEqual(cost, 3.5);
});

