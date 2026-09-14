import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Mail, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { authService } from '../../services/authService';
import { academicService } from '../../services/academicService';
import { useAuth } from '../../context/AuthContext';

export default function UserModal({ isOpen, onClose, userToEdit = null, onSaved, currentUser: propUser }) {
  let contextUser = null;
  try {
    const auth = useAuth();
    contextUser = auth?.currentUser;
  } catch (e) {
    // ignore
  }
  const currentUser = propUser || contextUser || { id: 1, username: 'admin' };
  const [units, setUnits] = useState([]);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('STUDENT');
  const [clearanceLevelId, setClearanceLevelId] = useState('2');
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadUnits = async () => {
      try {
        const uRes = await academicService.getUnits();
        setUnits(uRes || []);
      } catch (err) {
        console.error('Error loading units:', err);
      }
    };

    loadUnits();

    if (userToEdit) {
      setUsername(userToEdit.username || '');
      setFullName(userToEdit.fullName || '');
      setEmail(userToEdit.email || '');
      setPassword('');
      setRoleCode(userToEdit.role || 'STUDENT');
      setClearanceLevelId(String(userToEdit.clearanceLevelOrder || 2));
      setStatus(userToEdit.status || 'ACTIVE');
      setUnitId(userToEdit.organizationalUnitId ? String(userToEdit.organizationalUnitId) : '');
    } else {
      setUsername('');
      setFullName('');
      setEmail('');
      setPassword('T04@Security2026!');
      setRoleCode('STUDENT');
      setClearanceLevelId('2');
      setStatus('ACTIVE');
      setUnitId('');
    }

    setErrorMsg('');
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userToEdit && !username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên sĩ quan / học viên.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      if (userToEdit) {
        const dto = {
          fullName: fullName.trim(),
          email: email.trim(),
          roleCode,
          clearanceLevelId: Number(clearanceLevelId),
          status,
          organizationalUnitId: unitId ? Number(unitId) : null,
        };
        if (password.trim()) dto.password = password.trim();

        await authService.updateUser(userToEdit.id, dto, currentUser?.id || 1);
      } else {
        const dto = {
          username: username.trim(),
          fullName: fullName.trim(),
          email: email.trim() || `${username.trim().toLowerCase()}@t04.edu.vn`,
          password: password.trim() || 'T04@Security2026!',
          roleCode,
          clearanceLevelId: Number(clearanceLevelId),
          organizationalUnitId: unitId ? Number(unitId) : null,
        };
        await authService.createUser(dto, currentUser?.id || 1);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi lưu thông tin tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? `Chỉnh sửa Tài khoản: ${userToEdit.username}` : 'Thêm mới Tài khoản Sĩ quan / Học viên'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Username & FullName */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên đăng nhập (Username) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!!userToEdit}
              placeholder="VD: hv_minh, gv_cuong..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-xs font-mono ${
                userToEdit ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-red-500'
              }`}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Họ và tên / Cấp bậc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Thượng sĩ Đặng Minh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> Email nghiệp vụ
            </label>
            <input
              type="email"
              placeholder="VD: dangminh@t04.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> {userToEdit ? 'Đổi mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo'}
            </label>
            <input
              type="password"
              placeholder={userToEdit ? '••••••••' : 'Mặc định: T04@Security2026!'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
            />
          </div>
        </div>

        {/* Role & Clearance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-red-600" /> Vai trò phân quyền (Role)
            </label>
            <select
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
            >
              <option value="STUDENT">🎓 STUDENT - Học viên đào tạo</option>
              <option value="TEACHER">👨‍🏫 TEACHER - Giảng viên / Cán bộ giảng dạy</option>
              <option value="SUPER_ADMIN">🛡️ SUPER_ADMIN - Chỉ huy / Quản trị hệ thống</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-red-600" /> Cấp độ Bảo mật (Clearance)
            </label>
            <select
              value={clearanceLevelId}
              onChange={(e) => setClearanceLevelId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
            >
              <option value="1">Cấp 1: NORMAL (Công khai nội bộ)</option>
              <option value="2">Cấp 2: INTERNAL (Nội bộ học viện)</option>
              <option value="3">Cấp 3: CONFIDENTIAL (Mật nghiệp vụ)</option>
              <option value="4">Cấp 4: SECRET (Tối mật nghiệp vụ)</option>
            </select>
          </div>
        </div>

        {/* Unit & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" /> Đơn vị / Khoa chuyên ngành
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
            >
              <option value="">-- Học viện CSND (T04) --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} - {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
            >
              <option value="ACTIVE">🟢 Đang hoạt động (ACTIVE)</option>
              <option value="SUSPENDED">🔴 Khóa / Ngưng hoạt động (SUSPENDED)</option>
            </select>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-action-secondary"
            style={{ padding: '8px 18px', fontSize: '12.5px' }}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-action-primary"
            style={{ padding: '8px 20px', fontSize: '12.5px', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent' }}></span>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{userToEdit ? 'Lưu cập nhật tài khoản' : 'Khởi tạo tài khoản mới'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
