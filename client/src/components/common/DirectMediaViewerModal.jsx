import React, { useState } from 'react';
import {
  X,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
  Hash
} from 'lucide-react';
import { createMediaViewerUrl } from '../../pdfViewer';

export default function DirectMediaViewerModal({
  isOpen,
  onClose,
  file,
  onCopyHash,
  copiedHash
}) {
  const [pdfPage, setPdfPage] = useState(1);

  if (!isOpen || !file) return null;

  const isDoc = file.category === 'document' || file.originalFileName?.toLowerCase().endsWith('.pdf');
  const isVideo = file.category === 'video' || file.originalFileName?.toLowerCase().endsWith('.mp4');
  const isImage = file.category === 'image' || file.originalFileName?.toLowerCase().endsWith('.png') || file.originalFileName?.toLowerCase().endsWith('.jpg');
  const isAudio = file.category === 'audio' || file.originalFileName?.toLowerCase().endsWith('.mp3');

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '1050px', width: '95vw', height: '90vh', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ background: '#0B1E36', borderBottom: '2px solid #A31A1A' }}>
          <div className="modal-title-wrap">
            {isDoc && <FileText size={20} color="#F87171" />}
            {isVideo && <Video size={20} color="#60A5FA" />}
            {isImage && <ImageIcon size={20} color="#34D399" />}
            {isAudio && <Music size={20} color="#FBBF24" />}
            <div>
              <h3 title={file.originalFileName} style={{ fontSize: '15px', color: '#FFFFFF', margin: 0 }}>
                {file.originalFileName}
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>Định dạng: <strong>{file.category?.toUpperCase() || 'TẬP TIN'}</strong></span>
                <span>•</span>
                <span>Dung lượng: <strong>{formatFileSize(file.fileSize)}</strong></span>
                <span>•</span>
                <span>Lưu hành: <strong>Nội bộ T04</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href={`/api/media/stream/${file.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon-secondary"
              style={{
                textDecoration: 'none',
                padding: '5px 10px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Mở tập tin trong tab mới"
            >
              <ExternalLink size={13} />
              Mở tab mới
            </a>

            <button className="modal-close-btn" onClick={onClose} title="Đóng cửa sổ xem tài liệu">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL MEDIA VIEWPORT */}
        <div
          className="modal-media-viewport"
          style={{
            flex: 1,
            background: '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* PDF VIEWER */}
          {isDoc && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: '#1E293B',
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                    disabled={pdfPage <= 1}
                    className="btn-doc-nav"
                    style={{
                      background: '#334155',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: pdfPage <= 1 ? 'not-allowed' : 'pointer',
                      opacity: pdfPage <= 1 ? 0.5 : 1
                    }}
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span style={{ fontSize: '13px', color: '#E2E8F0' }}>
                    Trang <strong style={{ color: '#FEF08A' }}>{pdfPage}</strong>
                  </span>

                  <button
                    onClick={() => setPdfPage(p => p + 1)}
                    className="btn-doc-nav"
                    style={{
                      background: '#334155',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                    title="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Trình đọc Giáo trình & Tài liệu nghiệp vụ PDF chuẩn T04
                </div>
              </div>

              <iframe
                title={file.originalFileName}
                src={createMediaViewerUrl(file.id, 'document', pdfPage)}
                style={{ width: '100%', flex: 1, border: 'none', background: '#525659' }}
              />
            </div>
          )}

          {/* VIDEO PLAYER */}
          {isVideo && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <video
                controls
                autoPlay
                className="video-player-frame"
                src={`/api/media/stream/${file.id}`}
                style={{ maxHeight: '70vh', maxWidth: '100%', width: '100%' }}
              >
                Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
              </video>
            </div>
          )}

          {/* IMAGE VIEWER */}
          {isImage && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <img
                src={`/api/media/stream/${file.id}`}
                alt={file.originalFileName}
                className="image-viewer-frame"
                style={{ maxHeight: '72vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              />
            </div>
          )}

          {/* AUDIO PLAYER */}
          {isAudio && (
            <div className="audio-viewer-panel" style={{ margin: 'auto', textAlign: 'center' }}>
              <div className="audio-icon-pulse">
                <Music size={40} color="#FBBF24" />
              </div>
              <h4 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '8px' }}>{file.originalFileName}</h4>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>Bản ghi âm bài giảng lưu hành nội bộ T04</p>
              <audio controls autoPlay src={`/api/media/stream/${file.id}`} style={{ width: '380px' }} />
            </div>
          )}
        </div>

        {/* MODAL DETAILS FOOTER */}
        <div className="modal-details-footer" style={{ background: '#F8FAFC', padding: '12px 20px', borderTop: '1px solid #E2E8F0' }}>
          <div className="file-specs">
            <div className="spec-title" style={{ fontSize: '12.5px', color: '#334155' }}>
              <span>Dung lượng: <strong>{formatFileSize(file.fileSize)}</strong></span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>Ngày cập nhật: <strong>{formatDate(file.createdAt)}</strong></span>
            </div>
            <div className="spec-hash" style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
              SHA-256: <code>{file.checksum || 'N/A'}</code>
            </div>
          </div>

          <div className="modal-action-btns" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-icon-secondary"
              onClick={() => onCopyHash(file.checksum, file.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px' }}
            >
              {copiedHash === file.id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              <span>{copiedHash === file.id ? 'Đã sao chép' : 'Sao chép SHA-256'}</span>
            </button>

            <a
              href={`/api/media/download/${file.id}`}
              download={file.originalFileName}
              className="btn-download-gold"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                fontSize: '12.5px',
                background: '#A31A1A',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 700
              }}
            >
              <Download size={14} />
              Tải tài liệu về máy
            </a>

            <button
              className="btn-icon-secondary"
              onClick={onClose}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
