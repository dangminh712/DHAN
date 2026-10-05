import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Search,
  Download,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

const ROWS_PER_PAGE = 100;

export default function ExcelViewer({ url, fileName, file, downloadUrl }) {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheetName, setActiveSheetName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    const loadExcel = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Không thể nạp tệp (HTTP ${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        const data = new Uint8Array(arrayBuffer);
        const wb = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: true
        });

        if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('Tệp bảng tính không chứa dữ liệu trang tính hợp lệ.');
        }

        if (!isCancelled) {
          setWorkbook(wb);
          setActiveSheetName(wb.SheetNames[0]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Lỗi đọc bảng tính Excel:', err);
        if (!isCancelled) {
          setError(err.message || 'Không thể đọc tệp bảng tính.');
          setLoading(false);
        }
      }
    };

    if (url) {
      loadExcel();
    }

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Chuyển đổi dữ liệu sheet hiện tại thành mảng 2 chiều
  const currentSheetRows = useMemo(() => {
    if (!workbook || !activeSheetName) return [];
    const worksheet = workbook.Sheets[activeSheetName];
    if (!worksheet) return [];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });
    return rows;
  }, [workbook, activeSheetName]);

  // Xác định số cột tối đa của trang tính
  const maxCols = useMemo(() => {
    if (!currentSheetRows || currentSheetRows.length === 0) return 0;
    return Math.max(...currentSheetRows.map(r => (Array.isArray(r) ? r.length : 0)));
  }, [currentSheetRows]);

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return currentSheetRows;
    const q = searchQuery.toLowerCase().trim();
    return currentSheetRows.filter((row, idx) => {
      // Giữ lại dòng tiêu đề (index 0) để người dùng định vị
      if (idx === 0) return true;
      if (!Array.isArray(row)) return false;
      return row.some(cell => String(cell || '').toLowerCase().includes(q));
    });
  }, [currentSheetRows, searchQuery]);

  // Phân trang hiển thị cho bảng tính lớn
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const getColHeader = (colIdx) => {
    let label = '';
    let num = colIdx;
    while (num >= 0) {
      label = String.fromCharCode((num % 26) + 65) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  const effectiveDownloadUrl = downloadUrl || url;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[420px] text-slate-300">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-white">Đang tải và hiển thị bảng tính Excel...</h4>
        <p className="text-xs text-slate-400 mt-1">Đang phân tích cấu trúc trang tính trực tiếp trên trình duyệt</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 min-h-[420px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
          <AlertCircle className="w-7 h-7 text-amber-400" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Không thể hiển thị trực tiếp bảng tính</h4>
        <p className="text-xs text-slate-400 max-w-md mb-4">{error}</p>
        <a
          href={effectiveDownloadUrl}
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Tải tệp Excel về máy để mở qua Microsoft Excel</span>
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 select-text overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-800/90 border-b border-slate-700 text-xs">
        {/* Sheet Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] py-0.5 scrollbar-thin">
          <span className="text-emerald-400 font-bold flex items-center gap-1 mr-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Trang tính:</span>
          </span>
          {workbook?.SheetNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setActiveSheetName(name);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all ${
                activeSheetName === name
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Search & Info */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm ô dữ liệu..."
              className="pl-7 pr-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-32 sm:w-44"
            />
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline">
            {totalRows} dòng × {maxCols} cột
          </span>

          <a
            href={effectiveDownloadUrl}
            download={fileName}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-xs font-medium transition-colors"
            title="Tải tệp Excel gốc về máy"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Tải về</span>
          </a>
        </div>
      </div>

      {/* Spreadsheet Grid View */}
      <div className="flex-1 overflow-auto bg-slate-950 text-slate-100 relative max-h-[calc(75vh-100px)]">
        {paginatedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs">Trang tính này không có dữ liệu để hiển thị.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs font-mono">
            <thead className="sticky top-0 z-10 bg-slate-800 text-slate-300 select-none shadow-sm">
              <tr>
                {/* Góc hàng/cột */}
                <th className="sticky left-0 z-20 bg-slate-800/95 border-b border-r border-slate-700 px-2 py-1.5 w-12 text-center text-slate-400 font-bold text-[10px]">
                  #
                </th>
                {/* Tên cột A, B, C... */}
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    className="border-b border-r border-slate-700 px-3 py-1.5 text-center font-bold text-[11px] min-w-[90px] max-w-[260px] truncate"
                  >
                    {getColHeader(cIdx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rIdx) => {
                const actualRowNumber = (currentPage - 1) * ROWS_PER_PAGE + rIdx + 1;
                const isHeaderRow = rIdx === 0 && currentPage === 1;

                return (
                  <tr
                    key={rIdx}
                    className={`border-b border-slate-800/80 transition-colors ${
                      isHeaderRow
                        ? 'bg-slate-900/90 font-bold text-emerald-300'
                        : rIdx % 2 === 0
                        ? 'bg-slate-950 hover:bg-slate-800/50'
                        : 'bg-slate-900/30 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Số dòng 1, 2, 3... */}
                    <td className="sticky left-0 z-0 bg-slate-900 border-r border-slate-800 px-2 py-1 text-center text-[10px] text-slate-500 font-medium select-none">
                      {actualRowNumber}
                    </td>

                    {/* Dữ liệu từng ô */}
                    {Array.from({ length: maxCols }).map((_, cIdx) => {
                      const cellValue = Array.isArray(row) ? row[cIdx] : '';
                      const strVal = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
                      const isMatch =
                        searchQuery.trim() &&
                        strVal.toLowerCase().includes(searchQuery.toLowerCase().trim());

                      return (
                        <td
                          key={cIdx}
                          title={strVal}
                          className={`border-r border-slate-800/70 px-2.5 py-1 truncate max-w-[280px] ${
                            isMatch
                              ? 'bg-amber-500/20 text-amber-200 font-bold'
                              : isHeaderRow
                              ? 'text-emerald-300 font-semibold'
                              : typeof cellValue === 'number'
                              ? 'text-right text-sky-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {strVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Status / Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400">
          <div>
            Trang {currentPage} / {totalPages} (Tổng cộng {totalRows} dòng dữ liệu)
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
              title="Trang trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-slate-300">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
              title="Trang sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
