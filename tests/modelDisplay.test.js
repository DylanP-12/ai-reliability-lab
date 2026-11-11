import test from 'node:test';
import assert from 'node:assert/strict';
import { toModelDisplay } from '../cli/prepare-app-data.js';

test('model display keeps display fields only: no routing or pricing reaches /data', () => {
  const out = toModelDisplay({
    model_id: 'm', label: 'M', reasoning_enabled: false, family: 'f', weights: 'open',
    or_model: 'x/y', provider_pin: 'p', price_in_per_m: 1, price_out_per_m: 2,
    pin_verified: '2026-08-28', context_tokens: 1000, pricing_verified: '2026-08-27',
    api_key: 'sk-or-planted',
  });
  assert.deepEqual(Object.keys(out).sort(), ['family', 'label', 'model_id', 'reasoning_enabled', 'weights']);
});