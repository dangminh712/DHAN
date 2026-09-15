import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Shield,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCheck,
  UploadCloud,
  Eye,
  Check,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Award,
  Lock,
  ExternalLink
} from 'lucide-react';
import { lectureService } from '../services/lectureService';
import { academicService } from '../services/academicService';
import { fileService } from '../services/fileService';
import { getMediaKind } from '../mediaType';

const STANDARD_5_PARTS = [
  {
    partNumber: 1,
    title: 'Phần 1: Mục tiêu & Yêu cầu Nghiệp vụ',
    subtitle: 'Căn cứ pháp lý, chuẩn đầu ra & yêu cầu huấn luyện sĩ quan',
    durationMinutes: 15,
    durationText: '15 phút',
    defaultTab: 'doc',
    iconName: 'BookOpen',
    description: 'Nắm vững mục tiêu bài học, văn bản chỉ đạo của Bộ Công An và các yêu cầu nghiệp vụ bắt buộc.'
  },
  {
    partNumber: 2,
    title: 'Phần 2: Lý thuyết Chuyên đề & Trình chiếu',
    subtitle: 'Slide bài giảng PPT/PDF & Video ghi hình giảng viên',
    durationMinutes: 45,
    durationText: '45 phút',
    defaultTab: 'video',
    iconName: 'Video',
    description: 'Nội dung lý thuyết trọng tâm, bài giảng điện tử và video phân tích tình huống thực tế của giảng viên.'
  },
  {
    partNumber: 3,
    title: 'Phần 3: Tình huống Thực địa & Sơ đồ Chiến thuật',
    subtitle: 'Tư liệu ảnh hiện trường, bản đồ tác chiến & mô phỏng vụ việc',
    durationMinutes: 30,
    durationText: '30 phút',
    defaultTab: 'image',
    iconName: 'ImageIcon',
    description: 'Hình ảnh thực địa, sơ đồ tác chiến, phân tích phương thức thủ đoạn của các đối tượng trọng điểm.'
  },
  {
    partNumber: 4,
    title: 'Phần 4: Tài liệu Nghiên cứu & Văn bản Quy phạm',
    subtitle: 'Bộ luật TTHS, Luật CAND & Thông tư nghiệp vụ của Bộ',
    durationMinutes: 25,
    durationText: '25 phút',
    defaultTab: 'doc',
    iconName: 'FileText',
    description: 'Hệ thống tài liệu tham khảo, văn bản quy phạm pháp luật và biểu mẫu nghiệp vụ liên quan.'
  },
  {
    partNumber: 5,
    title: 'Phần 5: Câu hỏi Ôn tập & Sổ tay Thu hoạch',
    subtitle: 'Đánh giá nhận thức nghiệp vụ & Ghi chép thu hoạch',
    durationMinutes: 20,
    durationText: '20 phút',
    defaultTab: 'quiz',
    iconName: 'HelpCircle',
    description: 'Bộ câu hỏi trắc nghiệm kiểm tra mức độ tiếp thu bài học và ghi chép nhận thức của học viên.'
  }
];

const ICON_OPTIONS = [
  { name: 'BookOpen', label: 'Sách / Mục tiêu', icon: BookOpen },
  { name: 'Video', label: 'Video / Giảng viên', icon: Video },
  { name: 'ImageIcon', label: 'Ảnh / Hiện trường', icon: ImageIcon },
  { name: 'FileText', label: 'Văn bản / Tài liệu', icon: FileText },
  { name: 'HelpCircle', label: 'Trắc nghiệm / Ôn tập', icon: HelpCircle },
  { name: 'Shield', label: 'An ninh / Bảo mật', icon: Shield },
  { name: 'Award', label: 'Đánh giá / Thu hoạch', icon: Award }
];

const TAB_OPTIONS = [
  { value: 'doc', label: 'Tài liệu PDF / Văn bản' },
  { value: 'video', label: 'Video bài giảng MP4' },
  { value: 'slide', label: 'Slide trình chiếu PPT/PDF' },
  { value: 'image', label: 'Tư liệu hình ảnh / Bản đồ' },
  { value: 'quiz', label: 'Câu hỏi trắc nghiệm ôn tập' }
];

