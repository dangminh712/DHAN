import React, { useState, useEffect } from 'react';
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
  HardDrive,
  UserPlus,
  Edit,
  Zap,
  PowerOff
} from 'lucide-react';
import { authService } from '../services/authService';
import { systemService } from '../services/systemService';
import UserModal from '../components/common/UserModal';
import Pagination from '../components/common/Pagination';
import { Search } from 'lucide-react';

export default function AdminPortalPage({
  availableUsers: propUsers = [],
  currentUser,
  onSwitchUser
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'sessions' | 'audit' | 'dbms'
  const [users, setUsers] = useState(propUsers);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [auditSearch, setAuditSearch] = useState('');
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const loadAuditLogs = async (page = 1, search = auditSearch) => {
    try {
      const res = await systemService.getAuditLogs({ page, pageSize: auditPageSize, search });
      if (res && res.items) {
        setAuditLogs(res.items);
        setAuditTotal(res.totalCount);
        setAuditPage(res.page);
      } else if (Array.isArray(res)) {
        setAuditLogs(res);
        setAuditTotal(res.length);
      }
    } catch (err) {
      console.error('Lỗi tải audit logs:', err);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, alertsRes, sessRes] = await Promise.all([
        authService.getAvailableUsers().catch(() => propUsers),
        systemService.getSecurityAlerts().catch(() => []),
        systemService.getUserSessions().catch(() => []),
      ]);
      setUsers(uRes || propUsers);
      setSecurityAlerts(alertsRes || []);
      setUserSessions(sessRes || []);
      await loadAuditLogs(1, '');
    } catch (err) {
      console.error('Lỗi nạp dữ liệu quản trị:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleOpenCreateUser = () => {
    setUserToEdit(null);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setUserToEdit(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    if (user.username === 'admin' || user.id === 1) {
      alert('Không thể khóa tài khoản Quản trị viên tối cao (SUPER_ADMIN).');
      return;
    }
    if (!window.confirm(`Đồng chí có chắc chắn muốn khóa/vô hiệu hóa tài khoản:\n"${user.fullName} (${user.username})"?`)) {
      return;
    }

    try {
      await authService.deleteUser(user.id, currentUser?.id || 1);
      showToast('success', `Đã khóa/vô hiệu hóa tài khoản ${user.username} thành công.`);
      loadAdminData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi xóa tài khoản.');
    }
  };

  const handleRevokeSession = async (sessionId, deviceId) => {
    if (!window.confirm(`Đồng chí có muốn ngắt kết nối và thu hồi phiên của thiết bị:\n"${deviceId}"?`)) {
      return;
    }

    try {
      await systemService.revokeSession(sessionId, currentUser?.id || 1);
      setUserSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, revokedAt: new Date().toISOString() } : s))
      );
      showToast('success', 'Đã thu hồi phiên thiết bị ngay lập tức!');
    } catch (err) {
      console.error('Lỗi thu hồi phiên:', err);
      showToast('error', 'Lỗi thu hồi phiên thiết bị.');
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
    borderBottom: '2px solid #CBD5E1',
    background: '#F1F5F9'
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #E2E8F0',
    verticalAlign: 'middle'
  };

  const adminerUrl = 'http://localhost:8080/?server=127.0.0.1%3A3307&username=root&db=training_management';

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="dvc-tabs-container">
        {/* BANNER QUẢN TRỊ BGH */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #081729 0%, #1E3A8A 60%, #7F1D1D 100%)',
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
                  TRUNG TÂM CHỈ HUY & QUẢN TRỊ HỆ THỐNG AN NINH (T04)
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
                  Chỉ huy / Quản trị viên: <strong style={{ color: '#FEF08A' }}>{currentUser?.fullName || 'Đại tá Trần Văn Quyết'}</strong> •
                  Vai trò: <strong style={{ color: '#86EFAC' }}>SUPER_ADMIN</strong> •
                  Cơ quan: <strong style={{ color: '#BFDBFE' }}>Học viện An ninh CAND</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenCreateUser}
              className="btn-upload-primary"
              style={{ padding: '8px 18px', fontSize: '13px', cursor: 'pointer', background: 'linear-gradient(135deg, #A31A1A 0%, #DC2626 100%)' }}
            >
              <UserPlus size={16} />
              <span>Thêm Mới Sĩ Quan / Học Viên</span>
            </button>

            <button
              onClick={loadAdminData}
              disabled={loading}
              className="btn-icon-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Đồng bộ</span>
            </button>

            <a
              href={adminerUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#047857',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(4,120,87,0.3)'
              }}
            >
              <Database size={15} />
              <span>Mở Adminer MySQL</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
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
            <span>1. Quản lý Tài khoản & Phân quyền ({users.length})</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#A31A1A" />
                  Danh Sách Toàn Bộ Sĩ Quan, Giảng Viên & Học Viên (RBAC & Clearance)
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                  Quản trị viên có toàn quyền Thêm tài khoản mới, Cập nhật thông tin, Nâng cấp bậc an ninh và Khóa tài khoản.
                </p>
              </div>

              <button
                onClick={handleOpenCreateUser}
                className="btn-upload-primary"
                style={{ fontSize: '12.5px', padding: '7px 14px', cursor: 'pointer' }}
              >
                <UserPlus size={15} />
                <span>+ Thêm Tài Khoản Mới</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tài khoản</th>
                    <th style={thStyle}>Họ và tên Sĩ quan</th>
                    <th style={thStyle}>Đơn vị công tác</th>
                    <th style={thStyle}>Vai trò RBAC</th>
                    <th style={thStyle}>Cấp độ an ninh</th>
                    <th style={thStyle}>Trạng thái</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác CRUD & Kiểm thử</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSelf = currentUser?.username === u.username;
                    return (
                      <tr key={u.id} style={{ background: isSelf ? '#FEF2F2' : '#FFFFFF' }}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>
                          {u.username}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>
                          {u.fullName} {isSelf && <span style={{ fontSize: '11px', color: '#A31A1A', fontWeight: 800 }}>(Đang chọn)</span>}
                        </td>
                        <td style={tdStyle}>{u.department || 'Bộ môn Nghiệp vụ T04'}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 8px',
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
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: u.clearanceLevelOrder === 4 ? '#FEE2E2' : u.clearanceLevelOrder === 3 ? '#FEF3C7' : '#EFF6FF',
                            color: u.clearanceLevelOrder === 4 ? '#991B1B' : u.clearanceLevelOrder === 3 ? '#92400E' : '#1E40AF'
                          }}>
                            {u.maxClearance || (u.clearanceLevelOrder === 4 ? 'Tuyệt mật' : 'Lưu hành')}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: u.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                            color: u.status === 'ACTIVE' ? '#065F46' : '#991B1B'
                          }}>
                            {u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'BỊ KHÓA'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <button
                              onClick={() => onSwitchUser(u.username)}
                              className="btn-action-test"
                              disabled={isSelf}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                width: '92px',
                                height: '25px',
                                fontSize: '11px',
                                fontWeight: 700,
                                opacity: isSelf ? 0.6 : 1,
                                cursor: isSelf ? 'default' : 'pointer',
                                boxSizing: 'border-box',
                                whiteSpace: 'nowrap'
                              }}
                              title="Chuyển sang đăng nhập tài khoản này để kiểm thử nhanh"
                            >
                              <Zap size={11} />
                              <span>{isSelf ? 'Đang dùng' : 'Thử TK'}</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="btn-action-edit"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                width: '92px',
                                height: '25px',
                                fontSize: '11px',
                                fontWeight: 700,
                                boxSizing: 'border-box',
                                whiteSpace: 'nowrap'
                              }}
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit size={11} />
                              <span>Chỉnh sửa</span>
                            </button>

                            {u.username !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="btn-action-delete"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  width: '92px',
                                  height: '25px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  boxSizing: 'border-box',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Khóa/Xóa tài khoản"
                              >
                                <Trash2 size={11} />
                                <span>Khóa TK</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                  {userSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                        Chưa ghi nhận phiên thiết bị nào.
                      </td>
                    </tr>
                  ) : (
                    userSessions.map(sess => (
                      <tr key={sess.id}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#A31A1A' }}>{sess.username}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{sess.deviceName || 'Thiết bị nội bộ'}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>{sess.deviceId}</div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{sess.ipAddress || '127.0.0.1'}</td>
                        <td style={tdStyle}>{formatDate(sess.lastActivityAt)}</td>
                        <td style={tdStyle}>
                          {sess.revokedAt ? (
                            <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                              ĐÃ THU HỒI
                            </span>
                          ) : (
                            <span style={{ background: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                              ĐANG HOẠT ĐỘNG
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {!sess.revokedAt && (
                            <button
                              onClick={() => handleRevokeSession(sess.id, sess.deviceId)}
                              style={{
                                padding: '4px 10px',
                                background: '#FEF2F2',
                                color: '#991B1B',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Thu hồi phiên đăng nhập ngay lập tức"
                            >
                              <PowerOff size={12} />
                              <span>Thu hồi ngay</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* CẢNH BÁO AN NINH */}
            <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#DC2626" />
              Sự Kiện Cảnh Báo An Ninh Tự Động (Section 38 - Security Alerts)
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tài khoản liên quan</th>
                    <th style={thStyle}>Loại cảnh báo</th>
                    <th style={thStyle}>Mức độ nghiêm trọng</th>
                    <th style={thStyle}>Mô tả sự kiện</th>
                    <th style={thStyle}>IP Nguồn</th>
                    <th style={thStyle}>Thời điểm</th>
                    <th style={thStyle}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {securityAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                        Hệ thống an toàn, chưa ghi nhận cảnh báo bất thường nào.
                      </td>
                    </tr>
                  ) : (
                    securityAlerts.map(alert => (
                      <tr key={alert.id}>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{alert.username}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#DC2626' }}>{alert.alertType}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? '#FEE2E2' : '#FEF3C7',
                            color: alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? '#991B1B' : '#92400E'
                          }}>
                            {alert.severity}
                          </span>
                        </td>
                        <td style={tdStyle}>{alert.description}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{alert.sourceIp || '127.0.0.1'}</td>
                        <td style={tdStyle}>{formatDate(alert.createdAt)}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: alert.status === 'RESOLVED' ? '#DEF7EC' : '#FEE2E2',
                            color: alert.status === 'RESOLVED' ? '#03543F' : '#991B1B'
                          }}>
                            {alert.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: NHẬT KÝ KIỂM TOÁN AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#A31A1A" />
                Bản Ghi Kiểm Toán An Ninh Bất Biến (Section 39 - Audit Trail)
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px' }}>
                  Tổng: {auditTotal} bản ghi
                </span>
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '450px', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Tìm theo sĩ quan, hành động, bảng..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') loadAuditLogs(1, auditSearch); }}
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 32px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  onClick={() => loadAuditLogs(1, auditSearch)}
                  style={{
                    padding: '7px 14px',
                    background: '#0B1E36',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Tìm kiếm
                </button>
                <button
                  onClick={() => { setAuditSearch(''); loadAuditLogs(1, ''); }}
                  style={{
                    padding: '7px 10px',
                    background: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer'
                  }}
                  title="Tải lại / Xóa bộ lọc"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Thời điểm</th>
                    <th style={thStyle}>Sĩ quan thao tác</th>
                    <th style={thStyle}>Hành động (Action)</th>
                    <th style={thStyle}>Đối tượng (Entity)</th>
                    <th style={thStyle}>Địa chỉ IP</th>
                    <th style={thStyle}>Chi tiết giá trị mới</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                        Chưa có bản ghi kiểm toán nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ ...tdStyle, fontSize: '12px', color: '#64748B' }}>{formatDate(log.createdAt)}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>{log.username}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 6px',
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            fontWeight: 700
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{log.entityType} #{log.entityId}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{log.ipAddress || '127.0.0.1'}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '11px', color: '#475569', maxWidth: '300px' }} className="truncate">
                          {log.newValue || log.oldValue || '---'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={auditPage}
              totalPages={Math.max(1, Math.ceil(auditTotal / auditPageSize))}
              totalItems={auditTotal}
              pageSize={auditPageSize}
              onPageChange={(p) => {
                setAuditPage(p);
                loadAuditLogs(p, auditSearch);
              }}
            />
          </div>
        )}

        {/* TAB 4: THỐNG KÊ CSDL MYSQL 8.X (27 BẢNG) */}
        {activeTab === 'dbms' && (
          <div style={{ padding: '24px' }}>
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0B1E36' }}>
                  HỆ QUẢN TRỊ CSDL MYSQL 8.X: training_management
                </h5>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                  27 bảng quan hệ chuẩn 3NF, phân tách metadata trong MySQL và file vật lý trong Local Private Storage.
                </p>
              </div>

              <a
                href={adminerUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#047857',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <Database size={15} />
                <span>Truy cập Trực Tiếp Adminer</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {[
                { name: 'users', count: users.length, desc: 'Tài khoản cán bộ, sĩ quan, học viên' },
                { name: 'roles', count: 4, desc: '4 vai trò chuẩn RBAC' },
                { name: 'permissions', count: 31, desc: '31 quyền hạn hệ thống' },
                { name: 'role_permissions', count: 58, desc: 'Ma trận phân quyền vai trò' },
                { name: 'user_sessions', count: userSessions.length, desc: 'Phiên kết nối & thiết bị' },
                { name: 'organizational_units', count: 9, desc: '9 Khoa, Phòng và Bộ môn T04' },
                { name: 'classes', count: 4, desc: 'Lớp học vụ theo niên khóa' },
                { name: 'subjects', count: 4, desc: 'Môn học đào tạo nghiệp vụ' },
                { name: 'classification_levels', count: 4, desc: '4 cấp độ bảo mật (Normal->Secret)' },
                { name: 'lectures', count: 6, desc: 'Bài giảng điện tử CAND' },
                { name: 'lecture_files', count: 8, desc: 'Đính kèm học liệu vào bài giảng' },
                { name: 'files', count: 8, desc: 'Metadata kho lưu trữ số hóa' },
                { name: 'file_versions', count: 8, desc: 'Lịch sử phiên bản tập tin' },
                { name: 'audit_logs', count: auditLogs.length, desc: 'Nhật ký kiểm toán an ninh' },
                { name: 'security_alerts', count: securityAlerts.length, desc: 'Cảnh báo an ninh tự động' }
              ].map((tbl, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <code style={{ fontSize: '13px', fontWeight: 800, color: '#A31A1A' }}>{tbl.name}</code>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '10px' }}>
                      {tbl.count} hàng
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{tbl.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL USER CRUD */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userToEdit={userToEdit}
        onSaved={loadAdminData}
        currentUser={currentUser}
      />
    </main>
  );
}
