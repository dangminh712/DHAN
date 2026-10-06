// client/src/pages/BieuMauPage.jsx
import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  FileDown,
  Edit3,
  BookOpen,
  Shield,
  Layers,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  FolderOpen,
  ExternalLink,
  X,
  Loader2
} from 'lucide-react';
import {
  BIEU_MAU_BRANCHES,
  BIEU_MAU_CATEGORIES,
  BIEU_MAU_CATALOG,
  TTHD_DOCUMENTS,
  searchBieuMau
} from '../data/bieuMauCatalog';
import FormEditorModal from '../components/bieumau/FormEditorModal';
import PdfFormEditorModal from '../components/bieumau/PdfFormEditorModal';
import FormModalShell from '../components/bieumau/FormModalShell';
import { parseDocumentForm, findMatchingHtmlForPdf, convertPdfToEditableHtml } from '../utils/documentFormParser';
import { getDraftKey } from '../utils/bieuMauEngine';
import '../styles/bieumau.css';

export default function BieuMauPage() {
  const [branch, setBranch] = useState('HSAN'); // 'HSAN' | 'HSCS' | 'TTHD'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  // Modal soạn thảo biểu mẫu đánh máy
  const [activeForm, setActiveForm] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Modal xem trực tiếp tệp PDF tải lên từ máy tính
  const [externalPdf, setExternalPdf] = useState(null);

  // Trạng thái đang chuyển đổi PDF → bản đánh máy
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const conversionVersion = useRef(0);
  useEffect(() => () => { conversionVersion.current += 1; }, []);
  useEffect(() => {
    const url = externalPdf?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [externalPdf?.url]);

  // Lọc danh mục biểu mẫu
  const filteredForms = branch === 'TTHD' ? [] : searchBieuMau(deferredSearch, branch, selectedCategory);

  // Lọc danh mục TTHD
  const filteredTthd = (TTHD_DOCUMENTS || []).filter(doc => {
    if (!deferredSearch.trim()) return true;
    const q = deferredSearch.toLowerCase();
    return doc.code.toLowerCase().includes(q) || doc.title.toLowerCase().includes(q);
  });

  // Mở trình soạn thảo điền máy
  const handleOpenFillForm = (item) => {
    setActiveForm(item);
    setIsEditorOpen(true);
  };

  const closeExternalPdf = () => {
    conversionVersion.current += 1;
    setPdfConverting(false);
    setExternalPdf(null);
  };

  // Mở xem PDF viết tay ra tab mới (không dùng popup)
  const handleOpenPdf = (item) => {
    const url = item?.pdfPath || item?.fileUrl;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Chuyển đổi PDF thành bản đánh máy (editable HTML) giữ nguyên cấu trúc
  const handleConvertPdfToTyped = async (pdfSource) => {
    if (!pdfSource || pdfConverting) return;
    const version = ++conversionVersion.current;
    setPdfConverting(true);
    setPdfProgress('Đang đọc PDF...');
    try {
      const htmlContent = await convertPdfToEditableHtml(pdfSource.file || pdfSource,
        (page, total) => { if (version === conversionVersion.current) setPdfProgress(`Đang tạo trang ${page}/${total}...`); });
      if (version !== conversionVersion.current) return;
      const title = pdfSource.name
        ? pdfSource.name.replace(/\.pdf$/i, '')
        : 'Biểu mẫu PDF';

      setActiveForm({
        code: title,
        name: pdfSource.name || 'Biểu mẫu PDF',
        customHtml: htmlContent,
        isPdfLayout: true,
        pdfFingerprint: htmlContent.match(/data-pdf-fingerprint="([^"]+)"/)?.[1],
        isCustom: true
      });
      setIsEditorOpen(true);

      // Đóng modal PDF viewer
      setExternalPdf(null);
    } catch (err) {
      if (version !== conversionVersion.current) return;
      console.error('Lỗi chuyển đổi PDF sang bản đánh máy:', err);
      alert('Không thể chuyển đổi PDF: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      if (version === conversionVersion.current) setPdfConverting(false);
    }
  };

  // Xử lý kéo thả hoặc chọn tệp Word/PDF/HTML từ bên ngoài
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name || '';
    const ext = fileName.split('.').pop().toLowerCase();

    // 1. Tệp PDF: Mở ngay trong Trình xem PDF toàn màn hình (không bao giờ bị trình duyệt chặn popup hay đứng im)
    if (ext === 'pdf') {
      try {
        const fileUrl = URL.createObjectURL(file);
        const matched = findMatchingHtmlForPdf(fileName, BIEU_MAU_CATALOG);
        setExternalPdf({
          file,
          name: fileName,
          url: fileUrl,
          matched
        });
      } catch (err) {
        console.error('Lỗi mở PDF:', err);
        alert('Không thể mở tệp PDF: ' + (err.message || 'Lỗi không xác định'));
      } finally {
        e.target.value = '';
      }
      return;
    }

    // 2. Tệp Word (.doc, .docx) hoặc .html: Phân tích nội dung và mở trong Trình soạn thảo FormEditorModal
    try {
      const parsed = await parseDocumentForm(file);
      const matched = findMatchingHtmlForPdf(fileName, BIEU_MAU_CATALOG);

      setActiveForm({
        code: matched ? matched.code : parsed.title,
        name: file.name,
        customHtml: parsed.htmlContent,
        isPdfLayout: parsed.isPdfLayout,
        pdfFingerprint: parsed.pdfFingerprint,
        fromSavedLayout: parsed.fromSavedLayout,
        matchedForm: matched || null,
        isCustom: true
      });
      setIsEditorOpen(true);
    } catch (err) {
      console.error('Lỗi mở tệp Word/HTML:', err);
      alert(err.message || 'Không thể đọc tệp tin. Vui lòng kiểm tra lại định dạng tệp (.doc, .docx, .html).');
    } finally {
      e.target.value = '';
    }
  };

  // Kiểm tra xem biểu mẫu có bản nháp trong localStorage không
  const hasLocalDraft = (formCode) => {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return Boolean(window.localStorage.getItem(getDraftKey(formCode)));
  };

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '50px' }}>
      <div className="dvc-tabs-container">
        {/* BANNER ĐỈNH PHÂN HỆ BIỂU MẪU CAND */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #CBD5E1',
          background: 'linear-gradient(135deg, #0B1E36 0%, #881337 50%, #991B1B 100%)',
          color: '#FFFFFF',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ background: '#A31A1A', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={26} color="#FFFFFF" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '0.3px' }}>
                  HỆ THỐNG BIỂU MẪU HỒ SƠ NGHIỆP VỤ CÔNG AN NHÂN DÂN
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
                  Tra cứu, điền biểu mẫu điện tử trực tuyến, in chuẩn A4 CAND, tải file Word và tham khảo mẫu viết tay
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Mở tệp biểu mẫu cá nhân dạng .doc, .docx, .html hoặc .pdf để điền online"
            >
              <Upload size={16} />
              <span>Mở tệp ngoài (.doc/.pdf)</span>
              <input
                type="file"
                accept=".doc,.docx,.pdf,.html,.htm"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* THANH ĐIỀU HƯỚNG 3 PHÂN HỆ */}
        <div style={{ padding: '16px 24px 0' }}>
          <div className="home-segment-selector">
            <button
              className={`home-segment-btn ${branch === 'HSAN' ? 'active' : ''}`}
              onClick={() => { setBranch('HSAN'); setSelectedCategory('ALL'); }}
            >
              <Shield size={18} />
              <span>1. HỒ SƠ AN NINH NHÂN DÂN (HSAN)</span>
              <span className="segment-badge">
                {BIEU_MAU_CATALOG.filter(c => c.branch === 'HSAN').length} Biểu mẫu
              </span>
            </button>

            <button
              className={`home-segment-btn ${branch === 'HSCS' ? 'active' : ''}`}
              onClick={() => { setBranch('HSCS'); setSelectedCategory('ALL'); }}
            >
              <Layers size={18} />
              <span>2. HỒ SƠ CẢNH SÁT NHÂN DÂN (HSCS)</span>
              <span className="segment-badge">
                {BIEU_MAU_CATALOG.filter(c => c.branch === 'HSCS').length} Biểu mẫu
              </span>
            </button>

            <button
              className={`home-segment-btn ${branch === 'TTHD' ? 'active' : ''}`}
              onClick={() => setBranch('TTHD')}
            >
              <BookOpen size={18} />
              <span>3. VĂN BẢN & HƯỚNG DẪN NGHIỆP VỤ (TTHD)</span>
              <span className="segment-badge">
                {TTHD_DOCUMENTS.length} Tài liệu
              </span>
            </button>
          </div>
        </div>

        {/* BỘ LỌC THEO NHÓM HỒ SƠ (CHO HSAN & HSCS) */}
        {branch !== 'TTHD' && (
          <div style={{ margin: '0 24px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0B1E36', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={15} />
              Lọc theo Loại Hồ Sơ Nghiệp Vụ:
            </div>
            <div className="dept-pills-row">
              {BIEU_MAU_CATEGORIES.filter(cat => cat.branch === 'ALL' || cat.branch === branch).map(cat => (
                <button
                  key={cat.key}
                  className={`dept-pill ${selectedCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* THANH TÌM KIẾM BIỂU MẪU */}
        <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã số (B1, B20, B27a...) hoặc tên biểu mẫu nghiệp vụ..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                outline: 'none',
                background: '#FFFFFF'
              }}
            />
          </div>
          <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
            {branch === 'TTHD'
              ? `${filteredTthd.length} tài liệu`
              : `${filteredForms.length} biểu mẫu`}
          </div>
        </div>

        {/* NỘI DUNG DANH SÁCH BIỂU MẪU */}
        <div style={{ padding: '0 24px 24px' }}>
          {branch === 'TTHD' ? (
            /* DANH SÁCH VĂN BẢN HƯỚNG DẪN TTHD */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
              {filteredTthd.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ background: '#FEF2F2', padding: '6px', borderRadius: '6px', color: '#B91C1C' }}>
                        <FileText size={20} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px' }}>
                        {doc.code}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0B1E36', margin: '0 0 6px', lineHeight: 1.4 }}>
                      {doc.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <a
                      href={doc.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action-view"
                      style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      title="Mở tài liệu PDF ra trang mới (tab mới) của trình duyệt"
                    >
                      <ExternalLink size={14} />
                      <span>Mở trang mới</span>
                    </a>
                    <a
                      href={doc.pdfPath}
                      download={doc.fileName}
                      className="btn-action-secondary"
                      style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}
                      title="Tải tệp PDF về máy tính"
                    >
                      <Download size={14} />
                      <span>Tải về</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DANH SÁCH BIỂU MẪU ĐIỀN MÁY / VIẾT TAY */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
              {filteredForms.map(item => {
                const hasDraft = hasLocalDraft(item.code);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      border: hasDraft ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'border-color 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, background: '#991B1B', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px' }}>
                            MẪU {item.code}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.categoryKey}
                          </span>
                        </div>
                        {item.isHandwritingOnly ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #DDD6FE' }} title="Biểu mẫu này theo quy định CAND chỉ ban hành bản PDF để in ra viết tay bằng bút mực">
                            ✍️ Bản viết tay
                          </span>
                        ) : (
                          hasDraft && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }} title="Có bản nháp đang lưu trên trình duyệt này">
                              <CheckCircle2 size={13} color="#D97706" />
                              Đang có nháp
                            </span>
                          )
                        )}
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0B1E36', margin: '0 0 6px', lineHeight: 1.45 }}>
                        {item.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                        {item.categoryName}
                      </p>
                    </div>

                    {item.isHandwritingOnly ? (
                      /* HÀNH ĐỘNG CHO BIỂU MẪU CHỈ CÓ BẢN VIẾT TAY (PDF) */
                      <div className="bieu-mau-card-actions">
                        <a
                          href={item.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            border: '1px solid #5B21B6',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(109,40,217,0.25)',
                            textDecoration: 'none',
                            userSelect: 'none'
                          }}
                          title="Mở trực tiếp tệp PDF ra trang mới để xem và in ấn (không mở popup)"
                        >
                          <ExternalLink size={14} />
                          <span>Mở bản viết tay (Trang mới)</span>
                        </a>

                        <a
                          href={item.pdfPath}
                          download={`${item.code}_${item.name}.pdf`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#0F172A',
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            textDecoration: 'none',
                            userSelect: 'none'
                          }}
                          title="Tải tệp PDF mẫu trắng về máy"
                        >
                          <Download size={14} />
                          <span>Tải PDF</span>
                        </a>
                      </div>
                    ) : (
                      /* HÀNH ĐỘNG CHO BIỂU MẪU CÓ ĐÁNH MÁY TRỰC TUYẾN */
                      <div className="bieu-mau-card-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenFillForm(item)}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)',
                            border: '1px solid #1D4ED8',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(30,64,175,0.2)',
                            userSelect: 'none',
                            touchAction: 'manipulation'
                          }}
                          title="Điền biểu mẫu trực tuyến, tự động lưu và in ấn"
                        >
                          <Edit3 size={14} />
                          <span>Viết máy (Điền online)</span>
                        </button>

                        {item.pdfPath && (
                          <a
                            href={item.pdfPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '7px 12px',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: '#0F172A',
                              background: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              cursor: 'pointer',
                              textDecoration: 'none',
                              userSelect: 'none'
                            }}
                            title="Mở mẫu trắng PDF ra trang mới để in ra viết tay bằng bút mực"
                          >
                            <ExternalLink size={14} color="#DC2626" />
                            <span>Viết tay (PDF)</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {branch !== 'TTHD' && filteredForms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <FileText size={48} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
              <h3 style={{ margin: '0 0 6px', color: '#0F172A' }}>Không tìm thấy biểu mẫu phù hợp</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Thử tìm kiếm với từ khóa khác hoặc chọn nhóm hồ sơ khác.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SOẠN THẢO VÀ ĐIỀN BIỂU MẪU ĐÁNH MÁY */}
      {isEditorOpen && activeForm && (
        activeForm.isPdfLayout ? <PdfFormEditorModal formItem={activeForm} onClose={() => setIsEditorOpen(false)} /> : <FormEditorModal
          isOpen={isEditorOpen}
          onClose={() => { setIsEditorOpen(false); setActiveForm(null); }}
          formItem={activeForm}
          onOpenPdf={handleOpenPdf}
        />
      )}

      {/* MODAL XEM TRỰC TIẾP TỆP PDF TẢI LÊN TỪ MÁY TÍNH (KHÔNG BỊ CHẶN POPUP) */}
      {externalPdf && (
        <FormModalShell><div
          role="dialog" aria-modal="true" aria-label="Xem PDF tải lên"
          onKeyDown={event => { if (event.key === 'Escape') closeExternalPdf(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Thanh tiêu đề & điều khiển đỉnh */}
          <div
            style={{
              height: '56px',
              backgroundColor: '#0B1E36',
              borderBottom: '1px solid #1E293B',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              color: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <span style={{
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px',
                flexShrink: 0
              }}>
                PDF NGOÀI
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '450px'
              }} title={externalPdf.name}>
                {externalPdf.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* NÚT TẠO BẢN ĐÁNH MÁY TỪ PDF (tính năng chính) */}
              <button
                type="button"
                onClick={() => handleConvertPdfToTyped(externalPdf)}
                disabled={pdfConverting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: pdfConverting
                    ? 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: pdfConverting ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="Chuyển đổi PDF thành bản đánh máy có thể chỉnh sửa, giữ nguyên cấu trúc văn bản gốc"
              >
                {pdfConverting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{pdfProgress}</span>
                  </>
                ) : (
                  <>
                    <Edit3 size={16} />
                    <span>📝 Tạo bản đánh máy</span>
                  </>
                )}
              </button>

              {/* Nút gợi ý chuyển sang bản điền máy nếu tìm thấy mã CAND tương ứng */}
              {externalPdf.matched && externalPdf.matched.htmlPath && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenFillForm(externalPdf.matched);
                    closeExternalPdf();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: '#F59E0B',
                    color: '#0F172A',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Tìm thấy biểu mẫu đánh máy tương ứng trong kho CAND, bấm để mở bản điền máy"
                >
                  <Edit3 size={15} />
                  <span>Điền máy (Mẫu {externalPdf.matched.code})</span>
                </button>
              )}

              {/* Nút tải về máy */}
              <a
                href={externalPdf.url}
                download={externalPdf.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                title="Tải tệp PDF về máy tính"
              >
                <Download size={15} />
                <span>Tải về</span>
              </a>

              {/* Nút đóng */}
              <button
                type="button"
                onClick={closeExternalPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
                title="Đóng cửa sổ xem PDF (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Vùng hiển thị PDF nhúng trực tiếp bằng <object> và <embed> */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 56px)', background: '#525659' }}>
            <object
              data={externalPdf.url}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ width: '100%', height: '100%', border: 'none' }}
            >
              <embed
                src={externalPdf.url}
                type="application/pdf"
                width="100%"
                height="100%"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </object>
          </div>
        </div></FormModalShell>
      )}
    </main>
  );
}
