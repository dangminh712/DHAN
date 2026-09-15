import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Clock,
  Save,
  Trash2,
  Copy,
  Check,
  Layers,
  Award,
  AlertTriangle,
  FolderKanban,
  FileQuestion,
  RefreshCw,
  Printer
} from 'lucide-react';
import { createMediaViewerUrl, getMediaStreamUrl } from './pdfViewer';
import { learningService } from './services/learningService';
import { createQuizDraftKey } from './learningProgress';
import PageNotes from './components/lecture/PageNotes';
import { StudyPdf, ResumeVideo } from './components/lecture/StudyMedia';
import { getMediaKind, selectStudyMedia } from './mediaType';
import { lectureService } from './services/lectureService';

export default function LectureStudyPage({ lectureId, file, onBack, allFiles = [], currentUser }) {
  const [activePart, setActivePart] = useState(1); // Luôn bắt đầu từ mục tiêu và yêu cầu của bài học
  const [mediaTab, setMediaTab] = useState('doc'); // 'video' | 'slide' | 'doc' | 'image' | 'quiz'
  const [pdfPage, setPdfPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completedParts, setCompletedParts] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [backendLecture, setBackendLecture] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState(null);
  const [learning, setLearning] = useState(null);
  const [learningError, setLearningError] = useState('');
  const submissionId = useRef(null);
  const containerRef = useRef(null);

  // Tìm bài giảng theo ID từ backend
  const effectiveId = lectureId || file?.id || 1;

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      try {
        setFetchLoading(true);
        const data = await lectureService.getLectureDetail(effectiveId, currentUser?.id);
        if (isMounted && data) {
          setBackendLecture(data);
        }
      } catch (err) {
        setLearningError(err.response?.data?.message || 'Không tải được bài giảng.');
      } finally {
        if (isMounted) setFetchLoading(false);
      }
    };
    if (effectiveId) {
      loadDetail();
    }
    return () => { isMounted = false; };
  }, [effectiveId, currentUser?.id]);

  const draftKey = createQuizDraftKey(currentUser?.id, effectiveId);
  useEffect(() => {
    let active = true;
    setLearning(null); setCompletedParts([]); setLearningError('');
    setQuizResult(null); setShowQuizResults(false); setQuizAnswers({});
    let draft;
    try { draft = JSON.parse(localStorage.getItem(draftKey)); } catch { /* damaged local draft */ }
    submissionId.current = draft?.submissionId || crypto.randomUUID();
    if (draft?.answers) setQuizAnswers(draft.answers);
    if (!currentUser?.id) return;
    Promise.all([learningService.getProgress(effectiveId, currentUser.id), learningService.attempts(effectiveId, currentUser.id)]).then(([progress, attempts]) => {
      if (!active) return;
      setLearning(progress);
      setCompletedParts(progress.parts.filter(p => p.completed).map(p => p.partId));
      if (!draft && attempts.items && attempts.items[0]) {
        setQuizAnswers(attempts.items[0].answers || {});
        setQuizResult(attempts.items[0].result); setShowQuizResults(true);
      }
    }).catch(e => { if (active) setLearningError(e.response?.data?.message || 'Không tải được tiến độ học.'); });
    return () => { active = false; };
  }, [effectiveId, currentUser?.id]);

  const lectureObj = backendLecture
    || allFiles.find(f => String(f.id) === String(effectiveId))
    || file;

  const fileId = lectureObj?.id || effectiveId;
  const fileName = lectureObj?.title || lectureObj?.originalFileName || 'Bài giảng Nghiệp vụ An ninh T04';
  const category = getMediaKind(lectureObj);

  const filesList = lectureObj?.files || [];
  const mediaItems = lectureObj?.mediaItems || [];
  const isLecture = Boolean(filesList.length > 0 || mediaItems.length > 0);

  const lecturerName = lectureObj?.teacherName || lectureObj?.lecturer || 'Giảng viên phụ trách';
  const deptName = lectureObj?.departmentName || lectureObj?.subject || 'Khoa / Bộ môn đào tạo';
  const subjectCode = lectureObj?.subjectCode || lectureObj?.code || '';

  // Định tuyến tài liệu thực tế cho từng phân hệ từ CSDL MySQL
  const studyMedia = useMemo(() => selectStudyMedia(filesList), [filesList]);
  const videoFromFiles = studyMedia.video;
  const videoItem = mediaItems.find(m => m.role?.toLowerCase() === 'video' || ['video', 'audio'].includes(getMediaKind(m)));
  const videoFileId = videoFromFiles?.fileId || videoFromFiles?.id || videoItem?.mediaFileId || null;
  const videoLabel = videoFromFiles?.originalName || videoItem?.label || fileName;
  const slideFromFiles = studyMedia.slide;
  const slideItem = mediaItems.find(m => m.role?.toLowerCase() === 'slide');
  const slideFileId = slideFromFiles?.fileId || slideFromFiles?.id || slideItem?.mediaFileId || null;
  const slideLabel = slideFromFiles?.originalName || slideItem?.label || 'Slide trình chiếu bài giảng điện tử';
  const docFilesList = studyMedia.documents;

  const currentDocFile = useMemo(() => {
    if (selectedDocId) {
      const found = docFilesList.find(f => String(f.fileId) === String(selectedDocId));
      if (found) return found;
    }
    return docFilesList[0] || slideFromFiles;
  }, [selectedDocId, docFilesList, slideFromFiles]);

  const currentDocKind = getMediaKind(currentDocFile);
  const isCurrentDocPdf = currentDocKind === 'pdf' || currentDocFile?.fileType?.toLowerCase()?.includes('pdf') || currentDocFile?.originalName?.toLowerCase()?.endsWith('.pdf');
  const isCurrentDocVideo = currentDocKind === 'video' || currentDocFile?.fileType?.toLowerCase()?.includes('video') || Boolean(currentDocFile?.originalName?.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i));
  const isCurrentDocAudio = currentDocKind === 'audio' || currentDocFile?.fileType?.toLowerCase()?.includes('audio') || Boolean(currentDocFile?.originalName?.match(/\.(mp3|wav|ogg|m4a|aac)$/i));
  const isCurrentDocImage = currentDocKind === 'image' || currentDocFile?.fileType?.toLowerCase()?.includes('image') || Boolean(currentDocFile?.originalName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));

  const docFileId = currentDocFile?.fileId || null;
  const docLabel = currentDocFile?.originalName || (activePart === 4 ? 'Văn bản quy phạm pháp luật ngành' : 'Đề cương chi tiết học phần');

  const imageFromFiles = studyMedia.image;
  const imageItem = mediaItems.find(m => m.role === 'situation_diagram' || m.type === 'image');
  const imageFileId = imageFromFiles?.fileId || imageItem?.mediaFileId || null;
  const imageLabel = imageFromFiles?.originalName || imageItem?.label || 'Sơ đồ hiện trường & Bản đồ tác chiến';

  // Reset only when entering another lecture/user; fetched metadata must not override navigation.
  useEffect(() => {
    setActivePart(1);
    setMediaTab('doc');
    setSelectedDocId(null);
    setPdfPage(1);
  }, [effectiveId, currentUser?.id]);

  const activePdfFile = mediaTab === 'slide' ? slideFromFiles : currentDocFile;
  const activePdfId = ['slide', 'doc'].includes(mediaTab) && getMediaKind(activePdfFile) === 'pdf' ? activePdfFile.fileId : null;
  const mediaProgress = id => learning?.files.find(p => String(p.fileId) === String(id));
  const togglePartCompletion = async partId => {
    if (!learning || partId === 5 || (partId === 2 && videoFileId)) return;
    const completed = !completedParts.includes(partId);
    try {
      await learningService.patchProgress(effectiveId, { partId, completed });
      setCompletedParts(previous => completed ? [...new Set([...previous, partId])] : previous.filter(p => p !== partId));
    } catch (e) { setLearningError(e.response?.data?.message || 'Không lưu được tiến độ.'); }
  };

  // 5 Phần cấu trúc bài giảng đào tạo Sĩ quan CAND lấy trực tiếp từ MySQL CSDL (lecture_parts)
  const iconMap = {
    BookOpen,
    Video,
    ImageIcon,
    FileText,
    HelpCircle
  };

  const dbParts = backendLecture?.parts || [];
  const partsConfig = useMemo(() => {
    if (dbParts.length > 0) {
      return dbParts.map(p => {
        let defTab = p.defaultTab || 'doc';
        if (p.partNumber === 2) {
          defTab = (videoFileId || videoFromFiles) ? 'video' : 'slide';
        }
        return {
          id: p.partNumber,
          title: p.title,
          subtitle: p.subtitle || '',
          icon: iconMap[p.iconName] || (p.partNumber === 2 ? Video : (p.partNumber === 3 ? ImageIcon : (p.partNumber === 5 ? HelpCircle : BookOpen))),
          defaultTab: defTab,
          duration: p.durationText || `${p.durationMinutes || 30} phút`,
          description: p.description
        };
      });
    }

    return [];
  }, [dbParts, videoFileId, videoFromFiles]);

  // Câu hỏi trắc nghiệm lấy trực tiếp từ MySQL CSDL
  const quizQuestions = (backendLecture?.quizQuestions && backendLecture.quizQuestions.length > 0)
    ? backendLecture.quizQuestions
    : [];

  const handleSelectAnswer = (qId, optionIdx) => {
    if (showQuizResults || isSubmittingQuiz) return;
    const answers = { ...quizAnswers, [qId]: optionIdx };
    setQuizAnswers(answers);
    try { localStorage.setItem(draftKey, JSON.stringify({ answers, submissionId: submissionId.current })); }
    catch { setLearningError('Không lưu được bản nháp trên trình duyệt.'); }
  };

  const handleSubmitQuiz = async () => {
    if (quizQuestions.length === 0) return;
    setIsSubmittingQuiz(true);
    try {
      if (currentUser?.id) {
        const result = await lectureService.submitQuiz(effectiveId, {
          userId: currentUser.id,
          answers: quizAnswers,
          submissionId: submissionId.current
        });
        setQuizResult(result);
        localStorage.removeItem(draftKey);
        setCompletedParts(previous => [...new Set([...previous, 5])]);
      }
      setShowQuizResults(true);
    } catch (err) {
      setLearningError(err.response?.data?.message || 'Không nộp được bài. Bản nháp vẫn được giữ.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const getQuizScoreStats = () => {
    if (quizResult) {
      return {
        correct: quizResult.correctAnswers,
        total: quizResult.totalQuestions,
        score: quizResult.score,
        passed: quizResult.passed
      };
    }
    return { correct: 0, total: quizQuestions.length, score: 0, passed: false };
  };

  const progressPercent = Math.round((completedParts.length / 5) * 100);

  // Quyền truy cập và Khóa bài giảng
  const roleCode = (typeof currentUser?.role === 'string' ? currentUser.role : currentUser?.role?.code) || '';
  const isOfficerOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(roleCode.toUpperCase());
  const currentStatus = backendLecture?.status || lectureObj?.status || 'PUBLISHED';
  const isLocked = (currentStatus === 'LOCKED' || currentStatus === 'CLOSED') && !isOfficerOrAdmin;

  const isPublicAll = backendLecture ? backendLecture.isPublicAll : (lectureObj?.isPublicAll !== false);
  const assignedClassIds = backendLecture?.assignedClassIds || lectureObj?.assignedClassIds || [];
  const assignedClasses = backendLecture?.assignedClasses || lectureObj?.assignedClasses || [];

  const userClassId = currentUser?.studentClasses?.[0]?.classId || currentUser?.classId;
  const hasClassAccess = isOfficerOrAdmin || isPublicAll || (assignedClassIds.length === 0) || (userClassId && assignedClassIds.some(id => String(id) === String(userClassId)));

  // Quyền tải file
  const activeBackendFile = backendLecture?.files?.find(f => String(f.fileId) === String(fileId) || String(f.fileId) === String(slideFileId) || String(f.fileId) === String(videoFileId)) || backendLecture?.files?.[0];
  const isDownloadAllowed = activeBackendFile ? activeBackendFile.isDownloadable : (lectureObj?.isDownloadable !== false);

  // Link mở tab mới chuẩn xác theo URL định tuyến #/study/:id
  const newTabUrl = `/#/study/${fileId}`;

  // 1. Màn hình chặn nếu Bài giảng bị Giảng viên Khóa / Đóng
  if (isLocked) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1E36', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#fff' }}>
        <div style={{ maxWidth: '580px', width: '100%', background: 'rgba(15, 23, 42, 0.96)', border: '2px solid #A31A1A', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(163, 26, 26, 0.2)', border: '2px solid #A31A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#EF4444' }}>
            <Lock size={36} />
          </div>
          <span style={{ display: 'inline-block', padding: '4px 14px', background: '#A31A1A', color: '#fff', fontSize: '11.5px', fontWeight: 800, borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
            {currentStatus === 'LOCKED' ? 'HỌC PHẦN ĐANG TẠM KHÓA' : 'HỌC PHẦN ĐÃ KẾT THÚC / ĐÓNG'}
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '14px', color: '#F8FAFC' }}>
            {fileName}
          </h2>
          <p style={{ fontSize: '14.5px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px' }}>
            Giảng viên bộ môn đã <strong>khóa truy cập</strong> bài giảng này đối với học viên. Bạn không thể xem tài liệu hoặc bài tập vào thời điểm này.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px 16px', marginBottom: '28px', fontSize: '13px', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Shield size={16} color="#D4A843" />
            <span>Mã kiểm soát: SEC-LOCKED-{fileId} • ĐẠI HỌC AN NINH NHÂN DÂN</span>
          </div>
          <button
            onClick={() => { if (onBack) onBack(); else window.location.hash = '#/'; }}
            style={{ padding: '12px 28px', background: '#D4A843', color: '#0B1E36', fontWeight: 800, borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            <ArrowLeft size={16} />
            <span>Quay lại Cổng học phần</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Màn hình chặn nếu Giới hạn lớp học vụ mà học viên không thuộc lớp đó
  if (!hasClassAccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1E36', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#fff' }}>
        <div style={{ maxWidth: '580px', width: '100%', background: 'rgba(15, 23, 42, 0.96)', border: '2px solid #D4A843', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(212, 168, 67, 0.2)', border: '2px solid #D4A843', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#D4A843' }}>
            <ShieldAlert size={36} />
          </div>
          <span style={{ display: 'inline-block', padding: '4px 14px', background: '#D4A843', color: '#0B1E36', fontSize: '11.5px', fontWeight: 800, borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
            GIỚI HẠN LỚP HỌC VỤ
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '14px', color: '#F8FAFC' }}>
            {fileName}
          </h2>
          <p style={{ fontSize: '14.5px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '16px' }}>
            Bài giảng này được cấu hình giới hạn chỉ dành riêng cho các lớp học vụ:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
            {assignedClasses.length > 0 ? (
              assignedClasses.map((cls, idx) => (
                <span key={idx} style={{ padding: '6px 12px', background: 'rgba(212, 168, 67, 0.15)', border: '1px solid #D4A843', color: '#D4A843', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                  {cls}
                </span>
              ))
            ) : (
              <span style={{ color: '#94A3B8', fontSize: '13px' }}>Chỉ định lớp học chuyên trách</span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px' }}>
            Tài khoản của đồng chí không thuộc danh sách lớp được cấp quyền. Vui lòng liên hệ Giảng viên để được phê duyệt bổ sung vào lớp.
          </p>
          <button
            onClick={() => { if (onBack) onBack(); else window.location.hash = '#/'; }}
            style={{ padding: '12px 28px', background: '#D4A843', color: '#0B1E36', fontWeight: 800, borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            <ArrowLeft size={16} />
            <span>Quay lại Danh sách bài giảng</span>
          </button>
        </div>
      </div>
    );
  }

  if (fetchLoading || !backendLecture) return <div role="status">{learningError || 'Đang tải bài giảng…'}<button onClick={onBack}>Quay lại</button></div>;

  return (
    <div className="lecture-study-wrapper" ref={containerRef}>
      {/* 1. TOP STUDY NAVBAR (Đỏ thẫm CAND sang trọng) */}
      <header className="study-top-navbar">
        <div className="study-navbar-container">
          <div className="study-navbar-left">
            <button
              className="btn-study-back"
              onClick={() => {
                if (onBack) onBack();
                else window.location.hash = '#/';
              }}
              title="Quay lại Cổng danh sách tất cả bài giảng"
            >
              <ArrowLeft size={16} />
              <span>Tất cả bài giảng</span>
            </button>
            <button
              className="btn-study-back"
              style={{ background: 'rgba(255,255,255,0.12)', marginLeft: '6px' }}
              onClick={() => { window.location.hash = '#/'; }}
              title="Chuyển sang Kho lưu trữ tất cả tài liệu số"
            >
              <FolderKanban size={15} />
              <span>Kho tài liệu</span>
            </button>
            <div className="study-divider-v"></div>
            <div className="study-title-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span className="study-agency-tag">TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN • T04</span>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#D4A843', color: '#0B1E36', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                  {subjectCode}
                </span>
                <span style={{ fontSize: '12px', color: '#E2E8F0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  👨‍🏫 Giảng viên: <strong style={{ color: '#FEF08A' }}>{lecturerName}</strong>
                </span>
                <span style={{ fontSize: '12px', color: '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  🏛️ Khoa: <strong style={{ color: '#93C5FD' }}>{deptName}</strong>
                </span>
              </div>
              <h1 className="study-lecture-name" title={fileName}>
                {fileName}
              </h1>
            </div>
          </div>

          <div className="study-navbar-right">
            <span className="study-stamp-badge">
              <Shield size={12} />
              HỌC LIỆU NGHIỆP VỤ NỘI BỘ
            </span>

            {/* Nút mở tab mới: Thẻ <a> chuẩn HTML 100% không bị chặn popup */}
            <a
              href={newTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-study-action"
              title="Mở bài giảng này trong một tab trình duyệt độc lập"
            >
              <ExternalLink size={15} />
              <span>Mở tab mới</span>
            </a>

            {/* Quyền tải học liệu do giảng viên thiết lập */}
            {isDownloadAllowed ? (
              <a
                href={`/api/media/download/${fileId}`}
                download={fileName}
                className="btn-study-action"
                title="Tải toàn bộ học liệu về máy tính"
              >
                <Download size={15} />
                <span>Tải học liệu</span>
              </a>
            ) : (
              <button
                disabled
                className="btn-study-action disabled"
                style={{
                  opacity: 0.7,
                  cursor: 'not-allowed',
                  background: '#334155',
                  border: '1px solid #475569',
                  color: '#CBD5E1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Giảng viên đã khóa tính năng tải học liệu này về máy (Chỉ cho phép đọc trực tuyến)"
              >
                <Lock size={14} color="#F59E0B" />
                <span>Khóa tải về (Chỉ xem)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN STUDY WORKSPACE */}
      <div className="study-main-layout">
        {/* CỘT TRÁI: BẢNG ĐIỀU HƯỚNG 5 PHẦN BÀI GIẢNG */}
        <aside className="study-sidebar">
          <div className="sidebar-header-card">
            <div className="course-progress-info">
              <div className="progress-label-row">
                <span>Tiến độ học phần:</span>
                <strong>{progressPercent}% Hoàn thành</strong>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="curriculum-badge">
              <Layers size={13} />
              CHƯƠNG TRÌNH ĐÀO TẠO 5 PHẦN
            </div>
          </div>

          <nav className="parts-nav-list">
            {partsConfig.map((p) => {
              const IconComp = p.icon;
              const isSelected = activePart === p.id;
              const isDone = completedParts.includes(p.id);

              return (
                <div
                  key={p.id}
                  className={`part-nav-card ${isSelected ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                  onClick={() => {
                    setActivePart(p.id);
                    setMediaTab(p.defaultTab);
                  }}
                >
                  <div className="part-card-header">
                    <div className="part-icon-wrap">
                      <IconComp size={16} />
                    </div>
                    <div className="part-card-text">
                      <span className="part-label">{p.title}</span>
                      <span className="part-sub">{p.subtitle}</span>
                    </div>
                  </div>

                  <div className="part-card-footer">
                    <span className="part-duration">
                      <Clock size={11} /> {p.duration}
                    </span>
                    <button
                      className={`btn-check-part ${isDone ? 'done' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePartCompletion(p.id);
                      }}
                      title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã học xong'}
                    >
                      <CheckCircle2 size={15} />
                      <span>{isDone ? 'Đã học' : 'Chưa học'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="sidebar-officer-info">
            <div className="officer-card-title">
              <Award size={14} /> Giảng viên phụ trách:
            </div>
            <p className="officer-name">{lecturerName}</p>
            <p className="officer-dept">{deptName}</p>
          </div>
        </aside>

        {/* KHU VỰC TRUNG TÂM: TRÌNH PHÁT ĐA PHƯƠNG TIỆN (VIEWER WORKSPACE) */}
        <main className="study-center-workspace">
          {/* Thanh công cụ chọn định dạng theo phần */}
          <div className="media-mode-toolbar">
            <div className="media-mode-tabs">
              <button
                className={`media-tab-btn ${mediaTab === 'video' ? 'active' : ''}`}
                onClick={() => setMediaTab('video')}
              >
                <Video size={15} />
                Video bài giảng ({category === 'video' ? 'File gốc' : 'Ghi hình'})
              </button>

              <button
                className={`media-tab-btn ${mediaTab === 'slide' ? 'active' : ''}`}
                onClick={() => setMediaTab('slide')}
              >
                <FileText size={15} />
                Slide trình chiếu (PPT/PDF)
              </button>

              <button
                className={`media-tab-btn ${mediaTab === 'image' ? 'active' : ''}`}
                onClick={() => setMediaTab('image')}
              >
                <ImageIcon size={15} />
                Sơ đồ & Bản đồ hiện trường
              </button>

              <button
                className={`media-tab-btn ${mediaTab === 'doc' ? 'active' : ''}`}
                onClick={() => setMediaTab('doc')}
              >
                <BookOpen size={15} />
                Văn bản quy phạm & Đề cương
              </button>

              <button
                className={`media-tab-btn ${mediaTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setMediaTab('quiz')}
              >
                <HelpCircle size={15} />
                Câu hỏi ôn tập ({quizQuestions.length} câu)
              </button>
            </div>

            <div className="workspace-header-actions">
              <span className="current-part-indicator">
                Đang xem: <strong>Phần {activePart}</strong>
              </span>
            </div>
          </div>

          {/* VÙNG NỘI DUNG HIỂN THỊ CHÍNH */}
          <div className="study-viewport">
            {learningError && <p role="alert">{learningError}</p>}
            {/* 1. TAB VIDEO */}
            {mediaTab === 'video' && (
              <div className="study-video-container">
                {videoFileId ? (
                  <ResumeVideo
                    key={`${currentUser?.id}:${videoFileId}`}
                    lectureId={effectiveId}
                    fileId={videoFileId}
                    mediaKind={getMediaKind(videoFromFiles || videoItem)}
                    initialSecond={Number(mediaProgress(videoFileId)?.lastVideoSecond || 0)}
                    url={getMediaStreamUrl(videoFileId)}
                    onComplete={() => setCompletedParts(previous => [...new Set([...previous, 2])])}
                    onError={setLearningError}
                  />
                ) : (
                  <div className="document-empty-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <Video size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ color: '#0B1E36', fontWeight: 800 }}>Chưa có Video bài giảng dạng MP4</h4>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '4px auto 16px', maxWidth: '420px' }}>
                      Bài giảng này chưa được đính kèm tệp video. Đồng chí có thể chuyển sang tab <strong>Slide trình chiếu</strong> hoặc <strong>Văn bản quy phạm</strong> để học tập.
                    </p>
                    {slideFileId && (
                      <button
                        type="button"
                        onClick={() => setMediaTab('slide')}
                        className="btn-upload-primary"
                        style={{ margin: '0 auto', fontSize: '12.5px', padding: '6px 14px' }}
                      >
                        Chuyển sang xem Slide trình chiếu →
                      </button>
                    )}
                  </div>
                )}
                {videoFileId && (
                  <div className="video-info-strip">
                    <div className="video-title">
                      <h4>🎥 Video bài giảng: {videoLabel}</h4>
                      <p>Theo dõi bài giảng và tiếp tục từ vị trí đã lưu.</p>
                    </div>
                    <div className="video-actions">
                      <a
                        href={getMediaStreamUrl(videoFileId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-sub-action"
                      >
                        <ExternalLink size={13} />
                        Mở luồng video gốc
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. TAB SLIDE TRÌNH CHIẾU */}
            {mediaTab === 'slide' && (
              <div className="study-doc-container">
                {slideFileId && getMediaKind(slideFromFiles || slideItem) === 'pdf' ? (
                  <StudyPdf
                    key={`${currentUser?.id}:${effectiveId}:${slideFileId}:slide`}
                    lectureId={effectiveId}
                    fileId={slideFileId}
                    partId={2}
                    initialPage={mediaProgress(slideFileId)?.lastPdfPage || 1}
                    url={getMediaStreamUrl(slideFileId)}
                    fileName={slideFromFiles?.originalName || 'Slide bài giảng điện tử'}
                    downloadUrl={`/api/media/download/${slideFileId}`}
                    canDownload={slideFromFiles?.isDownloadable ?? isDownloadAllowed}
                    onPage={setPdfPage}
                    onError={setLearningError}
                  />
                ) : (
                  <div className="document-empty-card">
                    <FileText size={48} color="#94A3B8" />
                    <h4>Chưa có Slide trình chiếu dạng PDF cho bài giảng này</h4>
                    <p>Giảng viên có thể tải lên slide bài giảng tại mục Quản lý học liệu để học viên theo dõi.</p>
                  </div>
                )}
              </div>
            )}

            {/* 2B. TAB VĂN BẢN QUY PHẠM & ĐỀ CƯƠNG TÀI LIỆU */}
            {mediaTab === 'doc' && (
              <div className="study-doc-container">
                {docFilesList.length > 1 && (
                  <div className="attached-docs-bar">
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                      📚 Danh mục văn bản & tài liệu đính kèm ({docFilesList.length}):
                    </span>
                    <div className="attached-docs-pills">
                      {docFilesList.map(doc => {
                        const isChosen = String(doc.fileId) === String(currentDocFile?.fileId);
                        const isPdf = getMediaKind(doc) === 'pdf';
                        return (
                          <button
                            key={doc.fileId}
                            type="button"
                            className={`attached-doc-pill ${isChosen ? 'active' : ''}`}
                            onClick={() => setSelectedDocId(doc.fileId)}
                            title={doc.originalName}
                          >
                            <FileText size={14} />
                            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.originalName}
                            </span>
                            <span className="doc-pill-badge">{isPdf ? 'PDF' : (doc.fileType || 'VĂN BẢN')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePart === 1 ? (
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '32px 28px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>
                        <BookOpen size={26} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0B1E36', margin: 0 }}>
                          {partsConfig.find(p => p.id === 1)?.title || 'Phần 1: Mục tiêu & Yêu cầu Nghiệp vụ'}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                          {partsConfig.find(p => p.id === 1)?.subtitle || 'Khung chương trình, đề cương chuẩn hóa và yêu cầu huấn luyện thực hành Sĩ quan CAND'}
                        </p>
                      </div>
                    </div>

                    {partsConfig.find(p => p.id === 1)?.description && (
                      <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.6', margin: '0 0 20px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #991B1B' }}>
                        <strong>Nội dung trọng tâm: </strong>
                        <span>{partsConfig.find(p => p.id === 1)?.description}</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Award size={16} color="#991B1B" /> 1. Mục tiêu đào tạo
                        </h4>
                        <ul style={{ fontSize: '12.5px', color: '#475569', margin: 0, paddingLeft: '18px', lineHeight: '1.7' }}>
                          <li>Nắm vững phương pháp luận, nguyên tắc nghiệp vụ bảo vệ an ninh trật tự.</li>
                          <li>Nâng cao kỹ năng phân tích, nhận định tình huống nghiệp vụ thực tế.</li>
                          <li>Chấp hành nghiêm quy trình công tác và pháp luật hiện hành.</li>
                        </ul>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={16} color="#0284C7" /> 2. Căn cứ pháp lý & Quy chế
                        </h4>
                        <ul style={{ fontSize: '12.5px', color: '#475569', margin: 0, paddingLeft: '18px', lineHeight: '1.7' }}>
                          <li>Bộ luật Tố tụng Hình sự và các văn bản hướng dẫn thi hành.</li>
                          <li>Luật Công an nhân dân & Thông tư nghiệp vụ của Bộ Công An.</li>
                          <li>Quy chế bảo vệ bí mật nhà nước trong toàn lực lượng.</li>
                        </ul>
                      </div>
                    </div>

                    {currentDocFile && isCurrentDocPdf && (
                      <div style={{ marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0B1E36', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="#991B1B" /> Đề cương chi tiết học phần: {currentDocFile.originalName}
                        </h4>
                        <StudyPdf
                          key={`${currentUser?.id}:${effectiveId}:${currentDocFile.fileId}:part1`}
                          lectureId={effectiveId}
                          fileId={currentDocFile.fileId}
                          partId={1}
                          initialPage={mediaProgress(currentDocFile.fileId)?.lastPdfPage || 1}
                          url={getMediaStreamUrl(currentDocFile.fileId)}
                          fileName={currentDocFile.originalName}
                          downloadUrl={`/api/media/download/${currentDocFile.fileId}`}
                          canDownload={currentDocFile.isDownloadable ?? isDownloadAllowed}
                          onPage={setPdfPage}
                          onError={setLearningError}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePart(2);
                          setMediaTab((videoFileId || videoFromFiles) ? 'video' : 'slide');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#991B1B',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(153,27,27,0.25)'
                        }}
                      >
                        <span>Bắt đầu học Phần 2: Lý thuyết & Trình chiếu</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : currentDocFile ? (
                  isCurrentDocVideo ? (
                    <div className="study-video-container" style={{ background: '#0F172A', borderRadius: '12px', padding: '16px' }}>
                      <ResumeVideo
                        key={`${currentUser?.id}:${currentDocFile.fileId}:docvid`}
                        lectureId={effectiveId}
                        fileId={currentDocFile.fileId}
                        mediaKind="video"
                        initialSecond={Number(mediaProgress(currentDocFile.fileId)?.lastVideoSecond || 0)}
                        url={getMediaStreamUrl(currentDocFile.fileId)}
                        onComplete={() => setCompletedParts(previous => [...new Set([...previous, activePart])])}
                        onError={setLearningError}
                      />
                      <div className="video-info-strip" style={{ marginTop: '12px' }}>
                        <div className="video-title">
                          <h4>🎥 {currentDocFile.originalName}</h4>
                          <p>Tệp video tài liệu thuộc bài giảng. Theo dõi và tiếp tục bài học.</p>
                        </div>
                        <div className="video-actions">
                          <a
                            href={getMediaStreamUrl(currentDocFile.fileId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-sub-action"
                          >
                            <ExternalLink size={13} />
                            Mở luồng video gốc
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : isCurrentDocAudio ? (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1E36', marginBottom: '8px' }}>🎧 {currentDocFile.originalName}</h4>
                      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Tệp âm thanh nghiệp vụ phục vụ nghe giảng hoặc ghi âm thực địa.</p>
                      <audio controls autoPlay src={getMediaStreamUrl(currentDocFile.fileId)} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }} />
                    </div>
                  ) : isCurrentDocImage ? (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <img
                        src={getMediaStreamUrl(currentDocFile.fileId)}
                        alt={currentDocFile.originalName}
                        style={{ maxHeight: '550px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto', borderRadius: '8px' }}
                      />
                      <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '12px' }}>{currentDocFile.originalName}</p>
                    </div>
                  ) : isCurrentDocPdf ? (
                    <StudyPdf
                      key={`${currentUser?.id}:${effectiveId}:${currentDocFile.fileId}:doc`}
                      lectureId={effectiveId}
                      fileId={currentDocFile.fileId}
                      partId={activePart}
                      initialPage={mediaProgress(currentDocFile.fileId)?.lastPdfPage || 1}
                      url={getMediaStreamUrl(currentDocFile.fileId)}
                      fileName={currentDocFile.originalName}
                      downloadUrl={`/api/media/download/${currentDocFile.fileId}`}
                      canDownload={currentDocFile.isDownloadable ?? isDownloadAllowed}
                      onPage={setPdfPage}
                      onError={setLearningError}
                    />
                  ) : (
                    <div className="doc-office-card">
                      <div className="doc-office-icon">
                        <FileText size={36} />
                      </div>
                      <h4 className="doc-office-title">{currentDocFile.originalName}</h4>
                      <div className="doc-office-meta">
                        <span>Định dạng: <strong>{currentDocFile.fileType || 'Tài liệu Office'}</strong></span>
                        <span>•</span>
                        <span>Dung lượng: <strong>{currentDocFile.fileSize ? `${Math.round(currentDocFile.fileSize / 1024)} KB` : 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Bảo mật: <strong>{currentDocFile.classification || 'Lưu hành nội bộ'}</strong></span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '500px' }}>
                        Tài liệu văn bản nghiệp vụ phục vụ nghiên cứu và đối chiếu thực hành. Học viên có thể tải tập tin về máy để tra cứu nội dung chi tiết.
                      </p>
                      <div className="doc-office-actions">
                        <a
                          href={`/api/media/download/${currentDocFile.fileId}`}
                          download={currentDocFile.originalName}
                          className="btn-study-action"
                          style={{ background: '#991B1B', color: '#fff', border: 'none' }}
                        >
                          <Download size={15} />
                          <span>Tải tài liệu về máy tính</span>
                        </a>
                        <a
                          href={getMediaStreamUrl(currentDocFile.fileId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-study-action"
                          style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }}
                        >
                          <ExternalLink size={15} />
                          <span>Mở luồng tệp tin gốc</span>
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="document-empty-card">
                    <FileText size={48} color="#94A3B8" />
                    <h4>Chưa có tài liệu tham khảo cho học phần này</h4>
                    <p>Giảng viên phụ trách chuyên đề chưa bổ sung văn bản quy phạm pháp luật hoặc tài liệu đọc thêm vào bài giảng.</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. TAB HÌNH ẢNH / BẢN ĐỒ NGHIỆP VỤ */}
            {mediaTab === 'image' && (
              <div className="study-image-container">
                <div className="image-case-header">
                  <h4>🗺️ {imageLabel}</h4>
                  <p>Học viên quan sát các vị trí then chốt, dấu vết và kế hoạch phối hợp tác chiến.</p>
                </div>
                <div className="image-viewport">
                  <img
                    src={getMediaStreamUrl(imageFileId)}
                    alt="Tư liệu nghiệp vụ"
                    className="case-study-img"
                    onError={(e) => {
                      // Fallback hiển thị banner mô phỏng nếu file không phải là ảnh
                      e.currentTarget.style.display = 'none';
                      const fb = document.getElementById('image-fallback-box');
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div id="image-fallback-box" className="image-fallback-panel" style={{ display: 'none' }}>
                    <Layers size={48} color="#991B1B" />
                    <h4>Sơ đồ tổ chức nghiệp vụ & Bản đồ thực địa điện tử</h4>
                    <p>Hệ thống tự động đồng bộ hóa tư liệu hình ảnh và sơ đồ từ Cơ sở dữ liệu học liệu T04.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TAB CÂU HỎI ÔN TẬP */}
            {mediaTab === 'quiz' && (
              <div className="study-quiz-container">
                <div className="quiz-header-banner">
                  <div>
                    <h3>📝 Phiếu câu hỏi ôn tập & Củng cố nhận thức Sĩ quan</h3>
                    <p>Học viên chọn đáp án đúng nhất để kiểm tra mức độ nắm vững bài giảng (đồng bộ CSDL MySQL).</p>
                  </div>
                  {showQuizResults && (
                    <div className="quiz-score-badge" style={{
                      background: getQuizScoreStats().passed ? '#DCFCE7' : '#FEE2E2',
                      color: getQuizScoreStats().passed ? '#166534' : '#991B1B',
                      border: `1px solid ${getQuizScoreStats().passed ? '#86EFAC' : '#FCA5A5'}`
                    }}>
                      Kết quả: <strong>{getQuizScoreStats().correct} / {getQuizScoreStats().total}</strong> câu đúng ({getQuizScoreStats().score}%) - <strong>{getQuizScoreStats().passed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}</strong>
                    </div>
                  )}
                </div>

                {quizQuestions.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                    <FileQuestion size={48} style={{ margin: '0 auto 16px', color: '#94A3B8' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1E36', marginBottom: '8px' }}>Chưa có câu hỏi trắc nghiệm cho bài giảng này</h4>
                    <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '480px', margin: '0 auto' }}>
                      Giảng viên phụ trách chuyên đề chưa thiết lập ngân hàng câu hỏi ôn tập trên CSDL hệ thống.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="quiz-questions-list">
                      {quizQuestions.map((q, qIndex) => {
                        const selected = quizAnswers[q.id];
                        return (
                          <div key={q.id} className="quiz-card">
                            <div className="quiz-question-title">
                              <span className="q-number">Câu {qIndex + 1}:</span>
                              <span>{q.question}</span>
                            </div>

                            <div className="quiz-options-list">
                              {q.options.map((opt, optIndex) => {
                                const isChosen = selected === optIndex;
                                let optionClass = 'quiz-option';
                                if (isChosen) optionClass += ' chosen';
                                if (showQuizResults) {
                                  if (optIndex === q.correctIndex) optionClass += ' correct';
                                  else if (isChosen && optIndex !== q.correctIndex) optionClass += ' wrong';
                                }

                                return (
                                  <button
                                    key={optIndex}
                                    className={optionClass}
                                    onClick={() => handleSelectAnswer(q.id, optIndex)}
                                  >
                                    <span className="option-radio">
                                      {isChosen && <span className="radio-dot"></span>}
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {showQuizResults && q.explanation && (
                              <div className="quiz-explanation">
                                <strong>💡 Giải thích nghiệp vụ:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="quiz-action-bar">
                      <button
                        className="btn-submit-quiz"
                        onClick={handleSubmitQuiz}
                        disabled={isSubmittingQuiz || showQuizResults || !currentUser?.id || quizQuestions.some(q => quizAnswers[q.id] === undefined)}
                      >
                        <CheckCircle2 size={16} />
                        {isSubmittingQuiz ? 'Đang chấm điểm trên CSDL...' : 'Chấm điểm & Lưu kết quả CSDL'}
                      </button>
                      {showQuizResults && (
                        <button
                          className="btn-reset-quiz"
                          onClick={() => {
                            setShowQuizResults(false);
                            setQuizResult(null);
                            setQuizAnswers({});
                            submissionId.current = crypto.randomUUID();
                            localStorage.setItem(draftKey, JSON.stringify({ answers: {}, submissionId: submissionId.current }));
                          }}
                        >
                          <RefreshCw size={15} />
                          Làm lại bài kiểm tra
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* CỘT PHẢI: SỔ TAY GHI CHÚ NGHIỆP VỤ (Ẩn theo yêu cầu người dùng, giữ nguyên component PageNotes để tái kích hoạt khi cần) */}
        {/*
        <aside className="study-notes-sidebar">
          <div className="notes-card-header">
            <div className="notes-header-left">
              <ShieldCheck size={16} color="#991B1B" />
              <h4>SỔ TAY GHI CHÚ SĨ QUAN</h4>
            </div>
          </div>
          <PageNotes key={currentUser?.id} lectureId={effectiveId} fileId={activePdfId} pdfPage={activePdfId ? pdfPage : null} />

          <div className="security-notice-box">
            <AlertTriangle size={14} />
            <span>Mọi ghi chép bài học lưu hành trên hệ thống Intranet đào tạo T04. Nghiêm cấm trích xuất ra ngoài.</span>
          </div>
        </aside>
        */}
      </div>
    </div>
  );
}
