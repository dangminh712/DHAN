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
import { INITIAL_LECTURES } from '../lectureData';

export default function HomePage({
  files,
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
  onCopyHash,
  copiedHash,
  onDeleteFile,
  onSelectFile
}) {
  const [homeSection, setHomeSection] = useState('integrated'); // 'integrated' | 'repository'
  const quickKeywords = [
    'An ninh điều tra',
    'Nghiệp vụ an ninh',
    'An ninh mạng',
    'Luật tố tụng hình sự',
    'Bảo vệ bí mật nhà nước',
    'Lý luận chính trị'
  ];

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
    if (search.trim()) {
      return f.originalFileName.toLowerCase().includes(search.toLowerCase());
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
                <span className="segment-badge">{INITIAL_LECTURES.length} Bài giảng</span>
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
              (1 Bài giảng gồm Video, Đề cương PDF, Slide PPT, Sơ đồ, Quiz)
             ══════════════════════════════════════════════════════════ */}
          {homeSection === 'integrated' && (
            <div style={{ padding: '0 24px 20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #E2E8F0',
                paddingBottom: '10px',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Layers size={20} color="#A31A1A" />
                    CHƯƠNG TRÌNH BÀI GIẢNG ĐIỆN TỬ TÍCH HỢP ĐA HỌC LIỆU (T04)
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                    Mỗi bài giảng gồm 5 phần chuẩn CAND: tích hợp <strong>Video MP4, Slide PPT/PDF, Sơ đồ tác chiến, Văn bản pháp luật & Câu hỏi ôn tập</strong>.
                  </p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '16px' }}>
                  {INITIAL_LECTURES.length} Bài giảng tích hợp
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {INITIAL_LECTURES.map(lec => (
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
                          {lec.code}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: lec.securityLevel === 'TUYỆT MẬT' ? '#FEE2E2' : lec.securityLevel === 'MẬT - AN NINH' ? '#FEF3C7' : '#DBEAFE',
                          color: lec.securityLevel === 'TUYỆT MẬT' ? '#991B1B' : lec.securityLevel === 'MẬT - AN NINH' ? '#92400E' : '#1E40AF',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          {lec.securityLevel}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0B1E36', lineHeight: 1.35, marginBottom: '8px' }}>
                        {lec.title}
                      </h4>

                      <p style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px', lineHeight: 1.4 }}>
                        {lec.description.length > 110 ? lec.description.substring(0, 110) + '...' : lec.description}
                      </p>

                      <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#334155', marginBottom: '12px' }}>
                        <div>👨‍🏫 <strong>Giảng viên:</strong> {lec.lecturer}</div>
                        <div>🏛️ <strong>Khoa:</strong> {lec.departmentName}</div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          🎥 Video MP4
                        </span>
                        <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          📄 Đề cương PDF
                        </span>
                        <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          📑 Slide bài giảng
                        </span>
                        <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          🗺️ Sơ đồ hiện trường
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
                ))}
              </div>
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
                         file.category === 'image' ? 'SLIDE / SƠ ĐỒ' : 'HỌC LIỆU KHÁC'}
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
                          <span><Hash size={12} style={{ display: 'inline', marginRight: '4px' }} /> Mã SHA-256:</span>
                          <span
                            className="sha-badge"
                            title="Bấm để sao chép mã băm SHA-256"
                            onClick={() => onCopyHash(file.checksum, file.id)}
                          >
                            {copiedHash === file.id ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                            {file.checksum ? file.checksum.substring(0, 10) + '...' : 'N/A'}
                          </span>
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
