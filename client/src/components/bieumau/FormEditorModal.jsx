// client/src/components/bieumau/FormEditorModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Printer,
  FileDown,
  FileText,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Edit3,
  ExternalLink
} from 'lucide-react';
import {
  transformDottedToInputs,
  saveFormDraft,
  getFormDraft,
  clearFormDraft,
  exportToWord
} from '../../utils/bieuMauEngine';
import { cleanFormHtml } from '../../utils/bieuMauEngine';
import { handleFormTableAction, serializeForm, printFormDocument, prepareFormTables } from '../../utils/formEditorDom';
import FormModalShell from './FormModalShell';
import formStyles from '../../styles/bieumau.css?raw';
import '../../styles/bieumau.css';

export default function FormEditorModal({
  isOpen,
  onClose,
  formItem,
  onOpenPdf
}) {
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [highlightFields, setHighlightFields] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [fieldCount, setFieldCount] = useState(0);
  const [resetVersion, setResetVersion] = useState(0);

  const paperRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !formItem) {
      setContentHtml('');
      setSaveStatus('');
      setError(null);
      setFieldCount(0);
      return;
    }

    let isMounted = true;
    const formCode = formItem.code;
    setLoading(false);
    setHasDraft(false);

    // 1. Kiểm tra xem có bản nháp trong localStorage hay không
    const draft = getFormDraft(formCode);
    if (draft && draft.html) {
      setContentHtml(cleanFormHtml(draft.html));
      setHasDraft(true);
      const timeStr = draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString('vi-VN') : '';
      setSaveStatus(`Khôi phục bản nháp lúc ${timeStr}`);
      return;
    }

    // 2. Nếu không có nháp, tải file HTML gốc
    if (formItem.htmlPath) {
      setLoading(true);
      setError(null);

      fetch(formItem.htmlPath)
        .then(res => {
          if (!res.ok) throw new Error(`Không thể tải biểu mẫu (HTTP ${res.status})`);
          return res.text();
        })
        .then(rawHtml => {
          if (!isMounted) return;
          // Biến các dấu .... thành ô nhập liệu tương tác
          const transformed = transformDottedToInputs(rawHtml);
          setContentHtml(transformed);
          setLoading(false);
        })
        .catch(err => {
          if (!isMounted) return;
          setError(err.message || 'Lỗi tải biểu mẫu');
          setLoading(false);
        });
    } else if (formItem.customHtml) {
      const transformed = transformDottedToInputs(formItem.customHtml);
      setContentHtml(transformed);
      setLoading(false);
    } else if (!formItem.htmlPath && formItem.pdfPath) {
      // Biểu mẫu đặc thù chỉ có bản viết tay
      setContentHtml('');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, formItem]);

  // Đếm số lượng ô có thể điền sau khi nạp DOM
  useEffect(() => {
    if (!paperRef.current) return;
    prepareFormTables(paperRef.current);
    const timer = setTimeout(() => {
      if (paperRef.current) {
        const count = paperRef.current.querySelectorAll('.bm-fill-blank, [contenteditable]').length;
        setFieldCount(count);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [contentHtml, resetVersion]);

  // Phím tắt Ctrl+P để in và Escape để đóng
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Tự động lưu nháp khi người dùng gõ chữ
  const handleContentInput = () => {
    if (!paperRef.current || !formItem) return;
    const currentHtml = serializeForm(paperRef.current);
    const success = saveFormDraft(formItem.code, currentHtml);
    setFieldCount(paperRef.current.querySelectorAll('[contenteditable]').length);
    if (success) {
      const nowStr = new Date().toLocaleTimeString('vi-VN');
      setSaveStatus(`Đã lưu vào trình duyệt lúc ${nowStr}`);
      setHasDraft(true);
    } else {
      setSaveStatus('Không thể lưu tự động');
    }
  };

  // In biểu mẫu
  const handlePrint = async () => {
    if (!paperRef.current) return;
    handleContentInput();
    try {
      await printFormDocument(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Biểu mẫu CAND</title><style>${formStyles}</style></head><body><div class="bm-a4-paper font14 ta_jus">${serializeForm(paperRef.current)}</div></body></html>`);
    } catch (err) { setSaveStatus(err.message); }
  };

  // Tải file Word (.doc)
  const handleExportWord = () => {
    if (!paperRef.current || !formItem) return;
    const title = `${formItem.code}_${formItem.name}`;
    exportToWord(title, serializeForm(paperRef.current).replace(/<input[^>]*data-bm-action[^>]*>/gi, ''));
  };

  // Xóa bản nháp để quay về mẫu trắng
  const handleResetDraft = () => {
    if (!formItem) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa dữ liệu đã điền và quay về mẫu trắng ban đầu?')) {
      clearFormDraft(formItem.code);
      setHasDraft(false);
      setSaveStatus('');
      setResetVersion(version => version + 1);

      if (formItem.htmlPath) {
        setLoading(true);
        fetch(formItem.htmlPath)
          .then(res => res.text())
          .then(rawHtml => {
            setContentHtml(transformDottedToInputs(rawHtml));
            setLoading(false);
          });
      } else if (formItem.customHtml) {
        setContentHtml(transformDottedToInputs(formItem.customHtml));
      }
    }
  };

  // Tự động tạo bản mẫu đánh máy tương đương cho biểu mẫu vốn chỉ có bản viết tay
  const handleCreateTemplateDraft = () => {
    if (!formItem) return;
    const templateHtml = `
      <div class="wrapper border font14 ta_jus">
        <div class="header">
          <div class="cq_banhanh f_left ta_center font12" style="margin-top:3px">
            <span class="border font12 co_quan bm-fill-blank" contenteditable="true" data-placeholder="[Tên Cơ quan cấp trên]..."></span><br>
            <span class="border fontBold font12 co_quan bm-fill-blank" contenteditable="true" data-placeholder="[Tên Đơn vị trực tiếp]..."></span><br>
            Số: <span class="o_nhap_2cm ta_left border bm-fill-blank" contenteditable="true" data-placeholder=".../..."></span>
          </div>
          <div class="quochieu ta_center f_left">
            <span class="fontUpper fontBold font13">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
            <span class="fontBold font14">Độc lập - Tự do - Hạnh phúc</span>
            <hr style="width: 5cm; margin-top: 2px; height: 1px; color: black; background-color: black; border: none;">
          </div>
          <div class="td_bieumau ta_center f_right lh_06">
            <span class="font8">MẪU ${formItem.code}</span><br>
            <span class="font8">BH theo quy định BCA</span><br>
          </div>
          <div class="time_header font_I" style="clear: both; text-align: right; margin-top: 10px;">
            <span class="dia_danh border bm-fill-blank" contenteditable="true" data-placeholder="Địa danh..."></span>, ngày <span class="o_nhap_ngay border bm-fill-blank" contenteditable="true" data-placeholder="..ngày.."></span> tháng <span class="o_nhap_thang border bm-fill-blank" contenteditable="true" data-placeholder="..tháng.."></span> năm <span class="o_nhap_nam border bm-fill-blank" contenteditable="true" data-placeholder="..năm.."></span>
          </div>
        </div>

        <div class="content ta_center fontBold font14" style="margin-top: 30px; margin-bottom: 25px;">
          <h2 style="font-size: 16pt; margin: 0 0 8px; text-transform: uppercase;">${formItem.name}</h2>
          <div style="font-size: 13pt; font-weight: normal; font-style: italic;">(Ban hành kèm theo quy định về hồ sơ nghiệp vụ CAND)</div>
        </div>

        <div class="main-body" style="line-height: 1.6; font-size: 14pt;">
          <div style="margin-bottom: 14px;">
            Kính gửi: <span class="o_nhap_4cm border bm-fill-blank" contenteditable="true" data-placeholder="Nhập nơi nhận báo cáo..."></span>
          </div>
          <p style="margin-bottom: 14px;">
            Họ và tên cán bộ: <span class="o_nhap_3cm border bm-fill-blank" contenteditable="true" data-placeholder="Nhập họ và tên cán bộ..."></span>
            &nbsp;&nbsp;&nbsp;&nbsp;Cấp bậc: <span class="o_nhap_1cm border bm-fill-blank" contenteditable="true" data-placeholder="Cấp bậc..."></span>
            &nbsp;&nbsp;&nbsp;&nbsp;Chức vụ: <span class="o_nhap_2cm border bm-fill-blank" contenteditable="true" data-placeholder="Chức vụ..."></span>
          </p>
          <p style="margin-bottom: 14px;">
            Đơn vị công tác: <span class="o_nhap_3cm border bm-fill-blank" contenteditable="true" data-placeholder="Nhập đơn vị..."></span>
          </p>
          <div style="margin-bottom: 14px;">
            <strong>Nội dung nghiệp vụ:</strong>
            <div class="o_nhap_n_dong border bm-fill-blank" contenteditable="true" style="min-height: 140px; margin-top: 8px; padding: 10px;" data-placeholder="Nhập chi tiết nội dung văn bản nghiệp vụ tại đây..."></div>
          </div>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
              <strong>CÁN BỘ LẬP</strong><br>
              <em>(Ký, ghi rõ họ tên)</em>
              <div style="height: 60px;"></div>
              <span class="bm-fill-blank" contenteditable="true" data-placeholder="[Họ và tên cán bộ]"></span>
            </div>
            <div style="text-align: center; width: 45%;">
              <strong>CHỈ HUY PHÊ DUYỆT</strong><br>
              <em>(Ký, ghi rõ họ tên, chức vụ)</em>
              <div style="height: 60px;"></div>
              <span class="bm-fill-blank" contenteditable="true" data-placeholder="[Họ và tên chỉ huy]"></span>
            </div>
          </div>
        </div>
      </div>
    `;
    const transformed = transformDottedToInputs(templateHtml);
    setContentHtml(transformed);
    setHasDraft(true);
    saveFormDraft(formItem.code, transformed);
  };

  const isHandwritingOnlyMode = !formItem.htmlPath && !formItem.customHtml && !!formItem.pdfPath && !contentHtml;

  return (
    <FormModalShell><div className="bm-modal-overlay" role="dialog" aria-modal="true" aria-label="Soạn thảo biểu mẫu CAND">
      {/* THANH CÔNG CỤ ĐỈNH (TOP TOOLBAR) */}
      <div className="bm-top-toolbar no-print">
        <div className="bm-toolbar-title">
          <span className="bm-badge-code">MẪU {formItem.code}</span>
          <span className="bm-title-text" title={formItem.name}>
            {formItem.name}
          </span>
          {fieldCount > 0 && !isHandwritingOnlyMode && (
            <span
              style={{
                fontSize: '11.5px',
                background: '#1E3A8A',
                color: '#93C5FD',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}
              title={`Biểu mẫu có ${fieldCount} vị trí có thể nhập liệu`}
            >
              {fieldCount} ô điền
            </span>
          )}
        </div>

        <div className="bm-toolbar-actions">
          {saveStatus && !isHandwritingOnlyMode && (
            <div className="bm-save-status">
              <CheckCircle2 size={15} color="#86EFAC" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Nút bật/tắt làm nổi bật ô điền (chỉ hiện khi có nội dung soạn thảo) */}
          {!isHandwritingOnlyMode && (
            <button
              type="button"
              className={`bm-btn ${highlightFields ? 'bm-btn-toggle-active' : 'bm-btn-secondary'}`}
              onClick={() => setHighlightFields(prev => !prev)}
              title={highlightFields ? 'Đang bật viền xanh nổi bật ô điền. Bấm để xem dạng trang in như thật.' : 'Đang ở chế độ xem chuẩn. Bấm để làm nổi bật lại các ô điền.'}
            >
              {highlightFields ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{highlightFields ? 'Hiện ô điền' : 'Xem như thật'}</span>
            </button>
          )}

          {/* Điều chỉnh độ thu phóng Zoom (khi ở chế độ soạn thảo A4) */}
          {!isHandwritingOnlyMode && (
            <div className="bm-zoom-controls" title="Điều chỉnh tỉ lệ hiển thị khổ giấy A4">
              <button
                type="button"
                className="bm-zoom-btn"
                onClick={() => setZoom(z => Math.max(70, z - 10))}
                disabled={zoom <= 70}
                title="Thu nhỏ"
              >
                -
              </button>
              <span className="bm-zoom-label">{zoom}%</span>
              <button
                type="button"
                className="bm-zoom-btn"
                onClick={() => setZoom(z => Math.min(130, z + 10))}
                disabled={zoom >= 130}
                title="Phóng to"
              >
                +
              </button>
            </div>
          )}

          {/* Nút In biểu mẫu */}
          {!isHandwritingOnlyMode && (
            <button
              type="button"
              className="bm-btn bm-btn-print"
              onClick={handlePrint}
              title="In biểu mẫu trực tiếp ra máy in hoặc lưu PDF (Ctrl+P)"
            >
              <Printer size={16} />
              <span>In (Ctrl+P)</span>
            </button>
          )}

          {/* Nút Tải file Word (.doc) khi đang ở chế độ soạn thảo văn bản */}
          {!isHandwritingOnlyMode && (
            <button
              type="button"
              className="bm-btn bm-btn-word"
              onClick={handleExportWord}
              title="Tải biểu mẫu đã điền về máy dưới dạng tệp Microsoft Word (.doc)"
            >
              <FileDown size={16} />
              <span>Tải Word</span>
            </button>
          )}

          {/* Nút Mở PDF viết tay ra trang mới của trình duyệt */}
          {formItem.pdfPath && (
            <a
              href={formItem.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className={`bm-btn ${isHandwritingOnlyMode ? 'bm-btn-purple' : 'bm-btn-secondary'}`}
              style={{ textDecoration: 'none' }}
              title="Mở tệp PDF bản viết tay ra trang mới của trình duyệt (không mở popup)"
            >
              <ExternalLink size={16} />
              <span>Mở PDF viết tay (Trang mới)</span>
            </a>
          )}

          {/* Nút Xóa dữ liệu đã điền */}
          {hasDraft && !isHandwritingOnlyMode && (
            <button
              type="button"
              className="bm-btn bm-btn-secondary"
              onClick={handleResetDraft}
              title="Xóa dữ liệu đã lưu và quay về biểu mẫu trắng ban đầu"
            >
              <RotateCcw size={15} />
              <span>Xóa nháp</span>
            </button>
          )}

          {/* Nút Đóng */}
          <button
            type="button"
            className="bm-btn bm-btn-close"
            onClick={onClose}
            title="Đóng cửa sổ soạn thảo (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* BANNER GỢI Ý CHUYỂN SANG MẪU CHUẨN CAND TƯƠNG ỨNG (NẾU CÓ) */}
      {formItem.matchedForm && (
        <div style={{
          background: 'linear-gradient(90deg, #1E3A8A 0%, #1E40AF 100%)',
          color: '#FFFFFF',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#93C5FD" />
            <span>
              Phát hiện biểu mẫu chuẩn CAND tương ứng: <strong>Mẫu {formItem.matchedForm.code} - {formItem.matchedForm.name}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetch(formItem.matchedForm.htmlPath)
                .then(res => res.text())
                .then(rawHtml => {
                  setContentHtml(transformDottedToInputs(rawHtml));
                  setLoading(false);
                })
                .catch(() => setLoading(false));
            }}
            style={{
              background: '#F59E0B',
              color: '#1E293B',
              fontWeight: 700,
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Edit3 size={14} />
            <span>Chuyển sang bản Điền máy chuẩn CAND</span>
          </button>
        </div>
      )}

      {/* VÙNG SOẠN THẢO TRANG A4 HOẶC THÔNG BÁO MẪU VIẾT TAY */}
      <div className="bm-editor-scroll-area">
        {loading && (
          <div style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '60px' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang nạp dữ liệu biểu mẫu nghiệp vụ CAND...</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '18px 24px', color: '#991B1B', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {isHandwritingOnlyMode && (
          <div className="bm-handwriting-container">
            <div className="bm-handwriting-card">
              <div className="bm-handwriting-icon">
                <FileText size={32} color="#7C3AED" />
              </div>
              <h3>MẪU {formItem.code}: {formItem.name}</h3>
              <div className="bm-handwriting-badge">ĐẶC THÙ NGHIỆP VỤ: CHỈ SỬ DỤNG BẢN VIẾT TAY (PDF)</div>
              <p>
                Theo quy định của Bộ Công an về công tác hồ sơ nghiệp vụ CAND, biểu mẫu này bắt buộc phải in từ bản chuẩn PDF và <strong>viết tay bằng bút mực</strong> (hoặc ký trực tiếp) để đảm bảo giá trị pháp lý, không sử dụng bản đánh máy sẵn.
              </p>
              <div className="bm-handwriting-actions">
                <a
                  href={formItem.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bm-btn bm-btn-purple"
                  style={{ textDecoration: 'none' }}
                  title="Mở trực tiếp tệp PDF ra trang mới để xem và in ấn (không mở popup)"
                >
                  <ExternalLink size={16} />
                  <span>Mở bản PDF viết tay (Trang mới)</span>
                </a>
                <a
                  className="bm-btn bm-btn-secondary"
                  href={formItem.pdfPath}
                  download={`${formItem.code}_${formItem.name}.pdf`}
                  style={{ textDecoration: 'none' }}
                  title="Tải tệp PDF mẫu trắng về máy tính"
                >
                  <FileDown size={16} />
                  <span>Tải file PDF về máy</span>
                </a>
                <button
                  type="button"
                  className="bm-btn bm-btn-secondary"
                  onClick={handleCreateTemplateDraft}
                  title="Tự động tạo mẫu văn bản tương đương có các ô điền để gõ chữ trên máy tính"
                >
                  <Edit3 size={16} />
                  <span>Tự tạo bản soạn thảo máy</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !isHandwritingOnlyMode && (
          <div
            className="bm-a4-wrapper-container"
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
              transformOrigin: 'top center'
            }}
          >
            <div
              id="bieumau-print-area"
              key={resetVersion}
              className={`bm-a4-paper font14 ta_jus ${!highlightFields ? 'bm-hide-highlights' : ''}`}
              ref={paperRef}
              onInput={handleContentInput}
              onChange={handleContentInput}
              onSubmit={event => event.preventDefault()}
              onClick={event => {
                if (event.target.closest('a')) event.preventDefault();
                const button = event.target.closest('[data-bm-action]');
                if (button) {
                  event.preventDefault();
                  if (handleFormTableAction(paperRef.current, button)) handleContentInput();
                }
              }}
              onPaste={event => {
                if (!event.target.closest('[contenteditable]')) return;
                event.preventDefault();
                document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
              }}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        )}
      </div>
    </div></FormModalShell>
  );
}
