import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Trash2,
  Download,
  Search,
  Eye,
  Server,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  X,
  Play,
  FileQuestion,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Award,
  Shield,
  Layers,
  Clock,
  Hash,
  Filter,
  ChevronRight,
  FolderKanban,
  Users,
  UserCheck,
  Edit,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'student' | 'teacher'

  const fileInputRef = useRef(null);

  // Danh mục Khoa / Bộ môn trực thuộc Trường Đại học An ninh nhân dân (T04)
  const departments = [
    { id: 'all', name: 'Tất cả Khoa / Bộ môn' },
    { id: 'andieu-tra', name: 'Khoa An ninh điều tra' },
    { id: 'nghiep-vu-an', name: 'Khoa Nghiệp vụ An ninh' },
    { id: 'an-ninh-mang', name: 'Khoa An ninh mạng & PCTP Công nghệ cao' },
    { id: 'luat-qlnn', name: 'Khoa Luật & QLNN về ANTT' },
    { id: 'ly-luan-ct', name: 'Khoa Lý luận chính trị & KHXHNV' },
    { id: 'quan-su-vo-thuat', name: 'Khoa Quân sự, Võ thuật & TDTT' },
    { id: 'ngoai-ngu-tin-hoc', name: 'Khoa Ngoại ngữ - Tin học' }
  ];

  // Từ khóa tìm kiếm phổ biến
  const quickKeywords = [
    'An ninh điều tra',
    'Nghiệp vụ an ninh',
    'An ninh mạng',
    'Luật tố tụng hình sự',
    'Bảo vệ bí mật nhà nước',
    'Lý luận chính trị'
  ];

  // Dữ liệu tạm giảng viên
  const sampleTeachers = [
    { id: 1, name: 'TS. Nguyễn Văn An', khoa: 'Khoa An ninh điều tra', chucvu: 'Trưởng khoa', monHoc: 'Kỹ thuật điều tra cơ bản', soLuongBaiGiang: 12 },
    { id: 2, name: 'ThS. Trần Thị Bình', khoa: 'Khoa Nghiệp vụ An ninh', chucvu: 'Phó Trưởng khoa', monHoc: 'Nghiệp vụ an ninh nội bộ', soLuongBaiGiang: 8 },
    { id: 3, name: 'PGS.TS. Lê Hoàng Cường', khoa: 'Khoa An ninh mạng & PCTP CNC', chucvu: 'Giảng viên chính', monHoc: 'An ninh mạng và phòng chống tội phạm công nghệ cao', soLuongBaiGiang: 15 },
    { id: 4, name: 'TS. Phạm Minh Đức', khoa: 'Khoa Luật & QLNN về ANTT', chucvu: 'Giảng viên', monHoc: 'Luật tố tụng hình sự', soLuongBaiGiang: 6 },
    { id: 5, name: 'ThS. Hoàng Thị Lan', khoa: 'Khoa Lý luận chính trị & KHXHNV', chucvu: 'Giảng viên', monHoc: 'Triết học Mác-Lênin', soLuongBaiGiang: 10 },
    { id: 6, name: 'Đại tá, TS. Vũ Đình Tùng', khoa: 'Khoa Quân sự, Võ thuật & TDTT', chucvu: 'Trưởng khoa', monHoc: 'Quân sự và Võ thuật ứng dụng', soLuongBaiGiang: 9 }
  ];

  // Dữ liệu tạm học viên
  const sampleStudents = [
    { id: 1, mssv: 'T04-2024-001', name: 'Nguyễn Hoàng Minh', khoa: 'An ninh điều tra', lop: 'ĐT.49A', khoaHoc: '2024-2028', trangThai: 'Đang học' },
    { id: 2, mssv: 'T04-2024-002', name: 'Trần Thị Hồng Nhung', khoa: 'Nghiệp vụ An ninh', lop: 'NV.49B', khoaHoc: '2024-2028', trangThai: 'Đang học' },
    { id: 3, mssv: 'T04-2023-015', name: 'Lê Đức Anh', khoa: 'An ninh mạng & PCTP CNC', lop: 'ANM.48A', khoaHoc: '2023-2027', trangThai: 'Đang học' },
    { id: 4, mssv: 'T04-2023-022', name: 'Phạm Thị Thanh Thủy', khoa: 'Luật & QLNN về ANTT', lop: 'LU.48B', khoaHoc: '2023-2027', trangThai: 'Đang học' },
    { id: 5, mssv: 'T04-2022-008', name: 'Hoàng Quốc Bảo', khoa: 'An ninh điều tra', lop: 'ĐT.47A', khoaHoc: '2022-2026', trangThai: 'Đang học' },
    { id: 6, mssv: 'T04-2024-030', name: 'Đỗ Minh Tuấn', khoa: 'Lý luận chính trị', lop: 'CT.49A', khoaHoc: '2024-2028', trangThai: 'Đang học' },
    { id: 7, mssv: 'T04-2022-041', name: 'Bùi Thị Ngọc Mai', khoa: 'Ngoại ngữ - Tin học', lop: 'TH.47B', khoaHoc: '2022-2026', trangThai: 'Bảo lưu' },
    { id: 8, mssv: 'T04-2023-055', name: 'Vũ Trung Kiên', khoa: 'Quân sự, Võ thuật & TDTT', lop: 'QS.48A', khoaHoc: '2023-2027', trangThai: 'Đang học' }
  ];

  // Tải danh sách bài giảng từ Backend .NET 8
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await axios.get('/api/media', { params });
      setFiles(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách bài giảng:', err);
      showStatus('error', 'Không thể kết nối đến Backend .NET (Cổng 5000). Vui lòng kiểm tra Server API.');
    } finally {
      setLoading(false);
    }
  };

  // Tải thông tin mạng Intranet
  const fetchNetworkInfo = async () => {
    try {
      const res = await axios.get('/api/media/network-info');
      setNetworkInfo(res.data);
    } catch (err) {
      console.error('Lỗi tải thông tin mạng:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchNetworkInfo();
  }, [category]);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // Xử lý tải lên bài giảng mới
  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      await axios.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      showStatus('success', `Đã lưu trữ thành công bài giảng "${file.name}" vào hệ thống nội bộ!`);
      setIsUploadModalOpen(false);
      fetchFiles();
    } catch (err) {
      console.error('Upload thất bại:', err);
      showStatus('error', err.response?.data?.message || 'Tải lên bài giảng thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Xóa bài giảng
  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Xác nhận xóa học liệu "${fileName}" khỏi hệ thống máy chủ nội bộ?`)) {
      return;
    }

    try {
      await axios.delete(`/api/media/${id}`);
      showStatus('success', `Đã xóa bài giảng "${fileName}" thành công.`);
      if (selectedFile?.id === id) setSelectedFile(null);
      fetchFiles();
    } catch (err) {
      console.error('Xóa thất bại:', err);
      showStatus('error', 'Lỗi khi xóa bài giảng khỏi máy chủ.');
    }
  };

  // Sao chép mã băm SHA-256
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    showStatus('success', 'Đã sao chép mã băm SHA-256 xác thực bản quyền!');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Tính toán số liệu thống kê
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

  // Lọc theo từ khóa tìm kiếm
  const filteredFiles = files.filter(f => {
    if (search.trim()) {
      const matchSearch = f.originalFileName.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
    }
    return true;
  });

  // ═══════════════════════════════
  // RENDER: Trang Giảng viên
  // ═══════════════════════════════
  const renderTeacherPage = () => (
    <div className="dvc-tabs-container" style={{ marginTop: '24px' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="#A31A1A" />
              QUẢN LÝ CÁN BỘ GIẢNG VIÊN
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Danh sách cán bộ giảng viên Trường Đại học An ninh nhân dân (T04)</p>
          </div>
          <button className="btn-upload-primary" onClick={() => showStatus('success', 'Chức năng thêm giảng viên đang được phát triển!')}>
            <PlusCircle size={16} />
            Thêm giảng viên mới
          </button>
        </div>
      </div>

      <div className="teacher-panel-notice">
        <AlertTriangle size={18} />
        <span>Đây là trang quản trị dành cho <strong>quản trị viên hệ thống và ban giám hiệu</strong>. Dữ liệu hiển thị là dữ liệu mẫu phục vụ kiểm thử.</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
              <th style={thStyle}>STT</th>
              <th style={thStyle}>Họ và tên</th>
              <th style={thStyle}>Khoa / Bộ môn</th>
              <th style={thStyle}>Chức vụ</th>
              <th style={thStyle}>Môn giảng dạy</th>
              <th style={thStyle}>Bài giảng</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sampleTeachers.map((t, idx) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={tdStyle}>{idx + 1}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{t.name}</td>
                <td style={tdStyle}>{t.khoa}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    background: t.chucvu.includes('Trưởng') ? '#FEE2E2' : t.chucvu.includes('Phó') ? '#FEF9C3' : '#F3F4F6',
                    color: t.chucvu.includes('Trưởng') ? '#991B1B' : t.chucvu.includes('Phó') ? '#854D0E' : '#374151'
                  }}>
                    {t.chucvu}
                  </span>
                </td>
                <td style={tdStyle}>{t.monHoc}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#A31A1A' }}>{t.soLuongBaiGiang}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-card-icon" title="Xem chi tiết" onClick={() => showStatus('success', `Đang xem thông tin: ${t.name}`)}>
                      <Eye size={14} />
                    </button>
                    <button className="btn-card-icon" title="Chỉnh sửa" onClick={() => showStatus('success', `Chỉnh sửa: ${t.name}`)}>
                      <Edit size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '14px 20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', fontSize: '12.5px', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
        <span>Tổng cộng: <strong style={{ color: '#111827' }}>{sampleTeachers.length}</strong> giảng viên</span>
        <span>Tổng bài giảng: <strong style={{ color: '#A31A1A' }}>{sampleTeachers.reduce((a, t) => a + t.soLuongBaiGiang, 0)}</strong></span>
      </div>
    </div>
  );

  // ═══════════════════════════════
  // RENDER: Trang Học viên
  // ═══════════════════════════════
  const renderStudentPage = () => (
    <div className="dvc-tabs-container" style={{ marginTop: '24px' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={22} color="#A31A1A" />
              QUẢN LÝ HỌC VIÊN / SINH VIÊN
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Danh sách học viên các khóa đào tạo tại T04</p>
          </div>
          <button className="btn-upload-primary" onClick={() => showStatus('success', 'Chức năng thêm học viên đang được phát triển!')}>
            <PlusCircle size={16} />
            Thêm học viên mới
          </button>
        </div>
      </div>

      <div className="teacher-panel-notice">
        <AlertTriangle size={18} />
        <span>Trang quản lý hồ sơ học viên. Dữ liệu hiển thị là <strong>dữ liệu mẫu</strong> phục vụ kiểm thử hệ thống. Phân quyền sẽ được thiết lập sau.</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
              <th style={thStyle}>STT</th>
              <th style={thStyle}>Mã số</th>
              <th style={thStyle}>Họ và tên</th>
              <th style={thStyle}>Khoa</th>
              <th style={thStyle}>Lớp</th>
              <th style={thStyle}>Khóa học</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sampleStudents.map((s, idx) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={tdStyle}>{idx + 1}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600, color: '#A31A1A' }}>{s.mssv}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{s.name}</td>
                <td style={tdStyle}>{s.khoa}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{s.lop}</td>
                <td style={tdStyle}>{s.khoaHoc}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    background: s.trangThai === 'Đang học' ? '#D1FAE5' : '#FEF9C3',
                    color: s.trangThai === 'Đang học' ? '#065F46' : '#854D0E'
                  }}>
                    {s.trangThai}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-card-icon" title="Xem hồ sơ" onClick={() => showStatus('success', `Đang xem hồ sơ: ${s.name}`)}>
                      <Eye size={14} />
                    </button>
                    <button className="btn-card-icon" title="Chỉnh sửa" onClick={() => showStatus('success', `Chỉnh sửa: ${s.name}`)}>
                      <Edit size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '14px 20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', fontSize: '12.5px', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
        <span>Tổng cộng: <strong style={{ color: '#111827' }}>{sampleStudents.length}</strong> học viên</span>
        <span>Đang học: <strong style={{ color: '#059669' }}>{sampleStudents.filter(s => s.trangThai === 'Đang học').length}</strong> | Bảo lưu: <strong style={{ color: '#D97706' }}>{sampleStudents.filter(s => s.trangThai === 'Bảo lưu').length}</strong></span>
      </div>
    </div>
  );

  // Table styles
  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap'
  };
  const tdStyle = {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#6B7280',
    verticalAlign: 'middle'
  };

  return (
    <div className="portal-wrapper">
      {/* 1. TOP AGENCY BAR (BỘ CÔNG AN) */}
      <div className="top-agency-bar">
        <div className="top-agency-container">
          <div className="agency-left">
            <span className="agency-badge">BỘ CÔNG AN</span>
            <span>TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>| MÃ HIỆU: T04</span>
          </div>
          <div className="agency-right">
            <div className="intranet-pill">
              <span className="pulse-dot"></span>
              <span>MẠNG NỘI BỘ (INTRANET)</span>
            </div>
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              style={{ background: 'transparent', border: 'none', color: '#FEF08A', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Server size={13} />
              Thông số IP máy chủ
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <header className="main-header">
        <div className="header-container">
          <div className="brand-wrapper">
            <div className="emblem-icon">
              <Shield size={28} />
            </div>
            <div className="brand-text">
              <h1>TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN</h1>
              <h2>CỔNG THÔNG TIN QUẢN LÝ VÀ HỌC TẬP BÀI GIẢNG ĐIỆN TỬ</h2>
              <div className="sub-unit">Hệ thống Số hóa Học liệu Nghiệp vụ & Đào tạo Sĩ quan An ninh (Lưu hành nội bộ)</div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-icon-secondary"
              onClick={fetchFiles}
              title="Làm mới danh sách bài giảng"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>

            <button
              className="btn-upload-primary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <UploadCloud size={16} />
              Đăng tải bài giảng mới
            </button>
          </div>
        </div>
      </header>

      {/* 3. NAVBAR */}
      <nav className="nav-bar">
        <div className="nav-container">
          <a
            href="#home"
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}
          >
            <BookOpen size={15} />
            Trang chủ Cổng bài giảng
          </a>
          <a
            href="#giang-vien"
            className={`nav-item ${currentPage === 'teacher' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentPage('teacher'); }}
          >
            <Award size={15} />
            Quản lý Giảng viên
          </a>
          <a
            href="#hoc-vien"
            className={`nav-item ${currentPage === 'student' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentPage('student'); }}
          >
            <GraduationCap size={15} />
            Quản lý Học viên
          </a>
          <a href="#khoa-chuyen-nganh" className="nav-item" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>
            <FolderKanban size={15} />
            Khoa / Chuyên ngành
          </a>
          <a href="#thong-ke" className="nav-item" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>
            <Layers size={15} />
            Thống kê số hóa
          </a>
        </div>
      </nav>

      {/* CONDITIONAL RENDERING: Trang Giảng viên hoặc Học viên hoặc Dashboard */}
      {currentPage === 'teacher' ? (
        <main className="main-content-layout">
          {renderTeacherPage()}
        </main>
      ) : currentPage === 'student' ? (
        <main className="main-content-layout">
          {renderStudentPage()}
        </main>
      ) : (
        <>
          {/* 4. HERO BANNER & SEARCH BOX */}
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

              {/* Ô TÌM KIẾM NỔI BẬT */}
              <form
                className="hero-search-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchFiles();
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
                    onClick={() => { setSearch(''); fetchFiles(); }}
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

              {/* TỪ KHÓA GỢI Ý NHANH */}
              <div className="hero-tags-wrapper">
                <span className="hero-tags-label">Học phần trọng điểm:</span>
                {quickKeywords.map((kw, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="keyword-chip"
                    onClick={() => {
                      setSearch(kw);
                      fetchFiles();
                    }}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 5. THỐNG KÊ SỐ LIỆU */}
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

          {/* 6. KHU VỰC NỘI DUNG CHÍNH */}
          <main className="main-content-layout" id="kho-bai-giang">
            <div className="dvc-tabs-container">
              {/* TABS ĐỐI TƯỢNG */}
              <div className="dvc-role-tabs">
                <button
                  className={`role-tab-btn ${activeRoleTab === 'student' ? 'active' : ''}`}
                  onClick={() => setActiveRoleTab('student')}
                >
                  <GraduationCap size={18} />
                  DÀNH CHO HỌC VIÊN / SINH VIÊN (TRA CỨU & HỌC TẬP)
                </button>
                <button
                  className={`role-tab-btn ${activeRoleTab === 'teacher' ? 'active' : ''}`}
                  onClick={() => setActiveRoleTab('teacher')}
                >
                  <Award size={18} />
                  DÀNH CHO CÁN BỘ / GIẢNG VIÊN (QUẢN TRỊ & ĐĂNG TẢI)
                </button>
              </div>

              {/* Thông báo khi đang ở tab Giảng viên */}
              {activeRoleTab === 'teacher' && (
                <div className="teacher-panel-notice">
                  <ShieldCheck size={18} />
                  <span>Chế độ <strong>Quản trị Giảng viên</strong> — Bạn có quyền đăng tải, chỉnh sửa và xóa bài giảng. Mọi thao tác được ghi nhận trong nhật ký hệ thống.</span>
                </div>
              )}

              {/* CHỌN KHOA / BỘ MÔN */}
              <div className="departments-section" id="khoa-chuyen-nganh">
                <div className="dept-header">
                  <div className="dept-title">
                    <FolderKanban size={16} />
                    Lọc theo Khoa / Bộ môn đào tạo T04:
                  </div>
                </div>
                <div className="dept-pills-row">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      className={`dept-pill ${selectedDept === dept.id ? 'active' : ''}`}
                      onClick={() => setSelectedDept(dept.id)}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* BỘ LỌC ĐỊNH DẠNG TẬP TIN */}
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

              {/* LƯỚI DANH SÁCH BÀI GIẢNG */}
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
                    onClick={() => setIsUploadModalOpen(true)}
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
                                onClick={() => copyToClipboard(file.checksum, file.id)}
                              >
                                {copiedHash === file.id ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                                {file.checksum ? file.checksum.substring(0, 10) + '...' : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button
                            className="btn-view-lecture"
                            onClick={() => setSelectedFile(file)}
                          >
                            <Play size={14} />
                            Xem bài giảng
                          </button>

                          <a
                            href={`/api/media/download/${file.id}`}
                            download={file.originalFileName}
                            className="btn-card-icon"
                            title="Tải học liệu về máy tính"
                          >
                            <Download size={15} />
                          </a>

                          {activeRoleTab === 'teacher' && (
                            <button
                              className="btn-card-icon delete"
                              title="Xóa bài giảng"
                              onClick={() => handleDelete(file.id, file.originalFileName)}
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
            </div>
          </main>
        </>
      )}

      {/* 7. MODAL TRÌNH PHÁT BÀI GIẢNG */}
      {selectedFile && (
        <div className="modal-backdrop" onClick={() => setSelectedFile(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <ShieldCheck size={20} color="#FEF08A" />
                <h3>{selectedFile.originalFileName}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedFile(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-media-viewport">
              {selectedFile.category === 'video' ? (
                <video
                  controls
                  autoPlay
                  className="video-player-frame"
                  src={`/api/media/stream/${selectedFile.id}`}
                >
                  Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
                </video>
              ) : selectedFile.category === 'document' ? (
                <iframe
                  className="pdf-viewer-frame"
                  src={`/api/media/stream/${selectedFile.id}`}
                  title={selectedFile.originalFileName}
                />
              ) : selectedFile.category === 'audio' ? (
                <div className="audio-viewer-panel">
                  <div className="audio-icon-pulse">
                    <Music size={40} />
                  </div>
                  <h4 style={{ marginBottom: '16px' }}>{selectedFile.originalFileName}</h4>
                  <audio
                    controls
                    autoPlay
                    style={{ width: '100%' }}
                    src={`/api/media/stream/${selectedFile.id}`}
                  />
                </div>
              ) : selectedFile.category === 'image' ? (
                <img
                  className="image-viewer-frame"
                  src={`/api/media/stream/${selectedFile.id}`}
                  alt={selectedFile.originalFileName}
                />
              ) : (
                <div style={{ color: '#FFFFFF', textAlign: 'center', padding: '40px' }}>
                  <FileQuestion size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
                  <p>Định dạng này không hỗ trợ xem trực tiếp. Vui lòng tải về máy tính để mở.</p>
                </div>
              )}
            </div>

            <div className="modal-details-footer">
              <div className="file-specs">
                <div className="spec-title">
                  Kích thước: {formatFileSize(selectedFile.fileSize)} | Ngày cập nhật: {formatDate(selectedFile.createdAt)}
                </div>
                <div className="spec-hash">
                  Mã băm SHA-256 toàn vẹn: {selectedFile.checksum}
                </div>
              </div>

              <div className="modal-action-btns">
                <button
                  className="btn-icon-secondary"
                  onClick={() => copyToClipboard(selectedFile.checksum, selectedFile.id)}
                >
                  <Copy size={14} />
                  Sao chép SHA-256
                </button>

                <a
                  href={`/api/media/download/${selectedFile.id}`}
                  download={selectedFile.originalFileName}
                  className="btn-download-gold"
                >
                  <Download size={15} />
                  Tải học liệu về máy
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL ĐĂNG TẢI BÀI GIẢNG */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => !uploading && setIsUploadModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <UploadCloud size={20} color="#FEF08A" />
                <h3>ĐĂNG TẢI BÀI GIẢNG VÀ HỌC LIỆU SỐ</h3>
              </div>
              <button
                className="modal-close-btn"
                disabled={uploading}
                onClick={() => setIsUploadModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 20px 0' }}>
              <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
                Hỗ trợ đăng tải các tập tin bài giảng: <strong>Video MP4, Giáo trình PDF, Slide PPTX, Giáo án DOCX, File ghi âm MP3</strong>.
                Dung lượng tối đa lên đến <strong>1 GB</strong> mỗi tập tin.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e.target.files)}
            />

            <div
              className="upload-dropzone"
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!uploading && e.dataTransfer.files) {
                  handleUpload(e.dataTransfer.files);
                }
              }}
            >
              <UploadCloud className="upload-cloud-icon" />
              <div className="upload-title">
                {uploading ? 'Đang truyền dữ liệu lên máy chủ...' : 'Nhấp để chọn tập tin hoặc Kéo thả bài giảng vào đây'}
              </div>
              <div className="upload-hint">
                Hệ thống tự động tính toán mã băm SHA-256 xác thực bản quyền tập tin
              </div>
            </div>

            {uploading && (
              <div className="upload-progress-box">
                <div className="progress-info">
                  <span>Tiến độ tải lên máy chủ:</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn-icon-secondary"
                disabled={uploading}
                onClick={() => setIsUploadModalOpen(false)}
              >
                Đóng
              </button>
              <button
                className="btn-upload-primary"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={16} />
                Chọn tập tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL THÔNG SỐ MẠNG INTRANET */}
      {isNetworkModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNetworkModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Server size={20} color="#FEF08A" />
                <h3>THÔNG SỐ MÁY CHỦ MẠNG NỘI BỘ (INTRANET)</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsNetworkModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#854D0E' }}>
                Để máy tính hoặc điện thoại của học viên/giảng viên khác cùng mạng LAN truy cập vào hệ thống bài giảng:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Tên máy chủ chủ quản:</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0B1E36' }}>{networkInfo?.machineName || 'localhost'}</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Địa chỉ IP mạng LAN nội bộ:</div>
                  {networkInfo?.lanIps && networkInfo.lanIps.length > 0 ? (
                    networkInfo.lanIps.map((ip, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <code style={{ fontSize: '14px', fontWeight: 700, color: '#A31A1A' }}>http://{ip}:{networkInfo?.clientPort || 5173}</code>
                        <button
                          className="sha-badge"
                          onClick={() => copyToClipboard(`http://${ip}:${networkInfo?.clientPort || 5173}`, `ip-${idx}`)}
                        >
                          Sao chép link
                        </button>
                      </div>
                    ))
                  ) : (
                    <code style={{ fontSize: '14px', fontWeight: 700, color: '#A31A1A' }}>http://localhost:5173</code>
                  )}
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Chế độ cơ sở dữ liệu:</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#059669' }}>
                    {networkInfo?.storageMode || 'Local Offline Database (metadata.json)'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button className="btn-icon-secondary" onClick={() => setIsNetworkModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. TOAST THÔNG BÁO */}
      {statusMessage.text && (
        <div className={`toast-notification ${statusMessage.type}`}>
          {statusMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 11. FOOTER */}
      <footer className="agency-footer">
        <div className="footer-container">
          <div className="footer-col">
            <h4>TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN - BỘ CÔNG AN</h4>
            <p className="footer-desc">
              Cổng Quản lý và Học tập Bài giảng Điện tử phục vụ công tác giảng dạy, số hóa học liệu,
              nghiên cứu khoa học và huấn luyện nghiệp vụ an ninh trong mạng nội bộ Intranet.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
              Địa chỉ: Km9 Xa lộ Hà Nội, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh
            </p>
          </div>

          <div className="footer-col">
            <h4>KHOA / ĐƠN VỊ ĐÀO TẠO</h4>
            <ul className="footer-links">
              <li><a href="#kho-bai-giang" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Khoa An ninh điều tra</a></li>
              <li><a href="#kho-bai-giang" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Khoa Nghiệp vụ An ninh</a></li>
              <li><a href="#kho-bai-giang" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Khoa An ninh mạng & PCTP CNC</a></li>
              <li><a href="#kho-bai-giang" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Khoa Luật & QLNN về ANTT</a></li>
              <li><a href="#kho-bai-giang" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Khoa Lý luận chính trị</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>HỖ TRỢ KỸ THUẬT LAN</h4>
            <ul className="footer-links">
              <li>Cổng Backend API: <strong>5000</strong></li>
              <li>Cổng Frontend Web: <strong>5173</strong></li>
              <li>Giao thức Stream: <strong>HTTP 206 Partial Content</strong></li>
              <li>Bảo mật học liệu: <strong>Mã băm SHA-256</strong></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Trường Đại học An ninh nhân dân - Bộ Công an. Bản quyền tài liệu và bài giảng lưu hành nội bộ.
        </div>
      </footer>
    </div>
  );
}
