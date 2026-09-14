import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  AlertTriangle,
  Smartphone,
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Laptop,
  Terminal,
  ShieldCheck
} from 'lucide-react';

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'sessions' | 'audit'
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, alertsRes, sessRes] = await Promise.all([
        axios.get('/api/auth/audit-logs').catch(() => ({ data: [] })),
        axios.get('/api/auth/security-alerts').catch(() => ({ data: [] })),
        axios.get('/api/auth/user-sessions').catch(() => ({ data: [] }))
      ]);
      setAuditLogs(logsRes.data || []);
      setSecurityAlerts(alertsRes.data || []);
      setUserSessions(sessRes.data || []);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu kiểm toán:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.post(`/api/auth/revoke-session/${sessionId}`);
      setUserSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, isRevoked: true } : s)
      );
      setMessage({ type: 'success', text: 'Đã thu hồi phiên thiết bị an toàn!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Lỗi thu hồi phiên:', err);
      setMessage({ type: 'error', text: 'Lỗi thu hồi phiên thiết bị.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const thStyle = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0B1E36',
    borderBottom: '2px solid #E2E8F0',
    background: '#F1F5F9'
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #E2E8F0'
  };

  return (
    <div className="portal-container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {/* HEADER SECTION */}
      <div className="dvc-tabs-container" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <ShieldAlert size={26} color="#A31A1A" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0B1E36', margin: 0 }}>
                TRUNG TÂM KIỂM TOÁN AN NINH & GIÁM SÁT TRUY CẬP T04
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
              Hệ thống giám sát bất biến (Immutable Audit Trail) - Ghi nhận mọi phiên kết nối mạng nội bộ, tải học liệu nghiệp vụ và thiết bị truy cập.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadData}
              className="btn-filter-pill"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {message && (
          <div style={{
            margin: '16px 24px',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: message.type === 'success' ? '#DEF7EC' : '#FDE8E8',
            color: message.type === 'success' ? '#03543F' : '#9B1C1C',
            border: `1px solid ${message.type === 'success' ? '#31C48D' : '#F98080'}`
          }}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* SUB TABS */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`btn-filter-pill ${activeTab === 'alerts' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <AlertTriangle size={15} />
            <span>Cảnh báo An ninh ({securityAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`btn-filter-pill ${activeTab === 'sessions' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Smartphone size={15} />
            <span>Quản lý Phiên & Thiết bị ({userSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`btn-filter-pill ${activeTab === 'audit' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={15} />
            <span>Nhật ký Kiểm toán ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: CẢNH BÁO AN NINH */}
        {activeTab === 'alerts' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#A31A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Danh sách Cảnh Báo Vi Phạm & Tải Học Liệu Bất Thường
            </h4>

            {securityAlerts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                <ShieldCheck size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>Hệ thống an toàn tuyệt đối</p>
                <p style={{ fontSize: '12.5px' }}>Không phát hiện cảnh báo vi phạm bản quyền hay tải tệp bất thường nào.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {securityAlerts.map(a => (
                  <div key={a.id} style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#DC2626', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                          {a.alertType || 'SECURITY_ALERT'}
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#475569' }}>
                          Người dùng: <strong style={{ color: '#0B1E36' }}>{a.userName || 'Ẩn danh'}</strong> | IP: <code>{a.ipAddress || '127.0.0.1'}</code> | Thời gian: {formatDate(a.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 600 }}>{a.description}</div>
                    </div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      background: a.status === 'OPEN' ? '#FEE2E2' : '#D1FAE5',
                      color: a.status === 'OPEN' ? '#991B1B' : '#065F46',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${a.status === 'OPEN' ? '#FCA5A5' : '#86EFAC'}`
                    }}>
                      {a.status === 'OPEN' ? 'ĐANG THEO DÕI' : 'ĐÃ XỬ LÝ'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUẢN LÝ PHIÊN & THIẾT BỊ */}
        {activeTab === 'sessions' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="#2563EB" /> Danh Sách Thiết Bị Đang Kết Nối Intranet & Quyền Thu Hồi
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tài khoản</th>
                    <th style={thStyle}>Tên thiết bị / Device ID</th>
                    <th style={thStyle}>Địa chỉ IP mạng LAN</th>
                    <th style={thStyle}>Hoạt động cuối</th>
                    <th style={thStyle}>Trạng thái phiên</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {userSessions.map(sess => (
                    <tr key={sess.id}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#A31A1A' }}>{sess.username}</td>
                      <td style={tdStyle}>{sess.deviceName || sess.deviceId || 'Máy trạm Sĩ quan CAND'}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{sess.ipAddress || '127.0.0.1'}</td>
                      <td style={tdStyle}>{formatDate(sess.lastActivityAt)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: sess.isRevoked ? '#FEE2E2' : '#D1FAE5',
                          color: sess.isRevoked ? '#991B1B' : '#065F46'
                        }}>
                          {sess.isRevoked ? 'Đã thu hồi' : 'Đang trực tuyến'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {!sess.isRevoked ? (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            className="btn-card-icon delete"
                            title="Ngắt kết nối và thu hồi phiên thiết bị ngay lập tức"
                            style={{ margin: '0 auto', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>---</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: NHẬT KÝ AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#059669" /> Nhật Ký Kiểm Toán Bất Biến (Audit Trail)
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Thời gian</th>
                    <th style={thStyle}>Người thực hiện</th>
                    <th style={thStyle}>Hành vi (Action)</th>
                    <th style={thStyle}>Đối tượng</th>
                    <th style={thStyle}>Địa chỉ IP</th>
                    <th style={thStyle}>Chi tiết thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr key={log.id || idx}>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>
                        {log.username || 'Hệ thống'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#EFF6FF',
                          color: '#1E40AF',
                          fontFamily: 'monospace'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>
                        {log.entityType ? `${log.entityType} #${log.entityId || ''}` : 'MediaFiles'}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12.5px' }}>
                        {log.details || log.description || 'Truy cập và xem học liệu bài giảng điện tử'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
