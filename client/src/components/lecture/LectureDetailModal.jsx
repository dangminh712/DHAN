import React from 'react';
import {
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Users
} from 'lucide-react';
import Modal from '../common/Modal';
import { ClearanceBadge, LectureStatusBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export default function LectureDetailModal({
  isOpen,
  onClose,
  lecture,
  onViewFile,
  onDownloadFile
}) {
  const { currentUser, isClearanceSufficient } = useAuth();
  if (!lecture) return null;

  const isClosed = lecture.status === 'CLOSED';

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'VIDEO':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'OTHER':
        return <Music className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết Bài giảng & Danh mục Học liệu" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Lecture Overview Banner */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              {lecture.subjectCode}
            </span>
            <LectureStatusBadge status={lecture.status} />
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">{lecture.title}</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">{lecture.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Học phần: <strong>{lecture.subject}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Giảng viên: <strong>{lecture.teacherName}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Lớp phân quyền: <strong>{lecture.assignedClasses?.join(', ') || 'Chưa gán lớp'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Ngày phát hành: <strong>{lecture.publishAt ? new Date(lecture.publishAt).toLocaleDateString('vi-VN') : 'Bản thảo'}</strong></span>
            </div>
          </div>
        </div>

        {/* Closed Warning Banner */}
        {isClosed && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Bài giảng đã đóng (CLOSED per Section 34)</p>
              <p className="text-rose-600 mt-0.5">
                Theo quy tắc bảo mật của hệ thống, học viên không thể truy cập hoặc tải bất kỳ học liệu nào thuộc bài giảng này.
              </p>
            </div>
          </div>
        )}

        {/* Files List */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Danh mục Học liệu Số ({lecture.files?.length || 0})</span>
            <span className="text-xs font-normal text-slate-500">
              Clearance của bạn: <strong>{currentUser?.maxClearance}</strong> (Bậc {currentUser?.clearanceLevelOrder})
            </span>
          </h3>

          <div className="space-y-2.5">
            {lecture.files?.map((f) => {
              const isClearanceOk = isClearanceSufficient(f.classificationOrder);
              const canStream = !isClosed && isClearanceOk && f.isVisible;
              const canDownload = !isClosed && isClearanceOk && f.isDownloadable;

              return (
                <div
                  key={f.fileId}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !isClearanceOk || isClosed
                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {getFileIcon(f.fileType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {f.originalName}
                        </span>
                        <ClearanceBadge
                          level={
                            f.classificationOrder === 4
                              ? 'SECRET'
                              : f.classificationOrder === 3
                              ? 'CONFIDENTIAL'
                              : f.classificationOrder === 2
                              ? 'INTERNAL'
                              : 'NORMAL'
                          }
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Định dạng: {f.fileType}</span>
                        <span>•</span>
                        <span>Kích thước: {formatFileSize(f.fileSize)}</span>
                        {!f.isDownloadable && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Chỉ xem trực tuyến
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onViewFile(f, lecture.id)}
                      disabled={!canStream}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        canStream
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>

                    <button
                      onClick={() => onDownloadFile(f, lecture.id)}
                      disabled={!canDownload}
                      title={
                        !isClearanceOk
                          ? 'Cấp độ bảo mật học liệu cao hơn Clearance của bạn'
                          : !f.isDownloadable
                          ? 'Học liệu cấu hình không cho phép tải về máy'
                          : 'Tải tập tin'
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        canDownload
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
