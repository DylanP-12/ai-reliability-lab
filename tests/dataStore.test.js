import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDataStore } from '../app/src/lib/dataStore.js';

// A fake fetch that records every URL it was asked for
function makeFakeFetch(body = [], ok = true, status = 200) {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    return { ok, status, json: async () => body };
  };
  return { fakeFetch, calls };
}

test('getIndex loads and returns JSON', async () => {
  const { fakeFetch, calls } = makeFakeFetch([{ unitId: 'u1' }]);
  const store = createDataStore({ fetchFn: fakeFetch });

  const result = await store.getIndex();

  assert.deepEqual(result, [{ unitId: 'u1' }]);
  assert.deepEqual(calls, ['/data/index.json']);
});


test('getIndex caches: two awaited calls, one fetch', async () => {
  const { fakeFetch, calls } = makeFakeFetch([]);
  const store = createDataStore({ fetchFn: fakeFetch });

  await store.getIndex();
  await store.getIndex();

  assert.equal(calls.length, 1);
});

test('getIndex de-duplicates concurrent calls', async () => {
  const { fakeFetch, calls } = makeFakeFetch([]);
  const store = createDataStore({ fetchFn: fakeFetch });

  const p1 = store.getIndex();   // no await yet
  const p2 = store.getIndex();   // fired while p1 is still in flight
  await Promise.all([p1, p2]);

  assert.equal(calls.length, 1);
});

test('a failed load rejects with the resource name and status', async () => {
  const { fakeFetch } = makeFakeFetch(null, false, 404);
  const store = createDataStore({ fetchFn: fakeFetch });

  await assert.rejects(store.getIndex(), /index\.json.*404/);
});

test('getConversation requests the right path, and getIndex does not fetch it', async () => {
  const { fakeFetch, calls } = makeFakeFetch({});
  const store = createDataStore({ fetchFn: fakeFetch });

  await store.getIndex();
  assert.deepEqual(calls, ['/data/index.json']);   // no transcript loaded yet

  await store.getConversation('u1');
  assert.deepEqual(calls, ['/data/index.json', '/data/conversations/u1.json']);
});

test('clearCache makes the next call fetch again', async () => {
  const { fakeFetch, calls } = makeFakeFetch([]);
  const store = createDataStore({ fetchFn: fakeFetch });

  await store.getIndex();
  store.clearCache();
  await store.getIndex();

  assert.equal(calls.length, 2);
});