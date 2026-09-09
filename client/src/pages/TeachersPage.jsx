import React from 'react';
import { Award, ShieldCheck, PlusCircle, UserCheck, Eye } from 'lucide-react';

export default function TeachersPage({ teachersList, currentUser, onSwitchUser, onOpenUpload }) {
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
    color: '#4B5563',
    verticalAlign: 'middle'
  };

  return (
    <main className="main-content-layout">
      <div className="dvc-tabs-container" style={{ marginTop: '24px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} color="#A31A1A" />
                QUẢN LÝ CÁN BỘ GIẢNG VIÊN SĨ QUAN (CSDL MYSQL 8.0)
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Hồ sơ sĩ quan giảng dạy, phân quyền biên soạn bài giảng và cấp độ phê chuẩn an ninh
              </p>
            </div>
            <button className="btn-upload-primary" onClick={onOpenUpload}>
              <PlusCircle size={16} />
              Đăng tải học liệu mới
            </button>
          </div>
        </div>

        <div className="teacher-panel-notice">
          <ShieldCheck size={18} />
          <span>Dữ liệu nạp từ bảng <code>users</code> và <code>organizational_units</code>. Nhấp vào <strong>"Đăng nhập vai này"</strong> để chuyển đổi Persona kiểm thử phân quyền ngay lập tức.</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={thStyle}>STT</th>
                <th style={thStyle}>Họ và tên Sĩ quan</th>
                <th style={thStyle}>Tài khoản</th>
                <th style={thStyle}>Khoa / Đơn vị</th>
                <th style={thStyle}>Cấp độ phê chuẩn</th>
                <th style={thStyle}>Vai trò RBAC</th>
                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {teachersList.map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>
                    {t.fullName}
                    {currentUser?.id === t.id && (
                      <span style={{ marginLeft: '8px', fontSize: '10.5px', background: '#DC2626', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Đang chọn</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#A31A1A', fontWeight: 600 }}>{t.username}</td>
                  <td style={tdStyle}>{t.department}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: t.clearanceLevelOrder === 4 ? '#FEE2E2' : t.clearanceLevelOrder === 3 ? '#FEF3C7' : '#DBEAFE',
                      color: t.clearanceLevelOrder === 4 ? '#991B1B' : t.clearanceLevelOrder === 3 ? '#92400E' : '#1E40AF'
                    }}>
                      {t.maxClearance}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: t.role === 'SUPER_ADMIN' ? '#FEE2E2' : '#EFF6FF',
                      color: t.role === 'SUPER_ADMIN' ? '#991B1B' : '#1E40AF'
                    }}>
                      {t.roleName}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-card-icon"
                        title="Đăng nhập tài khoản này"
                        onClick={() => onSwitchUser(t.username)}
                        style={{ color: '#059669', borderColor: '#A7F3D0' }}
                      >
                        <UserCheck size={14} />
                      </button>
                      <a
                        href="#/"
                        className="btn-card-icon"
                        title="Xem bài giảng của giảng viên"
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', fontSize: '12.5px', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
          <span>Tổng cộng: <strong style={{ color: '#111827' }}>{teachersList.length}</strong> cán bộ giảng viên sĩ quan</span>
          <span>Mật khẩu mặc định phục vụ demo: <code>T04@Security2026!</code> (Mã hóa PBKDF2)</span>
        </div>
      </div>
    </main>
  );
}
