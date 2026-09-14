import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  FolderKanban,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  FileQuestion,
  Filter,
  Search,
  Clock,
  Hash,
  Copy,
  Check,
  Play,
  Download,
  Eye,
  ExternalLink,
  Award,
  ShieldCheck,
  CheckCircle2,
  User,
  Shield,
  Globe
} from 'lucide-react';

export default function StudentPortalPage({
  files,
  loading,
  search,
  setSearch,
  category,
  setCategory,
  selectedDept,
  setSelectedDept,
  academicUnits,
  currentUser,
  onSearch,
  onCopyHash,
  copiedHash,
  onSelectFile,
  lectures = []
}) {
  const [studentTab, setStudentTab] = useState('courses'); // 'courses' | 'documents'
  const [scopeFilter, setScopeFilter] = useState('ALL'); // 'ALL' | 'MY_CLASS' | 'PUBLIC'
  const [documentClassificationFilter, setDocumentClassificationFilter] = useState('ALL');

  const studentClass = currentUser?.className || (currentUser?.assignedClasses && currentUser.assignedClasses[0]) || '';

  // Requirement 5: Học viên chỉ thấy được những bài giảng của lớp mình hoặc được công khai
  const allowedLectures = (lectures || []).filter(lec => {
    if (currentUser?.role && currentUser.role !== 'STUDENT') return true;
    const isPub = lec.isPublicAll || !lec.assignedClasses || lec.assignedClasses.length === 0;
    const isClass = Boolean(
      studentClass && lec.assignedClasses &&
      lec.assignedClasses.some(c => c.toLowerCase() === studentClass.toLowerCase())
    );
    return isPub || isClass;
  });

  const filteredLectures = allowedLectures.filter(lec => {
    const isPub = lec.isPublicAll || !lec.assignedClasses || lec.assignedClasses.length === 0;
    const isClass = Boolean(
      studentClass && lec.assignedClasses &&
      lec.assignedClasses.some(c => c.toLowerCase() === studentClass.toLowerCase())
    );

    if (scopeFilter === 'MY_CLASS' && !isClass) return false;
    if (scopeFilter === 'PUBLIC' && !isPub) return false;

    const code = lec.subjectCode || lec.code || '';
    const lecturer = lec.teacherName || lec.lecturer || '';
    const dept = lec.departmentName || lec.subject || '';
    const matchesSearch = !search ||
      (lec.title && lec.title.toLowerCase().includes(search.toLowerCase())) ||
      (code && code.toLowerCase().includes(search.toLowerCase())) ||
      (lecturer && lecturer.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept === 'all' ||
      lec.departmentId === selectedDept ||
      (dept && dept.toLowerCase().includes(selectedDept.toLowerCase())) ||
      (code && code.toLowerCase().includes(selectedDept.toLowerCase()));
    return matchesSearch && matchesDept;
  });

  const myClassCount = allowedLectures.filter(lec =>
    Boolean(studentClass && lec.assignedClasses && lec.assignedClasses.some(c => c.toLowerCase() === studentClass.toLowerCase()))
  ).length;

  const publicCount = allowedLectures.filter(lec =>
    lec.isPublicAll || !lec.assignedClasses || lec.assignedClasses.length === 0
  ).length;

  const filteredFiles = files.filter(f => {
    const matchesSearch = !search ||
      (f.originalFileName && f.originalFileName.toLowerCase().includes(search.toLowerCase())) ||
      (f.checksum && f.checksum.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'all' || f.category === category;

    let matchesClass = true;
    if (documentClassificationFilter !== 'ALL') {
      const cName = (f.classification || f.classificationName || '').toLowerCase();
      if (documentClassificationFilter === 'TUYET_MAT') matchesClass = cName.includes('tuyệt mật');
      else if (documentClassificationFilter === 'TOI_MAT') matchesClass = cName.includes('tối mật');
      else if (documentClassificationFilter === 'MAT') matchesClass = cName.includes('mật') && !cName.includes('tuyệt') && !cName.includes('tối');
      else if (documentClassificationFilter === 'NOI_BO') matchesClass = cName.includes('nội bộ');
      else if (documentClassificationFilter === 'CONG_KHAI') matchesClass = cName.includes('công khai');
    }

    return matchesSearch && matchesCategory && matchesClass;
  });

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="dvc-tabs-container">
        {/* BANNER CHÀO MỪNG HỌC VIÊN */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #0B1E36 0%, #1E3A8A 100%)',
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
                <GraduationCap size={26} color="#FFFFFF" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  CỔNG HỌC TẬP VÀ TRA CỨU HỌC PHẦN DÀNH CHO HỌC VIÊN
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>
                  Học viên đang đăng nhập: <strong style={{ color: '#FEF08A' }}>{currentUser?.fullName || 'Học viên Sĩ quan'}</strong> •
                  Lớp: <strong style={{ color: '#93C5FD' }}>{studentClass || 'Học viên T04'}</strong> •
                  Cấp độ truy cập: <span style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{currentUser?.maxClearance || 'Lưu hành nội bộ'}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} color="#86EFAC" />
              Học liệu Lưu hành Nội bộ T04
            </span>
          </div>
        </div>

        {/* THANH ĐIỀU HƯỚNG PHÂN HỆ HỌC TẬP */}
        <div style={{ padding: '16px 24px 0' }}>
          <div className="home-segment-selector">
            <button
              className={`home-segment-btn ${studentTab === 'courses' ? 'active' : ''}`}
              onClick={() => setStudentTab('courses')}
            >
              <Layers size={18} />
              <span>1. BÀI GIẢNG ĐIỆN TỬ TÍCH HỢP (VÀO HỌC BÀI GIẢNG)</span>
              <span className="segment-badge">{allowedLectures.length} Bài giảng</span>
            </button>

            <button
              className={`home-segment-btn ${studentTab === 'documents' ? 'active' : ''}`}
              onClick={() => setStudentTab('documents')}
            >
              <FolderKanban size={18} />
              <span>2. KHO GIÁO TRÌNH & TÀI LIỆU SỐ (XEM TRỰC TIẾP)</span>
              <span className="segment-badge">{filteredFiles.length} Tài liệu</span>
            </button>
          </div>
        </div>

        {/* PHẦN LỌC THEO KHOA */}
        <div className="departments-section" style={{ margin: '0 24px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px' }}>
          <div className="dept-header" style={{ marginBottom: '8px' }}>
            <div className="dept-title" style={{ fontSize: '13px', fontWeight: 700, color: '#0B1E36' }}>
              <FolderKanban size={15} />
              Lọc theo Khoa / Chuyên ngành đào tạo:
            </div>
          </div>
          <div className="dept-pills-row">
            <button
              className={`dept-pill ${selectedDept === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedDept('all')}
            >
              Tất cả Khoa đào tạo
            </button>
            {academicUnits.filter(u => u.unitType === 'FACULTY').map(f => (
              <button
                key={f.id}
                className={`dept-pill ${selectedDept === f.code ? 'active' : ''}`}
                onClick={() => setSelectedDept(f.code)}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: BÀI GIẢNG ĐIỆN TỬ TÍCH HỢP CHO HỌC VIÊN
           ══════════════════════════════════════════════════════════ */}
        {studentTab === 'courses' && (
          <div style={{ padding: '0 24px 24px' }}>
            {/* SCOPE FILTER TOOLBAR (Requirement 5) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #E2E8F0',
              paddingBottom: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Layers size={18} color="#A31A1A" />
                  CHƯƠNG TRÌNH HỌC PHẦN NGHIỆP VỤ AN NINH (5 PHẦN CHUẨN CAND)
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Học viên chỉ thấy bài giảng thuộc lớp của mình hoặc bài giảng công khai. Bấm <strong>"Vào học bài giảng"</strong> để theo dõi toàn bộ học liệu.
                </p>
              </div>

              {/* Scope filter buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setScopeFilter('ALL')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: scopeFilter === 'ALL' ? '#A31A1A' : '#CBD5E1',
                    background: scopeFilter === 'ALL' ? '#A31A1A' : '#FFFFFF',
                    color: scopeFilter === 'ALL' ? '#FFFFFF' : '#475569'
                  }}
                >
                  Tất cả bài giảng ({allowedLectures.length})
                </button>

                {studentClass && (
                  <button
                    onClick={() => setScopeFilter('MY_CLASS')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: scopeFilter === 'MY_CLASS' ? '#047857' : '#86EFAC',
                      background: scopeFilter === 'MY_CLASS' ? '#047857' : '#ECFDF5',
                      color: scopeFilter === 'MY_CLASS' ? '#FFFFFF' : '#065F46',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <GraduationCap size={13} />
                    <span>Lớp của tôi: {studentClass} ({myClassCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setScopeFilter('PUBLIC')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: scopeFilter === 'PUBLIC' ? '#1D4ED8' : '#93C5FD',
                    background: scopeFilter === 'PUBLIC' ? '#1D4ED8' : '#EFF6FF',
                    color: scopeFilter === 'PUBLIC' ? '#FFFFFF' : '#1E40AF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Globe size={13} />
                  <span>Công khai toàn trường ({publicCount})</span>
                </button>
              </div>
            </div>

            {filteredLectures.length === 0 ? (
              <div className="empty-state-box">
                <FileQuestion className="empty-icon" />
                <h3>Không có bài giảng phù hợp</h3>
                <p>Không tìm thấy bài giảng nào khớp với điều kiện tìm kiếm hoặc phân quyền cho lớp của bạn.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredLectures.map(lec => {
                  const isPub = lec.isPublicAll || !lec.assignedClasses || lec.assignedClasses.length === 0;
                  const isClassAssigned = Boolean(
                    studentClass && lec.assignedClasses &&
                    lec.assignedClasses.some(c => c.toLowerCase() === studentClass.toLowerCase())
                  );

                  return (
                    <div key={lec.id} style={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: '#A31A1A', color: '#fff', padding: '3px 8px', borderRadius: '4px' }}>
                            {lec.subjectCode || lec.code || `ANDT_30${lec.id}`}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#DEF7EC',
                            color: '#03543F',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            {lec.status === 'PUBLISHED' ? 'ĐANG PHÁT HÀNH' : (lec.securityLevel || 'NỘI BỘ')}
                          </span>
                        </div>

                        {/* GHI CHÚ PHẠM VI BÀI GIẢNG (Requirement 5) */}
                        <div style={{ marginBottom: '8px' }}>
                          {isClassAssigned ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#DCFCE7',
                              color: '#166534',
                              border: '1px solid #86EFAC',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              <GraduationCap size={12} />
                              <span>Dành riêng cho lớp {studentClass} ({lec.assignedClasses?.join(', ')})</span>
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#DBEAFE',
                              color: '#1E40AF',
                              border: '1px solid #93C5FD',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              <Globe size={12} />
                              <span>Bài giảng công khai toàn trường</span>
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0B1E36', lineHeight: 1.35, marginBottom: '8px' }}>
                          {lec.title}
                        </h4>

                        <p style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px', lineHeight: 1.4 }}>
                          {lec.description && lec.description.length > 110 ? lec.description.substring(0, 110) + '...' : (lec.description || 'Chương trình đào tạo nghiệp vụ chuyên sâu tại Trường Đại học An ninh nhân dân.')}
                        </p>

                        <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#334155', marginBottom: '12px' }}>
                          <div>👨‍🏫 <strong>Giảng viên:</strong> {lec.teacherName || lec.lecturer || 'Đại tá Trần Minh Quang (Trưởng Khoa ANDT)'}</div>
                          <div>🏛️ <strong>Khoa:</strong> {lec.departmentName || lec.subject || 'Khoa An ninh điều tra'}</div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                          <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            📁 {lec.files?.length || lec.fileCount || 0} Học liệu đính kèm
                          </span>
                          <span style={{ fontSize: '11px', background: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ✨ Xem được mọi học liệu của lớp
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                        <a
                          href={`#/study/${lec.id}`}
                          className="btn-view-lecture"
                          style={{
                            flex: 1,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            fontSize: '13px'
                          }}
                        >
                          <Play size={14} />
                          Vào học bài giảng
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: KHO TÀI LIỆU & GIÁO TRÌNH SỐ HÓA (XEM TRỰC TIẾP)
           ══════════════════════════════════════════════════════════ */}
        {studentTab === 'documents' && (
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #E2E8F0',
              paddingBottom: '10px',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <FolderKanban size={18} color="#A31A1A" />
                  KHO HỌC LIỆU & GIÁO TRÌNH SỐ HÓA (TRUY CẬP TRỰC TIẾP)
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Tài liệu nghiệp vụ được phân cấp bảo mật CAND. Học viên có thể xem trực tiếp bài đọc, sơ đồ, video và bài ghi âm bài giảng.
                </p>
              </div>
            </div>

            {/* THANH TÌM KIẾM TÀI LIỆU */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }} />
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '36px', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  placeholder="Tra cứu tên giáo trình, văn bản quy phạm, tài liệu PDF nghiệp vụ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* BỘ LỌC ĐỊNH DẠNG & BẢO MẬT */}
            <div className="filter-bar" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div className="format-filters">
                <button
                  className={`format-btn ${category === 'all' ? 'active' : ''}`}
                  onClick={() => setCategory('all')}
                >
                  <Filter size={14} />
                  Tất cả ({files.length})
                </button>
                <button
                  className={`format-btn ${category === 'document' ? 'active' : ''}`}
                  onClick={() => setCategory('document')}
                >
                  <FileText size={14} />
                  Giáo trình & PDF ({files.filter(f => f.category === 'document').length})
                </button>
                <button
                  className={`format-btn ${category === 'video' ? 'active' : ''}`}
                  onClick={() => setCategory('video')}
                >
                  <Video size={14} />
                  Video bài giảng ({files.filter(f => f.category === 'video').length})
                </button>
                <button
                  className={`format-btn ${category === 'image' ? 'active' : ''}`}
                  onClick={() => setCategory('image')}
                >
                  <ImageIcon size={14} />
                  Slide & Bản đồ ({files.filter(f => f.category === 'image').length})
                </button>
                <button
                  className={`format-btn ${category === 'audio' ? 'active' : ''}`}
                  onClick={() => setCategory('audio')}
                >
                  <Music size={14} />
                  Ghi âm ({files.filter(f => f.category === 'audio').length})
                </button>
              </div>

              {/* Filter by Classification (Requirement 3) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cấp bảo mật:</span>
                <select
                  value={documentClassificationFilter}
                  onChange={(e) => setDocumentClassificationFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    background: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Tất cả cấp độ</option>
                  <option value="TUYET_MAT">🔴 Tuyệt mật</option>
                  <option value="TOI_MAT">🟠 Tối mật</option>
                  <option value="MAT">🟡 Mật</option>
                  <option value="NOI_BO">🔵 Lưu hành nội bộ</option>
                  <option value="CONG_KHAI">🟢 Công khai</option>
                </select>
                <span className="result-count-badge">
                  <strong>{filteredFiles.length}</strong> tài liệu
                </span>
              </div>
            </div>

            {/* LƯỚI TÀI LIỆU DÀNH CHO HỌC VIÊN */}
            {filteredFiles.length === 0 ? (
              <div className="empty-state-box">
                <FileQuestion className="empty-icon" />
                <h3>Chưa tìm thấy tài liệu phù hợp</h3>
                <p>Không có học liệu nào khớp với từ khóa tìm kiếm. Hãy thử với từ khóa khác.</p>
              </div>
            ) : (
              <div className="lecture-grid">
                {filteredFiles.map((file) => {
                  const isVideo = file.category === 'video';
                  const isDoc = file.category === 'document';
                  const isAudio = file.category === 'audio';
                  const isImg = file.category === 'image';

                  const cName = file.classification || file.classificationName || 'Lưu hành nội bộ';
                  const isTuyetMat = cName.toLowerCase().includes('tuyệt mật');
                  const isToiMat = cName.toLowerCase().includes('tối mật');
                  const isMat = cName.toLowerCase().includes('mật') && !isTuyetMat && !isToiMat;
                  const isCongKhai = cName.toLowerCase().includes('công khai');

                  return (
                    <div key={file.id} className="lecture-card">
                      <div className="card-top-badge">
                        <span className={`type-indicator ${file.category}`}>
                          {isVideo && <Video size={13} />}
                          {isDoc && <FileText size={13} />}
                          {isAudio && <Music size={13} />}
                          {isImg && <ImageIcon size={13} />}
                          {!isVideo && !isDoc && !isAudio && !isImg && <FileQuestion size={13} />}
                          {file.category === 'video' ? 'VIDEO BÀI GIẢNG' :
                           file.category === 'document' ? 'TÀI LIỆU / PDF' :
                           file.category === 'audio' ? 'GHI ÂM BÀI GIẢNG' :
                           file.category === 'image' ? 'SLIDE / SƠ ĐỒ' : 'HỌC LIỆU'}
                        </span>

                        {/* CẤP ĐỘ BẢO MẬT CAND (Requirement 3) */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isTuyetMat ? '#FEE2E2' : isToiMat ? '#FFEDD5' : isMat ? '#FEF3C7' : isCongKhai ? '#D1FAE5' : '#DBEAFE',
                          color: isTuyetMat ? '#991B1B' : isToiMat ? '#C2410C' : isMat ? '#B45309' : isCongKhai ? '#047857' : '#1E40AF',
                          border: '1px solid',
                          borderColor: isTuyetMat ? '#FCA5A5' : isToiMat ? '#FDBA74' : isMat ? '#FCD34D' : isCongKhai ? '#6EE7B7' : '#93C5FD'
                        }}>
                          <Shield size={11} />
                          <span>{cName}</span>
                        </span>

                        <span className="card-file-size">
                          {formatFileSize(file.fileSize)}
                        </span>
                      </div>

                      <div className="card-body">
                        <h4 className="card-title" title={file.originalFileName}>
                          {file.originalFileName}
                        </h4>

                        <div className="card-meta-list">
                          <div className="meta-row">
                            <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Ngày đăng:</span>
                            <span>{formatDate(file.createdAt)}</span>
                          </div>
                          <div className="meta-row">
                            <span><User size={12} style={{ display: 'inline', marginRight: '4px' }} /> Người đăng tải:</span>
                            <span style={{ fontWeight: 700, color: '#0B1E36' }}>
                              {file.uploaderName || file.uploadedByName || 'Cán bộ quản trị T04'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          className="btn-view-lecture"
                          onClick={() => onSelectFile(file)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                          title={`Xem trực tiếp tài liệu ${file.originalFileName}`}
                        >
                          <Eye size={14} />
                          Xem tài liệu trực tiếp
                        </button>

                        <a
                          href={`/api/media/download/${file.id}`}
                          download={file.originalFileName}
                          className="btn-card-icon"
                          title="Tải học liệu về máy tính"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