export default function LectureCreatorPage({
  lectureId = null,
  currentUser,
  onBack,
  onSaved
}) {
  const isEditing = Boolean(lectureId);

  // Active Wizard Tab: 'info' | 'parts' | 'files' | 'quiz' | 'preview'
  const [activeTab, setActiveTab] = useState('info');

  // Loading & Reference data from DBMS
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState({ type: '', text: '' });

  const [academicUnits, setAcademicUnits] = useState([]);
  const [academicSubjects, setAcademicSubjects] = useState([]);
  const [academicClasses, setAcademicClasses] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [availableFiles, setAvailableFiles] = useState([]);

  // Form State: 1. Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState(currentUser?.id || 1);
  const [status, setStatus] = useState('PUBLISHED');
  const [isPublicAll, setIsPublicAll] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Form State: 2. Lecture Parts
  const [parts, setParts] = useState(STANDARD_5_PARTS);

  // Form State: 3. Files & Permissions
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [fileDownloadSettings, setFileDownloadSettings] = useState({});
  const [filePrintSettings, setFilePrintSettings] = useState({});
  const [fileSearch, setFileSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');

  // Form State: 4. Quiz Questions
  const [quizQuestions, setQuizQuestions] = useState([]);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification({ type: '', text: '' }), 4500);
  };

  // Load all master reference data from DBMS
  useEffect(() => {
    let isMounted = true;
    const loadMasterData = async () => {
      try {
        setLoading(true);
        const [unitsRes, subsRes, classesRes, filesRes, usersRes] = await Promise.all([
          academicService.getUnits().catch(() => []),
          academicService.getSubjects().catch(() => []),
          academicService.getClasses().catch(() => []),
          fileService.getFiles().catch(() => []),
          academicService.getTeachers ? academicService.getTeachers().catch(() => []) : Promise.resolve([])
        ]);

        if (!isMounted) return;

        setAcademicUnits(unitsRes || []);
        setAcademicSubjects(subsRes || []);
        setAcademicClasses(classesRes || []);
        setAvailableFiles(filesRes || []);
        setTeachersList(usersRes || []);

        if (subsRes && subsRes.length > 0 && !subjectId) {
          setSubjectId(String(subsRes[0].id));
        }

        // If editing existing lecture, fetch details from MySQL
        if (lectureId) {
          const detail = await lectureService.getLectureDetail(lectureId, currentUser?.id);
          if (detail && isMounted) {
            setTitle(detail.title || '');
            setDescription(detail.description || '');
            setSubjectId(String(detail.subjectId || detail.subject?.id || subsRes[0]?.id || '1'));
            setTeacherId(detail.teacherId || currentUser?.id || 1);
            setStatus(detail.status || 'PUBLISHED');
            setIsPublicAll(detail.isPublicAll !== false && (!detail.assignedClassIds || detail.assignedClassIds.length === 0));
            setSelectedClasses(detail.assignedClassIds || []);

            if (detail.parts && detail.parts.length > 0) {
              setParts(detail.parts.map(p => ({
                partNumber: p.partNumber,
                title: p.title,
                subtitle: p.subtitle || '',
                durationMinutes: p.durationMinutes || 30,
                durationText: p.durationText || `${p.durationMinutes || 30} phút`,
                defaultTab: p.defaultTab || 'doc',
                iconName: p.iconName || 'BookOpen',
                description: p.description || ''
              })));
            }

            if (detail.files && detail.files.length > 0) {
              const fIds = detail.files.map(f => f.fileId);
              setSelectedFileIds(fIds);
              const dlMap = {};
              const prMap = {};
              detail.files.forEach(f => {
                dlMap[f.fileId] = f.isDownloadable !== false;
                prMap[f.fileId] = f.isPrintable !== false;
              });
              setFileDownloadSettings(dlMap);
              setFilePrintSettings(prMap);
            }

            if (detail.quizQuestions && detail.quizQuestions.length > 0) {
              setQuizQuestions(detail.quizQuestions);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu biên soạn:', err);
        setErrorMessage('Không thể nạp danh mục CSDL MySQL: ' + (err.message || ''));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMasterData();
    return () => { isMounted = false; };
  }, [lectureId, currentUser?.id]);

  // Handle Class toggling
  const handleToggleClass = (classId) => {
    setSelectedClasses(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  // Handle Parts management
  const handleApplyStandardParts = () => {
    setParts(STANDARD_5_PARTS);
    notify('success', 'Đã nạp 5 mục chuyên đề chuẩn nghiệp vụ đào tạo Sĩ quan CAND!');
  };

  const handleAddPart = () => {
    const nextNum = parts.length > 0 ? Math.max(...parts.map(p => p.partNumber)) + 1 : 1;
    const newPart = {
      partNumber: nextNum,
      title: `Phần ${nextNum}: Chuyên mục mở rộng`,
      subtitle: 'Mục tiêu, nội dung huấn luyện hoặc bài tập bổ trợ',
      durationMinutes: 30,
      durationText: '30 phút',
      defaultTab: 'doc',
      iconName: 'BookOpen',
      description: ''
    };
    setParts([...parts, newPart]);
    notify('info', `Đã thêm mục thứ ${nextNum} vào cấu trúc bài giảng.`);
  };

  const handleUpdatePart = (index, field, value) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'durationMinutes') {
      updated[index].durationText = `${value} phút`;
    }
    setParts(updated);
  };

  const handleDeletePart = (index) => {
    if (parts.length <= 1) {
      notify('error', 'Bài giảng phải có ít nhất 1 mục / phần chuyên đề.');
      return;
    }
    const filtered = parts.filter((_, i) => i !== index);
    const reordered = filtered.map((p, idx) => ({ ...p, partNumber: idx + 1 }));
    setParts(reordered);
    notify('info', 'Đã xóa mục và sắp xếp lại thứ tự bài giảng.');
  };

  const handleMovePart = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === parts.length - 1)) return;
    const updated = [...parts];
    const targetIdx = index + direction;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    const reordered = updated.map((p, idx) => ({ ...p, partNumber: idx + 1 }));
    setParts(reordered);
  };

  // Handle Files attachment
  const handleToggleFile = (fileId) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        const fileObj = availableFiles.find(f => f.id === fileId);
        const isVideo = fileObj?.fileType === 'VIDEO';
        const isPdf = fileObj?.fileType === 'PDF';
        setFileDownloadSettings(s => ({ ...s, [fileId]: !isVideo }));
        setFilePrintSettings(s => ({ ...s, [fileId]: isPdf }));
        return [...prev, fileId];
      }
    });
  };

  const handleToggleDownloadable = (fileId) => {
    setFileDownloadSettings(s => ({ ...s, [fileId]: !s[fileId] }));
  };

  const handleTogglePrintable = (fileId) => {
    setFilePrintSettings(s => ({ ...s, [fileId]: !s[fileId] }));
  };

  // Filtered available files
  const filteredFiles = useMemo(() => {
    return availableFiles.filter(f => {
      if (fileTypeFilter !== 'ALL') {
        const kind = getMediaKind(f)?.toUpperCase();
        if (fileTypeFilter === 'PDF' && kind !== 'PDF') return false;
        if (fileTypeFilter === 'VIDEO' && kind !== 'VIDEO') return false;
        if (fileTypeFilter === 'IMAGE' && kind !== 'IMAGE') return false;
      }
      if (fileSearch) {
        const q = fileSearch.toLowerCase();
        const matchName = f.originalFileName?.toLowerCase().includes(q) || f.title?.toLowerCase().includes(q);
        const matchCode = f.fileCode?.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [availableFiles, fileTypeFilter, fileSearch]);

  // Handle Quiz Questions
  const handleAddQuestion = () => {
    const nextOrder = quizQuestions.length + 1;
    const newQ = {
      id: Date.now(),
      question: `Câu ${nextOrder}: Nêu quy định nghiệp vụ về công tác bảo vệ an ninh và xử lý tình huống?`,
      options: [
        'A. Báo cáo ngay cho chỉ huy trực tiếp và triển khai biện pháp khẩn cấp',
        'B. Tự ý giải quyết không cần thông báo cho đơn vị phối hợp',
        'C. Chờ hết ca trực mới lập biên bản bàn giao vụ việc',
        'D. Chuyển hồ sơ cho cơ quan ngoài ngành khi chưa có phê duyệt'
      ],
      correctIndex: 0,
      explanation: 'Căn cứ Điều lệnh CAND và Quy định xử lý tình huống nghiệp vụ khẩn cấp của Bộ Công An.',
      orderIndex: nextOrder
    };
    setQuizQuestions([...quizQuestions, newQ]);
    notify('info', `Đã thêm Câu hỏi số ${nextOrder}.`);
  };

  const handleUpdateQuestionText = (qIndex, text) => {
    const updated = [...quizQuestions];
    updated[qIndex].question = text;
    setQuizQuestions(updated);
  };

  const handleUpdateOption = (qIndex, optIndex, optText) => {
    const updated = [...quizQuestions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = optText;
    updated[qIndex].options = newOptions;
    setQuizQuestions(updated);
  };

  const handleSetCorrectIndex = (qIndex, optIndex) => {
    const updated = [...quizQuestions];
    updated[qIndex].correctIndex = optIndex;
    setQuizQuestions(updated);
  };

  const handleUpdateExplanation = (qIndex, expText) => {
    const updated = [...quizQuestions];
    updated[qIndex].explanation = expText;
    setQuizQuestions(updated);
  };

  const handleDeleteQuestion = (qIndex) => {
    const filtered = quizQuestions.filter((_, i) => i !== qIndex);
    const reordered = filtered.map((q, idx) => ({ ...q, orderIndex: idx + 1 }));
    setQuizQuestions(reordered);
    notify('info', 'Đã xóa câu hỏi ôn tập.');
  };

  // Submit & Save to MySQL DBMS
  const handleSaveToDbms = async () => {
    if (!title.trim()) {
      setActiveTab('info');
      notify('error', 'Vui lòng nhập Tiêu đề bài giảng.');
      return;
    }
    if (!subjectId) {
      setActiveTab('info');
      notify('error', 'Vui lòng chọn Học phần / Môn học.');
      return;
    }
    if (parts.length === 0) {
      setActiveTab('parts');
      notify('error', 'Bài giảng cần có ít nhất 1 mục / phần chuyên đề.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const payload = {
        subjectId: Number(subjectId),
        teacherId: Number(teacherId) || currentUser?.id || 1,
        title: title.trim(),
        description: description.trim(),
        status: status || 'PUBLISHED',
        isPublicAll: isPublicAll,
        classIds: isPublicAll ? [] : selectedClasses,
        fileIds: selectedFileIds,
        fileDownloadSettings: fileDownloadSettings,
        filePrintSettings: filePrintSettings,
        parts: parts.map(p => ({
          partNumber: p.partNumber,
          title: p.title,
          subtitle: p.subtitle,
          durationMinutes: Number(p.durationMinutes) || 30,
          durationText: p.durationText || `${p.durationMinutes || 30} phút`,
          defaultTab: p.defaultTab || 'doc',
          iconName: p.iconName || 'BookOpen',
          description: p.description
        })),
        quizQuestions: quizQuestions.map((q, idx) => ({
          question: q.question,
          options: q.options || [],
          correctIndex: q.correctIndex || 0,
          explanation: q.explanation || '',
          orderIndex: idx + 1
        }))
      };

      let result;
      if (isEditing) {
        result = await lectureService.updateLecture(lectureId, payload, currentUser?.id);
        notify('success', `Đã cập nhật bài giảng vào MySQL CSDL thành công! (ID: ${lectureId})`);
      } else {
        result = await lectureService.createLecture(payload, currentUser?.id);
        notify('success', `Đã tạo mới và lưu bài giảng vào CSDL MySQL thành công! (ID: ${result?.id || ''})`);
      }

      setSaveSuccess(true);
      if (onSaved) onSaved(result);

      setTimeout(() => {
        if (onBack) onBack();
        else window.location.hash = '#/giang-vien';
      }, 1500);

    } catch (err) {
      console.error('Lỗi lưu bài giảng vào MySQL:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi lưu trữ bài giảng';
      setErrorMessage('Lỗi ghi dữ liệu vào MySQL DBMS: ' + msg);
      notify('error', 'Lỗi lưu dữ liệu: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedSubjectObj = useMemo(() => {
    return academicSubjects.find(s => String(s.id) === String(subjectId));
  }, [academicSubjects, subjectId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', background: '#F8FAFC' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: '#1E3A8A', marginBottom: '14px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Đang kết nối CSDL MySQL & Khởi tạo Studio...</h3>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Đồng bộ danh mục học phần, lớp học và kho học liệu điện tử T04</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', paddingBottom: '80px' }}>
      {/* 1. TOP HEADER STUDIO NAV */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        color: '#FFFFFF',
        padding: '20px 28px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack || (() => { window.location.hash = '#/giang-vien'; })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: '#F59E0B',
                  color: '#000000',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  {isEditing ? `BIÊN TẬP BÀI GIẢNG #${lectureId}` : 'BIÊN SOẠN BÀI GIẢNG MỚI'}
                </span>
                <span style={{
                  background: status === 'PUBLISHED' ? '#10B981' : '#64748B',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {status === 'PUBLISHED' ? 'XUẤT BẢN' : 'BẢN NHÁP'}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Kho lưu trữ MySQL DBMS (Port 3307)
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
                {title ? title : 'Studio Biên Soạn & Quản Trị Cấu Trúc Bài Giảng Điện Tử CAND'}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => handleSaveToDbms()}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#10B981',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '10px 22px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'transform 0.15s, background 0.15s'
              }}
              onMouseOver={e => !saving && (e.currentTarget.style.background = '#059669')}
              onMouseOut={e => !saving && (e.currentTarget.style.background = '#10B981')}
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Đang ghi vào MySQL...' : 'Lưu vào CSDL MySQL'}
            </button>
          </div>

        </div>
      </div>

      {/* 2. NOTIFICATIONS & TOAST */}
      {notification.text && (
        <div style={{
          maxWidth: '1400px',
          margin: '14px auto 0 auto',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 600,
            background: notification.type === 'error' ? '#FEE2E2' : (notification.type === 'success' ? '#D1FAE5' : '#DBEAFE'),
            color: notification.type === 'error' ? '#991B1B' : (notification.type === 'success' ? '#065F46' : '#1E40AF'),
            border: `1px solid ${notification.type === 'error' ? '#FCA5A5' : (notification.type === 'success' ? '#6EE7B7' : '#93C5FD')}`
          }}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* 3. STUDIO NAVIGATION TABS (5 PHÂN HỆ BIÊN SOẠN) */}
      <div style={{ maxWidth: '1400px', margin: '20px auto 0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
          gap: '6px'
        }}>
          {[
            { key: 'info', label: '1. Thông tin chung & Pháp lý', icon: BookOpen, count: null },
            { key: 'parts', label: '2. Cấu trúc Mục / Phần bài giảng', icon: Layers, count: parts.length },
            { key: 'files', label: '3. Đính kèm Tài liệu & Học liệu', icon: FileCheck, count: selectedFileIds.length },
            { key: 'quiz', label: '4. Ngân hàng Câu hỏi Trắc nghiệm', icon: HelpCircle, count: quizQuestions.length },
            { key: 'preview', label: '5. Xem trước & Xuất bản', icon: Eye, count: null }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  minWidth: '210px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#1E3A8A' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={e => !isActive && (e.currentTarget.style.background = '#F1F5F9')}
                onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <Icon size={18} style={{ color: isActive ? '#F59E0B' : '#64748B' }} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : '#334155',
                    fontWeight: 800
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. TAB PANELS */}
      <div style={{ maxWidth: '1400px', margin: '20px auto 0 auto', padding: '0 20px' }}>
        
        {/* ================= TAB 1: THÔNG TIN CHUNG ================= */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
            
            {/* Cột trái: Thông tin bài giảng */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={19} style={{ color: '#1E3A8A' }} /> Thông Tin Bài Giảng & Căn Cứ Đào Tạo
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Tiêu đề bài giảng điện tử <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Chiến thuật điều tra hiện trường vụ án hình sự đặc biệt nghiêm trọng"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '14px',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Học phần / Môn học <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    {academicSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Giảng viên phụ trách
                  </label>
                  <select
                    value={teacherId}
                    onChange={e => setTeacherId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    {teachersList.length > 0 ? (
                      teachersList.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.department || 'Giảng viên'})
                        </option>
                      ))
                    ) : (
                      <option value={currentUser?.id || 1}>
                        {currentUser?.fullName || 'Giảng viên phụ trách'}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Mục tiêu đào tạo & Mô tả tóm tắt
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả chuẩn đầu ra của bài học, nội dung nghiệp vụ chính và các yêu cầu học viên cần đạt được..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    color: '#0F172A',
                    outline: 'none',
                    lineHeight: 1.5,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Trạng thái xuất bản
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="PUBLISHED">PUBLISHED (Đã xuất bản - Học viên được học)</option>
                    <option value="DRAFT">DRAFT (Bản nháp - Chỉ giảng viên thấy)</option>
                    <option value="CLOSED">CLOSED (Khóa truy cập tạm thời)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Đơn vị quản lý học phần
                  </label>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#1E3A8A',
                    fontWeight: 700
                  }}>
                    {selectedSubjectObj?.organizationalUnit?.name || 'Khoa Nghiệp vụ An ninh T04'}
                  </div>
                </div>
              </div>

            </div>

            {/* Cột phải: Phân quyền lớp học & An ninh bảo mật */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={19} style={{ color: '#1E3A8A' }} /> Phân Quyền Đối Tượng & Độ Mật
              </h3>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Phạm vi áp dụng cho học viên
                </label>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isPublicAll ? '#1E3A8A' : '#E2E8F0'}`,
                    background: isPublicAll ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="accessScope"
                      checked={isPublicAll}
                      onChange={() => setIsPublicAll(true)}
                    />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>Toàn Học Viện</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>Tất cả học viên đều được vào học</div>
                    </div>
                  </label>

                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1.5px solid ${!isPublicAll ? '#1E3A8A' : '#E2E8F0'}`,
                    background: !isPublicAll ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="accessScope"
                      checked={!isPublicAll}
                      onChange={() => setIsPublicAll(false)}
                    />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>Chỉ định theo Lớp</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>Giới hạn cho các lớp được phân công</div>
                    </div>
                  </label>
                </div>
              </div>

              {!isPublicAll && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Chọn các Lớp học vụ được phép tham gia học:
                  </label>
                  <div style={{
                    maxHeight: '230px',
                    overflowY: 'auto',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px',
                    background: '#F8FAFC'
                  }}>
                    {academicClasses.map(cls => {
                      const isSelected = selectedClasses.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: isSelected ? '#DBEAFE' : 'transparent',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            transition: 'background 0.15s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleClass(cls.id)}
                          />
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: '#0F172A' }}>
                            {cls.code} - {cls.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '12.5px',
                color: '#92400E',
                lineHeight: 1.5
              }}>
                <strong>Quy định bảo mật học liệu T04:</strong> Toàn bộ nội dung bài giảng điện tử và học liệu số lưu trữ trực tiếp trên máy chủ CSDL nội bộ MySQL (Port 3307), được mã hóa SHA-256 và bảo đảm theo quy định an toàn thông tin của Trường Đại học An ninh nhân dân.
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: CẤU TRÚC MỤC / PHẦN BÀI GIẢNG ================= */}
        {activeTab === 'parts' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} style={{ color: '#1E3A8A' }} /> Cấu Trúc Các Mục / Phần Bài Giảng ({parts.length} Mục)
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Mỗi mục sẽ đại diện cho 1 phần học tập chuyên sâu trong phòng học bài giảng điện tử của học viên
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleApplyStandardParts}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#EFF6FF',
                    border: '1.5px solid #BFDBFE',
                    color: '#1E40AF',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={16} /> Nạp 5 Phần Chuẩn CAND
                </button>

                <button
                  type="button"
                  onClick={handleAddPart}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1E3A8A',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Thêm Mục Mới (+)
                </button>
              </div>
            </div>

            {/* Danh sách các phần */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {parts.map((part, index) => {
                const IconComponent = ICON_OPTIONS.find(i => i.name === part.iconName)?.icon || BookOpen;
                return (
                  <div
                    key={index}
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '18px 20px',
                      background: '#F8FAFC',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#1E3A8A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '16px'
                        }}>
                          {part.partNumber}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={part.title}
                            onChange={e => handleUpdatePart(index, 'title', e.target.value)}
                            placeholder="Tiêu đề mục..."
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: '#0F172A',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              width: '380px',
                              maxWidth: '100%',
                              outline: 'none',
                              background: '#FFFFFF'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleMovePart(index, -1)}
                          disabled={index === 0}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.4 : 1
                          }}
                          title="Di chuyển lên"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePart(index, 1)}
                          disabled={index === parts.length - 1}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: index === parts.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: index === parts.length - 1 ? 0.4 : 1
                          }}
                          title="Di chuyển xuống"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePart(index)}
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            color: '#DC2626',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Xóa mục này"
                        >
                          <Trash2 size={15} /> Xóa
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Phụ đề / Nội dung tóm tắt
                        </label>
                        <input
                          type="text"
                          value={part.subtitle}
                          onChange={e => handleUpdatePart(index, 'subtitle', e.target.value)}
                          placeholder="Mô tả phụ đề ngắn gọn..."
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Thời lượng dự kiến (phút)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={180}
                          value={part.durationMinutes}
                          onChange={e => handleUpdatePart(index, 'durationMinutes', parseInt(e.target.value) || 30)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Tab hiển thị mặc định
                        </label>
                        <select
                          value={part.defaultTab}
                          onChange={e => handleUpdatePart(index, 'defaultTab', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        >
                          {TAB_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Biểu tượng đại diện
                        </label>
                        <select
                          value={part.iconName}
                          onChange={e => handleUpdatePart(index, 'iconName', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        >
                          {ICON_OPTIONS.map(opt => (
                            <option key={opt.name} value={opt.name}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Mô tả chi tiết mục / Gợi ý học tập
                      </label>
                      <input
                        type="text"
                        value={part.description || ''}
                        onChange={e => handleUpdatePart(index, 'description', e.target.value)}
                        placeholder="Nêu nội dung chi tiết hoặc lưu ý nghiệp vụ cho học viên..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          background: '#FFFFFF',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ================= TAB 3: ĐÍNH KÈM TÀI LIỆU ================= */}
        {activeTab === 'files' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={20} style={{ color: '#1E3A8A' }} /> Kho Tài Liệu & Học Liệu Đính Kèm ({selectedFileIds.length} Đã Chọn)
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Chọn các tệp PDF giáo trình, Video ghi hình giảng viên, Slide PPT hoặc ảnh nghiệp vụ từ kho CSDL MySQL
                </p>
              </div>

              {/* Tìm kiếm & lọc */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={e => setFileSearch(e.target.value)}
                    placeholder="Tìm tên tệp, mã tài liệu..."
                    style={{
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      width: '220px'
                    }}
                  />
                </div>

                <select
                  value={fileTypeFilter}
                  onChange={e => setFileTypeFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="ALL">Tất cả định dạng</option>
                  <option value="PDF">Tài liệu PDF</option>
                  <option value="VIDEO">Video bài giảng MP4</option>
                  <option value="IMAGE">Hình ảnh nghiệp vụ</option>
                </select>
              </div>
            </div>

            {/* Bảng danh sách tài liệu CSDL */}
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', width: '40px' }}>Chọn</th>
                    <th style={{ padding: '10px 14px' }}>Tên Tài Liệu / Học Liệu</th>
                    <th style={{ padding: '10px 14px', width: '120px' }}>Định Dạng</th>
                    <th style={{ padding: '10px 14px', width: '140px' }}>Độ Mật</th>
                    <th style={{ padding: '10px 14px', width: '140px', textAlign: 'center' }}>Quyền Tải Về</th>
                    <th style={{ padding: '10px 14px', width: '140px', textAlign: 'center' }}>Quyền In Ấn</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(file => {
                    const isSelected = selectedFileIds.includes(file.id);
                    const canDownload = fileDownloadSettings[file.id] !== false;
                    const canPrint = filePrintSettings[file.id] !== false;
                    const kind = getMediaKind(file);
                    return (
                      <tr
                        key={file.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleFile(file.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            {file.originalFileName || file.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                            Mã tệp: #{file.id} • Dung lượng: {(Number(file.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: kind === 'video' ? '#FEE2E2' : (kind === 'pdf' ? '#DEF7EC' : '#FEF3C7'),
                            color: kind === 'video' ? '#DC2626' : (kind === 'pdf' ? '#03543F' : '#D97706')
                          }}>
                            {file.fileType || kind?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#1E3A8A'
                          }}>
                            <Shield size={13} /> {file.classificationLevel?.name || 'Nội bộ'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={() => handleToggleDownloadable(file.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: canDownload ? '#D1FAE5' : '#F1F5F9',
                                color: canDownload ? '#065F46' : '#64748B'
                              }}
                            >
                              {canDownload ? '✓ Cho phép' : 'Khóa tải'}
                            </button>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePrintable(file.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: canPrint ? '#DBEAFE' : '#F1F5F9',
                                color: canPrint ? '#1E40AF' : '#64748B'
                              }}
                            >
                              {canPrint ? '✓ Cho phép' : 'Khóa in'}
                            </button>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================= TAB 4: CÂU HỎI TRẮC NGHIỆM ================= */}
        {activeTab === 'quiz' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={20} style={{ color: '#1E3A8A' }} /> Ngân Hàng Câu Hỏi Trắc Nghiệm ({quizQuestions.length} Câu)
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Các câu hỏi sẽ xuất hiện tại Phần 5 (hoặc mục kiểm tra đánh giá) của bài giảng để học viên làm bài và chấm điểm tự động
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#1E3A8A',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Thêm Câu Hỏi Mới (+)
              </button>
            </div>

            {quizQuestions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1.5px dashed #CBD5E1'
              }}>
                <HelpCircle size={36} style={{ color: '#94A3B8', margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', margin: 0 }}>Chưa có câu hỏi trắc nghiệm nào</h4>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 16px 0' }}>
                  Bấm nút bên dưới để tạo các câu hỏi trắc nghiệm đánh giá nhận thức cho học viên CAND
                </p>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  style={{
                    background: '#1E3A8A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tạo Câu Hỏi Đầu Tiên
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '20px',
                      background: '#F8FAFC',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1E3A8A', marginBottom: '6px' }}>
                          Câu hỏi {qIdx + 1}:
                        </label>
                        <textarea
                          rows={2}
                          value={q.question}
                          onChange={e => handleUpdateQuestionText(qIdx, e.target.value)}
                          placeholder="Nhập nội dung câu hỏi..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13.5px',
                            color: '#0F172A',
                            fontWeight: 600,
                            outline: 'none',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FCA5A5',
                          color: '#DC2626',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={15} /> Xóa câu
                      </button>
                    </div>

                    {/* Các lựa chọn A, B, C, D */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                        Các phương án trả lời (chọn nút tròn ở đầu phương án ĐÚNG):
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                        {(q.options || []).map((opt, optIdx) => {
                          const isCorrect = q.correctIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: isCorrect ? '#DEF7EC' : '#FFFFFF',
                                border: `1.5px solid ${isCorrect ? '#31C48D' : '#CBD5E1'}`,
                                borderRadius: '8px',
                                padding: '8px 12px'
                              }}
                            >
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={isCorrect}
                                onChange={() => handleSetCorrectIndex(qIdx, optIdx)}
                                style={{ cursor: 'pointer' }}
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                style={{
                                  flex: 1,
                                  border: 'none',
                                  background: 'transparent',
                                  fontSize: '13px',
                                  color: '#0F172A',
                                  fontWeight: isCorrect ? 700 : 500,
                                  outline: 'none'
                                }}
                              />
                              {isCorrect && (
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#03543F' }}>ĐÚNG</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lời giải thích */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Căn cứ pháp lý & Lời giải thích chuyên sâu (hiển thị sau khi học viên nộp bài)
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={e => handleUpdateExplanation(qIdx, e.target.value)}
                        placeholder="Ví dụ: Theo Điều 143 Bộ luật Tố tụng hình sự năm 2015..."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: '#FFFFFF',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 5: XEM TRƯỚC (PREVIEW) & XUẤT BẢN ================= */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11.5px', background: '#DBEAFE', color: '#1E40AF', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    XEM TRƯỚC GIAO DIỆN BÀI GIẢNG ĐIỆN TỬ
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '6px 0 0 0' }}>
                    {title || 'Chưa đặt tiêu đề bài giảng'}
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    Môn học: <strong>{selectedSubjectObj?.name || 'Chưa chọn môn'}</strong> • Đơn vị: <strong>{selectedSubjectObj?.organizationalUnit?.name || 'Khoa đào tạo'}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToDbms}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Save size={20} /> {saving ? 'Đang lưu vào CSDL...' : 'XÁC NHẬN LƯU VÀO CSDL MYSQL'}
                </button>
              </div>

              {/* Tóm tắt các mục và tài liệu */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                
                {/* Cấu trúc mục */}
                <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '18px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#1E3A8A', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={18} /> Cấu trúc {parts.length} mục bài giảng:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {parts.map(p => (
                      <div key={p.partNumber} style={{ padding: '8px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                          ⏱️ {p.durationText} • Mặc định: {p.defaultTab}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Học liệu đính kèm */}
                <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '18px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#1E3A8A', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck size={18} /> {selectedFileIds.length} Học liệu đính kèm:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedFileIds.length === 0 ? (
                      <div style={{ color: '#94A3B8', fontSize: '12.5px' }}>Chưa chọn học liệu nào</div>
                    ) : (
                      selectedFileIds.map(fId => {
                        const fileObj = availableFiles.find(f => f.id === fId);
                        return (
                          <div key={fId} style={{ padding: '8px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{fileObj?.originalFileName || fileObj?.title || `Tài liệu #${fId}`}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                              Định dạng: {fileObj?.fileType} • Tải về: {fileDownloadSettings[fId] !== false ? 'Cho phép' : 'Khóa'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Câu hỏi trắc nghiệm */}
                <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '18px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#1E3A8A', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={18} /> {quizQuestions.length} Câu hỏi trắc nghiệm ôn tập:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {quizQuestions.length === 0 ? (
                      <div style={{ color: '#94A3B8', fontSize: '12.5px' }}>Chưa soạn câu hỏi ôn tập</div>
                    ) : (
                      quizQuestions.slice(0, 3).map((q, idx) => (
                        <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{q.question}</div>
                          <div style={{ fontSize: '11.5px', color: '#059669' }}>
                            Đáp án đúng: Phương án {String.fromCharCode(65 + (q.correctIndex || 0))}
                          </div>
                        </div>
                      ))
                    )}
                    {quizQuestions.length > 3 && (
                      <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                        ... và {quizQuestions.length - 3} câu hỏi khác
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
