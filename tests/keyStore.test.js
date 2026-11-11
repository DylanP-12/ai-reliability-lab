// tests/keyStore.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true, writable: true,
  value: { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) },
});
const ks = await import('../app/src/lib/keyStore.js');

test('round trip trims, clear removes', () => {
  ks.setKey('  sk-or-demo-123  ');
  assert.equal(ks.getKey(), 'sk-or-demo-123');
  ks.clearKey();
  assert.equal(ks.hasKey(), false);
});

test('keyInfo exposes derived facts, never the value', () => {
  ks.setKey('sk-or-demo-123');
  assert.deepEqual(ks.keyInfo(), { present: true, length: 14 });
  assert.ok(!JSON.stringify(ks.keyInfo()).includes('sk-or'));
  ks.clearKey();
});

test('empty key rejected with a generic message', () => {
  assert.throws(() => ks.setKey('   '), /empty key/);
});