import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
  Maximize,
  StretchHorizontal
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
  const [scaleMode, setScaleMode] = useState('fit-width'); // 'fit-width' | 'fit-page' | 'manual'
  const [rotation, setRotation] = useState(0); // 0 | 90 | 180 | 270
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  const [fallbackMode, setFallbackMode] = useState(false);

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
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
        console.warn('ArrayBuffer PDF parse failed:', secondErr);
        const message =
          secondErr?.name === 'InvalidPDFException'
            ? 'Tập tin không phải định dạng PDF tiêu chuẩn hoặc có cấu trúc bị lỗi.'
            : 'Không thể kết xuất trang PDF bằng Canvas.';
        setError(message);
        callbacks.current.onError?.(message);
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

  // 2. Theo dõi kích thước thực tế của vùng hiển thị (stageRef) bằng ResizeObserver
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateDimensions = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w > 0 && h > 0) {
        setStageDimensions({ width: w, height: h });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(stage);
    return () => resizeObserver.disconnect();
  }, []);

  // 3. Render trang PDF lên Canvas với tỷ lệ chuẩn xác và hỗ trợ High-DPI / Retina
  useEffect(() => {
    if (!document || !canvasRef.current) return;
    let active = true;

    // Hủy bỏ tác vụ render trước đó nếu đang thực thi
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    setRendering(true);

    document
      .getPage(page)
      .then(pdfPage => {
        if (!active || !canvasRef.current) return;

        const effectiveRotation = (pdfPage.rotate + rotation) % 360;
        const unscaledViewport = pdfPage.getViewport({ scale: 1.0, rotation: effectiveRotation });

        // Đo đạc từ container stage thực tế (không lấy từ canvas wrapper)
        const stageW = stageDimensions.width || stageRef.current?.clientWidth || 800;
        const stageH = stageDimensions.height || stageRef.current?.clientHeight || 600;

        const availW = Math.max(stageW - 56, 360);
        const availH = Math.max(stageH - 56, 360);

        let baseScale = 1.0;
        if (scaleMode === 'fit-width') {
          baseScale = availW / unscaledViewport.width;
        } else if (scaleMode === 'fit-page') {
          baseScale = Math.min(availW / unscaledViewport.width, availH / unscaledViewport.height);
        } else {
          // Manual mode: lấy fit-width làm tỷ lệ gốc 100%
          baseScale = availW / unscaledViewport.width;
        }

        const computedScale = Math.min(Math.max(baseScale * scaleMultiplier, 0.3), 3.5);

        const viewport = pdfPage.getViewport({ scale: computedScale, rotation: effectiveRotation });
        const dpr = window.devicePixelRatio || 1;

        const target = canvasRef.current;
        target.width = Math.floor(viewport.width * dpr);
        target.height = Math.floor(viewport.height * dpr);
        target.style.width = `${Math.floor(viewport.width)}px`;
        target.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = target.getContext('2d', { alpha: false });
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Vẽ nền trắng sạch trước khi render
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const task = pdfPage.render({
          canvasContext: ctx,
          viewport
        });

        renderTaskRef.current = task;
        return task.promise;
      })
      .then(() => {
        renderTaskRef.current = null;
        if (active) {
          setRendering(false);
          setError('');
        }
      })
      .catch(e => {
        if (e?.name === 'RenderingCancelledException') {
          return;
        }
        console.error('PDF Canvas Render Error:', e);
        if (active) {
          setError('Không thể kết xuất trang PDF này.');
          setRendering(false);
        }
      });

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [document, page, scaleMultiplier, scaleMode, rotation, stageDimensions]);

  // Chuyển trang kèm vị trí cuộn mượt mà
  const go = useCallback((value, scrollPos = 0) => {
    if (!document) return;
    const next = clampPdfPage(value, document.numPages);
    setPage(next);
    setJump(String(next));
    setError('');
    if (stageRef.current) {
      if (scrollPos === 'bottom') {
        stageRef.current.scrollTop = stageRef.current.scrollHeight;
      } else {
        stageRef.current.scrollTop = scrollPos;
      }
    }
    if (next !== page) {
      callbacks.current.onPage?.(next, document.numPages, true);
    }
  }, [document, page]);

  const submitJump = e => {
    e.preventDefault();
    if (validPdfPage(jump, document?.numPages)) {
      go(Number(jump), 0);
    } else {
      setError(`Vui lòng nhập số trang từ 1 đến ${document?.numPages || 1}.`);
    }
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScaleMode('manual');
    setScaleMultiplier(s => Math.min(Number((s + 0.15).toFixed(2)), 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScaleMode('manual');
    setScaleMultiplier(s => Math.max(Number((s - 0.15).toFixed(2)), 0.4));
  }, []);

  const handleFitWidth = useCallback(() => {
    setScaleMode('fit-width');
    setScaleMultiplier(1.0);
  }, []);

  const handleFitPage = useCallback(() => {
    setScaleMode('fit-page');
    setScaleMultiplier(1.0);
  }, []);

  const handleResetZoom = useCallback(() => {
    setScaleMode('fit-width');
    setScaleMultiplier(1.0);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(r => (r + 90) % 360);
  }, []);

  // Lắng nghe chuột cuộn: Ctrl + Wheel để Zoom, và lăn chuột tại mép để chuyển trang tự nhiên
  const wheelCooldownRef = useRef(0);
  const wheelAccumulatorRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e) => {
      // 1. Phím Ctrl + Lăn chuột: Phóng to / Thu nhỏ
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else if (e.deltaY > 0) {
          handleZoomOut();
        }
        return;
      }

      // 2. Lăn chuột cuộn trang: Cho phép cuộn tự nhiên trên trang hiện tại.
      // Khi đã cuộn đến kịch đáy (bottom) mà tiếp tục lăn xuống -> tự động chuyển trang kế tiếp!
      // Khi đã ở đỉnh (top) mà tiếp tục lăn lên -> tự động quay lại trang trước!
      if (!document || document.numPages <= 1) return;

      const now = Date.now();
      if (now - wheelCooldownRef.current < 400) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = stage;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 4;
      const atTop = scrollTop <= 4;

      if (e.deltaY > 0 && atBottom && page < document.numPages) {
        wheelAccumulatorRef.current += e.deltaY;
        if (wheelAccumulatorRef.current > 30) {
          wheelCooldownRef.current = now;
          wheelAccumulatorRef.current = 0;
          go(page + 1, 0);
          setTimeout(() => {
            if (stageRef.current) stageRef.current.scrollTop = 0;
          }, 30);
        }
      } else if (e.deltaY < 0 && atTop && page > 1) {
        wheelAccumulatorRef.current += e.deltaY;
        if (wheelAccumulatorRef.current < -30) {
          wheelCooldownRef.current = now;
          wheelAccumulatorRef.current = 0;
          go(page - 1, 'bottom');
          setTimeout(() => {
            if (stageRef.current) stageRef.current.scrollTop = stageRef.current.scrollHeight;
          }, 30);
        }
      } else {
        wheelAccumulatorRef.current = 0;
      }
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [document, page, go, handleZoomIn, handleZoomOut]);

  // Phím tắt bàn phím: Mũi tên trái/phải để lật trang, Ctrl +/- để zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(page - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        go(page + 1);
      } else if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, go, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!window.document.fullscreenElement) {
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

  return (
    <div
      ref={containerRef}
      className={`pdf-reader-container ${isFullscreen ? 'pdf-reader-fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        background: '#0B132B',
        overflow: 'hidden'
      }}
    >
      {/* THANH ĐIỀU KHIỂN CHUYÊN NGHIỆP */}
      <div className="pdf-toolbar-card" style={{ background: '#0F1E36', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
            title="Trang trước (←)"
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
              style={{ minWidth: '54px', width: '54px' }}
              aria-label="Số trang hiện tại"
            />
            <span className="pdf-page-total">/ {document ? document.numPages : '–'}</span>
          </form>

          <button
            type="button"
            className="pdf-btn"
            disabled={!document || page >= (document?.numPages || 1)}
            onClick={() => go(page + 1)}
            title="Trang sau (→)"
          >
            <span className="btn-label-desktop">Sau</span>
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            className="pdf-btn"
            disabled={!document || page >= (document?.numPages || 1)}
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
            disabled={!document || scaleMultiplier <= 0.4}
            title="Thu nhỏ (Ctrl + -)"
          >
            <ZoomOut size={15} />
          </button>

          <span
            className="pdf-zoom-badge"
            title="Tỷ lệ hiển thị. Nhấn để quay về vừa chiều rộng"
            onClick={handleResetZoom}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {Math.round(scaleMultiplier * 100)}%
          </span>

          <button
            type="button"
            className="pdf-btn"
            onClick={handleZoomIn}
            disabled={!document || scaleMultiplier >= 3.0}
            title="Phóng to (Ctrl + +)"
          >
            <ZoomIn size={15} />
          </button>

          {/* Vừa chiều rộng */}
          <button
            type="button"
            className={`pdf-btn ${scaleMode === 'fit-width' && scaleMultiplier === 1.0 ? 'active' : ''}`}
            onClick={handleFitWidth}
            disabled={!document}
            title="Vừa chiều rộng màn hình"
            style={{
              background: scaleMode === 'fit-width' && scaleMultiplier === 1.0 ? 'rgba(56, 189, 248, 0.25)' : undefined,
              borderColor: scaleMode === 'fit-width' && scaleMultiplier === 1.0 ? '#38BDF8' : undefined
            }}
          >
            <StretchHorizontal size={14} />
            <span className="btn-label-desktop">Vừa rộng</span>
          </button>

          {/* Vừa toàn trang */}
          <button
            type="button"
            className={`pdf-btn ${scaleMode === 'fit-page' && scaleMultiplier === 1.0 ? 'active' : ''}`}
            onClick={handleFitPage}
            disabled={!document}
            title="Vừa toàn bộ trang vào màn hình"
            style={{
              background: scaleMode === 'fit-page' && scaleMultiplier === 1.0 ? 'rgba(56, 189, 248, 0.25)' : undefined,
              borderColor: scaleMode === 'fit-page' && scaleMultiplier === 1.0 ? '#38BDF8' : undefined
            }}
          >
            <Maximize size={13} />
            <span className="btn-label-desktop">Vừa trang</span>
          </button>

          {/* Xoay trang 90 độ */}
          <button
            type="button"
            className="pdf-btn"
            onClick={handleRotate}
            disabled={!document}
            title={`Xoay trang chiều kim đồng hồ (${rotation}°)`}
          >
            <RotateCw size={14} />
            <span className="btn-label-desktop">{rotation > 0 ? `${rotation}°` : 'Xoay'}</span>
          </button>
        </div>

        {/* NHÓM 3: TÁC VỤ PHỤ */}
        <div className="pdf-toolbar-group actions-group">
          {downloadUrl && canDownload && (
            <a
              href={downloadUrl}
              download={fileName}
              className="pdf-btn pdf-btn-download"
              title="Tải tệp PDF về máy"
            >
              <Download size={14} />
              <span className="btn-label-desktop">Tải về</span>
            </a>
          )}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-btn"
            title="Mở tài liệu PDF trong thẻ trình duyệt mới"
          >
            <ExternalLink size={14} />
            <span className="btn-label-desktop">Tab mới</span>
          </a>

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
      <div
        ref={stageRef}
        className="pdf-canvas-stage"
        tabIndex={0}
        style={{
          outline: 'none',
          cursor: scaleMultiplier > 1.0 ? 'grab' : 'default'
        }}
      >
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
                <h4 style={{ color: '#F8FAFC' }}>Đang chuẩn bị trang tài liệu điện tử…</h4>
                <p style={{ color: '#94A3B8' }}>Hệ thống đang nạp trang {page} trực tiếp tại trình duyệt (bảo mật CSDL Intranet).</p>
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
