import React, { useState } from 'react';
import {
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  X,
  Shield,
  Lock,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { getMediaKind } from '../../mediaType';
import Modal from '../common/Modal';
import { ClearanceBadge } from '../common/Badge';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

export default function FileViewerModal({ isOpen, onClose, file, lectureId, onDownload }) {
  const { currentUser } = useAuth();
  const [loadError, setLoadError] = useState(false);

  if (!file) return null;

  const streamUrl = fileService.getStreamUrl(file.fileId || file.id, currentUser?.id, lectureId);
  const fileType = getMediaKind(file).toUpperCase();
  const fileName = file.originalName || file.originalFileName || 'Tài liệu học tập';

  const watermarkText = `${currentUser?.fullName} • ${currentUser?.username} • ${new Date().toLocaleDateString('vi-VN')} • T04 SECURE INTRANET`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fileName} maxWidth="max-w-5xl">
      <div className="flex flex-col space-y-4">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Định dạng: {fileType}</span>
            <span>•</span>
            <ClearanceBadge
              level={
                file.classificationOrder === 4
                  ? 'SECRET'
                  : file.classificationOrder === 3
                  ? 'CONFIDENTIAL'
                  : file.classificationOrder === 2
                  ? 'INTERNAL'
                  : 'NORMAL'
              }
            />
          </div>

          <div className="flex items-center gap-2">
            {file.isDownloadable && (
              <button
                onClick={() => onDownload && onDownload(file, lectureId)}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải về máy</span>
              </button>
            )}
          </div>
        </div>

        {/* Media Viewing Container with Watermark Overlay */}
        <div className={`relative w-full min-h-[450px] max-h-[70vh] ${fileType === 'PDF' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl overflow-hidden flex items-center justify-center border shadow-inner`}>
          {/* Security Watermark (Diagonal background repeated pattern) */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center opacity-15 select-none">
            <div className={`transform -rotate-12 text-center ${fileType === 'PDF' ? 'text-slate-600' : 'text-white'} font-mono text-sm tracking-widest leading-loose`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>{watermarkText}</div>
              ))}
            </div>
          </div>

          {/* Player Rendering Based on Type */}
          {fileType === 'VIDEO' ? (
            <video
              controls
              controlsList="nodownload"
              autoPlay
              className="w-full max-h-[65vh] object-contain z-10"
              src={streamUrl}
              onError={() => setLoadError(true)}
            >
              Trình duyệt của bạn không hỗ trợ phát thẻ video.
            </video>
          ) : fileType === 'IMAGE' ? (
            <img
              src={streamUrl}
              alt={fileName}
              className="max-h-[65vh] max-w-full object-contain z-10"
              onError={() => setLoadError(true)}
            />
          ) : fileType === 'AUDIO' ? (
            <div className="flex flex-col items-center justify-center p-12 text-white z-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-600/30 flex items-center justify-center border border-red-500/50">
                <Music className="w-8 h-8 text-red-400" />
              </div>
              <p className="font-semibold text-sm">{fileName}</p>
              <audio controls className="w-80" src={streamUrl} autoPlay>
                Trình duyệt không hỗ trợ phát audio.
              </audio>
            </div>
          ) : fileType === 'PDF' ? (
            <iframe
              src={streamUrl}
              title={fileName}
              className="w-full h-[65vh] border-0 z-10 bg-white"
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="text-center text-slate-300 p-8 z-10">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">{fileName}</p>
              <p className="text-xs text-slate-400 mt-1">
                Tài liệu sẵn sàng để tải về nghiên cứu nội bộ.
              </p>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white z-30 p-6 text-center">
              <Lock className="w-12 h-12 text-red-500 mb-3" />
              <p className="font-bold text-sm">Không thể tải nội dung học liệu</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Hệ thống bảo mật Master Access Model có thể đã từ chối quyền truy cập hoặc phiên làm việc của bạn đã hết hạn.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Security Notice */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-red-600" />
            <span>Tài liệu nghiệp vụ an ninh - Nghiêm cấm sao chép, trích xuất ra ngoài mạng nội bộ.</span>
          </span>
          <span className="font-mono text-slate-400">IP: 192.168.1.100 (Intranet)</span>
        </div>
      </div>
    </Modal>
  );
}
