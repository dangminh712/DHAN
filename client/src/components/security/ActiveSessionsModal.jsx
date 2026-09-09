import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, Monitor, ShieldX, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import { systemService } from '../../services/systemService';
import { useAuth } from '../../context/AuthContext';

export default function ActiveSessionsModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    loadSessions();
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await systemService.getUserSessions();
      setSessions(data);
    } catch (err) {
      console.error('Lỗi nạp phiên làm việc:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi phiên đăng nhập của thiết bị này?')) return;
    setRevokingId(sessionId);
    try {
      await systemService.revokeSession(sessionId, currentUser.id);
      await loadSessions();
    } catch (err) {
      alert('Lỗi thu hồi phiên: ' + (err.response?.data?.message || err.message));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quản trị Phiên Đăng nhập & Thiết bị (Section 26, 46)" maxWidth="max-w-3xl">
      <div className="space-y-4 text-xs">
        <p className="text-slate-500">
          Danh sách thiết bị kết nối vào mạng nội bộ. Quản trị viên có thẩm quyền thu hồi phiên tức thời nếu phát hiện bất thường.
        </p>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
          {sessions.map((s) => {
            const isRevoked = Boolean(s.revokedAt);
            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isRevoked
                    ? 'bg-rose-50/50 border-rose-200 opacity-75'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isRevoked
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{s.deviceId}</span>
                      <span className="text-[10px] text-slate-500">(@{s.username})</span>
                      {isRevoked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                          Đã thu hồi
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                          Đang hoạt động
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] truncate mt-0.5">{s.deviceName}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                      <span>IP: {s.ipAddress || '127.0.0.1'}</span>
                      <span>•</span>
                      <span>HĐ gần nhất: {s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleTimeString('vi-VN') : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {!isRevoked && (
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={revokingId === s.id}
                    className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>{revokingId === s.id ? 'Đang hủy...' : 'Thu hồi thiết bị'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
