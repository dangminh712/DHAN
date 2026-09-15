import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  X,
  BookOpen,
  HardDrive,
  Video,
  GraduationCap,
  Award,
  FolderKanban,
  Filter,
  FileText,
  Image as ImageIcon,
  Music,
  FileQuestion,
  Clock,
  Hash,
  Copy,
  Check,
  Play,
  Download,
  Trash2,
  RefreshCw,
  UploadCloud,
  ExternalLink,
  Layers,
  Sparkles,
  Shield,
  Eye,
  Users,
  ShieldAlert
} from 'lucide-react';

export default function HomePage({
  files,
  lectures = [],
  loading,
  search,
  setSearch,
  category,
  setCategory,
  selectedDept,
  setSelectedDept,
  activeRoleTab,
  setActiveRoleTab,
  academicUnits,
  currentUser,
  onSearch,
  onOpenUpload,
  onOpenCreateLecture,
  onCopyHash,
  copiedHash,
  onDeleteFile,
  onSelectFile
}) {
  const [homeSection, setHomeSection] = useState('integrated'); // 'integrated' | 'repository'
  const [selectedClassification, setSelectedClassification] = useState('ALL');

  const quickKeywords = [
    'An ninh điều tra',
    'Nghiệp vụ an ninh',
    'An ninh mạng',
    'Luật tố tụng hình sự',
    'Bảo vệ bí mật nhà nước',
    'Lý luận chính trị'
  ];

  const getClassificationBadge = (classification) => {
    const c = classification?.toUpperCase() || 'NORMAL';
    if (c.includes('TUYET_MAT') || c.includes('TUYỆT MẬT')) {
      return { label: 'Tuyệt mật (Bậc 5)', bg: '#7F1D1D', text: '#FEF2F2', border: '#991B1B' };
    }
    if (c.includes('SECRET') || c.includes('TOI_MAT') || c.includes('TỐI MẬT')) {
      return { label: 'Tối mật (Bậc 4)', bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' };
    }
    if (c.includes('CONFIDENTIAL') || c.includes('MAT') || c.includes('MẬT')) {
      return { label: 'Mật (Bậc 3)', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    }
    if (c.includes('INTERNAL') || c.includes('NOI_BO') || c.includes('NỘI BỘ')) {
      return { label: 'Lưu hành nội bộ (Bậc 2)', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
    }
    return { label: 'Công khai (Bậc 1)', bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };
  };

  const isStudent = currentUser?.role === 'STUDENT';
  const studentClasses = currentUser?.assignedClasses?.length
    ? currentUser.assignedClasses
    : (currentUser?.className ? [currentUser.className] : []);

  const visibleLectures = lectures.filter(lec => {
    if (!isStudent) return true;
    const isPublic = !lec.assignedClasses || lec.assignedClasses.length === 0 || lec.isPublic;
    const belongsToMyClass = lec.assignedClasses?.some(c => studentClasses.includes(c));
    return isPublic || belongsToMyClass;
  });

  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const videoCount = files.filter(f => f.category === 'video' || f.category === 'audio').length;
  const docCount = files.filter(f => f.category === 'document').length;

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

  const filteredFiles = files.filter(f => {
    if (search.trim() && !f.originalFileName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedClassification !== 'ALL') {
      const fc = f.classification?.toUpperCase() || 'NORMAL';
      if (selectedClassification === 'TUYET_MAT' && !fc.includes('TUYET') && !fc.includes('TUYỆT')) return false;
      if (selectedClassification === 'TOI_MAT' && (!fc.includes('TOI') && !fc.includes('TỐI') && !fc.includes('SECRET'))) return false;
      if (selectedClassification === 'MAT' && (!fc.includes('MAT') && !fc.includes('MẬT') && !fc.includes('CONFIDENTIAL'))) return false;
      if (selectedClassification === 'INTERNAL' && (!fc.includes('INTERNAL') && !fc.includes('NOI_BO') && !fc.includes('NỘI BỘ'))) return false;
      if (selectedClassification === 'NORMAL' && (fc.includes('TUYET') || fc.includes('TOI') || fc.includes('MAT') || fc.includes('INTERNAL') || fc.includes('SECRET'))) return false;
    }
    return true;
  });

  return (
    <>
      {/* 1. HERO BANNER */}
      <section className="hero-banner" id="home">
        <div className="hero-content">
          <div className="hero-tag">
            <ShieldCheck size={14} />
            HỆ THỐNG LƯU TRỮ HỌC LIỆU NGHIỆP VỤ AN NINH
          </div>
          <h2 className="hero-title">TRA CỨU VÀ HỌC TẬP BÀI GIẢNG ĐIỆN TỬ</h2>
          <p className="hero-subtitle">
            Khám phá kho bài giảng đa phương tiện, video nghiệp vụ truyền phát mượt mà chuẩn HTTP 206,
            tài liệu PDF chính khóa và ngân hàng đề cương bài giảng phục vụ học tập, nghiên cứu nội bộ.
          </p>

          <form
            className="hero-search-box"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
          >
            <div className="search-icon-wrapper">
              <Search size={22} />
            </div>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Nhập tên bài giảng, mã học phần nghiệp vụ, tên giảng viên hoặc từ khóa tra cứu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); onSearch(); }}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0 8px' }}
              >
                <X size={18} />
              </button>
            )}
            <button type="submit" className="btn-search-hero">
              <Search size={16} />
              Tìm kiếm bài giảng
            </button>
          </form>

          <div className="hero-tags-wrapper">
            <span className="hero-tags-label">Học phần trọng điểm:</span>
            {quickKeywords.map((kw, idx) => (
              <button
                key={idx}
                type="button"
                className="keyword-chip"
                onClick={() => {
                  setSearch(kw);
                  onSearch();
                }}
              >
                #{kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="stats-section" id="thong-ke">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <BookOpen size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{totalFiles}</div>
              <div className="stat-label">Tổng số bài giảng đã số hóa</div>
            </div>
          </div>

          <div className="stat-card gold-card">
            <div className="stat-icon">
              <HardDrive size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{totalSizeMB} MB</div>
              <div className="stat-label">Dung lượng học liệu Intranet</div>
            </div>
          </div>

          <div className="stat-card navy-card">
            <div className="stat-icon">
              <Video size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{videoCount}</div>
              <div className="stat-label">Video & Audio bài giảng (HTTP 206)</div>
            </div>
          </div>

          <div className="stat-card emerald-card">
            <div className="stat-icon">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">100%</div>
              <div className="stat-label">Mã băm SHA-256 xác thực bản quyền</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT LAYOUT */}
      <main className="main-content-layout" id="kho-bai-giang">
        <div className="dvc-tabs-container">
          {/* 3 PHÂN HỆ VAI TRÒ CHUYÊN BIỆT (TÁCH RIÊNG THÀNH TỪNG TRANG) */}
          <div style={{ padding: '24px 24px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#A31A1A" />
                CÁC PHÂN HỆ CHỨC NĂNG THEO VAI TRÒ (TRANG RIÊNG BIỆT)
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Đang dùng tài khoản: <strong style={{ color: '#A31A1A' }}>{currentUser?.fullName}</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* CỔNG HỌC VIÊN */}
              <a href="#/hoc-vien" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '18px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ background: '#1E40AF', color: '#fff', padding: '6px', borderRadius: '8px', display: 'inline-flex' }}>
                        <GraduationCap size={22} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '12px' }}>
                        VAI TRÒ HỌC VIÊN
                      </span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', margin: '0 0 6px' }}>
                      Cổng Học Viên (Tra Cứu & Học Tập)
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                      Không gian học tập chuyên biệt: học bài giảng tích hợp 5 phần, xem trực tiếp giáo trình PDF, làm bài ôn tập và ghi chép nghiệp vụ.
                    </p>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Vào Cổng Học viên →</span>
                  </div>
                </div>
              </a>

              {/* PHÒNG GIẢNG VIÊN */}
              <a href="#/giang-vien" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: '10px',
                  padding: '18px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ background: '#A31A1A', color: '#fff', padding: '6px', borderRadius: '8px', display: 'inline-flex' }}>
                        <Award size={22} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '12px' }}>
                        VAI TRÒ GIẢNG VIÊN
                      </span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#991B1B', margin: '0 0 6px' }}>
                      Phòng Làm Việc Giảng Viên (Teacher Studio)
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                      Không gian biên soạn: đăng tải học liệu mới (Video, Slide, PDF, Bản đồ), quản trị danh mục học liệu và tra cứu giảng viên cùng khoa.
                    </p>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Vào Phòng Giảng viên →</span>
                  </div>
                </div>
              </a>

              {/* QUẢN TRỊ HỆ THỐNG */}
              <a href="#/admin" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '18px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ background: '#0B1E36', color: '#fff', padding: '6px', borderRadius: '8px', display: 'inline-flex' }}>
                        <ShieldAlert size={22} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#E2E8F0', color: '#0F172A', padding: '2px 8px', borderRadius: '12px' }}>
                        CHỈ HUY & ADMIN
                      </span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: '0 0 6px' }}>
                      Trung Tâm Quản Trị Hệ Thống (Admin Portal)
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                      Quản lý tài khoản RBAC, giám sát nhật ký an ninh Audit Trail, kiểm soát phiên thiết bị truy cập và CSDL 27 bảng quan hệ.
                    </p>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 700, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Vào Trung tâm Quản trị →</span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* CHỌN KHOA */}
          <div className="departments-section">
            <div className="dept-header">
              <div className="dept-title">
                <FolderKanban size={16} />
                Lọc theo Khoa đào tạo T04:
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

          {/* THANH CHUYỂN ĐỔI 2 PHÂN HỆ NỘI DUNG RIÊNG BIỆT */}
          <div style={{ padding: '16px 24px 0' }}>
            <div className="home-segment-selector">
              <button
                className={`home-segment-btn ${homeSection === 'integrated' ? 'active' : ''}`}
                onClick={() => setHomeSection('integrated')}
              >
                <Layers size={18} />
                <span>1. BÀI GIẢNG ĐIỆN TỬ TÍCH HỢP ĐA HỌC LIỆU</span>
                <span className="segment-badge">{lectures.length} Bài giảng</span>
              </button>

              <button
                className={`home-segment-btn ${homeSection === 'repository' ? 'active' : ''}`}
                onClick={() => setHomeSection('repository')}
              >
                <FolderKanban size={18} />
                <span>2. KHO TÀI LIỆU SỐ HÓA (XEM TRỰC TIẾP TÀI LIỆU)</span>
                <span className="segment-badge">{filteredFiles.length} Tài liệu</span>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              PHÂN HỆ 1: CHƯƠNG TRÌNH BÀI GIẢNG ĐIỆN TỬ TÍCH HỢP (T04)
              (Lấy 100% từ CSDL MySQL 8.0 - training_management)
             ══════════════════════════════════════════════════════════ */}
          {homeSection === 'integrated' && (
            <div style={{ padding: '0 24px 20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #E2E8F0',
                paddingBottom: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Layers size={20} color="#A31A1A" />
                    CHƯƠNG TRÌNH BÀI GIẢNG ĐIỆN TỬ TÍCH HỢP ĐA HỌC LIỆU (T04)
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                    Dữ liệu trực tiếp từ <strong>CSDL MySQL 8.0</strong>: tích hợp <strong>Video MP4, Slide PPT/SVG, Giáo trình PDF, Sơ đồ tác chiến & Câu hỏi trắc nghiệm</strong>.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: '16px' }}>
                    {visibleLectures.length} Bài giảng {isStudent ? '(Lớp & Công khai)' : '(MySQL)'}
                  </span>
                  {onOpenCreateLecture && (
                    <button
                      type="button"
                      onClick={onOpenCreateLecture}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(185, 28, 28, 0.25)',
                        transition: 'transform 0.1s'
                      }}
                    >
                      <BookOpen size={15} />
                      + Tạo bài giảng mới
                    </button>
                  )}
                  {onOpenUpload && (
                    <button
                      type="button"
                      onClick={onOpenUpload}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#F8FAFC',
                        color: '#1E293B',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <UploadCloud size={15} color="#A31A1A" />
                      Tải lên Folder
                    </button>
                  )}
                </div>
              </div>

              {visibleLectures.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px' }}>
                  <Layers size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, fontSize: '15px', color: '#334155' }}>Chưa có bài giảng nào phù hợp cho lớp học vụ của bạn.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {visibleLectures.map(lec => {
                    const fileCount = lec.files?.length || lec.fileCount || 0;
                    const hasVideo = lec.files?.some(f => f.fileType === 'VIDEO') || false;
                    const hasDoc = lec.files?.some(f => f.fileType === 'PDF' || f.fileType === 'DOCUMENT') || false;
                    const hasImage = lec.files?.some(f => f.fileType === 'IMAGE') || false;
                    const isPublic = !lec.assignedClasses || lec.assignedClasses.length === 0 || lec.isPublic;

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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, background: '#A31A1A', color: '#fff', padding: '3px 8px', borderRadius: '4px' }}>
                                {lec.subjectCode || 'T04-BG'}
                              </span>
                              {isPublic && (
                                <span style={{ fontSize: '10.5px', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #CBD5E1' }}>
                                  🌐 Công khai
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: lec.status === 'PUBLISHED' ? '#DCFCE7' : lec.status === 'SCHEDULED' ? '#FEF3C7' : '#F1F5F9',
                              color: lec.status === 'PUBLISHED' ? '#166534' : lec.status === 'SCHEDULED' ? '#92400E' : '#475569',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              {lec.status === 'PUBLISHED' ? 'ĐÃ PHÁT HÀNH' : lec.status === 'SCHEDULED' ? 'LẬP LỊCH' : 'BẢN THẢO'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0B1E36', lineHeight: 1.35, marginBottom: '8px' }}>
                            {lec.title}
                          </h4>

                          <p style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px', lineHeight: 1.4 }}>
                            {lec.description && lec.description.length > 110 ? lec.description.substring(0, 110) + '...' : (lec.description || 'Chuyên đề đào tạo nghiệp vụ Sĩ quan CAND.')}
                          </p>

                          <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#334155', marginBottom: '12px' }}>
                            <div>👨‍🏫 <strong>Giảng viên:</strong> {lec.teacherName || 'Bộ môn Nghiệp vụ'}</div>
                            <div>🏛️ <strong>Khoa:</strong> {lec.departmentName || lec.subject || 'Khoa Nghiệp vụ An ninh'}</div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                            {hasVideo && (
                              <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                🎥 Video MP4
                              </span>
                            )}
                            {hasDoc && (
                              <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                📄 Giáo trình / Slide
                              </span>
                            )}
                            {hasImage && (
                              <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                🗺️ Sơ đồ hiện trường
                              </span>
                            )}
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              📁 {fileCount} Học liệu CSDL
                            </span>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              📝 5 Phần & Quiz
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
                            Vào phòng học bài giảng
                          </a>

                          <a
                            href={`/#/study/${lec.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-card-icon"
                            title="Mở bài giảng trong tab mới độc lập"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ExternalLink size={14} />
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
              PHÂN HỆ 2: KHO TÀI LIỆU & TẬP TIN SỐ HÓA (XEM TRỰC TIẾP)
              (Xem trực tiếp file PDF, Video, Ảnh, Audio không cần vào bài giảng)
             ══════════════════════════════════════════════════════════ */}
          {homeSection === 'repository' && (
            <>
              {/* BỘ LỌC ĐỊNH DẠNG */}
              <div className="filter-bar">
            <div className="format-filters">
              <button
                className={`format-btn ${category === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all')}
              >
                <Filter size={14} />
                Tất cả học liệu ({totalFiles})
              </button>
              <button
                className={`format-btn ${category === 'video' ? 'active' : ''}`}
                onClick={() => setCategory('video')}
              >
                <Video size={14} />
                Video bài giảng ({files.filter(f => f.category === 'video').length})
              </button>
              <button
                className={`format-btn ${category === 'document' ? 'active' : ''}`}
                onClick={() => setCategory('document')}
              >
                <FileText size={14} />
                Giáo trình & PDF ({docCount})
              </button>
              <button
                className={`format-btn ${category === 'image' ? 'active' : ''}`}
                onClick={() => setCategory('image')}
              >
                <ImageIcon size={14} />
                Slide & Sơ đồ ({files.filter(f => f.category === 'image').length})
              </button>
              <button
                className={`format-btn ${category === 'audio' ? 'active' : ''}`}
                onClick={() => setCategory('audio')}
              >
                <Music size={14} />
                Ghi âm bài giảng ({files.filter(f => f.category === 'audio').length})
              </button>
            </div>

            <div className="filter-right-controls">
              <span className="result-count-badge">
                Hiển thị: <strong>{filteredFiles.length}</strong> bài giảng
              </span>
            </div>
          </div>

          {/* BỘ LỌC PHÂN CẤP BẢO MẬT HỌC LIỆU */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', padding: '0 24px 14px', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} color="#A31A1A" />
              Cấp độ bảo mật CAND:
            </span>
            {[
              { key: 'ALL', label: 'Tất cả cấp độ' },
              { key: 'TUYET_MAT', label: '🔴 Tuyệt mật' },
              { key: 'TOI_MAT', label: '🛑 Tối mật' },
              { key: 'MAT', label: '🟡 Mật' },
              { key: 'INTERNAL', label: '🔵 Nội bộ' },
              { key: 'NORMAL', label: '🟢 Công khai' }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedClassification(item.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  fontWeight: selectedClassification === item.key ? 700 : 500,
                  border: selectedClassification === item.key ? '1px solid #0B1E36' : '1px solid #CBD5E1',
                  background: selectedClassification === item.key ? '#0B1E36' : '#FFFFFF',
                  color: selectedClassification === item.key ? '#FFFFFF' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* LƯỚI BÀI GIẢNG */}
          {loading ? (
            <div className="empty-state-box">
              <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: '#A31A1A', display: 'block' }} />
              <h3>Đang nạp dữ liệu bài giảng từ máy chủ Intranet...</h3>
              <p>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="empty-state-box">
              <FileQuestion className="empty-icon" />
              <h3>Chưa tìm thấy bài giảng phù hợp</h3>
              <p>
                {search
                  ? `Không có học liệu nào khớp với từ khóa "${search}". Hãy thử tìm kiếm với từ khóa khác.`
                  : 'Hiện tại chưa có bài giảng nào trong danh mục này. Giảng viên có thể đăng tải bài giảng mới ngay bây giờ.'}
              </p>
              <button
                className="btn-upload-primary"
                style={{ margin: '0 auto' }}
                onClick={onOpenUpload}
              >
                <UploadCloud size={16} />
                Đăng tải bài giảng đầu tiên
              </button>
            </div>
          ) : (
            <div className="lecture-grid">
              {filteredFiles.map((file) => {
                const isVideo = file.category === 'video';
                const isDoc = file.category === 'document';
                const isAudio = file.category === 'audio';
                const isImg = file.category === 'image';
                const clsBadge = getClassificationBadge(file.classification);

                return (
                  <div key={file.id} className="lecture-card">
                    <div className="card-top-badge" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={`type-indicator ${file.category}`}>
                          {isVideo && <Video size={13} />}
                          {isDoc && <FileText size={13} />}
                          {isAudio && <Music size={13} />}
                          {isImg && <ImageIcon size={13} />}
                          {!isVideo && !isDoc && !isAudio && !isImg && <FileQuestion size={13} />}
                          {file.category === 'video' ? 'VIDEO BÀI GIẢNG' :
                           file.category === 'document' ? 'TÀI LIỆU / PDF' :
                           file.category === 'audio' ? 'GHI ÂM BÀI GIẢNG' :
                           file.category === 'image' ? 'SLIDE / SƠ ĐỒ' : 'HỌC LIỆU KHÁC'}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: clsBadge.bg,
                          color: clsBadge.text,
                          border: `1px solid ${clsBadge.border}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Shield size={11} />
                          {clsBadge.label}
                        </span>
                      </div>
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
                          <span><Users size={12} style={{ display: 'inline', marginRight: '4px' }} /> Người đăng:</span>
                          <span style={{ fontWeight: 600, color: '#0B1E36' }}>{file.uploaderName || file.uploadedBy || 'Cán bộ quản trị T04'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      {/* XEM TRỰC TIẾP TẬP TIN / TÀI LIỆU KHÔNG CẦN VÀO BÀI GIẢNG */}
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

                      {(activeRoleTab === 'teacher' || currentUser?.role === 'SUPER_ADMIN') && (
                        <button
                          className="btn-card-icon delete"
                          title="Xóa bài giảng"
                          onClick={() => onDeleteFile(file.id, file.originalFileName)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
