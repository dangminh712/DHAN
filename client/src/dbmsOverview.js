const unavailable = 'Chưa có dữ liệu';
const isMetric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function formatNumber(value) {
  return isMetric(value) ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value) : unavailable;
}

export function formatBytes(value) {
  if (!isMetric(value)) return unavailable;
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const index = value > 0 ? Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1) : 0;
  return `${formatNumber(value / 1024 ** index)} ${units[index]}`;
}

export function diskUsage(total, free) {
  if (!isMetric(total) || !isMetric(free) || total === 0 || free > total) return null;
  return { usedBytes: total - free, percent: (total - free) / total * 100 };
}

export async function fetchOverview(client, signal) {
  const { data } = await client.get('/api/training/system/overview', { signal });
  if (!data || typeof data !== 'object' || typeof data.databaseName !== 'string' || !Array.isArray(data.tableStats)) {
    throw new Error('Dữ liệu tổng quan CSDL không hợp lệ.');
  }
  return data;
}
