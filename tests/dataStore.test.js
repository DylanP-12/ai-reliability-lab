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

// A fake fetch that answers each URL with its own body; unknown URLs get a 404
function makeRoutedFetch(routes) {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    if (!(url in routes)) return { ok: false, status: 404, json: async () => null };
    return { ok: true, status: 200, json: async () => routes[url] };
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


test('clearCache makes the next call fetch again', async () => {
  const { fakeFetch, calls } = makeFakeFetch([]);
  const store = createDataStore({ fetchFn: fakeFetch });

  await store.getIndex();
  store.clearCache();
  await store.getIndex();

  assert.equal(calls.length, 2);
});

test('getConversation loads the file the index names, and getIndex does not fetch it', async () => {
  const { fakeFetch, calls } = makeRoutedFetch({
    '/data/index.json': [
      { unit_id: 'run:C001:m1:r01', file: 'conversations/run_C001_m1_r01.json' },
    ],
    '/data/conversations/run_C001_m1_r01.json': { unit_id: 'run:C001:m1:r01', turns: [] },
  });
  const store = createDataStore({ fetchFn: fakeFetch });

  await store.getIndex();
  assert.deepEqual(calls, ['/data/index.json']);   // no transcript loaded yet

  const convo = await store.getConversation('run:C001:m1:r01');
  assert.equal(convo.unit_id, 'run:C001:m1:r01');
  assert.deepEqual(calls, [
    '/data/index.json',                          // index fetched once, then reused from cache
    '/data/conversations/run_C001_m1_r01.json',  // the file the index named
  ]);
});

test('getConversation fails closed on a unit the index does not list', async () => {
  const { fakeFetch, calls } = makeRoutedFetch({ '/data/index.json': [] });
  const store = createDataStore({ fetchFn: fakeFetch });

  await assert.rejects(store.getConversation('run:C999:m1:r01'), /Unknown unit: run:C999:m1:r01/);
  assert.deepEqual(calls, ['/data/index.json']);   // it never guessed a path
});

test('getManifest loads and returns JSON', async () => {
  const { fakeFetch, calls } = makeFakeFetch({ run_id: 'r1' });
  const store = createDataStore({ fetchFn: fakeFetch });

  const result = await store.getManifest();

  assert.deepEqual(result, { run_id: 'r1' });
  assert.deepEqual(calls, ['/data/manifest.json']);
});