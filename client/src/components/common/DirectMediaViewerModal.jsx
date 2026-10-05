import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  FileCode,
  Presentation,
  Archive,
  FileQuestion,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getMediaKind, getViewerKind } from '../../mediaType';
import { getMediaStreamUrl } from '../../pdfViewer';
import UniversalVideoPlayer from './UniversalVideoPlayer';
import PdfReader from '../lecture/PdfReader';
import ExcelViewer from '../file/ExcelViewer';
import WordViewer from '../file/WordViewer';
import TextViewer from '../file/TextViewer';
import OfficeDocCard from '../file/OfficeDocCard';

export default function DirectMediaViewerModal({
  isOpen,
  onClose,
  file,
  onCopyHash,
  copiedHash,
  initialPage = 1
}) {
  const [pdfPage, setPdfPage] = useState(initialPage || 1);
  const [isMaximized, setIsMaximized] = useState(false);

  React.useEffect(() => {
    setPdfPage(initialPage || 1);
  }, [file?.id, file?.fileId, initialPage]);

  if (!isOpen || !file) return null;

  const fileId = file.id || file.fileId;
  const fileName = file.originalFileName || file.originalName || 'Tập tin';
  const fileClassification = file.classification || file.classificationName || 'Nội bộ';
  const viewerKind = getViewerKind(file);
  const streamUrl = getMediaStreamUrl(fileId);
  const downloadUrl = `/api/media/download/${fileId}`;

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

  // Mở tab mới: luôn mở trang xem tài liệu toàn màn hình độc lập #/view/:id
  const newTabUrl = `#/view/${fileId}`;

  const formatBadgeLabel = () => {
    switch (viewerKind) {
      case 'excel':
        return 'EXCEL / BẢNG TÍNH';
      case 'word':
        return 'WORD / TÀI LIỆU';
      case 'pdf':
        return 'TÀI LIỆU PDF';
      case 'slide':
        return 'SLIDE POWERPOINT';
      case 'text':
        return 'VĂN BẢN THUẦN';
      case 'video':
        return 'VIDEO BÀI GIẢNG';
      case 'image':
        return 'HÌNH ẢNH';
      case 'audio':
        return 'BẢN ÂM THANH';
      case 'archive':
        return 'TỆP NÉN';
      default:
        return (file.fileType || 'TẬP TIN').toUpperCase();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        style={
          isMaximized
            ? { maxWidth: '100vw', width: '100vw', height: '100vh', maxHeight: '100vh', borderRadius: 0 }
            : { maxWidth: '1100px', width: '96vw', height: '90vh', maxHeight: '90vh' }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ background: '#0B1E36', borderBottom: '2px solid #A31A1A' }}>
          <div className="modal-title-wrap">
            {viewerKind === 'excel' && <FileSpreadsheet size={20} color="#10B981" />}
            {viewerKind === 'word' && <FileText size={20} color="#38BDF8" />}
            {viewerKind === 'pdf' && <FileText size={20} color="#F87171" />}
            {viewerKind === 'text' && <FileCode size={20} color="#93C5FD" />}
            {viewerKind === 'slide' && <Presentation size={20} color="#FBBF24" />}
            {viewerKind === 'archive' && <Archive size={20} color="#C084FC" />}
            {viewerKind === 'video' && <Video size={20} color="#60A5FA" />}
            {viewerKind === 'image' && <ImageIcon size={20} color="#34D399" />}
            {viewerKind === 'audio' && <Music size={20} color="#FBBF24" />}
            {viewerKind === 'other' && <FileQuestion size={20} color="#94A3B8" />}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 title={fileName} style={{ fontSize: '15px', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
                  {fileName}
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: fileClassification.toLowerCase().includes('tuyệt mật')
                      ? '#991B1B'
                      : fileClassification.toLowerCase().includes('tối mật')
                      ? '#C2410C'
                      : fileClassification.toLowerCase().includes('mật')
                      ? '#D97706'
                      : '#1E40AF',
                    color: '#FFFFFF'
                  }}
                >
                  {fileClassification}
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginTop: '3px'
                }}
              >
                <span>
                  Định dạng: <strong>{formatBadgeLabel()}</strong>
                </span>
                <span>•</span>
                <span>
                  Dung lượng: <strong>{formatFileSize(file.fileSize)}</strong>
                </span>
                <span>•</span>
                <span>
                  Lưu hành: <strong>Nội bộ T04</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="btn-icon-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title={isMaximized ? 'Thu nhỏ lại kích thước chuẩn' : 'Mở rộng toàn màn hình'}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">{isMaximized ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>

            <a
              href={newTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon-secondary"
              style={{
                textDecoration: 'none',
                padding: '6px 12px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Mở tài liệu ra một tab trình duyệt mới độc lập"
            >
              <ExternalLink size={13} />
              <span>Mở tab mới</span>
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
          {/* EXCEL VIEWER */}
          {viewerKind === 'excel' && (
            <ExcelViewer
              url={streamUrl}
              fileName={fileName}
              file={file}
              downloadUrl={downloadUrl}
            />
          )}

          {/* WORD VIEWER */}
          {viewerKind === 'word' && (
            <WordViewer
              url={streamUrl}
              fileName={fileName}
              file={file}
              downloadUrl={downloadUrl}
            />
          )}

          {/* PLAIN TEXT / CODE VIEWER */}
          {viewerKind === 'text' && (
            <TextViewer
              url={streamUrl}
              fileName={fileName}
              downloadUrl={downloadUrl}
            />
          )}

          {/* PDF VIEWER */}
          {viewerKind === 'pdf' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PdfReader
                key={`${fileId}_${initialPage}`}
                url={streamUrl}
                initialPage={pdfPage}
                fileName={fileName}
                downloadUrl={downloadUrl}
                canDownload={true}
                onPage={(p) => setPdfPage(p)}
              />
            </div>
          )}

          {/* SLIDE POWERPOINT */}
          {viewerKind === 'slide' && (
            <OfficeDocCard
              file={file}
              fileName={fileName}
              downloadUrl={downloadUrl}
              formatType="powerpoint"
            />
          )}

          {/* ARCHIVE (.ZIP / .RAR) */}
          {viewerKind === 'archive' && (
            <OfficeDocCard
              file={file}
              fileName={fileName}
              downloadUrl={downloadUrl}
              formatType="archive"
            />
          )}

          {/* OTHER UNRECOGNIZED FORMAT */}
          {viewerKind === 'other' && (
            <OfficeDocCard
              file={file}
              fileName={fileName}
              downloadUrl={downloadUrl}
              formatType="other"
            />
          )}

          {/* VIDEO PLAYER */}
          {viewerKind === 'video' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000'
              }}
            >
              <UniversalVideoPlayer
                src={streamUrl}
                fileName={fileName}
                className="video-player-frame"
                style={{ maxHeight: '70vh', maxWidth: '100%', width: '100%' }}
              />
            </div>
          )}

          {/* IMAGE VIEWER */}
          {viewerKind === 'image' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
            >
              <img
                src={streamUrl}
                alt={fileName}
                className="image-viewer-frame"
                style={{
                  maxHeight: '72vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          )}

          {/* AUDIO PLAYER */}
          {viewerKind === 'audio' && (
            <div className="audio-viewer-panel" style={{ margin: 'auto', textAlign: 'center' }}>
              <div className="audio-icon-pulse">
                <Music size={40} color="#FBBF24" />
              </div>
              <h4 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '8px' }}>{fileName}</h4>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
                Bản ghi âm bài giảng lưu hành nội bộ T04
              </p>
              <audio controls autoPlay src={streamUrl} style={{ width: '380px' }} />
            </div>
          )}
        </div>

        {/* MODAL DETAILS FOOTER */}
        <div
          className="modal-details-footer"
          style={{ background: '#F8FAFC', padding: '12px 20px', borderTop: '1px solid #E2E8F0' }}
        >
          <div className="file-specs">
            <div className="spec-title" style={{ fontSize: '12.5px', color: '#334155' }}>
              <span>
                Dung lượng: <strong>{formatFileSize(file.fileSize)}</strong>
              </span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>
                Ngày cập nhật: <strong>{formatDate(file.createdAt)}</strong>
              </span>
            </div>
            <div
              className="spec-hash"
              style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}
            >
              SHA-256: <code>{file.checksum || file.checksumSha256 || file.sha256Hash || 'N/A'}</code>
            </div>
          </div>

          <div className="modal-action-btns" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-icon-secondary"
              onClick={() => onCopyHash(file.checksum || file.checksumSha256 || file.sha256Hash, fileId)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px' }}
            >
              {copiedHash === fileId ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              <span>{copiedHash === fileId ? 'Đã sao chép' : 'Sao chép SHA-256'}</span>
            </button>

            <a
              href={downloadUrl}
              download={fileName}
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
              type="button"
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
