import React, { useState, useMemo, useCallback } from 'react';
import { nextTableSort } from './tableState';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Compare two values for sorting, supporting dates, numbers, strings (with Vietnamese locale), and booleans.
 */
export function compareValues(a, b, direction = 'asc') {
  if (a === b) return 0;
  if (a === null || a === undefined || a === '') return direction === 'asc' ? 1 : -1;
  if (b === null || b === undefined || b === '') return direction === 'asc' ? -1 : 1;

  // Booleans
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    const diff = (a ? 1 : 0) - (b ? 1 : 0);
    return direction === 'asc' ? diff : -diff;
  }

  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  // Dates (either Date object or ISO string)
  const isDateA = a instanceof Date || (typeof a === 'string' && /^\d{4}-\d{2}-\d{2}/.test(a));
  const isDateB = b instanceof Date || (typeof b === 'string' && /^\d{4}-\d{2}-\d{2}/.test(b));
  if (isDateA && isDateB) {
    const timeA = new Date(a).getTime();
    const timeB = new Date(b).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) {
      return direction === 'asc' ? timeA - timeB : timeB - timeA;
    }
  }

  // Fallback to string comparison with Vietnamese collation
  const strA = String(a).trim();
  const strB = String(b).trim();

  // Try numeric comparison if both strings are pure numbers
  if (!isNaN(strA) && !isNaN(strB) && strA !== '' && strB !== '') {
    return direction === 'asc' ? Number(strA) - Number(strB) : Number(strB) - Number(strA);
  }

  const result = strA.localeCompare(strB, 'vi', { numeric: true, sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

/**
 * Sort an array of items by key or custom getter.
 */
export function sortData(items, sortKey, sortDir, customGetters = {}) {
  if (!Array.isArray(items) || !sortKey || !sortDir) return items;

  const getter = customGetters[sortKey] || ((item) => item?.[sortKey]);

  return [...items].sort((itemA, itemB) => {
    const valA = getter(itemA);
    const valB = getter(itemB);
    return compareValues(valA, valB, sortDir);
  });
}

/**
 * Custom hook to manage table sorting state.
 * Supports two invocation styles:
 * 1. useTableSort(initialKey, initialDir, customGetters) -> for manual sorting with sortItems(data)
 * 2. useTableSort(dataArray, initialKey, initialDir, customGetters) -> automatically returns sortedData
 */
export function useTableSort(arg1 = '', arg2 = 'asc', arg3 = {}, arg4 = {}) {
  // Determine if first argument is a data array
  const isDataMode = Array.isArray(arg1);
  const data = isDataMode ? arg1 : null;
  const initialKey = isDataMode ? (typeof arg2 === 'string' ? arg2 : '') : (typeof arg1 === 'string' ? arg1 : '');
  const initialDir = isDataMode ? (typeof arg3 === 'string' ? arg3 : 'asc') : (typeof arg2 === 'string' ? arg2 : 'asc');
  const customGetters = isDataMode ? (typeof arg4 === 'object' && arg4 !== null ? arg4 : {}) : (typeof arg3 === 'object' && arg3 !== null ? arg3 : {});

  const [{ sortKey, sortDir }, setSort] = useState({ sortKey: initialKey, sortDir: initialDir });
  const setSortKey = key => setSort(s => ({ ...s, sortKey: key }));
  const setSortDir = dir => setSort(s => ({ ...s, sortDir: dir }));
  const requestSort = useCallback(key => setSort(s => nextTableSort(s, key)), []);

  const sortItems = useCallback(
    (items, overrides = {}) => {
      return sortData(items, sortKey, sortDir, { ...customGetters, ...overrides });
    },
    [sortKey, sortDir, customGetters]
  );

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return sortData(data, sortKey, sortDir, customGetters);
  }, [data, sortKey, sortDir, customGetters]);

  return {
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    requestSort,
    sortItems,

    // Aliases for data-in style (used in AcademicPage & ProvisioningPage)
    sortedData,
    sortField: sortKey,
    sortDirection: sortDir,
    handleSort: requestSort,
  };
}

/**
 * Reusable interactive table header component with sort indicators.
 * Supports both columnKey / sortKey / sortDir AND field / sortField / sortDirection props.
 */
export function SortableTh({
  columnKey,
  field,
  sortKey,
  sortField,
  sortDir,
  sortDirection,
  onSort,
  children,
  style = {},
  className = '',
  align = 'left',
  width,
  minWidth,
  title,
}) {
  const activeKey = columnKey || field || '';
  const currentSortKey = sortKey !== undefined ? sortKey : sortField;
  const currentSortDir = sortDir !== undefined ? sortDir : sortDirection;

  const isSorted = currentSortKey === activeKey && Boolean(activeKey);
  const isAsc = isSorted && currentSortDir === 'asc';
  const isDesc = isSorted && currentSortDir === 'desc';

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSort) onSort(activeKey);
  };

  return (
    <th
      scope="col"
      aria-sort={isAsc ? 'ascending' : isDesc ? 'descending' : 'none'}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); } }}
      onClick={handleClick}
      title={title || `Bấm để sắp xếp theo ${typeof children === 'string' ? children : 'cột này'}`}
      className={`sortable-th select-none ${className}`}
      style={{
        cursor: 'pointer',
        textAlign: align,
        width,
        minWidth,
        userSelect: 'none',
        transition: 'background-color 0.15s, color 0.15s',
        ...style,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          width: align === 'center' ? '100%' : 'auto',
        }}
      >
        <span>{children}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: isSorted ? '#A31A1A' : '#94A3B8',
            transition: 'transform 0.15s, color 0.15s',
          }}
        >
          {isAsc ? (
            <ChevronUp size={14} strokeWidth={2.5} />
          ) : isDesc ? (
            <ChevronDown size={14} strokeWidth={2.5} />
          ) : (
            <ChevronsUpDown size={13} strokeWidth={1.75} style={{ opacity: 0.6 }} />
          )}
        </span>
      </div>
    </th>
  );
}
