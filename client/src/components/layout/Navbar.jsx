import React from 'react';
import { BookOpen, FolderKanban, ShieldAlert, Database, UserPlus } from 'lucide-react';

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
          href="#/mon-hoc"
          className={`nav-item ${currentRoute.startsWith('/mon-hoc') ? 'active' : ''}`}
        >
          <BookOpen size={15} />
          Môn học
        </a>
        <a
          href="#/admin"
          className={`nav-item ${currentRoute === '/admin' ? 'active' : ''}`}
        >
          <ShieldAlert size={15} />
          Quản trị Hệ thống
        </a>
        <a
          href="#/cap-tai-khoan"
          className={`nav-item ${currentRoute === '/cap-tai-khoan' ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <UserPlus size={15} />
          Cấp Tài Khoản
          <span style={{ fontSize: '9.5px', background: '#D97706', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, marginLeft: '4px' }}>
            MỚI
          </span>
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
          Quản trị CSDL (29 Bảng)
        </a>
      </div>
    </nav>
  );
}
