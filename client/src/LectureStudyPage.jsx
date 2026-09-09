import React, { useState, useEffect, useRef } from 'react';
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
import { createMediaViewerUrl, createPdfNoteKey, normalizePdfPage } from './pdfViewer';
import { INITIAL_LECTURES } from './lectureData';

export default function LectureStudyPage({ lectureId, file, onBack, allFiles = [] }) {
  const [activePart, setActivePart] = useState(2); // Mặc định mở Phần 2 (Lý thuyết & Video)
  const [mediaTab, setMediaTab] = useState('video'); // 'video' | 'slide' | 'doc' | 'image' | 'quiz'
  const [pdfPage, setPdfPage] = useState(1);
  const [noteContent, setNoteContent] = useState('');
  const [copiedNote, setCopiedNote] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completedParts, setCompletedParts] = useState([1]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const containerRef = useRef(null);

  // Tìm bài giảng theo ID từ INITIAL_LECTURES hoặc allFiles hoặc file prop
  const effectiveId = lectureId || file?.id || 1;
  const lectureObj = INITIAL_LECTURES.find(l => String(l.id) === String(effectiveId))
    || allFiles.find(f => String(f.id) === String(effectiveId))
    || file
    || INITIAL_LECTURES[0];

  const fileId = lectureObj?.id || effectiveId;
  const fileName = lectureObj?.title || lectureObj?.originalFileName || 'Bài giảng Nghiệp vụ An ninh T04';
  const category = lectureObj?.category || (lectureObj?.mediaItems?.some(m => m.type === 'video') ? 'video' : 'document');
  const isLecture = Boolean(lectureObj?.mediaItems && lectureObj?.mediaItems.length > 0);
  const mediaItems = lectureObj?.mediaItems || [];
  const lecturerName = lectureObj?.lecturer || 'TS. Nguyễn Văn An - Trưởng Khoa ANĐT';
  const deptName = lectureObj?.departmentName || 'Trường Đại học An ninh nhân dân';

  // Định tuyến tài liệu thực tế cho từng phân hệ trong bài giảng
  const videoItem = mediaItems.find(m => m.role === 'video' || m.type === 'video');
  const videoFileId = videoItem?.mediaFileId || (category === 'video' ? fileId : 7);
  const videoLabel = videoItem?.label || fileName;

  const slideItem = mediaItems.find(m => m.role === 'slide');
  const slideFileId = slideItem?.mediaFileId || (category === 'document' ? fileId : 1);
  const slideLabel = slideItem?.label || 'Slide trình chiếu bài giảng điện tử';

  const docItem = mediaItems.find(m => (activePart === 4 ? m.role === 'reference_law' : m.role === 'syllabus') || m.type === 'document');
  const docFileId = docItem?.mediaFileId || (activePart === 4 ? 10 : (category === 'document' ? fileId : 4));
  const docLabel = docItem?.label || (activePart === 4 ? 'Văn bản quy phạm pháp luật ngành' : 'Đề cương chi tiết học phần');

  const imageItem = mediaItems.find(m => m.role === 'situation_diagram' || m.type === 'image');
  const imageFileId = imageItem?.mediaFileId || (category === 'image' ? fileId : 6);
  const imageLabel = imageItem?.label || 'Sơ đồ hiện trường & Bản đồ tác chiến';

  // Đồng bộ định dạng hiển thị phù hợp với loại file gốc
  useEffect(() => {
    if (category === 'video' || category === 'audio') {
      setMediaTab('video');
      setActivePart(2);
    } else if (category === 'document') {
      setMediaTab('slide');
      setActivePart(2);
    } else if (category === 'image') {
      setMediaTab('image');
      setActivePart(3);
    }
  }, [file]);

  // Nạp ghi chú của học viên từ localStorage
  useEffect(() => {
    const key = `dhan:lecture-note:${fileId}:part-${activePart}`;
    const saved = localStorage.getItem(key) || '';
    setNoteContent(saved);
  }, [fileId, activePart]);

  // Lưu ghi chú
  const handleSaveNote = (text) => {
    setNoteContent(text);
    const key = `dhan:lecture-note:${fileId}:part-${activePart}`;
    if (text.trim()) {
      localStorage.setItem(key, text);
    } else {
      localStorage.removeItem(key);
    }
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleCopyNote = () => {
    if (!noteContent) return;
    navigator.clipboard.writeText(noteContent);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const togglePartCompletion = (partId) => {
    setCompletedParts(prev =>
      prev.includes(partId) ? prev.filter(p => p !== partId) : [...prev, partId]
    );
  };

  // 5 Phần chuẩn cấu trúc bài giảng đào tạo Sĩ quan CAND
  const partsConfig = [
    {
      id: 1,
      title: 'Phần 1: Mục tiêu & Yêu cầu Nghiệp vụ',
      subtitle: 'Đề cương, căn cứ pháp lý & yêu cầu đào tạo',
      icon: BookOpen,
      defaultTab: 'doc',
      duration: '15 phút'
    },
    {
      id: 2,
      title: 'Phần 2: Lý thuyết Chuyên đề & Trình chiếu',
      subtitle: 'Slide bài giảng PPT/PDF & Video ghi hình giảng viên',
      icon: Video,
      defaultTab: category === 'video' ? 'video' : 'slide',
      duration: '45 phút'
    },
    {
      id: 3,
      title: 'Phần 3: Tình huống Thực địa & Sơ đồ Chiến thuật',
      subtitle: 'Tư liệu ảnh hiện trường, bản đồ & diễn biến vụ việc',
      icon: ImageIcon,
      defaultTab: 'image',
      duration: '30 phút'
    },
    {
      id: 4,
      title: 'Phần 4: Tài liệu Nghiên cứu & Văn bản Quy phạm',
      subtitle: 'Bộ luật TTHS, Luật CAND & Thông tư Bộ Công An',
      icon: FileText,
      defaultTab: 'doc',
      duration: '25 phút'
    },
    {
      id: 5,
      title: 'Phần 5: Câu hỏi Ôn tập & Sổ tay Thu hoạch',
      subtitle: 'Đánh giá nhận thức & Ghi chép nghiệp vụ',
      icon: HelpCircle,
      defaultTab: 'quiz',
      duration: '20 phút'
    }
  ];

  // Câu hỏi ôn tập mẫu nghiệp vụ
  const sampleQuiz = [
    {
      id: 'q1',
      question: 'Khi tiếp cận hiện trường vụ án an ninh trật tự, nguyên tắc bảo vệ hiện trường quan trọng nhất là gì?',
      options: [
        'A. Thu gom toàn bộ vật chứng vào túi ni lông ngay lập tức',
        'B. Giữ nguyên trạng thái hiện trường, căng dây phong tỏa và ghi nhận dấu vết ban đầu',
        'C. Cho phép người dân vào hỗ trợ tìm kiếm chứng cứ',
        'D. Chụp ảnh lưu niệm rồi dọn dẹp hiện trường sạch sẽ'
      ],
      correct: 1,
      explanation: 'Theo quy định tố tụng hình sự và nghiệp vụ trinh sát CAND, bảo vệ nguyên trạng hiện trường là điều kiện tiên quyết để khám nghiệm chính xác.'
    },
    {
      id: 'q2',
      question: 'Quy trình thu thập chứng cứ điện tử trong điều tra tội phạm công nghệ cao đòi hỏi yêu cầu bắt buộc nào?',
      options: [
        'A. Tạo bản sao bảo toàn (Forensic Image) và tính toán mã băm SHA-256 / MD5 xác thực',
        'B. Bật thiết bị lên và duyệt qua các tập tin trực tiếp',
        'C. Format ổ cứng trước khi sao lưu',
        'D. Gửi email tập tin chứng cứ cho người thân'
      ],
      correct: 0,
      explanation: 'Chứng cứ số phải đảm bảo tính nguyên vẹn tuyệt đối qua mã băm cryptographic (SHA-256) được hội đồng điều tra niêm phong.'
    },
    {
      id: 'q3',
      question: 'Thẩm quyền phê chuẩn lệnh bắt người trong trường hợp khẩn cấp thuộc về cơ quan nào?',
      options: [
        'A. Cơ quan Cảnh sát điều tra / An ninh điều tra cùng cấp',
        'B. Viện Kiểm sát nhân dân có thẩm quyền',
        'C. Ủy ban nhân dân cấp xã',
        'D. Đơn vị dân quân tự vệ'
      ],
      correct: 1,
      explanation: 'Viện Kiểm sát nhân dân thực hành quyền công tố và kiểm sát điều tra có thẩm quyền phê chuẩn theo Bộ luật Tố tụng hình sự.'
    }
  ];

  const handleSelectAnswer = (qId, optionIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateQuizScore = () => {
    let correctCount = 0;
    sampleQuiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) correctCount++;
    });
    return correctCount;
  };

  const progressPercent = Math.round((completedParts.length / 5) * 100);

  // Link mở tab mới chuẩn xác theo URL định tuyến #/study/:id
  const newTabUrl = `/#/study/${fileId}`;

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
              <span className="study-agency-tag">TRƯỜNG ĐẠI HỌC AN NINH NHÂN DÂN • T04</span>
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

            <a
              href={`/api/media/download/${fileId}`}
              download={fileName}
              className="btn-study-action"
              title="Tải toàn bộ học liệu về máy tính"
            >
              <Download size={15} />
              <span>Tải học liệu</span>
            </a>
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
                Câu hỏi ôn tập ({sampleQuiz.length} câu)
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
            {/* 1. TAB VIDEO */}
            {mediaTab === 'video' && (
              <div className="study-video-container">
                <video
                  controls
                  autoPlay={false}
                  preload="metadata"
                  className="study-video-player"
                  src={`/api/media/stream/${videoFileId}`}
                >
                  Trình duyệt của bạn không hỗ trợ phát Video HTML5.
                </video>
                <div className="video-info-strip">
                  <div className="video-title">
                    <h4>🎥 Video bài giảng: {videoLabel}</h4>
                    <p>Chuẩn truyền phát HTTP 206 Partial Content mượt mà, hỗ trợ tua thời gian tức thì.</p>
                  </div>
                  <div className="video-actions">
                    <a
                      href={`/api/media/stream/${videoFileId}`}
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
            )}

            {/* 2. TAB SLIDE TRÌNH CHIẾU & TÀI LIỆU PDF */}
            {(mediaTab === 'slide' || mediaTab === 'doc') && (
              <div className="study-doc-container">
                <div className="doc-page-toolbar">
                  <div className="page-nav-group">
                    <button
                      className="btn-doc-nav"
                      onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                      disabled={pdfPage <= 1}
                      title="Trang trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="page-indicator">Trang <strong>{pdfPage}</strong></span>
                    <button
                      className="btn-doc-nav"
                      onClick={() => setPdfPage(p => p + 1)}
                      title="Trang sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="doc-type-badge">
                    {mediaTab === 'slide' ? slideLabel : docLabel}
                  </div>

                  <div className="doc-tools-right">
                    <a
                      href={createMediaViewerUrl(mediaTab === 'slide' ? slideFileId : docFileId, 'document', pdfPage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-sub-action"
                    >
                      <ExternalLink size={13} />
                      Mở PDF toàn trang
                    </a>
                  </div>
                </div>

                <iframe
                  title="Trình đọc bài giảng PDF"
                  className="study-pdf-frame"
                  src={createMediaViewerUrl(mediaTab === 'slide' ? slideFileId : docFileId, 'document', pdfPage)}
                />
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
                    src={`/api/media/stream/${imageFileId}`}
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
                    <p>Học viên chọn đáp án đúng nhất để kiểm tra mức độ nắm vững bài giảng.</p>
                  </div>
                  {showQuizResults && (
                    <div className="quiz-score-badge">
                      Kết quả: <strong>{calculateQuizScore()} / {sampleQuiz.length}</strong> câu đúng
                    </div>
                  )}
                </div>

                <div className="quiz-questions-list">
                  {sampleQuiz.map((q, qIndex) => {
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
                              if (optIndex === q.correct) optionClass += ' correct';
                              else if (isChosen && optIndex !== q.correct) optionClass += ' wrong';
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

                        {showQuizResults && (
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
                    onClick={() => setShowQuizResults(true)}
                  >
                    <CheckCircle2 size={16} />
                    Chấm điểm & Xem đáp án chi tiết
                  </button>
                  {showQuizResults && (
                    <button
                      className="btn-reset-quiz"
                      onClick={() => {
                        setShowQuizResults(false);
                        setQuizAnswers({});
                      }}
                    >
                      <RefreshCw size={15} />
                      Làm lại bài kiểm tra
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* CỘT PHẢI: SỔ TAY GHI CHÚ NGHIỆP VỤ HỌC VIÊN */}
        <aside className="study-notes-sidebar">
          <div className="notes-card-header">
            <div className="notes-header-left">
              <ShieldCheck size={16} color="#991B1B" />
              <h4>SỔ TAY GHI CHÚ SĨ QUAN</h4>
            </div>
            {savedStatus && (
              <span className="notes-saved-tag">
                <Check size={11} /> Đã lưu
              </span>
            )}
          </div>

          <p className="notes-caption">
            Ghi chép tự động lưu trữ cho <strong>Phần {activePart}</strong> của bài giảng này.
          </p>

          <textarea
            className="study-notes-editor"
            placeholder={`Nhập tóm tắt nghiệp vụ, nhận xét hoặc điểm cần lưu ý của Phần ${activePart}...`}
            value={noteContent}
            onChange={(e) => handleSaveNote(e.target.value)}
          />

          <div className="notes-card-footer">
            <button
              className="btn-notes-tool"
              onClick={handleCopyNote}
              title="Sao chép nội dung ghi chú"
            >
              {copiedNote ? <Check size={13} color="#059669" /> : <Copy size={13} />}
              <span>{copiedNote ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>

            <button
              className="btn-notes-tool"
              onClick={() => handleSaveNote('')}
              title="Xóa toàn bộ ghi chú của phần này"
            >
              <Trash2 size={13} />
              <span>Xóa ghi chú</span>
            </button>
          </div>

          <div className="security-notice-box">
            <AlertTriangle size={14} />
            <span>Mọi ghi chép bài học lưu hành trên hệ thống Intranet đào tạo T04. Nghiêm cấm trích xuất ra ngoài.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
