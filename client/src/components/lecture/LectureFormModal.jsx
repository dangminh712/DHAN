import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { academicService } from '../../services/academicService';
import { fileService } from '../../services/fileService';
import { lectureService } from '../../services/lectureService';
import { useAuth } from '../../context/AuthContext';

export default function LectureFormModal({ isOpen, onClose, onCreated }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      setLoading(true);
      try {
        const [subList, classList, fileList] = await Promise.all([
          academicService.getSubjects(),
          academicService.getClasses(),
          fileService.getFiles(),
        ]);
        setSubjects(subList);
        setClasses(classList);
        setAllFiles(fileList);
        if (subList.length > 0) setSubjectId(subList[0].id);
      } catch (err) {
        console.error('Lỗi tải danh mục biên soạn:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    setSubmitting(true);
    try {
      await lectureService.createLecture(
        {
          subjectId: Number(subjectId),
          title: title.trim(),
          description: description.trim(),
          classIds: selectedClasses.map(Number),
          fileIds: selectedFiles.map(Number),
        },
        currentUser.id
      );

      // Reset
      setTitle('');
      setDescription('');
      setSelectedClasses([]);
      setSelectedFiles([]);
      onCreated();
      onClose();
    } catch (err) {
      alert('Lỗi tạo bài giảng: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleClass = (classId) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleFile = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Biên soạn & Xuất bản Bài giảng Điện tử mới" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Tiêu đề bài giảng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Bài giảng: Kỹ thuật giám sát và trinh sát mạng..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Môn học / Học phần đào tạo <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Giảng viên phụ trách</label>
            <input
              type="text"
              disabled
              value={currentUser?.fullName || ''}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 text-xs cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Mô tả tóm tắt nội dung bài giảng</label>
          <textarea
            rows={3}
            placeholder="Mô tả mục tiêu, yêu cầu cần đạt và hướng dẫn nghiên cứu học liệu..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
          />
        </div>

        {/* Assign Classes */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Phân quyền theo Lớp học vụ (Section 38 - Chỉ học viên thuộc lớp mới có quyền truy cập)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
            {classes.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 hover:text-red-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(c.id)}
                  onChange={() => toggleClass(c.id)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="truncate">
                  <strong>{c.code}</strong> - {c.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Attach Files */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Đính kèm Học liệu từ Kho lưu trữ số (Section 18)
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
            {allFiles.map((f) => (
              <label key={f.id} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-200/50 cursor-pointer">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(f.id)}
                    onChange={() => toggleFile(f.id)}
                    className="rounded text-red-600 focus:ring-red-500 shrink-0"
                  />
                  <span className="truncate text-xs text-slate-800">{f.originalName}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono shrink-0">
                  {f.fileType} • {f.classificationName}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5"
          >
            {submitting ? 'Đang lưu CSDL...' : 'Lưu & Xuất bản bài giảng'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
