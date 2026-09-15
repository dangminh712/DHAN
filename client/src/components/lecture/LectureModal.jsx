import React, { useState, useEffect } from 'react';
import { BookOpen, Check, AlertCircle, Layers, FileText, CheckCircle2, Search, Flame, ArrowUpDown, Filter, Shield, GraduationCap, ExternalLink, ShieldCheck, Eye } from 'lucide-react';
import { getMediaKind } from '../../mediaType';
import './LectureModal.css';
import Modal from '../common/Modal';
import { lectureService } from '../../services/lectureService';
import { academicService } from '../../services/academicService';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

export default function LectureModal({ isOpen, onClose, lectureToEdit = null, onSaved, currentUser: propUser }) {
  let contextUser = null;
  try {
    const auth = useAuth();
    contextUser = auth?.currentUser;
  } catch (e) {
    // ignore
  }
  const currentUser = propUser || contextUser || { id: 1, username: 'admin' };

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [availableFiles, setAvailableFiles] = useState([]);

  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [isPublicAll, setIsPublicAll] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDownloadSettings, setFileDownloadSettings] = useState({});

  // Filter & Sort state for Attach Files (Requirement 4)
  const [fileSearch, setFileSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [fileSortBy, setFileSortBy] = useState('RECENT_2DAYS'); // Ưu tiên tệp gần đây (2 ngày) mặc định

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Fetch dependencies
    const loadData = async () => {
      try {
        const [subRes, clsRes, fileRes] = await Promise.all([
          academicService.getSubjects(),
          academicService.getClasses(),
          fileService.getFiles(),
        ]);
        setSubjects(subRes || []);
        setClasses(clsRes || []);
        setAvailableFiles(fileRes || []);

        if (lectureToEdit) {
          // Pre-populate fields
          const foundSub = subRes.find((s) => s.code === lectureToEdit.subjectCode || s.name === lectureToEdit.subject);
          setSubjectId(foundSub ? String(foundSub.id) : (subRes[0]?.id ? String(subRes[0].id) : ''));
          setTitle(lectureToEdit.title || '');
          setDescription(lectureToEdit.description || '');
          setStatus(lectureToEdit.status || 'PUBLISHED');

          // Check if public to all
          const isPub = lectureToEdit.isPublicAll !== undefined ? lectureToEdit.isPublicAll : (!lectureToEdit.assignedClasses || lectureToEdit.assignedClasses.length === 0);
          setIsPublicAll(isPub);

          // Pre-select classes
          const classIds = [];
          (lectureToEdit.assignedClasses || []).forEach((cName) => {
            const matched = clsRes.find((c) => c.name === cName || c.code === cName);
            if (matched) classIds.push(matched.id);
          });
          setSelectedClasses(classIds.length > 0 ? classIds : clsRes.slice(0, 2).map((c) => c.id));

          // Pre-select files & their download settings
          const fileIds = (lectureToEdit.files || []).map((f) => f.fileId);
          setSelectedFiles(fileIds);

          const dlMap = {};
          (lectureToEdit.files || []).forEach(f => {
            dlMap[f.fileId] = f.isDownloadable !== false;
          });
          setFileDownloadSettings(dlMap);
        } else {
          // Defaults for new
          setSubjectId(subRes[0]?.id ? String(subRes[0].id) : '');
          setTitle('');
          setDescription('');
          setStatus('PUBLISHED');
          setIsPublicAll(true);
          setSelectedClasses(clsRes.slice(0, 2).map((c) => c.id));
          setSelectedFiles([]);
          setFileDownloadSettings({});
        }
      } catch (err) {
        console.error('Error loading modal data:', err);
      }
    };

    loadData();
    setErrorMsg('');
  }, [isOpen, lectureToEdit]);

  if (!isOpen) return null;

  const handleToggleClass = (id) => {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleFile = (id) => {
    setSelectedFiles((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      // Default downloadable to true when adding
      if (!prev.includes(id) && fileDownloadSettings[id] === undefined) {
        setFileDownloadSettings(s => ({ ...s, [id]: true }));
      }
      return next;
    });
  };

  const handleToggleDownloadable = (fileId, e) => {
    e.stopPropagation();
    setFileDownloadSettings(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên bài giảng.');
      return;
    }
    if (!subjectId) {
      setErrorMsg('Vui lòng chọn môn học tương ứng.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const dto = {
        subjectId: Number(subjectId),
        title: title.trim(),
        description: description.trim(),
        classIds: isPublicAll ? [] : selectedClasses,
        fileIds: selectedFiles,
      };

      let savedLectureId = lectureToEdit?.id;

      if (lectureToEdit) {
        dto.status = status;
        await lectureService.updateLecture(lectureToEdit.id, dto, currentUser?.id || 1);
        savedLectureId = lectureToEdit.id;
      } else {
        const created = await lectureService.createLecture(dto, currentUser?.id || 1);
        savedLectureId = created?.id || created?.lectureId;
      }

      // Update permissions explicitly
      if (savedLectureId) {
        await lectureService.updatePermissions(
          savedLectureId,
          {
            scope: isPublicAll ? 'ALL' : 'SPECIFIC',
            classIds: isPublicAll ? [] : selectedClasses
          },
          currentUser?.id || 1
        );

        // Update status if locked
        if (status) {
          await lectureService.updateStatus(savedLectureId, status, currentUser?.id || 1);
        }

        // Update download permission per file
        for (const fId of selectedFiles) {
          const canDl = fileDownloadSettings[fId] !== false;
          await lectureService.toggleFileDownloadable(savedLectureId, fId, canDl, currentUser?.id || 1).catch(() => {});
        }
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi lưu bài giảng.');
    } finally {
      setSaving(false);
    }
  };

  const selectedSubject = subjects.find((s) => String(s.id) === String(subjectId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lectureToEdit ? `Chỉnh sửa Bài giảng: ${lectureToEdit.title}` : 'Khởi tạo Bài giảng Điện tử Mới'}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="lecture-editor">
        <div className="lecture-editor-intro">
          <div className="lecture-editor-emblem"><BookOpen size={24} /></div>
          <div><span className="lecture-editor-eyebrow">KHÔNG GIAN BIÊN SOẠN</span><h2>{lectureToEdit ? 'Hoàn thiện bài giảng của bạn' : 'Xây dựng bài học, kết nối tri thức'}</h2><p>Thiết lập nội dung, chọn học viên và bổ sung học liệu cho bài giảng.</p></div>
        </div>
        <section className="lecture-editor-section">
          <div className="lecture-editor-section-heading"><span>01</span><div><h3>Thông tin bài giảng</h3><p>Những thông tin giúp học viên hiểu rõ nội dung và mục tiêu bài học.</p></div></div>
        {/* Row 1: Subject & Status */}
        <div className="lecture-editor-main-grid">
          <div className="md:col-span-2">
            <label htmlFor="lecture-subject" className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 text-xs">
              <GraduationCap className="w-4 h-4 text-red-700 shrink-0" />
              <span>Môn học / Học phần Nghiệp vụ</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <select
              id="lecture-subject" required value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-xs bg-white font-semibold text-slate-800 shadow-2xs transition-all"
            >
              <option value="">-- Chọn môn học / học phần nghiệp vụ --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.credits || 3} Tín chỉ)
                </option>
              ))}
            </select>

            {selectedSubject && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <span className="font-semibold text-slate-700">Mã môn: <span className="font-mono text-red-700 font-bold">{selectedSubject.code}</span></span>
                <span>•</span>
                <span>Số tín chỉ: <strong className="text-slate-800">{selectedSubject.credits || 3}</strong></span>
                {selectedSubject.facultyName && (
                  <>
                    <span>•</span>
                    <span>Khoa: <strong className="text-slate-800">{selectedSubject.facultyName}</strong></span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="lecture-status" className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Trạng thái phát hành</span>
            </label>
            <select
              id="lecture-status" value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white font-semibold text-slate-800 shadow-2xs transition-all"
            >
              <option value="PUBLISHED">Đang phát hành</option>
              <option value="LOCKED">Tạm khóa</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CLOSED">Đã kết thúc</option>
            </select>
          </div>
        </div>

        {/* Row 2: Title */}
        <div>
          <label htmlFor="lecture-title" className="block font-bold text-slate-700 mb-1">
            Tiêu đề Bài giảng Điện tử <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lecture-title" required placeholder="Ví dụ: Chuyên đề 4: Phương pháp bảo vệ hiện trường và thu thập dấu vết điện tử..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs font-semibold"
          />
        </div>

        {/* Row 3: Description */}
        <div>
          <label htmlFor="lecture-description" className="block font-bold text-slate-700 mb-1">Mục tiêu & Tóm tắt nội dung bài học</label>
          <textarea
            id="lecture-description" rows={3}
            placeholder="Mô tả tóm tắt nội dung trọng tâm bài giảng, kỹ năng cần đạt và tài liệu bắt buộc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
          />
        </div>

        </section>
        <section className="lecture-editor-section">
          <div className="lecture-editor-section-heading"><span>02</span><div><h3>Đối tượng học tập</h3><p>Chọn phạm vi truy cập phù hợp với kế hoạch đào tạo.</p></div></div>
        {/* Row 4: Visibility & Class Permissions */}
        <div className="lecture-editor-access">
          <label className="block font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-red-600" />
            Phân quyền Tiếp cận Bài giảng <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
            <label
              onClick={() => setIsPublicAll(true)}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                isPublicAll ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input type="radio" name="visibilityScope" checked={isPublicAll} onChange={() => setIsPublicAll(true)} className="mt-0.5 accent-emerald-600" />
              <div>
                <div className="text-xs">Toàn bộ học viên</div>
                <div className="text-[10.5px] font-normal text-slate-500">Tất cả học viên mọi khóa/lớp trong trường đều xem được bài giảng này</div>
              </div>
            </label>

            <label
              onClick={() => setIsPublicAll(false)}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                !isPublicAll ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input type="radio" name="visibilityScope" checked={!isPublicAll} onChange={() => setIsPublicAll(false)} className="mt-0.5 accent-blue-600" />
              <div>
                <div className="text-xs">Các lớp được chỉ định</div>
                <div className="text-[10.5px] font-normal text-slate-500">Chỉ các lớp được chọn mới có quyền tiếp cận học liệu</div>
              </div>
            </label>
          </div>

          {!isPublicAll && (
            <div>
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Chọn các lớp được phép xem ({selectedClasses.length}/{classes.length} lớp):</span>
                {classSearchQuery && (
                  <span className="text-[10px] text-slate-400">Đang lọc theo từ khóa</span>
                )}
              </div>

              {/* Ô TÌM KIẾM LỚP HỌC VỤ */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Tìm lớp học" value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm mã lớp, tên lớp học vụ (VD: D31, An ninh điều tra)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-white border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                {classes
                  .filter((c) => {
                    if (!classSearchQuery.trim()) return true;
                    const q = classSearchQuery.toLowerCase();
                    return (
                      (c.code && c.code.toLowerCase().includes(q)) ||
                      (c.name && c.name.toLowerCase().includes(q))
                    );
                  })
                  .map((c) => {
                    const checked = selectedClasses.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-[11px] border ${
                          checked
                            ? 'bg-red-50 border-red-200 text-red-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => handleToggleClass(c.id)} />
                        <span className="truncate" title={`${c.code} - ${c.name}`}>{c.code} - {c.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        </section>
        <section className="lecture-editor-section">
          <div className="lecture-editor-section-heading"><span>03</span><div><h3>Học liệu đính kèm</h3><p>Chọn tài liệu trong kho và thiết lập quyền tải cho từng tệp.</p></div></div>
        {/* Row 5: Attach Files from Repository with Download Toggle (Requirement 4) */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label className="block font-bold text-slate-700 flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Đính kèm Học liệu Số & Phân quyền Tải về</span>
              <span className="font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full text-[10.5px]">
                Đã chọn: {selectedFiles.length}/{availableFiles.length}
              </span>
            </label>
            <span className="text-[11px] font-normal text-slate-500">Bấm nút để đổi quyền tải / chỉ xem</span>
          </div>

          {/* SEARCH, FILTER & SORT TOOLBAR */}
          <div className="lecture-editor-toolbar">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Tìm học liệu" placeholder="Tìm theo tên học liệu..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              <select
                aria-label="Loại học liệu" value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="video">🎥 Video</option>
                <option value="document">📄 Tài liệu / PDF</option>
                <option value="image">🖼️ Slide & Sơ đồ</option>
                <option value="audio">🎵 Ghi âm</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <select
                aria-label="Sắp xếp học liệu" value={fileSortBy}
                onChange={(e) => setFileSortBy(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-sky-500"
              >
                <option value="RECENT_2DAYS">⚡ Ưu tiên tệp mới nạp gần đây</option>
                <option value="NEWEST">📅 Mới nhất trước</option>
                <option value="OLDEST">📅 Cũ nhất trước</option>
                <option value="NAME_ASC">🔤 Tên A → Z</option>
                <option value="NAME_DESC">🔤 Tên Z → A</option>
                <option value="SIZE_DESC">💾 Dung lượng lớn nhất</option>
                <option value="SELECTED_FIRST">✅ Đã chọn lên đầu</option>
              </select>
            </div>
          </div>

          {/* FILES LIST */}
          <div className="lecture-editor-files">
            {(() => {
              const isWithin2Days = (dateStr) => {
                if (!dateStr) return false;
                const d = new Date(dateStr).getTime();
                if (isNaN(d)) return false;
                const diff = Date.now() - d;
                return diff >= -60000 && diff <= 2 * 24 * 60 * 60 * 1000;
              };

              const formatFileSize = (bytes) => {
                if (!bytes || bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
              };

              const formatFileDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return '';
                return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
              };

              const q = fileSearch.trim().toLowerCase();
              const filtered = availableFiles.filter((f) => {
                const matchSearch = !q || (f.originalName && f.originalName.toLowerCase().includes(q));
                if (!matchSearch) return false;

                if (fileTypeFilter === 'ALL') return true;
                const kind = getMediaKind(f);
                return fileTypeFilter === 'document' ? ['document', 'pdf', 'slide'].includes(kind) : kind === fileTypeFilter;
              });

              const sorted = [...filtered].sort((a, b) => {
                if (fileSortBy === 'RECENT_2DAYS') {
                  const aRecent = isWithin2Days(a.createdAt);
                  const bRecent = isWithin2Days(b.createdAt);
                  if (aRecent && !bRecent) return -1;
                  if (!aRecent && bRecent) return 1;
                  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return timeB - timeA;
                }
                if (fileSortBy === 'NEWEST') {
                  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return timeB - timeA;
                }
                if (fileSortBy === 'OLDEST') {
                  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return timeA - timeB;
                }
                if (fileSortBy === 'NAME_ASC') {
                  return (a.originalName || '').localeCompare(b.originalName || '', 'vi');
                }
                if (fileSortBy === 'NAME_DESC') {
                  return (b.originalName || '').localeCompare(a.originalName || '', 'vi');
                }
                if (fileSortBy === 'SIZE_DESC') {
                  return (b.fileSize || 0) - (a.fileSize || 0);
                }
                if (fileSortBy === 'SELECTED_FIRST') {
                  const aSel = selectedFiles.includes(a.id);
                  const bSel = selectedFiles.includes(b.id);
                  if (aSel && !bSel) return -1;
                  if (!aSel && bSel) return 1;
                  return 0;
                }
                return 0;
              });

              if (sorted.length === 0) {
                return (
                  <p className="text-slate-400 italic text-[11px] p-3 text-center">
                    {availableFiles.length === 0
                      ? 'Chưa có học liệu nào trong kho. Hãy nạp file trước.'
                      : 'Không tìm thấy học liệu nào phù hợp với bộ lọc.'}
                  </p>
                );
              }

              return sorted.map((f) => {
                const checked = selectedFiles.includes(f.id);
                const isDl = fileDownloadSettings[f.id] !== false;
                const isRecent = isWithin2Days(f.createdAt);
                const cName = f.classificationName || f.classification || 'Nội bộ';

                return (
                  <div
                    key={f.id}
                    onClick={() => handleToggleFile(f.id)}
                    className={`lecture-editor-file flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-[11px] border ${
                      checked
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
                        : isRecent
                        ? 'bg-amber-50/50 border-amber-200 text-slate-800 hover:bg-amber-100/60'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <input type="checkbox" checked={checked} aria-label={`Chọn ${f.originalName}`} onClick={e => e.stopPropagation()} onChange={() => handleToggleFile(f.id)} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate font-semibold text-slate-800">{f.originalName}</span>
                          {isRecent && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs shrink-0">
                              <Flame className="w-3 h-3 fill-current shrink-0" />
                              <span>Mới</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5 font-medium">
                          <span>{formatFileSize(f.fileSize)}</span>
                          {f.createdAt && (
                            <>
                              <span>•</span>
                              <span>{formatFileDate(f.createdAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[10px]" onClick={(e) => e.stopPropagation()}>
                      <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded font-mono font-bold text-[10px]">
                        {f.fileType || 'FILE'}
                      </span>

                      <span style={{
                        padding: '3px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: cName.toLowerCase().includes('tuyệt mật') ? '#FEE2E2' :
                                    cName.toLowerCase().includes('tối mật') ? '#FFEDD5' :
                                    cName.toLowerCase().includes('mật') ? '#FEF3C7' : '#DBEAFE',
                        color: cName.toLowerCase().includes('tuyệt mật') ? '#991B1B' :
                               cName.toLowerCase().includes('tối mật') ? '#C2410C' :
                               cName.toLowerCase().includes('mật') ? '#B45309' : '#1E40AF'
                      }}>
                        {cName}
                      </span>

                      {/* Nút mở tài liệu ở trang khác để coi */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(fileService.getStreamUrl(f.id, currentUser?.id || 1), '_blank');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[10.5px] font-semibold transition-colors shadow-2xs cursor-pointer"
                        title="Mở tài liệu ở trang khác để xem"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                        <span>Mở xem</span>
                      </button>

                      {checked && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleDownloadable(f.id, e)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: isDl ? '#DEF7EC' : '#FEF3C7',
                            color: isDl ? '#03543F' : '#92400E'
                          }}
                          title="Bấm để chuyển đổi giữa Cho phép tải và Chỉ xem trực tuyến"
                        >
                          {isDl ? '📥 Cho phép tải' : '👁️ Chỉ xem (Khóa tải)'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        </section>
        {/* Error Notification */}
        {errorMsg && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="lecture-editor-actions">
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
                <span>{lectureToEdit ? 'Lưu thay đổi bài giảng' : 'Tạo bài giảng mới'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
