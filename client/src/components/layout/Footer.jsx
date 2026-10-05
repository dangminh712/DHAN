import React from 'react'
import { ChevronRight, LockKeyhole, MapPin, Server } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="agency-footer">
      <div className="footer-container">
        <section className="footer-brand" aria-labelledby="footer-school-name">
          <div className="footer-identity">
            <img className="footer-logo" src="/assets/logo-dhan.jpg" alt="" />
            <div>
              <span className="footer-kicker">Bộ Công an · Mã hiệu T04</span>
              <h2 id="footer-school-name">Trường Đại học An ninh nhân dân</h2>
            </div>
          </div>
          <p>Cổng học liệu số phục vụ giảng dạy, nghiên cứu và huấn luyện nghiệp vụ trong mạng nội bộ.</p>
          <address className="footer-address"><MapPin size={17} aria-hidden="true" /><span>Km9 Xa lộ Hà Nội, TP. Thủ Đức, TP. Hồ Chí Minh</span></address>
        </section>

        <nav className="footer-nav" aria-label="Liên kết nhanh">
          <h2>Liên kết nhanh</h2>
          <div className="footer-link-list">
            <a href="#/mon-hoc"><span>Môn học</span><ChevronRight size={15} aria-hidden="true" /></a>
            <a href="#/bieu-mau"><span>Biểu mẫu CAND</span><ChevronRight size={15} aria-hidden="true" /></a>
            <a href="#/academic"><span>Khoa &amp; Bộ môn</span><ChevronRight size={15} aria-hidden="true" /></a>
          </div>
        </nav>

        <section className="footer-security" aria-labelledby="footer-system-title">
          <h2 id="footer-system-title">Thông tin hệ thống</h2>
          <div className="footer-status-card">
            <div><Server size={17} aria-hidden="true" /><span><small>Kết nối</small><strong>Intranet T04</strong></span></div>
            <div><LockKeyhole size={17} aria-hidden="true" /><span><small>Bảo mật</small><strong>Xác thực nội bộ</strong></span></div>
          </div>
        </section>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>© {new Date().getFullYear()} Trường Đại học An ninh nhân dân</span>
          <span className="footer-classification"><LockKeyhole size={13} aria-hidden="true" /> Tài liệu lưu hành nội bộ</span>
        </div>
      </div>
    </footer>
  )
}
