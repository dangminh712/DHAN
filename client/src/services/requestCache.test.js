import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestCache } from './requestCache.js';

test('deduplicates concurrent GETs and returns independent response data', async () => {
  const cache = createRequestCache();
  let calls = 0;
  const fetch = async () => { calls++; return { items: [{ id: 1 }] }; };
  const [a, b] = await Promise.all([cache.read('a', fetch), cache.read('a', fetch)]);
  a.items[0].id = 99;
  assert.equal(b.items[0].id, 1);
  assert.equal((await cache.read('a', fetch)).items[0].id, 1);
  assert.equal(calls, 1);
});

test('expires entries and evicts the least recently used key', async () => {
  let now = 0, calls = 0;
  const cache = createRequestCache({ maxEntries: 2, ttl: 10, now: () => now });
  const fetch = async () => ++calls;
  await cache.read('a', fetch); await cache.read('b', fetch);
  await cache.read('a', fetch); await cache.read('c', fetch);
  assert.equal(await cache.read('b', fetch), 4);
  now = 11;
  assert.equal(await cache.read('b', fetch), 5);
});

test('invalidating during a request prevents stale results from repopulating cache', async () => {
  const cache = createRequestCache();
  let complete;
  const pending = cache.read('a', () => new Promise(resolve => { complete = resolve; }));
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.read('a', async () => 'fresh'), 'fresh');
  complete('old'); await pending;
  assert.equal(await cache.read('a', async () => 'wrong'), 'fresh');
});

test('failed requests are retried and oversized payloads are not retained', async () => {
  const cache = createRequestCache({ maxBytes: 20 });
  await assert.rejects(cache.read('a', async () => { throw new Error('offline'); }));
  assert.equal(await cache.read('a', async () => 'ok'), 'ok');
  await cache.read('b', async () => 'x'.repeat(30));
  assert.equal(await cache.read('b', async () => 'new'), 'new');
});
