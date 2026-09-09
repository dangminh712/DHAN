import React from 'react';
import { Shield, ShieldAlert, Lock, Globe, CheckCircle2, Clock, Archive } from 'lucide-react';

export function ClearanceBadge({ level, order }) {
  const configs = {
    NORMAL: { label: 'Công khai nội bộ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: Globe },
    INTERNAL: { label: 'Lưu hành nội bộ', bg: 'bg-blue-50 text-blue-700 border-blue-300', icon: Shield },
    CONFIDENTIAL: { label: 'Mật (Bậc 3)', bg: 'bg-amber-50 text-amber-800 border-amber-300', icon: Lock },
    SECRET: { label: 'Tối mật nghiệp vụ', bg: 'bg-red-50 text-red-700 border-red-400 font-bold', icon: ShieldAlert },
  };

  const key = typeof level === 'string' ? level.toUpperCase() : 'NORMAL';
  const cfg = configs[key] || configs.NORMAL;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function LectureStatusBadge({ status }) {
  const configs = {
    PUBLISHED: { label: 'Đang phát hành', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
    SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-blue-50 text-blue-700 border-blue-300', icon: Clock },
    CLOSED: { label: 'Đã đóng học phần', bg: 'bg-rose-50 text-rose-700 border-rose-300', icon: Lock },
    DRAFT: { label: 'Bản thảo', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: Archive },
    ARCHIVED: { label: 'Lưu trữ', bg: 'bg-gray-100 text-gray-700 border-gray-300', icon: Archive },
  };

  const key = typeof status === 'string' ? status.toUpperCase() : 'DRAFT';
  const cfg = configs[key] || configs.DRAFT;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function RoleBadge({ role, roleName }) {
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const bg = isAdmin
    ? 'bg-purple-50 text-purple-700 border-purple-300'
    : isTeacher
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : 'bg-sky-50 text-sky-700 border-sky-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${bg}`}>
      {roleName || role}
    </span>
  );
}
