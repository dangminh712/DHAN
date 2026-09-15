import { useState, useEffect, useRef } from 'react';
import { nextTableSort, tableQuery } from './tableState';

export function useRemoteTable(fetchPage, { enabled = true, sortKey = 'id', sortDir = 'asc', pageSize = 15, filters = {} } = {}) {
  const [state, setState] = useState({ page: 1, pageSize, sortKey, sortDir });
  const [data, setData] = useState({ items: [], totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  // In-memory table query cache for 0ms instantaneous re-sort and tab switches
  const tableCacheRef = useRef(new Map());
  const lastRevision = useRef(revision);
  if (lastRevision.current !== revision) {
    lastRevision.current = revision;
    tableCacheRef.current.clear();
  }

  const filterKey = JSON.stringify(filters);
  const previousFilters = useRef(filterKey);

  useEffect(() => {
    if (!enabled) return;

    const isFilterChange = previousFilters.current !== filterKey;
    if (isFilterChange) {
      previousFilters.current = filterKey;
      if (state.page !== 1) {
        setState(s => ({ ...s, page: 1 }));
        return;
      }
    }

    const query = tableQuery(state, JSON.parse(filterKey));
    const queryKey = JSON.stringify(query);

    // Instant cache hit: Return immediately without loading flash
    if (tableCacheRef.current.has(queryKey)) {
      const cached = tableCacheRef.current.get(queryKey);
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let current = true;
    setLoading(true);
    setError(null);

    // Debounce only for search text filters; sort and page clicks fire immediately (0ms delay)
    const delay = isFilterChange ? 180 : 0;

    const timer = setTimeout(() => {
      fetchRef.current(query).then(result => {
        if (!current) return;
        let formatted;
        if (Array.isArray(result)) {
          formatted = { items: result, totalCount: result.length, page: 1, pageSize: result.length, totalPages: 1 };
        } else if (result && Array.isArray(result.items)) {
          formatted = result;
          if (result.page && result.page !== state.page) {
            setState(s => ({ ...s, page: result.page }));
          }
        } else {
          formatted = { items: [], totalCount: 0 };
        }
        tableCacheRef.current.set(queryKey, formatted);
        setData(formatted);
      }).catch(err => {
        if (current) setError(err);
      }).finally(() => {
        if (current) setLoading(false);
      });
    }, delay);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [enabled, state, filterKey, revision]);

  return {
    ...state,
    ...data,
    loading,
    error,
    requestSort: key => setState(s => ({ ...s, ...nextTableSort(s, key), page: 1 })),
    setPage: page => setState(s => ({ ...s, page })),
    setPageSize: pageSize => setState(s => ({ ...s, pageSize, page: 1 })),
    reload: () => {
      tableCacheRef.current.clear();
      setRevision(v => v + 1);
    },
    setData,
    updateItem: (predicate, updater) => {
      setData(prev => {
        const nextItems = (prev.items || []).map(item => {
          if (!predicate(item)) return item;
          return typeof updater === 'function' ? updater(item) : { ...item, ...updater };
        });
        tableCacheRef.current.clear();
        return { ...prev, items: nextItems };
      });
    }
  };
}
