// Memory only: never persist protected table responses to browser storage.
export function createRequestCache({ ttl = 15000, maxEntries = 80, maxBytes = 4 * 1024 * 1024, now = Date.now } = {}) {
  const entries = new Map();
  const pending = new Map();
  let generation = 0;
  let bytes = 0;
  const remove = key => {
    bytes -= entries.get(key)?.bytes || 0;
    entries.delete(key);
  };
  return {
    clear() { generation++; entries.clear(); pending.clear(); bytes = 0; },
    async read(key, fetch) {
      const cached = entries.get(key);
      if (cached && cached.until > now()) {
        entries.delete(key); entries.set(key, cached);
        return structuredClone(cached.value);
      }
      if (cached) remove(key);
      if (pending.has(key)) return structuredClone(await pending.get(key));
      const started = generation;
      const request = Promise.resolve().then(fetch).then(value => {
        const encodedSize = JSON.stringify(value)?.length * 2 || 0;
        if (started === generation && encodedSize <= maxBytes) {
          // Drop expired data before applying the LRU memory budget.
          for (const [entryKey, entry] of entries) if (entry.until <= now()) remove(entryKey);
          while (entries.size >= maxEntries || bytes + encodedSize > maxBytes) remove(entries.keys().next().value);
          entries.set(key, { value: structuredClone(value), until: now() + ttl, bytes: encodedSize });
          bytes += encodedSize;
        }
        return value;
      }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
      pending.set(key, request);
      return structuredClone(await request);
    },
  };
}
