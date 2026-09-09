import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, User, Clock, Network } from 'lucide-react';

export default function SecurityAlertsList({ alerts = [] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
        Hệ thống an ninh đang hoạt động bình thường, không có cảnh báo vi phạm.
      </div>
    );
  }

  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-300';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-300';
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'bg-rose-100 text-rose-800 font-bold';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 font-medium';
      case 'FALSE_POSITIVE':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-xs">{alert.alertType}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getSeverityStyle(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${getStatusStyle(alert.status)}`}>
                  {alert.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Người dùng: <strong>@{alert.username}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Network className="w-3 h-3" />
                  <span>IP: {alert.sourceIp || 'Nội bộ'}</span>
                </span>
                <span>•</span>
                <span>{new Date(alert.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
