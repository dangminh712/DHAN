import React from 'react';
import { GraduationCap, AlertTriangle, BookOpen, UserCheck } from 'lucide-react';

export default function StudentsPage({ studentsList, currentUser, onSwitchUser }) {
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
                <GraduationCap size={22} color="#A31A1A" />
                QUẢN LÝ HỌC VIÊN / SINH VIÊN (CSDL MYSQL 8.0)
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Danh sách học viên các khóa D31A, D31B, LT15, VB2_K8 đào tạo tại T04
              </p>
            </div>
            <a href="#/" className="btn-icon-secondary" style={{ textDecoration: 'none' }}>
              <BookOpen size={16} />
              Đến Cổng Học Tập
            </a>
          </div>
        </div>

        <div className="teacher-panel-notice">
          <AlertTriangle size={18} />
          <span>Hồ sơ học viên liên kết trực tiếp với bảng <code>users</code>, <code>student_classes</code> và <code>classes</code>. Bấm nút màu xanh để đăng nhập dưới quyền học viên kiểm thử rào chắn Clearance.</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={thStyle}>STT</th>
                <th style={thStyle}>Mã tài khoản</th>
                <th style={thStyle}>Họ và tên Học viên</th>
                <th style={thStyle}>Email Học viên</th>
                <th style={thStyle}>Khoa quản lý</th>
                <th style={thStyle}>Cấp độ tiếp cận</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>{s.username}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>
                    {s.fullName}
                    {currentUser?.id === s.id && (
                      <span style={{ marginLeft: '8px', fontSize: '10.5px', background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Đang học</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px' }}>{s.email}</td>
                  <td style={tdStyle}>{s.department}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: s.clearanceLevelOrder === 3 ? '#FEF3C7' : s.clearanceLevelOrder === 2 ? '#DBEAFE' : '#D1FAE5',
                      color: s.clearanceLevelOrder === 3 ? '#92400E' : s.clearanceLevelOrder === 2 ? '#1E40AF' : '#065F46'
                    }}>
                      {s.maxClearance}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: s.status === 'ACTIVE' ? '#D1FAE5' : '#FEF9C3',
                      color: s.status === 'ACTIVE' ? '#065F46' : '#854D0E'
                    }}>
                      {s.status === 'ACTIVE' ? 'Đang học tập' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      className="btn-card-icon"
                      title="Đăng nhập thử vai trò học viên này"
                      onClick={() => onSwitchUser(s.username)}
                      style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
                    >
                      <UserCheck size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', fontSize: '12.5px', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
          <span>Tổng cộng: <strong style={{ color: '#111827' }}>{studentsList.length}</strong> học viên đang theo học</span>
          <span>Phân quyền lớp học: <strong>D31A, D31B, LT15, VB2_K8</strong></span>
        </div>
      </div>
    </main>
  );
}
