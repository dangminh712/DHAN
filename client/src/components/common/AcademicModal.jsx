import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { academicService } from '../../services/academicService';

export default function AcademicModal({ isOpen, onClose, type = 'subject', itemToEdit = null, onSaved }) {
  const [units, setUnits] = useState([]);

  // Common / Subject fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState('3');
  const [unitId, setUnitId] = useState('');

  // Class fields
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('Học kỳ 1');

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

    if (itemToEdit) {
      setCode(itemToEdit.code || '');
      setName(itemToEdit.name || '');
      setDescription(itemToEdit.description || '');
      setCredits(String(itemToEdit.credits || 3));
      setAcademicYear(itemToEdit.academicYear || '2025-2026');
      setSemester(itemToEdit.semester || 'Học kỳ 1');
      setUnitId(itemToEdit.organizationalUnitId ? String(itemToEdit.organizationalUnitId) : '');
    } else {
      setCode('');
      setName('');
      setDescription('');
      setCredits('3');
      setAcademicYear('2025-2026');
      setSemester('Học kỳ 1');
      setUnitId('');
    }

    setErrorMsg('');
  }, [isOpen, type, itemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã và Tên.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      if (type === 'subject') {
        if (itemToEdit) {
          await academicService.updateSubject(itemToEdit.id, {
            name: name.trim(),
            description: description.trim(),
            credits: Number(credits),
            organizationalUnitId: unitId ? Number(unitId) : null,
          });
        } else {
          await academicService.createSubject({
            code: code.trim(),
            name: name.trim(),
            description: description.trim(),
            credits: Number(credits),
            organizationalUnitId: unitId ? Number(unitId) : null,
          });
        }
      } else {
        // class
        if (itemToEdit) {
          await academicService.updateClass(itemToEdit.id, {
            name: name.trim(),
            academicYear: academicYear.trim(),
            semester: semester.trim(),
            organizationalUnitId: unitId ? Number(unitId) : null,
          });
        } else {
          await academicService.createClass({
            code: code.trim(),
            name: name.trim(),
            academicYear: academicYear.trim(),
            semester: semester.trim(),
            organizationalUnitId: unitId ? Number(unitId) : null,
          });
        }
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi lưu dữ liệu học vụ.');
    } finally {
      setSaving(false);
    }
  };

  const isSubject = type === 'subject';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isSubject
          ? itemToEdit
            ? `Chỉnh sửa Môn học: ${itemToEdit.code}`
            : 'Thêm mới Môn học / Học phần Nghiệp vụ'
          : itemToEdit
          ? `Chỉnh sửa Lớp học vụ: ${itemToEdit.code}`
          : 'Thêm mới Lớp học vụ Niên khóa'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Code & Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mã {isSubject ? 'môn học' : 'lớp'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!!itemToEdit}
              placeholder={isSubject ? 'VD: AN_DT' : 'VD: D49_ATTT'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-xs font-mono uppercase font-bold ${
                itemToEdit ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-red-500'
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">
              Tên {isSubject ? 'môn học nghiệp vụ' : 'lớp học vụ'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={isSubject ? 'VD: An ninh Điều tra Hình sự' : 'VD: Khóa D49 - An ninh Điều tra'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Specific Fields */}
        {isSubject ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số tín chỉ đào tạo</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Khoa / Bộ môn phụ trách</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
                >
                  <option value="">-- Khoa chuyên ngành --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} - {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mô tả tóm tắt học phần</label>
              <textarea
                rows={2}
                placeholder="Mục tiêu môn học, giáo trình quy định và yêu cầu kiểm tra..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Niên khóa đào tạo</label>
              <input
                type="text"
                placeholder="VD: 2025-2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Học kỳ</label>
              <input
                type="text"
                placeholder="VD: Học kỳ 1"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
          </div>
        )}

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
                <span>{itemToEdit ? 'Lưu cập nhật' : (type === 'subject' ? 'Tạo môn học mới' : 'Tạo lớp học vụ mới')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
