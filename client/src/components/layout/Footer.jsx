import React from 'react';

export default function Footer() {
  return (
    <footer className="agency-footer">
      <div className="footer-container">
        <div className="footer-col">
          <h4>TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN - BỘ CÔNG AN</h4>
          <p className="footer-desc">
            Cổng Quản lý và Học tập Bài giảng Điện tử phục vụ công tác giảng dạy, số hóa học liệu,
            nghiên cứu khoa học và huấn luyện nghiệp vụ an ninh trong mạng nội bộ Intranet.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
            Địa chỉ: Km9 Xa lộ Hà Nội, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh
          </p>
        </div>

        <div className="footer-col">
          <h4>KHOA / ĐƠN VỊ ĐÀO TẠO</h4>
          <ul className="footer-links">
            <li><a href="#/academic">Khoa An ninh điều tra</a></li>
            <li><a href="#/academic">Khoa Nghiệp vụ An ninh</a></li>
            <li><a href="#/academic">Khoa An ninh mạng & PCTP CNC</a></li>
            <li><a href="#/academic">Khoa Luật & QLNN về ANTT</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>HỖ TRỢ KỸ THUẬT LAN & BẢO MẬT</h4>
          <ul className="footer-links">
            <li>Cổng Backend API: <strong>5000</strong></li>
            <li>Cổng Frontend Web: <strong>5173</strong></li>
            <li>Cổng CSDL MySQL: <strong>3307</strong></li>
            <li>Giao thức Stream: <strong>HTTP 206 Partial Content</strong></li>
            <li>Bảo mật học liệu: <strong>Mã băm SHA-256 & Watermark</strong></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Trường Đại học An ninh nhân dân - Bộ Công an. Bản quyền tài liệu và bài giảng lưu hành nội bộ.
      </div>
    </footer>
  );
}
