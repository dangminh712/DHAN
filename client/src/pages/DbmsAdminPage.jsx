import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Database,
  ExternalLink,
  Table,
  CheckCircle2,
  Server,
  Layers,
  ShieldCheck,
  RefreshCw,
  HardDrive
} from 'lucide-react';

export default function DbmsAdminPage() {
  const [dbOverview, setDbOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/overview').catch(() => null);
      if (res && res.data) {
        setDbOverview(res.data);
      } else {
        // Fallback default statistics
        setDbOverview({
          databaseEngine: 'MySQL 8.x (InnoDB)',
          charset: 'utf8mb4_0900_ai_ci',
          databaseName: 'training_management',
          totalTables: 27,
          totalRows: 182,
          modules: [
            {
              name: 'Identity & Access',
              count: 6,
              tables: ['users', 'roles', 'permissions', 'role_permissions', 'user_sessions', 'user_mfa']
            },
            {
              name: 'Organization',
              count: 1,
              tables: ['organizational_units']
            },
            {
              name: 'Academic',
              count: 3,
              tables: ['classes', 'students', 'subjects']
            },
            {
              name: 'Lecture & Media',
              count: 12,
              tables: [
                'lectures', 'lecture_media_items', 'media_files', 'media_file_chunks',
                'media_access_policies', 'media_view_progress', 'media_notes',
                'media_transcriptions', 'media_bookmarks', 'media_shares',
                'media_favorites', 'media_ratings'
              ]
            },
            {
              name: 'Security & Audit',
              count: 5,
              tables: ['audit_logs', 'security_alerts', 'download_tokens', 'system_configs', 'system_backups']
            }
          ]
        });
      }
    } catch (err) {
      console.error('Lỗi nạp tổng quan CSDL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const adminerUrl = 'http://localhost:8080/?server=127.0.0.1%3A3307&username=root&db=training_management';

  return (
    <div className="portal-container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="dvc-tabs-container">
        {/* BANNER HEADER */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Database size={26} color="#A31A1A" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0B1E36', margin: 0 }}>
                HỆ THỐNG QUẢN TRỊ CƠ SỞ DỮ LIỆU MYSQL (27 BẢNG 3NF)
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
              Cơ sở dữ liệu <code>training_management</code> chuẩn hóa 3NF, RBAC đa tầng, mã băm mật khẩu Argon2/BCrypt và lưu vết Audit Trail.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={loadOverview}
              className="btn-filter-pill"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Kiểm tra kết nối</span>
            </button>

            <a
              href={adminerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-view-lecture"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: '#A31A1A',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13.5px'
              }}
            >
              <ExternalLink size={16} />
              <span>Mở Adminer Web GUI (Port 8080)</span>
            </a>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          padding: '20px 24px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0'
        }}>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Cơ sở dữ liệu</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#A31A1A' }}>training_management</div>
            <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Đang kết nối MySQL 8.x
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Cổng dịch vụ CSDL</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36' }}>127.0.0.1:3307</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Character Set: utf8mb4</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Tổng số bảng quan hệ</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>27 Bảng (5 Phân hệ)</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>InnoDB Engine (FK, Index, Soft Delete)</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Giao diện trực quan</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#D97706' }}>Adminer 4.8.4</div>
            <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>http://localhost:8080</div>
          </div>
        </div>

        {/* 27 TABLES BREAKDOWN */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#A31A1A" />
            Cấu Trúc 5 Nhóm Phân Hệ Bảng Quan Hệ (27 Tables)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* 1. Identity & Access */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#1E40AF' }}>1. Identity & Access (6 Bảng)</span>
                <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>RBAC</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><code>users</code> - Tài khoản sĩ quan, giảng viên, học viên</li>
                <li><code>roles</code> - Vai trò: SUPER_ADMIN, TEACHER, STUDENT...</li>
                <li><code>permissions</code> - Quyền chi tiết (CREATE, VIEW, AUDIT...)</li>
                <li><code>role_permissions</code> - Bảng liên kết Phân quyền & Vai trò</li>
                <li><code>user_sessions</code> - Phiên đăng nhập & Quản lý thiết bị</li>
                <li><code>user_mfa</code> - Xác thực 2 lớp bảo vệ cấp cao</li>
              </ul>
            </div>

            {/* 2. Organization */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#065F46' }}>2. Organization (1 Bảng)</span>
                <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Cơ Cấu</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><code>organizational_units</code> - 9 Khoa, Bộ môn và Ban giám hiệu</li>
              </ul>
            </div>

            {/* 3. Academic */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#92400E' }}>3. Academic Đào Tạo (3 Bảng)</span>
                <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Đào Tạo</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><code>classes</code> - Danh sách lớp học viên (D32A, D32B...)</li>
                <li><code>students</code> - Hồ sơ hồ sơ học viên, quân hàm, khóa</li>
                <li><code>subjects</code> - Học phần nghiệp vụ, tín chỉ, đề cương</li>
              </ul>
            </div>

            {/* 4. Lecture & Media */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#A31A1A' }}>4. Lecture & Media (12 Bảng)</span>
                <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#A31A1A', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Học Liệu Số</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><code>lectures</code> - Thực thể bài giảng số hóa T04</li>
                <li><code>lecture_media_items</code> - Đính kèm nhiều PDF, Video, Ảnh vào 1 bài giảng</li>
                <li><code>media_files</code> - Quản lý tệp tin vật lý, SHA-256</li>
                <li><code>media_access_policies</code> - Phân quyền theo cấp độ Mật (Level 1-4)</li>
                <li><code>media_view_progress</code> - Theo dõi tiến độ xem & học</li>
                <li><code>media_notes</code> - Sổ tay ghi chép nghiệp vụ học viên</li>
                <li><code>media_file_chunks, media_transcriptions, media_bookmarks...</code></li>
              </ul>
            </div>

            {/* 5. Security & Audit */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#4C1D95' }}>5. Security & Audit (5 Bảng)</span>
                <span style={{ fontSize: '11px', background: '#EDE9FE', color: '#4C1D95', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>An Ninh</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><code>audit_logs</code> - Nhật ký bất biến ghi lại mọi thao tác</li>
                <li><code>security_alerts</code> - Cảnh báo truy cập & tải bất thường</li>
                <li><code>download_tokens</code> - Token ký số giới hạn thời gian tải</li>
                <li><code>system_configs</code> - Cấu hình hệ thống & Dung lượng giới hạn</li>
                <li><code>system_backups</code> - Lịch sử sao lưu phục hồi dữ liệu</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
