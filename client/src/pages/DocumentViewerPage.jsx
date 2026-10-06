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
  Award,
  Lock,
  CheckCircle2,
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
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen();
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
  const todayStr = new Date().toLocaleDateString('vi-VN');

  const getFormatBadge = () => {
    switch (viewerKind) {
      case 'excel':
        return { label: 'BẢNG TÍNH EXCEL', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', icon: <FileSpreadsheet size={20} color="#059669" /> };
      case 'word':
        return { label: 'VĂN BẢN WORD', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD', icon: <FileText size={20} color="#0284C7" /> };
      case 'pdf':
        return { label: 'TÀI LIỆU PDF', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', icon: <FileText size={20} color="#DC2626" /> };
      case 'slide':
        return { label: 'BÀI GIẢNG POWERPOINT', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', icon: <Presentation size={20} color="#D97706" /> };
      case 'text':
        return { label: 'VĂN BẢN THUẦN (TXT/SRC)', bg: '#F8FAFC', color: '#475569', border: '#CBD5E1', icon: <FileCode size={20} color="#475569" /> };
      case 'video':
        return { label: 'VIDEO BÀI GIẢNG', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: <Video size={20} color="#2563EB" /> };
      case 'image':
        return { label: 'HÌNH ẢNH MINH HỌA / CHỨNG CỨ', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', icon: <ImageIcon size={20} color="#16A34A" /> };
      case 'audio':
        return { label: 'BẢN GHI ÂM BÀI GIẢNG', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', icon: <Music size={20} color="#B45309" /> };
      case 'archive':
        return { label: 'TỆP NÉN HỒ SƠ', bg: '#FAF5FF', color: '#9333EA', border: '#E9D5FF', icon: <Archive size={20} color="#9333EA" /> };
      default:
        return { label: (file?.fileType || 'TẬP TIN').toUpperCase(), bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', icon: <FileQuestion size={20} color="#475569" /> };
    }
  };

  const formatMeta = getFormatBadge();

  const getClassificationBadgeStyle = () => {
    const text = fileClassification.toLowerCase();
    if (text.includes('tuyệt mật')) {
      return {
        levelName: 'TUYỆT MẬT - ĐỘ 4',
        background: '#FEF2F2',
        color: '#991B1B',
        border: '1px solid #F87171',
        icon: <ShieldAlert size={12} color="#DC2626" />
      };
    }
    if (text.includes('tối mật')) {
      return {
        levelName: 'TỐI MẬT - ĐỘ 3',
        background: '#FFF7ED',
        color: '#9A3412',
        border: '1px solid #FB923C',
        icon: <ShieldAlert size={12} color="#EA580C" />
      };
    }
    if (text.includes('mật')) {
      return {
        levelName: 'MẬT - ĐỘ 2',
        background: '#FEFCE8',
        color: '#854D0E',
        border: '1px solid #FACC15',
        icon: <Shield size={12} color="#D97706" />
      };
    }
    if (text.includes('công khai')) {
      return {
        levelName: 'CÔNG KHAI - ĐỘ 1',
        background: '#ECFDF5',
        color: '#065F46',
        border: '1px solid #6EE7B7',
        icon: <ShieldCheck size={12} color="#059669" />
      };
    }
    // Mặc định: Lưu hành nội bộ T04
    return {
      levelName: 'LƯU HÀNH NỘI BỘ T04',
      background: '#EFF6FF',
      color: '#1E40AF',
      border: '1px solid #93C5FD',
      icon: <ShieldCheck size={12} color="#2563EB" />
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
        background: '#F8FAFC',
        color: '#0F172A',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
      }}
    >
      {/* 1. TOP HEADER BAR: LÔI CUỐN, TƯƠI SÁNG, CHUẨN AN NINH NHÂN DÂN (BESPOKE EXECUTIVE COMMAND HEADER) */}
      <header
        style={{
          height: '66px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: '2px solid #D4A843',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.07)',
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
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1.5px solid #94A3B8',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E2E8F0';
              e.currentTarget.style.borderColor = '#64748B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            title="Đóng chế độ xem và quay lại trang trước (Esc)"
          >
            <ArrowLeft size={16} strokeWidth={2.2} />
            <span>Quay lại</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 5px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                color: '#64748B',
                fontFamily: 'monospace',
                fontWeight: 700
              }}
            >
              ESC
            </span>
          </button>

          <div style={{ width: '1px', height: '28px', background: '#E2E8F0', flexShrink: 0 }} />

          {/* Document Format Icon & Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: formatMeta.bg,
                border: `1px solid ${formatMeta.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              {formatMeta.icon}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <h1
                  title={fileName}
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0F172A',
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

                {/* Security Clearance Pill */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: classificationStyle.background,
                    color: classificationStyle.color,
                    border: classificationStyle.border,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
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
                  fontSize: '12px',
                  color: '#64748B'
                }}
              >
                <span style={{ color: '#B45309', fontWeight: 700 }}>{formatMeta.label}</span>
                {file?.fileSize && (
                  <>
                    <span>•</span>
                    <span style={{ fontWeight: 600 }}>{formatFileSize(file.fileSize)}</span>
                  </>
                )}
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0F172A', fontWeight: 600 }}>
                  <Award size={13} color="#D4A843" />
                  Đại học An ninh Nhân dân (T04)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions Toolbar (NO "Mở tab mới" - All Actions SPA-Native) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Nút xem hồ sơ học liệu */}
          <button
            type="button"
            onClick={() => setShowInfoSidebar((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '8px',
              background: showInfoSidebar ? '#FEF3C7' : '#F1F5F9',
              color: showInfoSidebar ? '#92400E' : '#0F172A',
              border: showInfoSidebar ? '1.5px solid #F59E0B' : '1.5px solid #CBD5E1',
              boxShadow: showInfoSidebar ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Xem hồ sơ chi tiết tệp, mã băm & người nạp (Phím I)"
          >
            <Info size={15} color={showInfoSidebar ? '#D97706' : '#2563EB'} />
            <span className="hidden sm:inline">Hồ sơ tệp</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                background: showInfoSidebar ? '#FDE68A' : '#E2E8F0',
                borderRadius: '4px',
                color: showInfoSidebar ? '#78350F' : '#475569',
                fontFamily: 'monospace',
                fontWeight: 700
              }}
            >
              I
            </span>
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
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                background: copiedHash ? '#ECFDF5' : '#F1F5F9',
                color: copiedHash ? '#065F46' : '#0F172A',
                border: copiedHash ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`Sao chép mã SHA-256 toàn vẹn: ${shaHash}`}
            >
              {copiedHash ? <Check size={14} color="#059669" /> : <Hash size={14} color="#B45309" />}
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
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Mở toàn màn hình (Phím F)'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Nút Tải về máy (Được bảo vệ theo quyền) */}
          <a
            href={downloadUrl}
            download={fileName}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
              color: '#FFFFFF',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(185, 28, 28, 0.3)',
              border: '1px solid #7F1D1D',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)';
            }}
            title="Tải tệp học liệu an toàn về máy tính"
          >
            <Download size={15} strokeWidth={2.4} />
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
            background: '#E2E8F0',
            position: 'relative'
          }}
        >

          {/* LOADING STATE */}
          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Loader2 size={36} className="animate-spin text-blue-600" style={{ color: '#2563EB' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Đang chuẩn bị hiển thị học liệu...</h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Hệ thống nạp trực tiếp luồng dữ liệu an toàn từ Intranet T04</p>
            </div>
          )}

          {/* ERROR STATE */}
          {error && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '20px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', color: '#DC2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)' }}>
                <AlertCircle size={36} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Không thể hiển thị tài liệu trực tiếp</h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '460px', margin: '0 0 24px', lineHeight: 1.6 }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  style={{ padding: '9px 20px', background: '#FFFFFF', color: '#1E293B', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  Quay lại trang trước
                </button>
                <a
                  href={downloadUrl}
                  download
                  style={{ padding: '9px 20px', background: '#B91C1C', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 6px rgba(185, 28, 28, 0.25)' }}
                >
                  Thử tải tệp về máy
                </a>
              </div>
            </div>
          )}

          {/* CONTENT VIEWERS: INTEGRATED SUITE */}
          {!loading && !error && file && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
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

              {/* VIDEO PLAYER: KHUNG CHIẾU SÁNG SẮC NÉT */}
              {viewerKind === 'video' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', padding: '20px' }}>
                  <UniversalVideoPlayer
                    src={streamUrl}
                    fileName={fileName}
                    className="video-player-frame"
                    style={{
                      maxHeight: 'calc(100vh - 140px)',
                      maxWidth: '100%',
                      width: '100%',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                </div>
              )}

              {/* IMAGE VIEWER: KHUNG TRƯNG BÀY HỒ SƠ CHỨNG CỨ SÁNG ĐẸP */}
              {viewerKind === 'image' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#F1F5F9' }}>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '14px', boxShadow: '0 15px 35px rgba(15, 23, 42, 0.1)', border: '1px solid #E2E8F0', maxWidth: '92%', maxHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                      src={streamUrl}
                      alt={fileName}
                      style={{ maxHeight: 'calc(100vh - 200px)', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={14} color="#059669" />
                      <span>{fileName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO PLAYER: BẢN GHI ÂM LƯU HÀNH NỘI BỘ */}
              {viewerKind === 'audio' && (
                <div style={{ margin: 'auto', textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)' }}>
                  <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#FEF3C7', border: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#B45309' }}>
                    <Music size={38} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{fileName}</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px' }}>Bản ghi âm bài giảng lưu hành nội bộ Trường Đại học An ninh Nhân dân</p>
                  <audio controls autoPlay src={streamUrl} style={{ width: '100%' }} />
                </div>
              )}
            </div>
          )}
        </main>

        {/* 2b. COLLAPSIBLE INFO SIDEBAR DRAWER (HỒ SƠ HỌC LIỆU SỐ T04) */}
        {showInfoSidebar && (
          <aside
            style={{
              width: '370px',
              maxWidth: '85vw',
              background: '#FFFFFF',
              borderLeft: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.08)',
              zIndex: 25,
              animation: 'slideInRight 0.2s ease-out'
            }}
          >
            {/* Sidebar Header: Executive Navy Gradient */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #0B1E36 0%, #1E3A8A 100%)',
                color: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(212, 168, 67, 0.2)', border: '1px solid #D4A843', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} color="#FDE047" />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    Hồ sơ học liệu số
                  </h3>
                  <div style={{ fontSize: '11px', color: '#93C5FD' }}>Mã định danh: #{fileId}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoSidebar(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                title="Đóng bảng thông tin"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* BESPOKE RED DIGITAL SEAL (DẤU ĐỎ ĐIỆN TỬ KIỂM DUYỆT T04) */}
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '12px 18px',
                    borderRadius: '50%',
                    border: '3px double #DC2626',
                    color: '#DC2626',
                    background: 'rgba(220, 38, 38, 0.03)',
                    transform: 'rotate(-4deg)',
                    boxShadow: 'inset 0 0 12px rgba(220, 38, 38, 0.08)',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1.1 }}>
                    BỘ CÔNG AN
                  </div>
                  <div style={{ fontSize: '7.5px', fontWeight: 800, margin: '2px 0' }}>
                    ĐH AN NINH NHÂN DÂN
                  </div>
                  <div style={{ fontSize: '13px', margin: '1px 0' }}>★</div>
                  <div style={{ fontSize: '8.5px', fontWeight: 900, borderTop: '1px solid #DC2626', borderBottom: '1px solid #DC2626', padding: '1px 4px', textTransform: 'uppercase' }}>
                    KIỂM DUYỆT BẢO MẬT
                  </div>
                  <div style={{ fontSize: '7.5px', fontWeight: 800, marginTop: '2px' }}>
                    T04-SEC-#{fileId}
                  </div>
                </div>
              </div>

              {/* Box 1: Định danh học liệu */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  1. Định danh học liệu
                </span>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Tên tệp gốc:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', wordBreak: 'break-all', marginTop: '2px' }}>
                    {fileName}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Mã lưu trữ:</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                      #{fileId}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Dung lượng:</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                      {formatFileSize(file?.fileSize)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Độ mật & Cấp độ kiểm soát */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  2. Cấp độ bảo mật CAND
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Phân loại an ninh:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: classificationStyle.background,
                      color: classificationStyle.color,
                      border: classificationStyle.border
                    }}
                  >
                    {classificationStyle.icon}
                    {fileClassification}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '6px', lineHeight: 1.5 }}>
                  Học liệu nghiệp vụ chịu sự kiểm soát và quản lý của Trường Đại học An ninh Nhân dân, chỉ phục vụ giảng dạy và nghiên cứu nội bộ CAND.
                </div>
              </div>

              {/* Box 3: Tính toàn vẹn SHA-256 */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    3. Mã băm toàn vẹn SHA-256
                  </span>
                  <button
                    type="button"
                    onClick={() => copyChecksum(shaHash)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      background: 'none',
                      border: 'none',
                      color: copiedHash ? '#059669' : '#2563EB',
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
                    fontFamily: 'Consolas, monospace',
                    fontSize: '11px',
                    color: '#0F172A',
                    background: '#FFFFFF',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    lineHeight: 1.5,
                    border: '1px solid #CBD5E1',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  {shaHash}
                </div>
              </div>

              {/* Box 4: Xuất xứ & Cán bộ phụ trách */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  4. Quản lý & Cập nhật
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <UserCheck size={15} color="#2563EB" />
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Cán bộ tải lên:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{uploader}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="#2563EB" />
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Thời điểm nạp:</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{createdAtFormatted}</span>
                </div>
              </div>

              {/* Box 5: Cảnh báo an ninh */}
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '10px',
                  fontSize: '11.5px',
                  color: '#991B1B',
                  lineHeight: 1.5
                }}
              >
                <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Nghiêm cấm chia sẻ, sao chép hoặc phát tán học liệu này ra ngoài hạ tầng mạng nội bộ CAND khi chưa được sự phê duyệt của Ban Giám hiệu.
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM SECURITY FOOTER STRIP (TƯƠI SÁNG, TINH TẾ) */}
      <footer
        style={{
          height: '32px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          fontSize: '11.5px',
          color: '#64748B',
          flexShrink: 0,
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={13} color="#D4A843" />
          <span style={{ fontWeight: 600, color: '#334155' }}>Học liệu số Đại học An ninh Nhân dân</span>
          <span>•</span>
          <span>Hệ thống trình chiếu bảo mật nội bộ T04</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className="hidden sm:inline">Phím tắt: [ESC] Quay lại • [I] Hồ sơ • [F] Toàn màn hình</span>
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#059669',
              background: '#ECFDF5',
              padding: '1px 6px',
              borderRadius: '4px',
              border: '1px solid #A7F3D0'
            }}
          >
            T04-SEC-VERIFIED
          </span>
        </div>
      </footer>
    </div>
  );
}
