import React from 'react';
import { FolderKanban } from 'lucide-react';

export default function AcademicPage({ academicUnits, academicSubjects }) {
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
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={22} color="#A31A1A" />
            CƠ CẤU TỔ CHỨC & HỌC PHẦN ĐÀO TẠO (TRƯỜNG ĐH AN NINH NHÂN DÂN - T04)
          </h3>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
            Danh mục 9 đơn vị tổ chức (Khoa, Bộ môn) và 4 học phần đào tạo chuyên sâu
          </p>
        </div>

        <div style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>
            1. Danh Mục Các Khoa & Bộ Môn Trực Thuộc
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {academicUnits.map(u => (
              <div key={u.id} style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: u.unitType === 'ACADEMY' ? '#FEE2E2' : u.unitType === 'FACULTY' ? '#DBEAFE' : '#FEF3C7', color: u.unitType === 'ACADEMY' ? '#991B1B' : u.unitType === 'FACULTY' ? '#1E40AF' : '#92400E', padding: '2px 8px', borderRadius: '4px' }}>
                    {u.unitType}
                  </span>
                  <code style={{ fontSize: '12px', color: '#6B7280', float: 'right' }}>{u.code}</code>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{u.name}</div>
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>
            2. Học Phần Nghiệp Vụ Chuyên Sâu
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={thStyle}>Mã môn</th>
                  <th style={thStyle}>Tên học phần</th>
                  <th style={thStyle}>Khoa chủ quản</th>
                  <th style={thStyle}>Số tín chỉ</th>
                  <th style={thStyle}>Mô tả chương trình</th>
                </tr>
              </thead>
              <tbody>
                {academicSubjects.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>{s.code}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>{s.name}</td>
                    <td style={tdStyle}>{s.departmentName}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#059669' }}>{s.credits}</td>
                    <td style={tdStyle}>{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
