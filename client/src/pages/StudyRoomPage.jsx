import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  Download,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  Clock,
  Shield,
  Check
} from 'lucide-react';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { ClearanceBadge } from '../components/common/Badge';

export default function StudyRoomPage({ lecture, onBack, onDownloadFile }) {
  const { currentUser, isClearanceSufficient } = useAuth();
  const [activeFile, setActiveFile] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savedNote, setSavedNote] = useState(false);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    if (lecture?.files && lecture.files.length > 0) {
      setActiveFile(lecture.files[0]);
    }
  }, [lecture]);

  useEffect(() => {
    if (!lecture) return;
    const key = `dhan_note_${lecture.id}_${currentUser?.id}`;
    const saved = localStorage.getItem(key) || '';
    setNoteText(saved);
  }, [lecture, currentUser]);

  const handleSaveNote = () => {
    if (!lecture) return;
    const key = `dhan_note_${lecture.id}_${currentUser?.id}`;
    localStorage.setItem(key, noteText);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const toggleComplete = (fileId) => {
    setCompletedItems((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  if (!lecture) return null;

  const streamUrl = activeFile
    ? fileService.getStreamUrl(activeFile.fileId || activeFile.id, currentUser?.id, lecture.id)
    : '';

  const isClearanceOk = activeFile ? isClearanceSufficient(activeFile.classificationOrder) : false;
  const isClosed = lecture.status === 'CLOSED';

  const watermarkText = `${currentUser?.fullName} • ${currentUser?.username} • T04 SECURE STUDY`;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {lecture.subjectCode}
              </span>
              <span className="font-bold text-slate-800 text-sm">{lecture.title}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Giảng viên: {lecture.teacherName} • Lớp: {lecture.assignedClasses?.join(', ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ClearanceBadge level={currentUser?.maxClearance} order={currentUser?.clearanceLevelOrder} />
        </div>
      </div>

      {/* Main Study Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Main Player & File Viewer */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-lg">
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center opacity-15 select-none">
              <div className="transform -rotate-12 text-center text-white font-mono text-sm tracking-widest leading-loose">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>{watermarkText}</div>
                ))}
              </div>
            </div>

            {/* Media Rendering */}
            {!isClearanceOk || isClosed ? (
              <div className="text-center p-8 text-white z-30">
                <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="font-bold text-base">Truy cập bị giới hạn bởi Master Access Model</p>
                <p className="text-slate-400 mt-1 max-w-md text-xs">
                  {isClosed
                    ? 'Bài giảng này đã kết thúc và đóng quyền truy cập học viên.'
                    : 'Cấp độ bảo mật của học liệu cao hơn cấp độ Clearance hiện tại của bạn.'}
                </p>
              </div>
            ) : activeFile?.fileType === 'VIDEO' ? (
              <video
                key={activeFile.fileId}
                controls
                controlsList="nodownload"
                autoPlay
                className="w-full h-full object-contain z-10"
                src={streamUrl}
              >
                Trình duyệt không hỗ trợ video.
              </video>
            ) : activeFile?.fileType === 'PDF' ? (
              <iframe
                key={activeFile.fileId}
                src={streamUrl}
                title={activeFile.originalName}
                className="w-full h-full border-0 z-10 bg-white"
              />
            ) : activeFile?.fileType === 'IMAGE' ? (
              <img
                key={activeFile.fileId}
                src={streamUrl}
                alt={activeFile.originalName}
                className="max-h-full max-w-full object-contain z-10"
              />
            ) : (
              <div className="text-center text-white z-10 p-6">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-sm">{activeFile?.originalName}</p>
                <p className="text-slate-400 mt-1 text-xs">Học liệu đã sẵn sàng tải về nghiên cứu.</p>
              </div>
            )}
          </div>

          {/* Active File Bar */}
          {activeFile && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-slate-800 truncate">{activeFile.originalName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-mono text-[11px]">{activeFile.fileType}</span>
              </div>

              {activeFile.isDownloadable && isClearanceOk && !isClosed && (
                <button
                  onClick={() => onDownloadFile(activeFile, lecture.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải học liệu này</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Attached Files List & Notes */}
        <div className="space-y-4">
          {/* Attached Files Playlist */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center justify-between text-xs">
              <span>Học liệu thuộc bài giảng ({lecture.files?.length || 0})</span>
              <span className="text-slate-400 font-normal">Nhấp để chuyển mục</span>
            </h4>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {lecture.files?.map((f) => {
                const isSelected = activeFile?.fileId === f.fileId;
                const isDone = completedItems.includes(f.fileId);

                return (
                  <div
                    key={f.fileId}
                    onClick={() => setActiveFile(f)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(f.fileId);
                        }}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 bg-white text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span className="truncate text-xs">{f.originalName}</span>
                    </div>

                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white border border-slate-200 shrink-0">
                      {f.fileType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Study Notes */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">Sổ tay ghi chú học phần</h4>
              {savedNote && (
                <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã lưu</span>
                </span>
              )}
            </div>

            <textarea
              rows={8}
              placeholder="Ghi lại các điểm mấu chốt, căn cứ pháp lý hoặc thao tác nghiệp vụ cần lưu ý trong bài giảng..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-xs leading-relaxed"
            />

            <button
              onClick={handleSaveNote}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu ghi chú cá nhân</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
