import React, { useState } from 'react';
import {
  Award,
  UploadCloud,
  FileText,
  Video,
  Image as ImageIcon,
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
  AlertTriangle
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'colleagues'

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
    borderBottom: '2px solid #E2E8F0',
    background: '#F1F5F9'
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #E2E8F0'
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
                  PHÒNG LÀM VIỆC & BIÊN SOẠN BÀI GIẢNG GIẢNG VIÊN
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
                  Cán bộ Giảng viên: <strong style={{ color: '#FEF08A' }}>{currentUser?.fullName || 'TS. Nguyễn Văn An'}</strong> •
                  Vai trò: <strong style={{ color: '#86EFAC' }}>{currentUser?.role === 'SUPER_ADMIN' ? 'Chỉ huy Ban Giám hiệu' : 'Giảng viên Sĩ quan'}</strong> •
                  Khoa phụ trách: <strong style={{ color: '#BFDBFE' }}>Khoa An ninh điều tra</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onOpenUpload}
              className="btn-upload-primary"
              style={{ padding: '8px 18px', fontSize: '13.5px', cursor: 'pointer' }}
            >
              <UploadCloud size={16} />
              <span>Đăng tải bài giảng / Học liệu mới</span>
            </button>
          </div>
        </div>

        {/* THÔNG BÁO QUYỀN BIÊN SOẠN */}
        <div className="teacher-panel-notice" style={{ margin: '16px 24px' }}>
          <ShieldCheck size={18} />
          <span>Hệ thống áp dụng chính sách bảo vệ bản quyền số nội bộ: Tập tin sau khi tải lên được tính mã băm SHA-256 tự động, phân cấp quyền truy cập theo Section 34, 45 Quy chế đào tạo CAND.</span>
        </div>

        {/* SUB TABS GIẢNG VIÊN */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setActiveTab('materials')}
            className={`btn-filter-pill ${activeTab === 'materials' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FolderKanban size={15} />
            <span>Học liệu đã đăng tải ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colleagues')}
            className={`btn-filter-pill ${activeTab === 'colleagues' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>Đội ngũ Giảng viên cùng Khoa ({teachersList.length})</span>
          </button>
        </div>

        {/* TAB 1: DANH SÁCH HỌC LIỆU GIẢNG VIÊN */}
        {activeTab === 'materials' && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban size={18} color="#A31A1A" />
                Danh Mục Các Tập Tin Bài Giảng Đã Lưu Trữ Trên Máy Chủ
              </h4>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                Tổng dung lượng: <strong>{(files.reduce((a, b) => a + (b.fileSize || 0), 0) / (1024 * 1024)).toFixed(1)} MB</strong>
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Định dạng</th>
                    <th style={thStyle}>Tên tập tin bài giảng</th>
                    <th style={thStyle}>Dung lượng</th>
                    <th style={thStyle}>Mã băm SHA-256</th>
                    <th style={thStyle}>Ngày đăng tải</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => (
                    <tr key={file.id}>
                      <td style={tdStyle}>
                        <span className={`type-indicator ${file.category}`} style={{ display: 'inline-flex', padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }}>
                          {file.category === 'video' ? 'VIDEO' : file.category === 'document' ? 'PDF' : file.category === 'image' ? 'ẢNH' : 'AUDIO'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>
                        {file.originalFileName}
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td style={tdStyle}>
                        <span
                          className="sha-badge"
                          title="Bấm để sao chép SHA-256"
                          onClick={() => onCopyHash(file.checksum, file.id)}
                        >
                          {copiedHash === file.id ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                          {file.checksum ? file.checksum.substring(0, 10) + '...' : 'N/A'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12.5px', color: '#64748B' }}>
                        {formatDate(file.createdAt)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => onSelectFile(file)}
                            className="btn-card-icon"
                            title="Xem trực tiếp tài liệu"
                          >
                            <Eye size={14} />
                          </button>

                          <a
                            href={`/api/media/download/${file.id}`}
                            download={file.originalFileName}
                            className="btn-card-icon"
                            title="Tải học liệu về máy tính"
                          >
                            <Download size={14} />
                          </a>

                          <button
                            onClick={() => onDeleteFile(file.id, file.originalFileName)}
                            className="btn-card-icon delete"
                            title="Xóa học liệu khỏi hệ thống"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ĐỘI NGŨ GIẢNG VIÊN CÙNG KHOA */}
        {activeTab === 'colleagues' && (
          <div style={{ padding: '20px 24px' }}>
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#2563EB" />
              Danh Sách Đội Ngũ Cán Bộ Giảng Viên Sĩ Quan CAND
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>STT</th>
                    <th style={thStyle}>Họ và tên Sĩ quan</th>
                    <th style={thStyle}>Tài khoản</th>
                    <th style={thStyle}>Khoa / Đơn vị</th>
                    <th style={thStyle}>Cấp độ phê chuẩn an ninh</th>
                    <th style={thStyle}>Vai trò</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Chuyển đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachersList.map((t, idx) => (
                    <tr key={t.id || idx}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>{t.fullName}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#A31A1A', fontWeight: 600 }}>{t.username}</td>
                      <td style={tdStyle}>{t.department || 'Khoa An ninh điều tra'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: t.clearanceLevelOrder === 4 ? '#FEE2E2' : t.clearanceLevelOrder === 3 ? '#FEF3C7' : '#DBEAFE',
                          color: t.clearanceLevelOrder === 4 ? '#991B1B' : t.clearanceLevelOrder === 3 ? '#92400E' : '#1E40AF'
                        }}>
                          {t.maxClearance || (t.clearanceLevelOrder === 4 ? 'Tuyệt mật' : 'Mật')}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '11.5px', color: '#475569' }}>
                        {t.role === 'SUPER_ADMIN' ? 'Ban Giám hiệu' : 'Giảng viên'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={() => onSwitchUser(t.username)}
                          className="btn-filter-pill"
                          style={{ padding: '3px 10px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Đăng nhập vai này
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
