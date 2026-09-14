import React, { useState, useEffect } from 'react';
import { Users, Search, X, CheckCircle2, UserPlus, Phone, Mail, GraduationCap } from 'lucide-react';
import Modal from './Modal';
import { academicService } from '../../services/academicService';
import { authService } from '../../services/authService';

export default function ClassRosterModal({ isOpen, onClose, targetClass, onRosterChanged }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [studentMssvInput, setStudentMssvInput] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState(null);

  const loadRoster = async () => {
    if (!targetClass?.id) return;
    setLoading(true);
    try {
      const data = await academicService.getClassStudents(targetClass.id, search);
      setStudents(data?.students || []);
    } catch (err) {
      console.error('Error loading class roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStudentsForEnroll = async () => {
    try {
      const all = await authService.getProvisionedStudents({ page: 1, pageSize: 500 });
      setAvailableStudents(all?.items || all || []);
    } catch (err) {
      console.error('Error loading all students:', err);
    }
  };

  useEffect(() => {
    if (isOpen && targetClass?.id) {
      loadRoster();
      loadAllStudentsForEnroll();
      setMessage(null);
      setStudentMssvInput('');
      setSelectedStudentToEnroll('');
    }
  }, [isOpen, targetClass]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRoster();
  };

  const handleEnrollStudent = async () => {
    const mssv = studentMssvInput.trim();
    if (!mssv && !selectedStudentToEnroll) return;
    setEnrolling(true);
    try {
      if (selectedStudentToEnroll) {
        await authService.enrollStudent(Number(selectedStudentToEnroll), targetClass.id, targetClass.code);
      } else {
        await authService.enrollStudent(0, targetClass.id, targetClass.code, true, null, mssv);
      }
      setMessage({ type: 'success', text: `Đã thêm học viên ${mssv ? `(MSSV: ${mssv})` : ''} vào lớp thành công!` });
      setSelectedStudentToEnroll('');
      setStudentMssvInput('');
      loadRoster();
      if (onRosterChanged) onRosterChanged();
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi thêm học viên vào lớp. Vui lòng kiểm tra lại MSSV.' });
    } finally {
      setEnrolling(false);
    }
  };

  if (!isOpen || !targetClass) return null;

  // Filter out students already in this class for the dropdown
  const currentStudentIds = new Set(students.map((s) => s.studentId));
  const candidateStudents = availableStudents.filter((s) => !currentStudentIds.has(s.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Danh sách Học viên Lớp: ${targetClass.name} (${targetClass.code})`}
      maxWidth="max-w-4xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #0B1E36 0%, #1E3A8A 100%)',
          borderRadius: '8px',
          color: '#FFFFFF'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} color="#FDE047" />
              <strong style={{ fontSize: '15px' }}>{targetClass.name}</strong>
              <span style={{ background: '#D97706', padding: '1px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                {targetClass.code}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
              Khoa: {targetClass.facultyName || 'T04'} • Niên khóa: {targetClass.academicYear || '2025-2026'} • Sĩ số hiện tại: <strong style={{ color: '#86EFAC' }}>{students.length} học viên</strong>
            </div>
          </div>
        </div>

        {/* Action message */}
        {message && (
          <div style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            background: message.type === 'error' ? '#FEE2E2' : '#DEF7EC',
            color: message.type === 'error' ? '#991B1B' : '#03543F',
            border: `1px solid ${message.type === 'error' ? '#F87171' : '#34D399'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Quick Enroll Student to this Class */}
        <div style={{
          padding: '12px 16px',
          background: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <label htmlFor="mssv-enroll-input" style={{ fontSize: '13px', fontWeight: 700, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} color="#A31A1A" />
            Thêm học viên vào lớp này:*
          </label>

          <input
            id="mssv-enroll-input"
            type="text"
            placeholder="Nhập MSSV (VD: 074_vb2d5b)..."
            value={studentMssvInput}
            onChange={(e) => {
              setStudentMssvInput(e.target.value);
              if (e.target.value) setSelectedStudentToEnroll('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEnrollStudent();
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #94A3B8',
              background: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#0B1E36',
              minWidth: '220px'
            }}
          />

          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>hoặc</span>

          <select
            value={selectedStudentToEnroll}
            onChange={(e) => {
              setSelectedStudentToEnroll(e.target.value);
              if (e.target.value) setStudentMssvInput('');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 500,
              minWidth: '220px'
            }}
          >
            <option value="">-- Hoặc chọn từ danh sách --</option>
            {candidateStudents.map((st) => (
              <option key={st.id} value={st.id}>
                {st.studentCode || st.username} - {st.fullName} (Lớp: {st.classCode || 'Chưa gán'})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleEnrollStudent}
            disabled={(!studentMssvInput.trim() && !selectedStudentToEnroll) || enrolling}
            className="btn-upload-primary"
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: (studentMssvInput.trim() || selectedStudentToEnroll) ? 'pointer' : 'not-allowed',
              opacity: (studentMssvInput.trim() || selectedStudentToEnroll) ? 1 : 0.6
            }}
          >
            {enrolling ? 'Đang thêm...' : '+ Thêm vào Lớp'}
          </button>
        </div>

        {/* Search bar within class */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Tìm theo mã sinh viên, họ tên trong lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px'
              }}
            />
          </div>
          <button type="submit" className="btn-icon-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Tìm kiếm
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); academicService.getClassStudents(targetClass.id, '').then(res => setStudents(res?.students || [])); }}
              className="btn-action-delete"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              Đặt lại
            </button>
          )}
        </form>

        {/* Roster Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#0B1E36' }}>STT</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#0B1E36' }}>Mã sinh viên</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#0B1E36' }}>Họ và tên</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#0B1E36' }}>Tài khoản</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#0B1E36' }}>Liên hệ</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#0B1E36' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                    Đang tải danh sách học viên...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                    Chưa có học viên nào trong lớp này hoặc không khớp kết quả tìm kiếm.
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => (
                  <tr key={st.studentId} style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>
                      {st.studentCode || '---'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36' }}>
                      {st.fullName}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>
                      {st.username}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11.5px', color: '#475569' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {st.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} color="#059669" /> {st.phone}</span>}
                        {st.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11} color="#2563EB" /> {st.email}</span>}
                        {!st.phone && !st.email && <span style={{ color: '#94A3B8' }}>---</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: st.status === 'ACTIVE' ? '#DEF7EC' : '#FEE2E2',
                        color: st.status === 'ACTIVE' ? '#03543F' : '#991B1B'
                      }}>
                        {st.status === 'ACTIVE' ? 'Đang học' : 'Nghỉ'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
