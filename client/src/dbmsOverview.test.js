import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatBytes, diskUsage, fetchOverview } from './dbmsOverview.js';

test('unknown metrics remain unavailable while zero remains measured', () => {
  assert.equal(formatNumber(null), 'Chưa có dữ liệu');
  assert.equal(formatNumber(undefined), 'Chưa có dữ liệu');
  assert.equal(formatNumber(0), '0');
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(null), 'Chưa có dữ liệu');
  assert.equal(formatBytes(1048576), '1 MiB');
});

test('disk usage derives actual host utilization and rejects invalid metrics', () => {
  assert.deepEqual(diskUsage(1000, 250), { usedBytes: 750, percent: 75 });
  assert.deepEqual(diskUsage(1000, 0), { usedBytes: 1000, percent: 100 });
  assert.equal(diskUsage(0, 0), null);
  assert.equal(diskUsage(null, 0), null);
  assert.equal(diskUsage(100, 101), null);
  assert.equal(diskUsage(100, -1), null);
});

test('overview requests the training endpoint and returns measured data', async () => {
  const controller = new AbortController();
  const payload = { databaseName: 'training_management', totalTables: 0, tableStats: [] };
  const client = { get: async (url, options) => {
    assert.equal(url, '/api/training/system/overview');
    assert.equal(options.signal, controller.signal);
    return { data: payload };
  } };
  assert.equal(await fetchOverview(client, controller.signal), payload);
});

test('failed or malformed overview cannot become a successful snapshot', async () => {
  await assert.rejects(fetchOverview({ get: async () => { throw new Error('offline'); } }), /offline/);
  await assert.rejects(fetchOverview({ get: async () => ({ data: '<html>fallback</html>' }) }), /Dữ liệu/);
  await assert.rejects(fetchOverview({ get: async () => ({ data: {} }) }), /Dữ liệu/);
});
