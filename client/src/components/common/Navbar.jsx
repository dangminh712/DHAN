import React, { useState } from 'react';
import {
  Shield,
  User,
  ChevronDown,
  Database,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Edit3,
  Wifi,
  Lock,
  LogOut,
  Layers,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClearanceBadge } from './Badge';

export default function Navbar({ activeTab, onSelectTab }) {
  const { currentUser, availableUsers, switchUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'lectures', label: 'Bài giảng điện tử', icon: BookOpen },
    ...(isTeacher ? [{ id: 'studio', label: 'Biên soạn & Giảng dạy', icon: Edit3 }] : []),
    ...(isAdmin ? [{ id: 'security', label: 'Kiểm toán & An ninh', icon: ShieldCheck }] : []),
    { id: 'dbms', label: 'Quản trị CSDL (MySQL Web)', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Police Branding Bar */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 text-red-800 rounded-full flex items-center justify-center font-black shadow-md border border-amber-200">
              <Shield className="w-5 h-5 fill-red-800 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider uppercase text-amber-200">
                  Bộ Công An
                </span>
                <span className="text-xs bg-red-800/80 px-1.5 py-0.5 rounded border border-red-500/50 text-red-200">
                  T04
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Trường Đại học An ninh Nhân dân • Hệ thống Bài giảng & Học liệu Số
              </h1>
            </div>
          </div>

          {/* Intranet badge & Active Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* LAN status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-red-800/60 rounded-full border border-red-500/40 text-xs text-red-100">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Mạng nội bộ an toàn (Intranet)</span>
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/80 hover:bg-red-950 text-white rounded-lg border border-red-400/30 transition-all text-xs font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400 text-red-900 flex items-center justify-center font-bold text-[10px]">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="text-left leading-tight max-w-[140px] truncate">
                  <div className="font-semibold truncate">{currentUser?.fullName || 'Đang tải...'}</div>
                  <div className="text-[10px] text-amber-300 truncate">{currentUser?.roleName}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Chuyển đổi Tài khoản Kiểm thử (Persona)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Đổi người dùng để kiểm tra Master Access Model
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1">
                    {availableUsers.map((u) => {
                      const isSelected = u.username === currentUser?.username;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.username);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors ${
                            isSelected ? 'bg-red-50 font-semibold text-red-700' : ''
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs truncate">{u.fullName}</div>
                            <div className="text-[10px] text-slate-500">
                              @{u.username} • {u.roleName}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : u.role === 'TEACHER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-red-700 hover:bg-red-50/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Current User Clearance Badge & Department */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-700">{currentUser?.department}</div>
              <div className="text-[10px] text-slate-500">Học viện T04 - Năm học 2026</div>
            </div>
            <ClearanceBadge
              level={
                currentUser?.clearanceLevelOrder === 4
                  ? 'SECRET'
                  : currentUser?.clearanceLevelOrder === 3
                  ? 'CONFIDENTIAL'
                  : currentUser?.clearanceLevelOrder === 2
                  ? 'INTERNAL'
                  : 'NORMAL'
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
