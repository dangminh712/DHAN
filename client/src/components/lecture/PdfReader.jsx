import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { clampPdfPage, validPdfPage } from '../../pdfViewer';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfReader({
  url,
  initialPage = 1,
  fileName = 'Tài liệu học phần',
  downloadUrl,
  canDownload = true,
  onPage,
  onError
}) {
  const [document, setDocument] = useState(null);
  const [page, setPage] = useState(1);
  const [jump, setJump] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [fallbackMode, setFallbackMode] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const callbacks = useRef({ onPage, onError });
  callbacks.current = { onPage, onError };

  // 1. Tải văn bản PDF với cơ chế tự phục hồi đa tầng (Range Stream -> ArrayBuffer -> Native Iframe Fallback)
  useEffect(() => {
    let active = true;
    let task = null;
    setDocument(null);
    setLoading(true);
    setError('');

    const loadWithFallback = async () => {
      // Tầng 1: Thử nạp URL tiêu chuẩn
      try {
        task = getDocument({
          url,
          enableXfa: true,
          isEvalSupported: false
        });
        const doc = await task.promise;
        if (!active) return;
        setDocument(doc);
        const restored = clampPdfPage(initialPage, doc.numPages);
        setPage(restored);
        setJump(String(restored));
        callbacks.current.onPage?.(restored, doc.numPages, false);
        return;
      } catch (firstErr) {
        console.warn('PDF stream load encountered issue, attempting ArrayBuffer buffer recovery:', firstErr);
      }

      // Tầng 2: Tự động tải nguyên vẹn ArrayBuffer để PDF.js tự phục hồi bảng đối chiếu xref
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        task = getDocument({
          data: new Uint8Array(arrayBuf),
          enableXfa: true
        });
        const doc = await task.promise;
        if (!active) return;
        setDocument(doc);
        const restored = clampPdfPage(initialPage, doc.numPages);
        setPage(restored);
        setJump(String(restored));
        callbacks.current.onPage?.(restored, doc.numPages, false);
        return;
      } catch (secondErr) {
        if (!active) return;
        console.warn('ArrayBuffer PDF parse failed, switching to native embed fallback:', secondErr);
        const message =
          secondErr?.name === 'InvalidPDFException'
            ? 'Tập tin PDF bị lỗi cấu trúc ISO. Đang hiển thị qua trình xem dự phòng của trình duyệt.'
            : 'Không thể kết xuất PDF bằng Canvas. Đang chuyển sang trình xem dự phòng.';
        setError(message);
        callbacks.current.onError?.(message);
        setFallbackMode(true);
      }
    };

    loadWithFallback().finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      task?.destroy?.();
    };
  }, [url]);

  // 2. Render trang PDF lên Canvas với hỗ trợ High-DPI / Retina
  useEffect(() => {
    if (!document || !canvasRef.current) return;
    let active = true;
    let renderTask;

    setRendering(true);

    document
      .getPage(page)
      .then(pdfPage => {
        if (!active || !canvasRef.current) return;

        const parent = canvasRef.current.parentElement;
        const availableWidth = parent ? Math.max(parent.clientWidth - 48, 400) : 800;

        const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });
        const fitScale = availableWidth / unscaledViewport.width;
        const computedScale = Math.min(Math.max(fitScale * scaleMultiplier, 0.4), 3.0);

        const viewport = pdfPage.getViewport({ scale: computedScale });
        const dpr = window.devicePixelRatio || 1;

        const target = canvasRef.current;
        target.width = Math.floor(viewport.width * dpr);
        target.height = Math.floor(viewport.height * dpr);
        target.style.width = `${Math.floor(viewport.width)}px`;
        target.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = target.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        renderTask = pdfPage.render({
          canvasContext: ctx,
          viewport
        });

        return renderTask.promise;
      })
      .then(() => {
        if (active) setRendering(false);
      })
      .catch(e => {
        if (active && e.name !== 'RenderingCancelledException') {
          setError('Không thể kết xuất trang PDF này.');
          setRendering(false);
        }
      });

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, page, scaleMultiplier]);

  // Chuyển trang
  const go = value => {
    if (!document) return;
    const next = clampPdfPage(value, document.numPages);
    setPage(next);
    setJump(String(next));
    setError('');
    if (next !== page) {
      callbacks.current.onPage?.(next, document.numPages, true);
    }
  };

  const submitJump = e => {
    e.preventDefault();
    if (validPdfPage(jump, document?.numPages)) {
      go(Number(jump));
    } else {
      setError(`Vui lòng nhập số trang từ 1 đến ${document?.numPages || 1}.`);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setScaleMultiplier(s => Math.min(+(s + 0.2).toFixed(2), 2.5));
  const handleZoomOut = () => setScaleMultiplier(s => Math.max(+(s - 0.2).toFixed(2), 0.5));
  const handleResetZoom = () => setScaleMultiplier(1.0);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!documentRef()) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (window.document.exitFullscreen) {
        window.document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const documentRef = () => window.document.fullscreenElement;

  return (
    <div
      ref={containerRef}
      className={`pdf-reader-container ${isFullscreen ? 'pdf-reader-fullscreen' : ''}`}
    >
      {/* THANH ĐIỀU KHIỂN CHUYÊN NGHIỆP */}
      <div className="pdf-toolbar-card">
        {/* NHÓM 1: ĐIỀU HƯỚNG TRANG */}
        <div className="pdf-toolbar-group nav-group">
          <button
            type="button"
            className="pdf-btn"
            disabled={!document || page <= 1}
            onClick={() => go(1)}
            title="Trang đầu tiên (Ctrl + Home)"
          >
            <ChevronsLeft size={16} />
            <span className="btn-label-desktop">Đầu</span>
          </button>

          <button
            type="button"
            className="pdf-btn"
            disabled={!document || page <= 1}
            onClick={() => go(page - 1)}
            title="Trang trước"
          >
            <ChevronLeft size={16} />
            <span className="btn-label-desktop">Trước</span>
          </button>

          {/* Ô NHẬP & HIỂN THỊ SỐ TRANG */}
          <form onSubmit={submitJump} className="pdf-jump-form" title="Nhập số trang và nhấn Enter">
            <span className="pdf-page-prefix">Trang</span>
            <input
              type="number"
              min="1"
              max={document?.numPages || 1}
              value={jump}
              onChange={e => setJump(e.target.value)}
              onBlur={submitJump}
              className="pdf-page-number-input"
              style={{ minWidth: '60px', width: '60px' }}
              aria-label="Số trang hiện tại"
            />
            <span className="pdf-page-total">/ {document ? document.numPages : '–'}</span>
          </form>

          <button
            type="button"
            className="pdf-btn"
            disabled={!document || page >= document?.numPages}
            onClick={() => go(page + 1)}
            title="Trang tiếp theo"
          >
            <span className="btn-label-desktop">Sau</span>
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            className="pdf-btn"
            disabled={!document || page >= document?.numPages}
            onClick={() => go(document?.numPages)}
            title="Trang cuối cùng (Ctrl + End)"
          >
            <span className="btn-label-desktop">Cuối</span>
            <ChevronsRight size={16} />
          </button>
        </div>

        {/* NHÓM 2: THU PHÓNG (ZOOM CONTROLS) */}
        <div className="pdf-toolbar-group zoom-group">
          <button
            type="button"
            className="pdf-btn"
            onClick={handleZoomOut}
            disabled={!document || scaleMultiplier <= 0.6}
            title="Thu nhỏ (-)"
          >
            <ZoomOut size={15} />
          </button>

          <span className="pdf-zoom-badge" title="Tỷ lệ hiển thị">
            {Math.round(scaleMultiplier * 100)}%
          </span>

          <button
            type="button"
            className="pdf-btn"
            onClick={handleZoomIn}
            disabled={!document || scaleMultiplier >= 2.4}
            title="Phóng to (+)"
          >
            <ZoomIn size={15} />
          </button>

          <button
            type="button"
            className="pdf-btn pdf-btn-reset"
            onClick={handleResetZoom}
            disabled={!document || scaleMultiplier === 1.0}
            title="Vừa chiều rộng màn hình"
          >
            <RotateCcw size={13} />
            <span className="btn-label-desktop">Vừa khung</span>
          </button>
        </div>

        {/* NHÓM 3: TIỆN ÍCH & TẢI XUỐNG */}
        <div className="pdf-toolbar-group actions-group">
          {/* Mở tab mới độc lập */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-btn pdf-btn-link"
            title="Mở tài liệu này trên một tab trình duyệt mới"
          >
            <ExternalLink size={15} />
            <span className="btn-label-desktop">Mở tab</span>
          </a>

          {/* Tải về nếu có quyền */}
          {canDownload && (
            <a
              href={downloadUrl || url}
              download={fileName}
              className="pdf-btn pdf-btn-download"
              title="Tải tài liệu PDF về máy tính"
            >
              <Download size={15} />
              <span className="btn-label-desktop">Tải về</span>
            </a>
          )}

          {/* Nút chuyển đổi chế độ Trình đọc gốc / Trình duyệt */}
          <button
            type="button"
            className={`pdf-btn ${fallbackMode ? 'active' : ''}`}
            onClick={() => setFallbackMode(prev => !prev)}
            title={fallbackMode ? 'Chuyển lại trình đọc Canvas tương tác' : 'Chuyển sang trình đọc gốc của trình duyệt (Dự phòng)'}
          >
            <FileText size={15} />
            <span className="btn-label-desktop">{fallbackMode ? 'Bản Canvas' : 'Trình đọc gốc'}</span>
          </button>

          {/* Phóng to toàn màn hình */}
          <button
            type="button"
            className="pdf-btn pdf-btn-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Chế độ đọc toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* THÔNG BÁO LỖI HOẶC TRẠNG THÁI */}
      {error && !fallbackMode && (
        <div className="pdf-alert-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="pdf-btn"
            style={{ background: '#1D4ED8', color: '#fff', fontSize: '12px', padding: '4px 10px', borderRadius: '4px' }}
            onClick={() => setFallbackMode(true)}
          >
            Mở trình đọc dự phòng (Iframe)
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ CANVAS TRANG PDF HOẶC FALLBACK NATIVE IFRAME */}
      <div className="pdf-canvas-stage">
        {fallbackMode ? (
          <iframe
            src={url}
            title={fileName}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '650px',
              border: 'none',
              background: '#FFFFFF',
              borderRadius: '6px'
            }}
          />
        ) : (
          <>
            {loading && (
              <div className="pdf-loading-state">
                <Loader2 className="spinner-rotate" size={36} />
                <h4>Đang chuẩn bị trang tài liệu điện tử…</h4>
                <p>Hệ thống đang nạp trang {page} trực tiếp tại trình duyệt (bảo mật CSDL Intranet).</p>
              </div>
            )}

            <div className={`pdf-canvas-wrapper ${rendering ? 'rendering' : ''}`}>
              <canvas
                ref={canvasRef}
                aria-label={`Trang PDF ${page}`}
                className="pdf-rendered-canvas"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
