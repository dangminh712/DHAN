export function nextTableSort(state, key) {
  return { sortKey: key, sortDir: state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc' };
}
export function tableQuery(state, filters = {}) {
  return { ...filters, page: Math.max(1, state.page || 1), pageSize: Math.min(100, Math.max(1, state.pageSize || 15)), sortBy: state.sortKey, sortDir: state.sortDir };
}
