import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import {
  FileText,
  Search,
  Download,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

export default function WordViewer({ url, fileName, file, downloadUrl }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadWord = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Không thể nạp tệp (HTTP ${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        const convertToHtml = mammoth.convertToHtml || mammoth.default?.convertToHtml;
        if (!convertToHtml) {
          throw new Error('Thư viện xử lý văn bản Word chưa được kích hoạt đúng cách.');
        }

        const result = await convertToHtml({ arrayBuffer });
        if (!isCancelled) {
          if (!result.value || result.value.trim() === '') {
            setHtmlContent('<p class="empty-doc">Tài liệu không có nội dung văn bản hiển thị.</p>');
          } else {
            setHtmlContent(result.value);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Lỗi phân tích tệp Word:', err);
        if (!isCancelled) {
          setError(err.message || 'Không thể hiển thị tài liệu Word trực tiếp.');
          setLoading(false);
        }
      }
    };

    if (url) {
      loadWord();
    }

    return () => {
      isCancelled = true;
    };
  }, [url]);

  const effectiveDownloadUrl = downloadUrl || url;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[420px] text-slate-300">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-white">Đang xử lý nội dung văn bản Word (.docx)...</h4>
        <p className="text-xs text-slate-400 mt-1">Đang trích xuất định dạng tài liệu nội bộ</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 min-h-[420px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3">
          <FileText className="w-7 h-7 text-blue-400" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Tài liệu Word sẵn sàng nghiên cứu</h4>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Tệp định dạng Word cần mở qua trình soạn thảo văn bản để xem trọn vẹn mọi định dạng biểu bảng phức tạp.
        </p>
        <a
          href={effectiveDownloadUrl}
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Tải tệp Word (.docx / .doc) về máy</span>
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 select-text overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 text-xs text-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900 truncate max-w-xs">{fileName}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="p-1 hover:bg-slate-200 rounded text-slate-700"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono min-w-[36px] text-center font-bold text-slate-800">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(160, z + 10))}
              className="p-1 hover:bg-slate-200 rounded text-slate-700"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1 hover:bg-slate-200 rounded text-slate-700"
              title="Đặt lại 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <a
            href={effectiveDownloadUrl}
            download={fileName}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải về</span>
          </a>
        </div>
      </div>

      {/* Document Viewport - Styled like A4 Paper on an Executive Desk */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
        <div
          className="bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 p-8 sm:p-12 max-w-3xl w-full min-h-[600px] transition-transform origin-top leading-relaxed text-sm select-text"
          style={{
            transform: `scale(${zoom / 100})`,
            fontFamily: "'Times New Roman', Times, serif",
            lineHeight: 1.7
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
