import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Laptop,
  RefreshCw,
  Clock,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { systemService } from '../services/systemService';
import AuditLogsTable from '../components/security/AuditLogsTable';
import SecurityAlertsList from '../components/security/SecurityAlertsList';
import ActiveSessionsModal from '../components/security/ActiveSessionsModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function SecurityAuditPage() {
  const [activeSubTab, setActiveSubTab] = useState('alerts'); // 'alerts' | 'audit'
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [alertList, logList] = await Promise.all([
        systemService.getSecurityAlerts(),
        systemService.getAuditLogs(100),
      ]);
      setAlerts(alertList);
      setAuditLogs(logList);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu an ninh:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang đồng bộ nhật ký kiểm toán & an ninh T04..." />;

  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-slate-900">Trung Tâm Giám Sát An Ninh & Nhật Ký Kiểm Toán</span>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
              Bất biến (Immutable Audit Trail)
            </span>
          </div>
          <p className="text-slate-500">
            Theo dõi truy cập bất thường, tần suất tải học liệu và kiểm soát phiên thiết bị kết nối theo Section 24, 25, 45.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSessionsOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center gap-1.5"
          >
            <Laptop className="w-4 h-4 text-slate-600" />
            <span>Quản trị Phiên & Thiết bị</span>
          </button>

          <button
            onClick={loadSecurityData}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
            activeSubTab === 'alerts'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Cảnh báo An ninh</span>
          {openAlertsCount > 0 && (
            <span className="text-[10px] bg-white text-red-700 px-1.5 py-0.2 rounded-full font-black">
              {openAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
            activeSubTab === 'audit'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Nhật ký Kiểm toán (Audit Trail)</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'alerts' ? (
        <SecurityAlertsList alerts={alerts} />
      ) : (
        <AuditLogsTable logs={auditLogs} />
      )}

      {/* Active Sessions Modal */}
      <ActiveSessionsModal isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} />
    </div>
  );
}
