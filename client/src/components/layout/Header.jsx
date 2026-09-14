import React from 'react';
import { Shield, RefreshCw, UploadCloud, Server, Lock } from 'lucide-react';

export default function Header({
  currentUser,
  availableUsers,
  onSwitchUser,
  onOpenUpload,
  onOpenNetwork,
  onRefresh,
  loading
}) {
  const renderClearanceBadge = (order, name) => {
    let bg = '#D1FAE5';
    let color = '#065F46';
    if (order === 4) {
      bg = '#FEE2E2';
      color = '#991B1B';
    } else if (order === 3) {
      bg = '#FEF3C7';
      color = '#92400E';
    } else if (order === 2) {
      bg = '#DBEAFE';
      color = '#1E40AF';
    }
    return (
      <span style={{
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        background: bg,
        color: color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Lock size={10} />
        {name || (order === 4 ? 'Tối mật' : order === 3 ? 'Mật' : order === 2 ? 'Lưu hành nội bộ' : 'Công khai')}
      </span>
    );
  };

  return (
    <>
      {/* 1. TOP AGENCY BAR */}
      <div className="top-agency-bar">
        <div className="top-agency-container">
          <div className="agency-left">
            <span className="agency-badge">BỘ CÔNG AN</span>
            <span>TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>| MÃ HIỆU: T04</span>
          </div>

          <div className="agency-right">
            {/* PERSONA SWITCHER */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '3px 10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Đang chọn:</span>
                <select
                  value={currentUser.username}
                  onChange={(e) => onSwitchUser(e.target.value)}
                  style={{
                    background: '#fff',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.username}>
                      [{u.role === 'SUPER_ADMIN' ? 'Admin' : u.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'}] {u.fullName}
                    </option>
                  ))}
                </select>
                {renderClearanceBadge(currentUser.clearanceLevelOrder, currentUser.maxClearance)}
              </div>
            )}

            <div className="intranet-pill">
              <span className="pulse-dot"></span>
              <span>MẠNG NỘI BỘ (INTRANET)</span>
            </div>
            <button
              onClick={onOpenNetwork}
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
              onClick={onRefresh}
              title="Làm mới danh sách bài giảng"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>

            <button
              className="btn-upload-primary"
              onClick={onOpenUpload}
              title="Nhập liệu và lưu trữ file nội bộ: PDF giáo trình, slide PPT, video MP4, ảnh, âm thanh"
            >
              <UploadCloud size={16} />
              <span>Nạp File Học Liệu Mới</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. QUICK PERSONA SCROLL STRIP (CUỘN NGANG ĐỔI NHANH QUYỀN QUẢN TRỊ / VAI TRÒ) */}
      <div className="quick-persona-scroll-bar">
        <div className="persona-scroll-container">
          <div className="persona-scroll-label">
            <span className="persona-label-tag">⚡ Đổi nhanh vai trò:</span>
          </div>
          <div className="persona-scroll-list">
            {availableUsers.map((u) => {
              const isActive = currentUser?.username === u.username;
              const isSuper = u.role === 'SUPER_ADMIN';
              const isTeacher = u.role === 'TEACHER';
              return (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u.username)}
                  className={`persona-scroll-chip ${isActive ? 'active' : ''}`}
                  title={`Bấm để chuyển quyền sang: ${u.fullName} (${u.role})`}
                >
                  <span className="chip-icon">{isSuper ? '👑' : isTeacher ? '👨‍🏫' : '👨‍🎓'}</span>
                  <span className="chip-name">{u.fullName}</span>
                  <span className="chip-role">[{isSuper ? 'Admin T04' : isTeacher ? 'Giảng viên' : 'Học viên'}]</span>
                  <span className={`chip-clearance order-${u.clearanceLevelOrder || 2}`}>
                    {u.maxClearance || (u.clearanceLevelOrder === 4 ? 'Tuyệt mật' : 'Lưu hành')}
                  </span>
                  {isActive && <span className="chip-active-dot">● Đang dùng</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
