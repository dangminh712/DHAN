import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { installApiCache, invalidateApiCache } from './cachedApi.js';

test('GET cache is scoped to session, query, and invalidated by writes', async () => {
  let calls = 0;
  let session = { token: 'one', userId: '1' };
  const client = axios.create({ adapter: async config => ({ data: { call: ++calls, auth: config.headers.Authorization }, status: 200, headers: {}, config }) });
  installApiCache(client, () => session);
  const [a, b] = await Promise.all([client.get('/api/auth/users', { params: { page: 1 } }), client.get('/api/auth/users', { params: { page: 1 } })]);
  assert.equal(a.data.call, b.data.call);
  assert.equal(a.data.auth, 'Bearer one');
  assert.equal((await client.get('/api/auth/users', { params: { page: 2 } })).data.call, 2);
  await client.post('/api/auth/users', {});
  assert.equal((await client.get('/api/auth/users', { params: { page: 1 } })).data.call, 4);
  session = { token: 'two', userId: '2' };
  assert.equal((await client.get('/api/auth/users', { params: { page: 1 } })).data.auth, 'Bearer two');
  assert.equal(calls, 5);
  invalidateApiCache();
});

test('streams and explicit refreshes always reach the network', async () => {
  let calls = 0;
  const client = axios.create({ adapter: async config => ({ data: ++calls, status: 200, headers: {}, config }) });
  installApiCache(client, () => ({ token: '', userId: '' }));
  await client.get('/api/training/files/1/stream'); await client.get('/api/training/files/1/stream');
  await client.get('/api/auth/users', { cache: false }); await client.get('/api/auth/users', { cache: false });
  assert.equal(calls, 4);
});
