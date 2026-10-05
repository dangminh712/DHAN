import React from 'react'
import { LockKeyhole, RefreshCw, Server, UploadCloud } from 'lucide-react'

export default function Header({ currentUser, availableUsers, onSwitchUser, onOpenUpload, onOpenNetwork, onRefresh, loading }) {
  const roleLabel = currentUser?.role === 'SUPER_ADMIN' ? 'Quản trị viên' : currentUser?.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'

  return (
    <>
      <div className="top-agency-bar">
        <div className="top-agency-container">
          <div className="agency-left"><span className="agency-badge">BỘ CÔNG AN</span><span>TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN</span><span className="agency-code">MÃ HIỆU T04</span></div>
          <div className="agency-right">
            <span className="intranet-pill"><span className="pulse-dot" /> Mạng nội bộ</span>
            <button className="top-bar-button" onClick={onOpenNetwork} type="button"><Server size={15} /> Thông số máy chủ</button>
          </div>
        </div>
      </div>
      <header className="main-header">
        <div className="header-container">
          <a className="brand-wrapper" href="#/" aria-label="Về trang chủ">
            <span className="brand-emblem">
              <img src="/assets/logo-dhan.jpg" alt="Logo Trường Đại học An ninh nhân dân" />
            </span>
            <span className="brand-text">
              <span className="brand-kicker">Bộ Công an · Mã hiệu T04</span>
              <strong>Trường Đại học An ninh nhân dân</strong>
              <span className="brand-portal-name">Cổng môn học và học liệu số</span>
            </span>
          </a>
          <div className="header-tools">
            {currentUser && (
              <label className="user-switcher">
                <span className="user-switcher__meta"><small>{roleLabel}</small><strong>{currentUser.fullName}</strong></span>
                <select value={currentUser.username} onChange={(event) => onSwitchUser(event.target.value)} aria-label="Chuyển tài khoản đang sử dụng">
                  {availableUsers.map((user) => <option key={user.id} value={user.username}>{user.fullName} · {user.role === 'SUPER_ADMIN' ? 'Admin' : user.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'}</option>)}
                </select>
                <span className="clearance-badge"><LockKeyhole size={13} /> {currentUser.maxClearance || 'Nội bộ'}</span>
              </label>
            )}
            <div className="header-actions">
              <button className="portal-icon-button" onClick={onRefresh} type="button" aria-label="Làm mới dữ liệu" title="Làm mới dữ liệu"><RefreshCw size={19} className={loading ? 'animate-spin' : ''} /></button>
              <button className="portal-button portal-button--primary header-upload" onClick={onOpenUpload} type="button" aria-label="Nạp học liệu" title="Nạp học liệu"><UploadCloud size={18} /><span>Nạp học liệu</span></button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
