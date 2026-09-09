import React from 'react';
import { Shield, Clock, HardDrive, User, Terminal } from 'lucide-react';

export default function AuditLogsTable({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-xs">
        Chưa ghi nhận bản ghi nhật ký kiểm toán nào.
      </div>
    );
  }

  const getActionBadge = (action) => {
    if (action.includes('LOGIN')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('UPLOAD')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('CLEARANCE')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('REVOKE') || action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
            <th className="py-3 px-4">Thời gian (UTC)</th>
            <th className="py-3 px-4">Tài khoản</th>
            <th className="py-3 px-4">Hành vi (Action)</th>
            <th className="py-3 px-4">Đối tượng (Entity)</th>
            <th className="py-3 px-4">Chi tiết thay đổi</th>
            <th className="py-3 px-4">Địa chỉ IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                {new Date(log.createdAt).toLocaleString('vi-VN')}
              </td>
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{log.username}</span>
              </td>
              <td className="py-2.5 px-4">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                  {log.action}
                </span>
              </td>
              <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
              </td>
              <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                {log.newValue || log.accessReason || '-'}
              </td>
              <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                {log.ipAddress || '127.0.0.1'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
