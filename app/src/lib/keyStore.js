// app/src/lib/keyStore.js
const KEY_NAME = 'ai-reliability-lab.demo-key';

function store() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function getKey() { return store()?.getItem(KEY_NAME) ?? null; }
export function hasKey() { return Boolean(getKey()); }

export function setKey(value) {
  const v = String(value ?? '').trim();
  if (!v) throw new Error('setKey: empty key');               // generic, never echoes input
  const s = store();
  if (!s) throw new Error('setKey: browser storage unavailable');
  s.setItem(KEY_NAME, v);
}

export function clearKey() { store()?.removeItem(KEY_NAME); }

// Derived facts only: safe to display or log
export function keyInfo() {
  const k = getKey();
  return { present: Boolean(k), length: k ? k.length : 0 };
}