import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
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
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getViewerKind } from '../mediaType';
import { getMediaStreamUrl } from '../pdfViewer';
import UniversalVideoPlayer from '../components/common/UniversalVideoPlayer';
import PdfReader from '../components/lecture/PdfReader';
import ExcelViewer from '../components/file/ExcelViewer';
import WordViewer from '../components/file/WordViewer';
import TextViewer from '../components/file/TextViewer';
import OfficeDocCard from '../components/file/OfficeDocCard';

export default function DocumentViewerPage({
  fileId,
  currentUser,
  initialPage = 1,
  onBack
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [pdfPage, setPdfPage] = useState(initialPage || 1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const fetchFileDetail = async () => {
      try {
        // 1. Thử lấy thông tin học liệu từ API media
        const res = await axios.get(`/api/media/${fileId}`);
        if (!isCancelled) {
          setFile(res.data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Không tìm thấy từ /api/media, đang thử nạp qua API training...', err.message);
        try {
          // 2. Thử tìm trong danh sách training files
          const trainingRes = await axios.get('/api/training/files');
          const items = Array.isArray(trainingRes.data)
            ? trainingRes.data
            : trainingRes.data?.items || [];
          const found = items.find((f) => String(f.id) === String(fileId) || String(f.fileId) === String(fileId));

          if (found && !isCancelled) {
            setFile({
              ...found,
              id: found.id || found.fileId,
              originalFileName: found.originalName || found.originalFileName,
              classification: found.classificationName || found.classification || 'Lưu hành nội bộ'
            });
            setLoading(false);
            return;
          }
          throw new Error('Không tìm thấy tài liệu này trong hệ thống cơ sở dữ liệu.');
        } catch (secondErr) {
          if (!isCancelled) {
            setError(secondErr.response?.data?.message || secondErr.message || 'Không thể tải thông tin tài liệu.');
            setLoading(false);
          }
        }
      }
    };

    if (fileId) {
      fetchFileDetail();
    } else {
      setError('Mã tài liệu không hợp lệ.');
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [fileId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#/mon-hoc';
    }
  };

  const copyChecksum = (checksum) => {
    if (!checksum) return;
    navigator.clipboard.writeText(checksum);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileName = file?.originalFileName || file?.originalName || `Tài liệu #${fileId}`;
  const viewerKind = file ? getViewerKind(file) : 'other';
  const streamUrl = getMediaStreamUrl(fileId);
  const downloadUrl = `/api/media/download/${fileId}`;
  const fileClassification = file?.classification || file?.classificationName || 'Nội bộ T04';
  const shaHash = file?.checksumSha256 || file?.checksum || file?.sha256Hash || 'N/A';

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
        return (file?.fileType || 'TẬP TIN').toUpperCase();
    }
  };

  return (
    <div
      className="document-viewer-page"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B1E36',
        color: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      {/* 1. TOP HEADER BAR */}
      <header
        style={{
          height: '56px',
          background: '#0B1E36',
          borderBottom: '2px solid #A31A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          gap: '12px',
          flexShrink: 0,
          zIndex: 20
        }}
      >
        {/* Left: Back & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Đóng trang xem và quay lại"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>

          <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.2)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
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

            <h1
              title={fileName}
              style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '450px'
              }}
            >
              {fileName}
            </h1>

            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                background: fileClassification.toLowerCase().includes('tuyệt mật')
                  ? '#991B1B'
                  : fileClassification.toLowerCase().includes('tối mật')
                  ? '#C2410C'
                  : fileClassification.toLowerCase().includes('mật')
                  ? '#D97706'
                  : '#1E40AF',
                color: '#FFFFFF',
                whiteSpace: 'nowrap'
              }}
            >
              {fileClassification}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {file && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }} className="hidden md:flex">
              <span>Định dạng: <strong style={{ color: '#fff' }}>{formatBadgeLabel()}</strong></span>
              <span>•</span>
              <span>Dung lượng: <strong style={{ color: '#fff' }}>{formatFileSize(file.fileSize)}</strong></span>
            </div>
          )}

          {file && (
            <button
              type="button"
              onClick={() => copyChecksum(shaHash)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                fontSize: '11.5px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.1)',
                color: '#E2E8F0',
                border: 'none',
                cursor: 'pointer'
              }}
              title={`Sao chép mã SHA-256: ${shaHash}`}
            >
              {copiedHash ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copiedHash ? 'Đã sao chép' : 'Mã SHA-256'}</span>
            </button>
          )}

          <a
            href={downloadUrl}
            download={fileName}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              background: '#A31A1A',
              color: '#FFFFFF',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(163,26,26,0.3)'
            }}
          >
            <Download size={14} />
            <span>Tải về máy</span>
          </a>
        </div>
      </header>

      {/* 2. MAIN VIEWER VIEWPORT */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#0F172A',
          position: 'relative'
        }}
      >
        {loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
            <Loader2 size={36} className="animate-spin text-blue-400" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Đang chuẩn bị hiển thị học liệu...</h3>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>Hệ thống đang nạp dữ liệu an toàn từ Intranet T04</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#EF4444' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Không thể hiển thị tài liệu</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '420px', margin: '0 0 20px', lineHeight: 1.5 }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{ padding: '8px 18px', background: '#334155', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Quay lại môn học
              </button>
              <a
                href={downloadUrl}
                download
                style={{ padding: '8px 18px', background: '#A31A1A', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
              >
                Thử tải trực tiếp
              </a>
            </div>
          </div>
        )}

        {!loading && !error && file && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <UniversalVideoPlayer
                  src={streamUrl}
                  fileName={fileName}
                  className="video-player-frame"
                  style={{ maxHeight: 'calc(100vh - 90px)', maxWidth: '100%', width: '100%' }}
                />
              </div>
            )}

            {/* IMAGE VIEWER */}
            {viewerKind === 'image' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <img
                  src={streamUrl}
                  alt={fileName}
                  style={{ maxHeight: 'calc(100vh - 110px)', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
                />
              </div>
            )}

            {/* AUDIO PLAYER */}
            {viewerKind === 'audio' && (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Music size={32} color="#FBBF24" />
                </div>
                <h3 style={{ fontSize: '17px', color: '#fff', margin: '0 0 8px' }}>{fileName}</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px' }}>Bản ghi âm bài giảng lưu hành nội bộ T04</p>
                <audio controls autoPlay src={streamUrl} style={{ width: '380px' }} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. BOTTOM SECURITY STRIP */}
      <footer
        style={{
          height: '28px',
          background: '#0B1E36',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={12} color="#A31A1A" />
          <span>Tài liệu nghiệp vụ CAND - Nghiêm cấm sao chép, trích xuất ra ngoài mạng nội bộ T04</span>
        </div>
        <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
          Hệ thống Quản lý Học liệu Số T04
        </div>
      </footer>
    </div>
  );
}
