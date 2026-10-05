import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Info,
  Maximize2,
  Minimize2,
  X,
  Hash,
  Clock,
  UserCheck,
  HardDrive,
  FileCheck2,
  ExternalLink
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
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

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
        console.warn('Không tìm thấy từ /api/media, đang thử nạp qua API training...', err?.message);
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

  // Phím tắt bàn phím: Esc (quay lại), i (bật/tắt thông tin), f (toàn màn hình)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') {
        if (showInfoSidebar) {
          setShowInfoSidebar(false);
        } else {
          handleBack();
        }
      } else if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        setShowInfoSidebar((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInfoSidebar]);

  // Lắng nghe thay đổi toàn màn hình
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

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
  const fileClassification = file?.classification || file?.classificationName || 'Lưu hành nội bộ';
  const shaHash = file?.checksumSha256 || file?.checksum || file?.sha256Hash || 'N/A';
  const uploader = file?.uploaderName || file?.uploadedByName || 'Cán bộ quản trị T04';
  const createdAtFormatted = file?.createdAt ? new Date(file.createdAt).toLocaleString('vi-VN') : 'Mới cập nhật';

  const formatBadgeLabel = () => {
    switch (viewerKind) {
      case 'excel':
        return 'BẢNG TÍNH EXCEL';
      case 'word':
        return 'VĂN BẢN WORD';
      case 'pdf':
        return 'TÀI LIỆU PDF';
      case 'slide':
        return 'BÀI GIẢNG POWERPOINT';
      case 'text':
        return 'VĂN BẢN THUẦN (TXT/SRC)';
      case 'video':
        return 'VIDEO BÀI GIẢNG';
      case 'image':
        return 'HÌNH ẢNH MINH HỌA';
      case 'audio':
        return 'BẢN GHI ÂM BÀI GIẢNG';
      case 'archive':
        return 'TỆP NÉN HỒ SƠ';
      default:
        return (file?.fileType || 'TẬP TIN').toUpperCase();
    }
  };

  const getFormatIcon = () => {
    switch (viewerKind) {
      case 'excel':
        return <FileSpreadsheet size={20} color="#10B981" />;
      case 'word':
        return <FileText size={20} color="#38BDF8" />;
      case 'pdf':
        return <FileText size={20} color="#EF4444" />;
      case 'text':
        return <FileCode size={20} color="#93C5FD" />;
      case 'slide':
        return <Presentation size={20} color="#FBBF24" />;
      case 'archive':
        return <Archive size={20} color="#C084FC" />;
      case 'video':
        return <Video size={20} color="#60A5FA" />;
      case 'image':
        return <ImageIcon size={20} color="#34D399" />;
      case 'audio':
        return <Music size={20} color="#FBBF24" />;
      default:
        return <FileQuestion size={20} color="#94A3B8" />;
    }
  };

  const getClassificationBadgeStyle = () => {
    const text = fileClassification.toLowerCase();
    if (text.includes('tuyệt mật')) {
      return {
        background: 'linear-gradient(135deg, #7F1D1D, #991B1B)',
        color: '#FEE2E2',
        border: '1px solid #B91C1C',
        icon: <ShieldAlert size={12} color="#FCA5A5" />
      };
    }
    if (text.includes('tối mật')) {
      return {
        background: 'linear-gradient(135deg, #9A3412, #C2410C)',
        color: '#FFEDD5',
        border: '1px solid #EA580C',
        icon: <ShieldAlert size={12} color="#FDBA74" />
      };
    }
    if (text.includes('mật')) {
      return {
        background: 'linear-gradient(135deg, #B45309, #D97706)',
        color: '#FEF3C7',
        border: '1px solid #F59E0B',
        icon: <Shield size={12} color="#FCD34D" />
      };
    }
    if (text.includes('công khai')) {
      return {
        background: 'linear-gradient(135deg, #065F46, #059669)',
        color: '#D1FAE5',
        border: '1px solid #10B981',
        icon: <ShieldCheck size={12} color="#6EE7B7" />
      };
    }
    // Mặc định: Lưu hành nội bộ T04
    return {
      background: 'linear-gradient(135deg, #1E3A8A, #1D4ED8)',
      color: '#DBEAFE',
      border: '1px solid #3B82F6',
      icon: <ShieldCheck size={12} color="#93C5FD" />
    };
  };

  const classificationStyle = getClassificationBadgeStyle();

  return (
    <div
      ref={containerRef}
      className="document-viewer-page"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B1E36',
        color: '#FFFFFF',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
        zIndex: 9999
      }}
    >
      {/* 1. TOP HEADER BAR: TRANG NHÃ, RÕ RÀNG, CHUẨN AN NINH NHÂN DÂN */}
      <header
        style={{
          height: '62px',
          background: 'rgba(11, 30, 54, 0.98)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212, 168, 67, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          gap: '16px',
          flexShrink: 0,
          zIndex: 30
        }}
      >
        {/* Left: Back button & Breadcrumb Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.borderColor = '#D4A843';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
            }}
            title="Đóng chế độ xem và quay lại trang trước (Esc)"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 5px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                color: '#94A3B8',
                fontFamily: 'monospace'
              }}
            >
              ESC
            </span>
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {getFormatIcon()}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <h1
                  title={fileName}
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '520px',
                    letterSpacing: '-0.2px'
                  }}
                >
                  {fileName}
                </h1>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    background: classificationStyle.background,
                    color: classificationStyle.color,
                    border: classificationStyle.border,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px'
                  }}
                >
                  {classificationStyle.icon}
                  {fileClassification}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: '#94A3B8'
                }}
              >
                <span style={{ color: '#D4A843', fontWeight: 600 }}>{formatBadgeLabel()}</span>
                {file?.fileSize && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(file.fileSize)}</span>
                  </>
                )}
                <span>•</span>
                <span>Học liệu số ĐH An ninh Nhân dân</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Nút thông tin chi tiết */}
          <button
            type="button"
            onClick={() => setShowInfoSidebar((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '7px',
              background: showInfoSidebar ? '#D4A843' : 'rgba(255, 255, 255, 0.08)',
              color: showInfoSidebar ? '#0B1E36' : '#E2E8F0',
              border: showInfoSidebar ? '1px solid #D4A843' : '1px solid rgba(255, 255, 255, 0.14)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Xem hồ sơ chi tiết tệp, mã băm & người nạp (Phím I)"
          >
            <Info size={15} />
            <span className="hidden sm:inline">Hồ sơ tệp</span>
          </button>

          {/* Nút sao chép mã SHA-256 */}
          {shaHash && shaHash !== 'N/A' && (
            <button
              type="button"
              onClick={() => copyChecksum(shaHash)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '7px',
                background: copiedHash ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: copiedHash ? '#34D399' : '#E2E8F0',
                border: copiedHash ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.14)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`Sao chép mã SHA-256: ${shaHash}`}
            >
              {copiedHash ? <Check size={14} color="#34D399" /> : <Hash size={14} color="#D4A843" />}
              <span className="hidden md:inline">{copiedHash ? 'Đã sao chép SHA' : 'Mã SHA-256'}</span>
            </button>
          )}

          {/* Nút Toàn màn hình */}
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '7px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#E2E8F0',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={isFullscreen ? 'Thu nhỏ toàn màn hình' : 'Mở toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Nút Tải về máy */}
          <a
            href={downloadUrl}
            download={fileName}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
              color: '#FFFFFF',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(185, 28, 28, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)';
            }}
          >
            <Download size={15} />
            <span>Tải về máy</span>
          </a>
        </div>
      </header>

      {/* 2. MAIN VIEWER VIEWPORT & COLLAPSIBLE SIDEBAR */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#0B132B',
            position: 'relative'
          }}
        >
          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
              <Loader2 size={42} className="animate-spin text-blue-400" style={{ marginBottom: '16px', color: '#38BDF8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Đang chuẩn bị hiển thị học liệu...</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px' }}>Hệ thống đang nạp dữ liệu an toàn từ Intranet T04</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', color: '#EF4444' }}>
                <AlertCircle size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>Không thể hiển thị tài liệu</h3>
              <p style={{ fontSize: '13.5px', color: '#94A3B8', maxWidth: '460px', margin: '0 0 24px', lineHeight: 1.6 }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  style={{ padding: '9px 20px', background: '#1E293B', color: '#fff', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Quay lại trang trước
                </button>
                <a
                  href={downloadUrl}
                  download
                  style={{ padding: '9px 20px', background: '#A31A1A', color: '#fff', borderRadius: '7px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
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

              {/* PDF VIEWER: TOÀN BỘ CHIỀU CAO VỚI BỘ ĐỌC CAO CẤP */}
              {viewerKind === 'pdf' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', padding: '16px' }}>
                  <UniversalVideoPlayer
                    src={streamUrl}
                    fileName={fileName}
                    className="video-player-frame"
                    style={{ maxHeight: 'calc(100vh - 120px)', maxWidth: '100%', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', borderRadius: '8px' }}
                  />
                </div>
              )}

              {/* IMAGE VIEWER */}
              {viewerKind === 'image' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#020617' }}>
                  <img
                    src={streamUrl}
                    alt={fileName}
                    style={{ maxHeight: 'calc(100vh - 130px)', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              )}

              {/* AUDIO PLAYER */}
              {viewerKind === 'audio' && (
                <div style={{ margin: 'auto', textAlign: 'center', padding: '40px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', maxWidth: '480px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Music size={36} color="#FBBF24" />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{fileName}</h3>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 24px' }}>Bản ghi âm bài giảng lưu hành nội bộ T04</p>
                  <audio controls autoPlay src={streamUrl} style={{ width: '100%' }} />
                </div>
              )}
            </div>
          )}
        </main>

        {/* 2b. COLLAPSIBLE INFO SIDEBAR DRAWER (HỒ SƠ HỌC LIỆU SỐ) */}
        {showInfoSidebar && (
          <aside
            style={{
              width: '360px',
              maxWidth: '85vw',
              background: '#0B1E36',
              borderLeft: '1px solid rgba(212, 168, 67, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
              zIndex: 25,
              animation: 'slideInRight 0.2s ease-out'
            }}
          >
            {/* Sidebar Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={18} color="#D4A843" />
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '0.2px' }}>
                  Hồ sơ học liệu số
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoSidebar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                title="Đóng bảng thông tin"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Box 1: Định danh học liệu */}
              <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  1. Định danh học liệu
                </span>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Tên tệp gốc:</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', wordBreak: 'break-all', marginTop: '2px' }}>
                    {fileName}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Mã lưu trữ:</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                      #{fileId}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Dung lượng:</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                      {formatFileSize(file?.fileSize)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Độ mật & Cấp độ kiểm soát */}
              <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  2. Cấp độ bảo mật
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Phân loại an ninh:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      background: classificationStyle.background,
                      color: classificationStyle.color,
                      border: classificationStyle.border
                    }}
                  >
                    {classificationStyle.icon}
                    {fileClassification}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '6px', lineHeight: 1.5 }}>
                  Tài liệu nghiệp vụ thuộc quản lý của Trường Đại học An ninh Nhân dân, chỉ phục vụ công tác giảng dạy và học tập nội bộ.
                </div>
              </div>

              {/* Box 3: Tính toàn vẹn SHA-256 */}
              <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    3. Mã băm toàn vẹn SHA-256
                  </span>
                  <button
                    type="button"
                    onClick={() => copyChecksum(shaHash)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      background: 'none',
                      border: 'none',
                      color: copiedHash ? '#34D399' : '#D4A843',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                    {copiedHash ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#93C5FD',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    wordBreak: 'break-all',
                    lineHeight: 1.4,
                    border: '1px solid rgba(147, 197, 253, 0.2)'
                  }}
                >
                  {shaHash}
                </div>
              </div>

              {/* Box 4: Xuất xứ & Cán bộ phụ trách */}
              <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  4. Quản lý & Cập nhật
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <UserCheck size={14} color="#60A5FA" />
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Cán bộ tải lên:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>{uploader}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="#60A5FA" />
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Thời điểm nạp:</span>
                  <span style={{ fontSize: '12px', color: '#CBD5E1' }}>{createdAtFormatted}</span>
                </div>
              </div>

              {/* Box 5: Cảnh báo an ninh */}
              <div
                style={{
                  background: 'rgba(163, 26, 26, 0.12)',
                  border: '1px solid rgba(163, 26, 26, 0.35)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  gap: '10px',
                  fontSize: '11.5px',
                  color: '#FECACA',
                  lineHeight: 1.5
                }}
              >
                <ShieldAlert size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Nghiêm cấm chia sẻ, sao chép hoặc phát tán học liệu này ra ngoài hạ tầng mạng nội bộ CAND mà không có sự phê duyệt của Ban Giám hiệu.
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM SECURITY FOOTER STRIP */}
      <footer
        style={{
          height: '30px',
          background: 'rgba(11, 30, 54, 0.98)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.55)',
          flexShrink: 0,
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={12} color="#D4A843" />
          <span>Học liệu số Đại học An ninh Nhân dân • Lưu hành và khai thác nội bộ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className="hidden sm:inline">Phím tắt: [ESC] Quay lại • [I] Hồ sơ tệp • [F] Toàn màn hình</span>
          <span style={{ fontFamily: 'monospace', color: '#D4A843' }}>DHAN SEC-SECURE</span>
        </div>
      </footer>
    </div>
  );
}
