import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield,
  Users,
  ShieldAlert,
  Smartphone,
  Clock,
  Trash2,
  Database,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  HardDrive
} from 'lucide-react';

export default function AdminPortalPage({
  availableUsers,
  currentUser,
  onSwitchUser
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit' | 'sessions' | 'dbms'
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadAdminData = async () => {
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
      console.error('Lỗi nạp dữ liệu quản trị:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.post(`/api/auth/revoke-session/${sessionId}`);
      setUserSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, isRevoked: true } : s)
      );
      setMessage({ type: 'success', text: 'Đã thu hồi phiên thiết bị ngay lập tức!' });
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
      minute: '2-digit'
    });
  };

  const thStyle = {
    padding: '12px 14px',
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

  const adminerUrl = 'http://localhost:8080/?server=127.0.0.1%3A3307&username=root&db=training_management';

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="dvc-tabs-container">
        {/* BANNER QUẢN TRỊ VIÊN */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #0B1E36 0%, #1E1B4B 100%)',
          color: '#FFFFFF',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ background: '#A31A1A', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={26} color="#FFFFFF" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  TRUNG TÂM CHỈ HUY & QUẢN TRỊ HỆ THỐNG ĐÀO TẠO T04
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
                  Quản trị viên: <strong style={{ color: '#FEF08A' }}>{currentUser?.fullName || 'Đại tá Trần Văn Quyết'}</strong> •
                  Vai trò: <strong style={{ color: '#F87171' }}>SUPER_ADMIN (Toàn quyền Chỉ huy)</strong> •
                  Cấp độ: <span style={{ background: '#991B1B', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>Tuyệt mật (Level 4)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadAdminData}
              className="btn-filter-pill active"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 16px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Đồng bộ dữ liệu</span>
            </button>
          </div>
        </div>

        {/* THÔNG BÁO TOAST */}
        {message && (
          <div style={{
            margin: '16px 24px 0',
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

        {/* SUB TABS QUẢN TRỊ */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn-filter-pill ${activeTab === 'users' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>1. Quản lý Tài khoản & Phân quyền ({availableUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`btn-filter-pill ${activeTab === 'sessions' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Smartphone size={15} />
            <span>2. Phiên Thiết bị & Cảnh báo an ninh ({userSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`btn-filter-pill ${activeTab === 'audit' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={15} />
            <span>3. Nhật ký Kiểm toán Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dbms')}
            className={`btn-filter-pill ${activeTab === 'dbms' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Database size={15} />
            <span>4. CSDL MySQL 8.x (27 Bảng)</span>
          </button>
        </div>

        {/* TAB 1: QUẢN LÝ NGƯỜI DÙNG & RBAC */}
        {activeTab === 'users' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#A31A1A" />
              Danh Sách Toàn Bộ Sĩ Quan, Giảng Viên & Học Viên (RBAC & Clearance)
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tài khoản</th>
                    <th style={thStyle}>Họ và tên Sĩ quan</th>
                    <th style={thStyle}>Đơn vị công tác</th>
                    <th style={thStyle}>Vai trò RBAC</th>
                    <th style={thStyle}>Cấp độ an ninh</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {availableUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>
                        {u.username}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>
                        {u.fullName}
                      </td>
                      <td style={tdStyle}>{u.department || 'Bộ môn Nghiệp vụ T04'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: u.role === 'SUPER_ADMIN' ? '#FEE2E2' : u.role === 'TEACHER' ? '#DBEAFE' : '#D1FAE5',
                          color: u.role === 'SUPER_ADMIN' ? '#991B1B' : u.role === 'TEACHER' ? '#1E40AF' : '#065F46'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: u.clearanceLevelOrder === 4 ? '#FEE2E2' : u.clearanceLevelOrder === 3 ? '#FEF3C7' : '#EFF6FF',
                          color: u.clearanceLevelOrder === 4 ? '#991B1B' : u.clearanceLevelOrder === 3 ? '#92400E' : '#1E40AF'
                        }}>
                          {u.maxClearance || (u.clearanceLevelOrder === 4 ? 'Tuyệt mật' : 'Lưu hành')}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={() => onSwitchUser(u.username)}
                          className="btn-filter-pill"
                          style={{ padding: '3px 10px', fontSize: '11.5px', cursor: 'pointer' }}
                          title="Đăng nhập thử nghiệm dưới quyền tài khoản này"
                        >
                          Chuyển vai trò
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: THIẾT BỊ & CẢNH BÁO */}
        {activeTab === 'sessions' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="#2563EB" />
              Phiên Đăng Nhập & Thiết Bị Kết Nối Mạng Nội Bộ (Intranet)
            </h4>

            <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tài khoản</th>
                    <th style={thStyle}>Tên thiết bị / Device ID</th>
                    <th style={thStyle}>Địa chỉ IP</th>
                    <th style={thStyle}>Hoạt động cuối</th>
                    <th style={thStyle}>Trạng thái phiên</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thu hồi phiên</th>
                  </tr>
                </thead>
                <tbody>
                  {userSessions.map(sess => (
                    <tr key={sess.id}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#A31A1A' }}>{sess.username}</td>
                      <td style={tdStyle}>{sess.deviceName || sess.deviceId || 'Máy trạm nội bộ'}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{sess.ipAddress || '127.0.0.1'}</td>
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
                          {sess.isRevoked ? 'Đã thu hồi' : 'Đang hoạt động'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {!sess.isRevoked ? (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            className="btn-card-icon delete"
                            title="Thu hồi phiên thiết bị ngay lập tức"
                            style={{ margin: '0 auto', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Đã ngắt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CẢNH BÁO AN NINH */}
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#DC2626', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Cảnh Báo An Ninh T04 ({securityAlerts.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {securityAlerts.map(a => (
                <div key={a.id} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#DC2626', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                        {a.alertType}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Người dùng: <strong>{a.userName}</strong> | IP: {a.ipAddress}</span>
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#1F2937', fontWeight: 600 }}>{a.description}</div>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, background: a.status === 'OPEN' ? '#FEE2E2' : '#D1FAE5', color: a.status === 'OPEN' ? '#991B1B' : '#065F46', padding: '4px 10px', borderRadius: '12px' }}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#059669" />
              Nhật Ký Kiểm Toán Bất Biến Toàn Hệ Thống (Audit Trail)
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
                    <th style={thStyle}>Chi tiết</th>
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
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', fontFamily: 'monospace' }}>
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
                        {log.details || log.description || 'Truy cập học liệu bài giảng'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DBMS MYSQL */}
        {activeTab === 'dbms' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: 0 }}>
                  Quản Trị Cơ Sở Dữ Liệu MySQL 8.x (training_management)
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                  27 Bảng quan hệ chuẩn 3NF, phân hệ RBAC, Audit Trail và quản lý học liệu.
                </p>
              </div>

              <a
                href={adminerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-view-lecture"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  background: '#A31A1A',
                  color: '#fff',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13.5px'
                }}
              >
                <ExternalLink size={16} />
                <span>Mở Adminer Web GUI (Port 8080)</span>
              </a>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Engine CSDL</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0B1E36' }}>MySQL 8.0 (InnoDB)</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Tên Cơ sở dữ liệu</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#A31A1A' }}>training_management</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Tổng số bảng</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563EB' }}>27 Bảng quan hệ</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Quản trị trực quan</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669' }}>Adminer Port 8080</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
