import React from 'react';
import { BookOpen, Award, GraduationCap, FolderKanban, ShieldAlert, Database } from 'lucide-react';

export default function Navbar({ currentRoute }) {
  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <a
          href="#/"
          className={`nav-item ${currentRoute === '/' || currentRoute === '' ? 'active' : ''}`}
        >
          <BookOpen size={15} />
          Trang chủ
        </a>
        <a
          href="#/hoc-vien"
          className={`nav-item ${currentRoute === '/hoc-vien' ? 'active' : ''}`}
        >
          <GraduationCap size={15} />
          Cổng Học viên
        </a>
        <a
          href="#/giang-vien"
          className={`nav-item ${currentRoute === '/giang-vien' ? 'active' : ''}`}
        >
          <Award size={15} />
          Phòng Giảng viên
        </a>
        <a
          href="#/admin"
          className={`nav-item ${currentRoute === '/admin' ? 'active' : ''}`}
        >
          <ShieldAlert size={15} />
          Quản trị Hệ thống
        </a>
        <a
          href="#/academic"
          className={`nav-item ${currentRoute === '/academic' ? 'active' : ''}`}
        >
          <FolderKanban size={15} />
          Khoa & Bộ môn
        </a>
        <a
          href="#/dbms"
          className={`nav-item ${currentRoute === '/dbms' ? 'active' : ''}`}
        >
          <Database size={15} />
          Quản trị CSDL (27 Bảng)
        </a>
      </div>
    </nav>
  );
}
