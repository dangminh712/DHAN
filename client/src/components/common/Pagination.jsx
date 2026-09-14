import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  page = 1,
  pageSize = 15,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50]
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount <= 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Calculate visible page range (e.g. up to 5 pages around current)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  const buttonBaseStyle = {
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.15s ease-in-out',
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#334155'
  };

  const disabledStyle = {
    opacity: 0.45,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 16px',
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        borderRadius: '0 0 10px 10px'
      }}
    >
      {/* Left: Summary and Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: '#475569' }}>
        <span>
          Hiển thị <strong style={{ color: '#0B1E36' }}>{startItem} - {endItem}</strong> / <strong style={{ color: '#A31A1A' }}>{totalCount}</strong> bản ghi
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>• Số hàng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0B1E36',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          style={{ ...buttonBaseStyle, ...(page <= 1 ? disabledStyle : {}) }}
          title="Trang đầu"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ ...buttonBaseStyle, ...(page <= 1 ? disabledStyle : {}) }}
          title="Trang trước"
        >
          <ChevronLeft size={15} />
          <span>Trước</span>
        </button>

        {/* Page numbers */}
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              style={{ ...buttonBaseStyle, minWidth: '32px' }}
            >
              1
            </button>
            {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>}
          </>
        )}

        {pages.map((p) => {
          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                ...buttonBaseStyle,
                minWidth: '32px',
                background: isActive ? '#0B1E36' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#334155',
                borderColor: isActive ? '#0B1E36' : '#CBD5E1',
                boxShadow: isActive ? '0 1px 3px rgba(11, 30, 54, 0.25)' : 'none'
              }}
            >
              {p}
            </button>
          );
        })}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              style={{ ...buttonBaseStyle, minWidth: '32px' }}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ ...buttonBaseStyle, ...(page >= totalPages ? disabledStyle : {}) }}
          title="Trang sau"
        >
          <span>Sau</span>
          <ChevronRight size={15} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          style={{ ...buttonBaseStyle, ...(page >= totalPages ? disabledStyle : {}) }}
          title="Trang cuối"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
