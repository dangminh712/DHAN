import React from 'react'
import { CalendarDays, LockKeyhole, RefreshCw, Server, UploadCloud } from 'lucide-react'

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function formatGovDate(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${WEEKDAYS[date.getDay()]}, ngày ${dd}/${mm}/${date.getFullYear()}`
}

export default function Header({ currentUser, availableUsers, onSwitchUser, onOpenUpload, onOpenNetwork, onRefresh, loading }) {
  const roleLabel = currentUser?.role === 'SUPER_ADMIN' ? 'Quản trị viên' : currentUser?.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'
  const today = formatGovDate(new Date())

  return (
    <>
      <div className="top-agency-bar">
        <div className="top-agency-container">
          <div className="agency-left">
            <span className="agency-date"><CalendarDays size={14} aria-hidden="true" /> {today}</span>
            <span className="agency-divider" aria-hidden="true" />
            <span className="intranet-pill"><span className="pulse-dot" /> Mạng nội bộ</span>
          </div>
          <div className="agency-right">
            <button className="top-bar-button" onClick={onOpenNetwork} type="button"><Server size={14} aria-hidden="true" /> Thông số máy chủ</button>
          </div>
        </div>
      </div>
      <header className="main-header">
        <div className="main-header__pattern" aria-hidden="true" />
        <div className="header-container">
          <a className="brand-wrapper" href="#/" aria-label="Về trang chủ">
            <span className="brand-emblem">
              <img src="/assets/logo-dhan.jpg" alt="Logo Trường Đại học An ninh nhân dân" />
            </span>
            <span className="brand-text">
              <span className="brand-kicker">Bộ Công an</span>
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
              <button className="portal-icon-button header-icon-button" onClick={onRefresh} type="button" aria-label="Làm mới dữ liệu" title="Làm mới dữ liệu"><RefreshCw size={19} className={loading ? 'animate-spin' : ''} /></button>
              <button className="portal-button header-upload" onClick={onOpenUpload} type="button" aria-label="Nạp học liệu" title="Nạp học liệu"><UploadCloud size={18} /><span>Nạp học liệu</span></button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
