import React, { useState, useEffect } from 'react';
import {
  Award,
  UploadCloud,
  FileText,
  Video,
  Image as ImageIcon,
  Presentation,
  Music,
  Trash2,
  Download,
  Eye,
  PlusCircle,
  ShieldCheck,
  Clock,
  Hash,
  Copy,
  Check,
  FolderKanban,
  Users,
  AlertTriangle,
  Edit,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Lock,
  Unlock,
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield
} from 'lucide-react';
import { lectureService } from '../services/lectureService';
import LectureModal from '../components/lecture/LectureModal';
import Pagination from '../components/common/Pagination';
import { SortableTh, useTableSort } from '../utils/tableSort';

export default function TeacherPortalPage({
  files,
  teachersList,
  currentUser,
  onOpenUpload,
  onDeleteFile,
  onSelectFile,
  onCopyHash,
  copiedHash,
  onSwitchUser
}) {
  const [activeTab, setActiveTab] = useState('lectures'); // 'lectures' | 'materials' | 'colleagues'
  const [lectures, setLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(false);
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [lectureToEdit, setLectureToEdit] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Search, Filter & Pagination State for Lectures
  const [lectureSearch, setLectureSearch] = useState('');
  const [lectureStatusFilter, setLectureStatusFilter] = useState('ALL');
  const [lectureScopeFilter, setLectureScopeFilter] = useState('ALL');
  const [lecturePage, setLecturePage] = useState(1);
  const [lecturePageSize, setLecturePageSize] = useState(8);
  const [expandedLectureFilesId, setExpandedLectureFilesId] = useState(null);

  // Sorting hooks for tables
  const {
    sortKey: lectureSortKey,
    sortDir: lectureSortDir,
    requestSort: requestLectureSort,
    sortItems: sortLectures
  } = useTableSort('id', 'desc', {
    subject: (l) => `${l.subjectCode || ''} ${l.subject || ''} ${l.teacherName || ''}`,
    title: (l) => l.title || '',
    scope: (l) => (l.isPublicAll ? 'Công khai' : (l.assignedClasses || []).join(', ')),
    fileCount: (l) => (l.files ? l.files.length : l.fileCount || 0),
    status: (l) => l.status || '',
    version: (l) => l.version || 1
  });

  const {
    sortKey: subFileSortKey,
    sortDir: subFileSortDir,
    requestSort: requestSubFileSort,
    sortItems: sortSubFiles
  } = useTableSort('originalName', 'asc', {
    originalName: (f) => f.originalName || '',
    fileType: (f) => f.fileType || '',
    fileSize: (f) => f.fileSize || 0,
    classification: (f) => f.classification || 'Nội bộ',
    isDownloadable: (f) => (f.isDownloadable !== false ? 1 : 0)
  });

  const {
    sortKey: matSortKey,
    sortDir: matSortDir,
    requestSort: requestMatSort,
    sortItems: sortMaterials
  } = useTableSort('createdAt', 'desc', {
    category: (f) => f.category || '',
    originalFileName: (f) => f.originalFileName || '',
    classification: (f) => f.classification || 'Lưu hành nội bộ',
    fileSize: (f) => f.fileSize || 0,
    uploader: (f) => f.uploaderName || '',
    createdAt: (f) => f.createdAt || ''
  });

  const {
    sortKey: teachSortKey,
    sortDir: teachSortDir,
    requestSort: requestTeachSort,
    sortItems: sortTeachers
  } = useTableSort('fullName', 'asc', {
    username: (t) => t.username || '',
    fullName: (t) => t.fullName || '',
    department: (t) => t.department || '',
    maxClearance: (t) => t.clearanceLevelOrder || 1,
    status: (t) => t.status || ''
  });

  // Filter state for Tab 2: Materials Repository
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('ALL');
  const [materialClassificationFilter, setMaterialClassificationFilter] = useState('ALL');

  const fetchLectures = async () => {
    setLoadingLectures(true);
    try {
      const res = await lectureService.getLectures(currentUser?.id);
      setLectures(res || []);
    } catch (err) {
      console.error('Error fetching lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [currentUser]);

  const showNotice = (text, type = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleOpenCreateLecture = () => {
    setLectureToEdit(null);
    setLectureModalOpen(true);
  };

  const handleOpenEditLecture = (lecture) => {
    setLectureToEdit(lecture);
    setLectureModalOpen(true);
  };

  const handleDeleteLecture = async (id, title) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa bài giảng:\n"${title}"?`)) return;
    try {
      await lectureService.deleteLecture(id, currentUser?.id || 1);
      showNotice(`Đã xóa/lưu trữ bài giảng "${title}" thành công!`);
      fetchLectures();
    } catch (err) {
      showNotice(err.response?.data?.message || 'Lỗi khi xóa bài giảng.', 'error');
    }
  };

  const handleQuickSetStatus = async (lecture, newStatus) => {
    try {
      await lectureService.updateStatus(lecture.id, newStatus, currentUser?.id || 1);
      showNotice(`Đã cập nhật trạng thái bài giảng sang: ${newStatus}`);
      fetchLectures();
    } catch (err) {
      showNotice(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.', 'error');
    }
  };

  const handleToggleScope = async (lecture) => {
    const nextScope = lecture.isPublicAll ? 'SPECIFIC' : 'ALL';
    try {
      await lectureService.updatePermissions(lecture.id, {
        scope: nextScope,
        classIds: nextScope === 'ALL' ? [] : (lecture.assignedClassIds?.length ? lecture.assignedClassIds : [1])
      }, currentUser?.id || 1);
      showNotice(nextScope === 'ALL' ? 'Đã mở công khai toàn học viện!' : 'Đã giới hạn theo lớp học vụ chỉ định.');
      fetchLectures();
    } catch (err) {
      showNotice('Lỗi khi đổi phạm vi tiếp cận.', 'error');
    }
  };

  const handleToggleFileDownloadable = async (lectureId, fileId, currentIsDl) => {
    try {
      await lectureService.toggleFileDownloadable(lectureId, fileId, !currentIsDl, currentUser?.id || 1);
      showNotice(!currentIsDl ? 'Đã bật quyền tải về học liệu này cho học viên!' : 'Đã khóa tải về: Học viên chỉ được xem trực tuyến.');
      fetchLectures();
    } catch (err) {
      showNotice('Lỗi khi cập nhật quyền tải về file.', 'error');
    }
  };

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

  const thStyle = {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0B1E36',
    borderBottom: '2px solid #CBD5E1',
    background: '#F1F5F9'
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #E2E8F0',
    verticalAlign: 'middle'
  };

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="dvc-tabs-container">
        {/* BANNER GIẢNG VIÊN */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #0B1E36 0%, #7F1D1D 100%)',
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
                <Award size={26} color="#FFFFFF" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  STUDIO BIÊN SOẠN & QUẢN TRỊ BÀI GIẢNG ĐIỆN TỬ
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
                  Cán bộ Giảng viên: <strong style={{ color: '#FEF08A' }}>{currentUser?.fullName || 'TS. Nguyễn Văn An'}</strong> •
                  Vai trò: <strong style={{ color: '#86EFAC' }}>{currentUser?.role === 'SUPER_ADMIN' ? 'Chỉ huy / Quản trị' : 'Giảng viên Sĩ quan'}</strong> •
                  Khoa: <strong style={{ color: '#BFDBFE' }}>{currentUser?.department || 'Khoa An ninh điều tra'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenCreateLecture}
              className="btn-upload-primary"
              style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
            >
              <PlusCircle size={16} />
              <span>Tạo Bài Giảng Mới</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="btn-icon-secondary"
              style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <UploadCloud size={16} />
              <span>Nạp File Học Liệu (PDF/PPT/Video/Ảnh)</span>
            </button>
          </div>
        </div>

        {/* FLOATING ACTION NOTIFICATION TOAST */}
        {actionNotice && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: actionNotice.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: actionNotice.type === 'error' ? '#991B1B' : '#166534',
            border: `1.5px solid ${actionNotice.type === 'error' ? '#F87171' : '#4ADE80'}`,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {actionNotice.type === 'error' ? <XCircle size={18} color="#DC2626" /> : <CheckCircle2 size={18} color="#16A34A" />}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* THÔNG BÁO CHÍNH SÁCH BẢO VỆ BẢN QUYỀN SỐ */}
        <div className="teacher-panel-notice" style={{ margin: '16px 24px' }}>
          <ShieldCheck size={18} />
          <span>Học liệu số tải lên được lưu nội bộ trên máy chủ, mã hóa tính SHA-256 bất biến và bảo đảm đúng phân cấp bảo mật CAND.</span>
        </div>

        {/* SUB TABS GIẢNG VIÊN */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setActiveTab('lectures')}
            className={`btn-filter-pill ${activeTab === 'lectures' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FolderKanban size={15} />
            <span>1. Quản lý Bài giảng Điện tử ({lectures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`btn-filter-pill ${activeTab === 'materials' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>2. Kho Học liệu Đã Tải Lên ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colleagues')}
            className={`btn-filter-pill ${activeTab === 'colleagues' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>3. Đội ngũ Giảng viên cùng Khoa ({teachersList.length})</span>
          </button>
        </div>

        {/* TAB 1: QUẢN LÝ BÀI GIẢNG ĐIỆN TỬ */}
        {activeTab === 'lectures' && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: 0 }}>
                  Danh Mục Bài Giảng Điện Tử Tích Hợp Đa Học Liệu
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                  Giảng viên có toàn quyền mở công khai cho tất cả học viên, khóa bài giảng, giới hạn cho lớp cụ thể và phân quyền tải/chỉ xem tài liệu.
                </p>
              </div>

              <button
                onClick={handleOpenCreateLecture}
                className="btn-upload-primary"
                style={{ fontSize: '12.5px', padding: '7px 14px', cursor: 'pointer' }}
              >
                <PlusCircle size={15} />
                <span>+ Thêm Bài Giảng Mới</span>
              </button>
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên bài giảng, môn học, mô tả..."
                  value={lectureSearch}
                  onChange={(e) => { setLectureSearch(e.target.value); setLecturePage(1); }}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px'
                  }}
                />
              </div>

              {/* Filter by Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Trạng thái:</span>
                <select
                  value={lectureStatusFilter}
                  onChange={(e) => { setLectureStatusFilter(e.target.value); setLecturePage(1); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0B1E36',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PUBLISHED">🟢 Đang phát hành</option>
                  <option value="LOCKED">🔒 Đã khóa (LOCKED)</option>
                  <option value="CLOSED">🔴 Đã kết thúc / Đóng</option>
                  <option value="DRAFT">🟡 Bản nháp</option>
                </select>
              </div>

              {/* Filter by Scope */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Phạm vi:</span>
                <select
                  value={lectureScopeFilter}
                  onChange={(e) => { setLectureScopeFilter(e.target.value); setLecturePage(1); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0B1E36',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="ALL">Tất cả phạm vi</option>
                  <option value="PUBLIC">🌐 Công khai toàn học viện</option>
                  <option value="RESTRICTED">🔒 Giới hạn lớp cụ thể</option>
                </select>
              </div>

              {(lectureSearch || lectureStatusFilter !== 'ALL' || lectureScopeFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => { setLectureSearch(''); setLectureStatusFilter('ALL'); setLectureScopeFilter('ALL'); setLecturePage(1); }}
                  className="btn-action-delete"
                  style={{ padding: '6px 10px', fontSize: '11.5px' }}
                >
                  Đặt lại lọc
                </button>
              )}
            </div>

            {loadingLectures ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                Đang tải danh sách bài giảng...
              </div>
            ) : lectures.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                <p style={{ fontWeight: 600, color: '#475569' }}>Chưa có bài giảng nào được tạo.</p>
                <button
                  onClick={handleOpenCreateLecture}
                  className="btn-upload-primary"
                  style={{ marginTop: '10px' }}
                >
                  Tạo bài giảng đầu tiên ngay
                </button>
              </div>
            ) : (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <SortableTh columnKey="subject" sortKey={lectureSortKey} sortDir={lectureSortDir} onSort={requestLectureSort} style={thStyle} width="145px">
                          Môn học & Giảng viên
                        </SortableTh>
                        <SortableTh columnKey="title" sortKey={lectureSortKey} sortDir={lectureSortDir} onSort={requestLectureSort} style={thStyle} minWidth="240px">
                          Tên bài giảng điện tử
                        </SortableTh>
                        <SortableTh columnKey="scope" sortKey={lectureSortKey} sortDir={lectureSortDir} onSort={requestLectureSort} style={thStyle} width="165px">
                          Phạm vi tiếp cận
                        </SortableTh>
                        <SortableTh columnKey="fileCount" sortKey={lectureSortKey} sortDir={lectureSortDir} onSort={requestLectureSort} style={thStyle} width="115px">
                          Học liệu
                        </SortableTh>
                        <SortableTh columnKey="status" sortKey={lectureSortKey} sortDir={lectureSortDir} onSort={requestLectureSort} style={thStyle} width="140px">
                          Trạng thái
                        </SortableTh>
                        <SortableTh columnKey="version" sortKey={lectureSortKey} sortDir={lectureSortDir} onSort={requestLectureSort} style={thStyle} width="70px" align="center">
                          Phiên bản
                        </SortableTh>
                        <th style={{ ...thStyle, width: '180px', textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = lectures.filter((l) => {
                          const q = lectureSearch.trim().toLowerCase();
                          const matchesSearch = !q ||
                            l.title?.toLowerCase().includes(q) ||
                            l.subjectCode?.toLowerCase().includes(q) ||
                            l.subject?.toLowerCase().includes(q) ||
                            l.description?.toLowerCase().includes(q);

                          const matchesStatus = lectureStatusFilter === 'ALL' || l.status === lectureStatusFilter;

                          const isPub = l.isPublicAll || (!l.assignedClasses || l.assignedClasses.length === 0);
                          const matchesScope = lectureScopeFilter === 'ALL' ||
                            (lectureScopeFilter === 'PUBLIC' && isPub) ||
                            (lectureScopeFilter === 'RESTRICTED' && !isPub);

                          return matchesSearch && matchesStatus && matchesScope;
                        });

                        const sorted = sortLectures(filtered);
                        const paginated = sorted.slice((lecturePage - 1) * lecturePageSize, lecturePage * lecturePageSize);

                        if (paginated.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                                Không tìm thấy bài giảng nào khớp với điều kiện tìm kiếm.
                              </td>
                            </tr>
                          );
                        }

                        return paginated.map((l) => {
                          const isPublished = l.status === 'PUBLISHED';
                          const isLocked = l.status === 'LOCKED';
                          const isClosed = l.status === 'CLOSED';
                          const isPublic = l.isPublicAll || (!l.assignedClasses || l.assignedClasses.length === 0);
                          const isExpanded = expandedLectureFilesId === l.id;
                          const lectureFiles = l.files || [];

                          return (
                            <React.Fragment key={l.id}>
                              <tr style={{ background: isLocked ? '#FFFBEB' : '#FFFFFF', transition: 'background 0.15s' }}>
                                {/* Cột 1: Môn học & Giảng viên */}
                                <td style={tdStyle}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      padding: '2px 8px',
                                      borderRadius: '5px',
                                      border: '1px solid #FECACA',
                                      display: 'inline-block',
                                      width: 'fit-content'
                                    }}>
                                      {l.subjectCode || 'ANDT_301'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                                      {l.subject || 'Nghiệp vụ'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#0B1E36', fontWeight: 700, marginTop: '2px' }}>
                                      👨‍🏫 {l.teacherName || 'TS. Nguyễn Văn An'}
                                    </span>
                                  </div>
                                </td>

                                {/* Cột 2: Tên bài giảng & Mô tả */}
                                <td style={tdStyle}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 800, color: '#0B1E36', fontSize: '13.5px', lineHeight: 1.3 }}>
                                      {l.title}
                                    </span>
                                    {isLocked && (
                                      <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '4px', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                                        <Lock size={10} /> ĐÃ KHÓA
                                      </span>
                                    )}
                                  </div>
                                  {l.description && (
                                    <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400, marginTop: '3px', lineHeight: 1.35 }} className="line-clamp-2">
                                      {l.description}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '3px' }}>
                                    🏛️ {l.departmentName || 'Khoa Nghiệp vụ An ninh'}
                                  </div>
                                </td>

                                {/* Cột 3: Phạm vi tiếp cận gọn gàng, loại bỏ chữ thừa */}
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                    {isPublic ? (
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          background: '#DEF7EC',
                                          color: '#03543F',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          border: '1px solid #A7F3D0',
                                          width: '108px',
                                          boxSizing: 'border-box'
                                        }}
                                        title="Bài giảng được công khai cho toàn thể học viên trong học viện"
                                      >
                                        <Globe size={12} />
                                        <span>Toàn học viện</span>
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          background: '#EFF6FF',
                                          color: '#1D4ED8',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          border: '1px solid #BFDBFE',
                                          width: '108px',
                                          boxSizing: 'border-box'
                                        }}
                                        title={(l.assignedClasses || []).join('\n')}
                                      >
                                        <Users size={12} />
                                        <span>Chỉ định {(l.assignedClasses || []).length} lớp</span>
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleToggleScope(l)}
                                      style={{
                                        fontSize: '10.5px',
                                        color: '#2563EB',
                                        background: '#F8FAFC',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '5px',
                                        padding: '3px 8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        width: '108px',
                                        boxSizing: 'border-box',
                                        textAlign: 'center'
                                      }}
                                      title={isPublic ? 'Bấm để chuyển sang giới hạn theo lớp học vụ' : 'Bấm để mở công khai toàn học viện'}
                                    >
                                      ⇄ Đổi phạm vi
                                    </button>
                                  </div>
                                </td>

                                {/* Cột 4: Học liệu */}
                                <td style={tdStyle}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedLectureFilesId(isExpanded ? null : l.id)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: isExpanded ? '#0B1E36' : '#F0FDFA',
                                        color: isExpanded ? '#FFFFFF' : '#0F766E',
                                        border: '1px solid #99F6E4',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title="Bấm để xem chi tiết học liệu và chỉnh quyền tải về"
                                    >
                                      <span>📁 {l.fileCount || lectureFiles.length} tệp</span>
                                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                  </div>
                                </td>

                                {/* Cột 5: Trạng thái & Khóa nhanh - Xếp dọc đều đặn, đối xứng hoàn hảo */}
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px',
                                      width: '98px',
                                      height: '24px',
                                      borderRadius: '5px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      background: isPublished ? '#DEF7EC' : (isLocked ? '#FEF3C7' : '#FEE2E2'),
                                      color: isPublished ? '#03543F' : (isLocked ? '#92400E' : '#991B1B'),
                                      border: isPublished ? '1px solid #86EFAC' : (isLocked ? '1px solid #FCD34D' : '1px solid #FCA5A5'),
                                      whiteSpace: 'nowrap',
                                      boxSizing: 'border-box'
                                    }}>
                                      {isPublished && <CheckCircle2 size={11} />}
                                      {isLocked && <Lock size={11} />}
                                      {isClosed && <XCircle size={11} />}
                                      <span>{isPublished ? 'Đang phát hành' : (isLocked ? 'Đang khóa' : 'Đã đóng')}</span>
                                    </span>

                                    {isLocked ? (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickSetStatus(l, 'PUBLISHED')}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          width: '98px',
                                          height: '24px',
                                          borderRadius: '5px',
                                          background: '#DEF7EC',
                                          color: '#03543F',
                                          border: '1px solid #86EFAC',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          fontSize: '10.5px',
                                          whiteSpace: 'nowrap',
                                          boxSizing: 'border-box'
                                        }}
                                        title="Mở khóa bài giảng cho học viên vào học"
                                      >
                                        <Unlock size={11} />
                                        <span>Mở khóa</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickSetStatus(l, 'LOCKED')}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          width: '98px',
                                          height: '24px',
                                          borderRadius: '5px',
                                          background: '#FEF3C7',
                                          color: '#92400E',
                                          border: '1px solid #FCD34D',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          fontSize: '10.5px',
                                          whiteSpace: 'nowrap',
                                          boxSizing: 'border-box'
                                        }}
                                        title="Khóa ngay bài giảng, học viên không thể truy cập"
                                      >
                                        <Lock size={11} />
                                        <span>Khóa bài</span>
                                      </button>
                                    )}

                                    {!isClosed ? (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickSetStatus(l, 'CLOSED')}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          width: '98px',
                                          height: '24px',
                                          borderRadius: '5px',
                                          background: '#FEE2E2',
                                          color: '#991B1B',
                                          border: '1px solid #FCA5A5',
                                          cursor: 'pointer',
                                          fontWeight: 600,
                                          fontSize: '10.5px',
                                          whiteSpace: 'nowrap',
                                          boxSizing: 'border-box'
                                        }}
                                        title="Kết thúc bài giảng"
                                      >
                                        <XCircle size={11} />
                                        <span>Đóng bài</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickSetStatus(l, 'PUBLISHED')}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          width: '98px',
                                          height: '24px',
                                          borderRadius: '5px',
                                          background: '#DEF7EC',
                                          color: '#03543F',
                                          border: '1px solid #86EFAC',
                                          cursor: 'pointer',
                                          fontWeight: 600,
                                          fontSize: '10.5px',
                                          whiteSpace: 'nowrap',
                                          boxSizing: 'border-box'
                                        }}
                                        title="Mở lại bài giảng"
                                      >
                                        <CheckCircle2 size={11} />
                                        <span>Mở lại</span>
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#64748B', textAlign: 'center', fontSize: '12px' }}>
                                  v{l.version || 1}
                                </td>

                                {/* Cột 7: Thao tác xếp dọc, bằng nhau tuyệt đối, chống mất đối xứng */}
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                    <a
                                      href={`#/study/${l.id}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        width: '76px',
                                        height: '25px',
                                        borderRadius: '5px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#FFFFFF',
                                        background: 'linear-gradient(135deg, #B91C1C 0%, #881337 100%)',
                                        textDecoration: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(185, 28, 28, 0.25)',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box'
                                      }}
                                      title="Vào phòng học bài giảng"
                                    >
                                      <PlayCircle size={12} />
                                      <span>Vào học</span>
                                    </a>

                                    <button
                                      onClick={() => handleOpenEditLecture(l)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        width: '76px',
                                        height: '25px',
                                        borderRadius: '5px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#92400E',
                                        background: '#FEF3C7',
                                        border: '1px solid #FCD34D',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box'
                                      }}
                                      title="Chỉnh sửa bài giảng"
                                    >
                                      <Edit size={12} />
                                      <span>Sửa</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteLecture(l.id, l.title)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        width: '76px',
                                        height: '25px',
                                        borderRadius: '5px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#991B1B',
                                        background: '#FEE2E2',
                                        border: '1px solid #FCA5A5',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box'
                                      }}
                                      title="Xóa bài giảng"
                                    >
                                      <Trash2 size={12} />
                                      <span>Xóa</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* SUB-TABLE: EXPANDED LECTURE FILES WITH DOWNLOADABLE PERMISSIONS */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} style={{ background: '#F8FAFC', padding: '12px 20px', borderBottom: '2px solid #CBD5E1' }}>
                                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <strong style={{ fontSize: '12.5px', color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <FileText size={15} color="#2563EB" />
                                          Danh sách tài liệu học tập thuộc bài giảng & Thiết lập quyền tải về máy:
                                        </strong>
                                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                                          Bấm nút để Bật/Tắt quyền cho phép học viên tải tài liệu về máy tính
                                        </span>
                                      </div>

                                      {lectureFiles.length === 0 ? (
                                        <div style={{ padding: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                          Bài giảng này chưa đính kèm file học liệu nào. Bấm "Sửa" để thêm file.
                                        </div>
                                      ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                          <thead>
                                            <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                                              <SortableTh columnKey="originalName" sortKey={subFileSortKey} sortDir={subFileSortDir} onSort={requestSubFileSort} style={{ padding: '6px 10px', color: '#475569', fontWeight: 700 }}>
                                                Tên tập tin
                                              </SortableTh>
                                              <SortableTh columnKey="fileType" sortKey={subFileSortKey} sortDir={subFileSortDir} onSort={requestSubFileSort} style={{ padding: '6px 10px', color: '#475569', fontWeight: 700 }} width="85px">
                                                Loại
                                              </SortableTh>
                                              <SortableTh columnKey="fileSize" sortKey={subFileSortKey} sortDir={subFileSortDir} onSort={requestSubFileSort} style={{ padding: '6px 10px', color: '#475569', fontWeight: 700 }} width="95px">
                                                Dung lượng
                                              </SortableTh>
                                              <SortableTh columnKey="classification" sortKey={subFileSortKey} sortDir={subFileSortDir} onSort={requestSubFileSort} style={{ padding: '6px 10px', color: '#475569', fontWeight: 700 }} width="110px">
                                                Bảo mật
                                              </SortableTh>
                                              <SortableTh columnKey="isDownloadable" sortKey={subFileSortKey} sortDir={subFileSortDir} onSort={requestSubFileSort} style={{ padding: '6px 10px', color: '#475569', fontWeight: 700 }} width="140px" align="center">
                                                Quyền học viên
                                              </SortableTh>
                                              <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '130px' }}>
                                                Xem / Mở file
                                              </th>
                                              <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '140px' }}>
                                                Chuyển đổi quyền tải
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {sortSubFiles(lectureFiles).map((file) => {
                                              const canDl = file.isDownloadable !== false;
                                              const fileObj = {
                                                id: file.fileId,
                                                fileId: file.fileId,
                                                originalFileName: file.originalName,
                                                originalName: file.originalName,
                                                fileSize: file.fileSize,
                                                fileType: file.fileType,
                                                category: file.fileType?.includes('VIDEO') ? 'video' :
                                                          file.fileType?.includes('IMAGE') ? 'image' :
                                                          file.fileType?.includes('AUDIO') ? 'audio' : 'document',
                                                classification: file.classification,
                                                isDownloadable: file.isDownloadable
                                              };

                                              return (
                                                <tr key={file.fileId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                  <td style={{ padding: '6px 10px', fontWeight: 600, color: '#0B1E36' }}>
                                                    <button
                                                      type="button"
                                                      onClick={() => onSelectFile && onSelectFile(fileObj)}
                                                      style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: 0,
                                                        color: '#1D4ED8',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        textDecoration: 'underline',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                      }}
                                                      title="Bấm để mở và xem nội dung file này"
                                                    >
                                                      <FileText size={13} color="#2563EB" />
                                                      <span>{file.originalName}</span>
                                                    </button>
                                                  </td>
                                                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748B' }}>
                                                    {file.fileType}
                                                  </td>
                                                  <td style={{ padding: '6px 10px', color: '#64748B' }}>
                                                    {formatFileSize(file.fileSize)}
                                                  </td>
                                                  <td style={{ padding: '6px 10px' }}>
                                                    <span style={{
                                                      fontSize: '10.5px',
                                                      fontWeight: 700,
                                                      padding: '2px 7px',
                                                      borderRadius: '4px',
                                                      background: file.classification?.toLowerCase().includes('tuyệt mật') ? '#FEE2E2' :
                                                                  file.classification?.toLowerCase().includes('tối mật') ? '#FFEDD5' :
                                                                  file.classification?.toLowerCase().includes('mật') ? '#FEF3C7' : '#DBEAFE',
                                                      color: file.classification?.toLowerCase().includes('tuyệt mật') ? '#991B1B' :
                                                             file.classification?.toLowerCase().includes('tối mật') ? '#C2410C' :
                                                             file.classification?.toLowerCase().includes('mật') ? '#B45309' : '#1E40AF',
                                                      border: '1px solid',
                                                      borderColor: file.classification?.toLowerCase().includes('tuyệt mật') ? '#FCA5A5' :
                                                                   file.classification?.toLowerCase().includes('tối mật') ? '#FDBA74' :
                                                                   file.classification?.toLowerCase().includes('mật') ? '#FCD34D' : '#BFDBFE'
                                                    }}>
                                                      {file.classification || 'Nội bộ'}
                                                    </span>
                                                  </td>
                                                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                                    <span style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: '3px',
                                                      padding: '2px 8px',
                                                      borderRadius: '4px',
                                                      fontSize: '11px',
                                                      fontWeight: 700,
                                                      background: canDl ? '#DEF7EC' : '#FEF3C7',
                                                      color: canDl ? '#03543F' : '#92400E'
                                                    }}>
                                                      {canDl ? '📥 Được phép tải' : '👁️ Chỉ xem (Khóa tải)'}
                                                    </span>
                                                  </td>
                                                  {/* THAO TÁC XEM / MỞ FILE DÀNH CHO GIẢNG VIÊN */}
                                                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                      <button
                                                        type="button"
                                                        onClick={() => onSelectFile && onSelectFile(fileObj)}
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '3px',
                                                          padding: '3px 8px',
                                                          borderRadius: '4px',
                                                          fontSize: '11px',
                                                          fontWeight: 700,
                                                          background: '#EFF6FF',
                                                          color: '#1D4ED8',
                                                          border: '1px solid #BFDBFE',
                                                          cursor: 'pointer'
                                                        }}
                                                        title="Xem trực tiếp tài liệu trong trình đọc"
                                                      >
                                                        <Eye size={12} />
                                                        <span>Xem</span>
                                                      </button>
                                                      <a
                                                        href={`/api/media/stream/${file.fileId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          padding: '3px 6px',
                                                          borderRadius: '4px',
                                                          fontSize: '11px',
                                                          background: '#F1F5F9',
                                                          color: '#475569',
                                                          border: '1px solid #CBD5E1',
                                                          textDecoration: 'none'
                                                        }}
                                                        title="Mở tài liệu trong tab mới"
                                                      >
                                                        <ExternalLink size={12} />
                                                      </a>
                                                    </div>
                                                  </td>
                                                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleFileDownloadable(l.id, file.fileId, canDl)}
                                                      style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '5px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        border: '1px solid',
                                                        borderColor: canDl ? '#F59E0B' : '#10B981',
                                                        background: canDl ? '#FFFBEB' : '#ECFDF5',
                                                        color: canDl ? '#B45309' : '#047857'
                                                      }}
                                                      title="Bấm để đổi quyền tải của học viên"
                                                    >
                                                      {canDl ? 'Khóa tải (Chuyển sang chỉ xem)' : 'Mở quyền cho tải về'}
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION FOR LECTURES */}
                <Pagination
                  page={lecturePage}
                  pageSize={lecturePageSize}
                  totalCount={lectures.filter((l) => {
                    const q = lectureSearch.trim().toLowerCase();
                    const matchesSearch = !q ||
                      l.title?.toLowerCase().includes(q) ||
                      l.subjectCode?.toLowerCase().includes(q) ||
                      l.subject?.toLowerCase().includes(q) ||
                      l.description?.toLowerCase().includes(q);

                    const matchesStatus = lectureStatusFilter === 'ALL' || l.status === lectureStatusFilter;

                    const isPub = l.isPublicAll || (!l.assignedClasses || l.assignedClasses.length === 0);
                    const matchesScope = lectureScopeFilter === 'ALL' ||
                      (lectureScopeFilter === 'PUBLIC' && isPub) ||
                      (lectureScopeFilter === 'RESTRICTED' && !isPub);

                    return matchesSearch && matchesStatus && matchesScope;
                  }).length}
                  onPageChange={(p) => setLecturePage(p)}
                  onPageSizeChange={(sz) => { setLecturePageSize(sz); setLecturePage(1); }}
                  pageSizeOptions={[5, 8, 12, 20]}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DANH SÁCH HỌC LIỆU GIẢNG VIÊN */}
        {activeTab === 'materials' && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: 0 }}>
                  Kho Lưu Trữ Học Liệu Số (PDF, Slide PPT, Video, Ảnh, Audio)
                </h4>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Tổng dung lượng vật lý trên ổ cứng: <strong>{(files.reduce((a, b) => a + (b.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB</strong>
                </span>
              </div>

              <button
                onClick={onOpenUpload}
                className="btn-upload-primary"
                style={{ fontSize: '12.5px', padding: '7px 14px', cursor: 'pointer' }}
              >
                <UploadCloud size={15} />
                <span>+ Nạp Học Liệu Mới</span>
              </button>
            </div>

            {/* SEARCH & FILTER TOOLBAR FOR MATERIALS */}
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên học liệu, định dạng..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px'
                  }}
                />
              </div>

              {/* Filter by Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Định dạng:</span>
                <select
                  value={materialCategoryFilter}
                  onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    background: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Tất cả định dạng</option>
                  <option value="video">🎥 Video bài giảng</option>
                  <option value="document">📄 Giáo trình / PDF</option>
                  <option value="image">🖼️ Slide & Sơ đồ</option>
                  <option value="audio">🎵 Ghi âm bài giảng</option>
                </select>
              </div>

              {/* Filter by Classification (Requirement 3) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cấp bảo mật:</span>
                <select
                  value={materialClassificationFilter}
                  onChange={(e) => setMaterialClassificationFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
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
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <SortableTh columnKey="category" sortKey={matSortKey} sortDir={matSortDir} onSort={requestMatSort} style={thStyle} width="110px">
                      Định dạng
                    </SortableTh>
                    <SortableTh columnKey="originalFileName" sortKey={matSortKey} sortDir={matSortDir} onSort={requestMatSort} style={thStyle} minWidth="220px">
                      Tên tập tin bài giảng
                    </SortableTh>
                    <SortableTh columnKey="classification" sortKey={matSortKey} sortDir={matSortDir} onSort={requestMatSort} style={thStyle} width="140px">
                      Cấp độ bảo mật
                    </SortableTh>
                    <SortableTh columnKey="fileSize" sortKey={matSortKey} sortDir={matSortDir} onSort={requestMatSort} style={thStyle} width="110px">
                      Dung lượng
                    </SortableTh>
                    <SortableTh columnKey="uploader" sortKey={matSortKey} sortDir={matSortDir} onSort={requestMatSort} style={thStyle} width="170px">
                      Người đăng & Thư mục
                    </SortableTh>
                    <SortableTh columnKey="createdAt" sortKey={matSortKey} sortDir={matSortDir} onSort={requestMatSort} style={thStyle} width="140px">
                      Ngày đăng tải
                    </SortableTh>
                    <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = files.filter((file) => {
                      const q = materialSearch.trim().toLowerCase();
                      const matchesSearch = !q ||
                        file.originalFileName?.toLowerCase().includes(q) ||
                        file.category?.toLowerCase().includes(q);

                      const matchesCat = materialCategoryFilter === 'ALL' || file.category === materialCategoryFilter;

                      let matchesClass = true;
                      if (materialClassificationFilter !== 'ALL') {
                        const cName = (file.classification || '').toLowerCase();
                        if (materialClassificationFilter === 'TUYET_MAT') matchesClass = cName.includes('tuyệt mật');
                        else if (materialClassificationFilter === 'TOI_MAT') matchesClass = cName.includes('tối mật');
                        else if (materialClassificationFilter === 'MAT') matchesClass = cName.includes('mật') && !cName.includes('tuyệt') && !cName.includes('tối');
                        else if (materialClassificationFilter === 'NOI_BO') matchesClass = cName.includes('nội bộ');
                        else if (materialClassificationFilter === 'CONG_KHAI') matchesClass = cName.includes('công khai');
                      }

                      return matchesSearch && matchesCat && matchesClass;
                    });

                    const sorted = sortMaterials(filtered);

                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                            Không tìm thấy học liệu nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      );
                    }

                    return sorted.map((file) => {
                      const cName = file.classification || 'Lưu hành nội bộ';
                      const isTuyetMat = cName.toLowerCase().includes('tuyệt mật');
                      const isToiMat = cName.toLowerCase().includes('tối mật');
                      const isMat = cName.toLowerCase().includes('mật') && !isTuyetMat && !isToiMat;
                      const isCongKhai = cName.toLowerCase().includes('công khai');

                      return (
                        <tr key={file.id}>
                          <td style={tdStyle}>
                            <span className={`type-indicator ${file.category}`} style={{ display: 'inline-flex', padding: '3px 8px', fontSize: '11px', borderRadius: '4px', fontWeight: 700 }}>
                              {file.category === 'video' ? 'VIDEO' : file.category === 'document' ? 'PDF' : file.category === 'image' ? 'ẢNH' : 'SLIDE / AUDIO'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>
                            <button
                              type="button"
                              onClick={() => onSelectFile(file)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: '#0B1E36',
                                fontWeight: 700,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              title="Bấm để xem trực tiếp tài liệu"
                            >
                              <span>{file.originalFileName}</span>
                            </button>
                          </td>
                          {/* Cột Cấp độ bảo mật CAND */}
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
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
                          </td>
                          <td style={{ ...tdStyle, color: '#475569', fontWeight: 600 }}>
                            {formatFileSize(file.fileSize)}
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 700, color: '#0B1E36', fontSize: '12px' }}>
                                {file.uploaderName || 'TS. Nguyễn Văn An'}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>
                                📁 {file.storagePath?.split('/')[1] || (file.category === 'video' ? 'Videos' : file.category === 'document' ? 'PDFs' : 'Storage')}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, fontSize: '12.5px', color: '#64748B' }}>
                            {formatDate(file.createdAt)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              <button
                                onClick={() => onSelectFile(file)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  width: '72px',
                                  height: '25px',
                                  borderRadius: '5px',
                                  background: '#ECFDF5',
                                  color: '#065F46',
                                  border: '1px solid #A7F3D0',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxSizing: 'border-box',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Xem trực tiếp tài liệu"
                              >
                                <Eye size={12} />
                                <span>Xem</span>
                              </button>

                              <a
                                href={`/api/media/download/${file.id}`}
                                download={file.originalFileName}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  width: '72px',
                                  height: '25px',
                                  borderRadius: '5px',
                                  background: '#F1F5F9',
                                  color: '#334155',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  boxSizing: 'border-box',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Tải học liệu về máy tính"
                              >
                                <Download size={12} />
                                <span>Tải về</span>
                              </a>

                              <button
                                onClick={() => onDeleteFile(file.id, file.originalFileName)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  width: '72px',
                                  height: '25px',
                                  borderRadius: '5px',
                                  background: '#FEF2F2',
                                  color: '#991B1B',
                                  border: '1px solid #FECACA',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxSizing: 'border-box',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Xóa học liệu khỏi hệ thống"
                              >
                                <Trash2 size={12} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ĐỘI NGŨ GIẢNG VIÊN CÙNG KHOA */}
        {activeTab === 'colleagues' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#A31A1A" />
              Danh Sách Đội Ngũ Cán Bộ Giảng Viên Học Viện CAND (T04)
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <SortableTh columnKey="username" sortKey={teachSortKey} sortDir={teachSortDir} onSort={requestTeachSort} style={thStyle} width="120px">
                      Mã định danh
                    </SortableTh>
                    <SortableTh columnKey="fullName" sortKey={teachSortKey} sortDir={teachSortDir} onSort={requestTeachSort} style={thStyle}>
                      Học hàm / Học vị / Họ tên
                    </SortableTh>
                    <SortableTh columnKey="department" sortKey={teachSortKey} sortDir={teachSortDir} onSort={requestTeachSort} style={thStyle} width="180px">
                      Khoa phụ trách
                    </SortableTh>
                    <SortableTh columnKey="maxClearance" sortKey={teachSortKey} sortDir={teachSortDir} onSort={requestTeachSort} style={thStyle} width="140px">
                      Cấp độ an ninh
                    </SortableTh>
                    <SortableTh columnKey="status" sortKey={teachSortKey} sortDir={teachSortDir} onSort={requestTeachSort} style={thStyle} width="120px">
                      Trạng thái
                    </SortableTh>
                    <th style={{ ...thStyle, textAlign: 'center', width: '130px' }}>Thao tác kiểm thử</th>
                  </tr>
                </thead>
                <tbody>
                  {sortTeachers(teachersList).map((t) => {
                    const isSelf = currentUser?.username === t.username;
                    return (
                      <tr key={t.id} style={{ background: isSelf ? '#FEF2F2' : '#FFFFFF' }}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>
                          {t.username}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>
                          {t.fullName} {isSelf && <span style={{ fontSize: '11px', color: '#A31A1A', fontWeight: 800 }}>(Đang chọn)</span>}
                        </td>
                        <td style={tdStyle}>{t.department || 'Khoa An ninh điều tra'}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: t.clearanceLevelOrder === 4 ? '#FEE2E2' : t.clearanceLevelOrder === 3 ? '#FEF3C7' : '#DBEAFE',
                            color: t.clearanceLevelOrder === 4 ? '#991B1B' : t.clearanceLevelOrder === 3 ? '#92400E' : '#1E40AF'
                          }}>
                            {t.maxClearance || 'Lưu hành nội bộ'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: '4px' }}>
                            ĐANG GIẢNG DẠY
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {!isSelf ? (
                            <button
                              onClick={() => onSwitchUser(t.username)}
                              style={{
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                borderRadius: '6px',
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              ⚡ Đổi vai giảng viên này
                            </button>
                          ) : (
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#A31A1A' }}>
                              ✓ Đang đăng nhập
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CRUD BÀI GIẢNG */}
      <LectureModal
        isOpen={lectureModalOpen}
        onClose={() => setLectureModalOpen(false)}
        lectureToEdit={lectureToEdit}
        onSaved={fetchLectures}
        currentUser={currentUser}
      />
    </main>
  );
}
