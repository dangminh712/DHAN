import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Video,
  Image as ImageIcon,
  Presentation,
  Music,
  CheckCircle2,
  Shield,
  AlertCircle,
  HardDrive,
  Copy,
  Check,
  FileCode,
  Folder,
  FolderOpen
} from 'lucide-react';
import Modal from '../common/Modal';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

export default function FileUploadModal({ isOpen, onClose, onUploaded, lectures = [], currentUser: propUser }) {
  let contextUser = null;
  try {
    const auth = useAuth();
    contextUser = auth?.currentUser;
  } catch (e) {
    // context not provided
  }
  const currentUser = propUser || contextUser || { id: 1, username: 'admin' };
  const [selectedFile, setSelectedFile] = useState(null);
  const [classificationId, setClassificationId] = useState('2'); // Default INTERNAL
  const [targetFolder, setTargetFolder] = useState(''); // Default auto
  const [storageFolders, setStorageFolders] = useState([]);
  const [changeNote, setChangeNote] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [copiedSha, setCopiedSha] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fileService.getFolders()
        .then((res) => {
          if (Array.isArray(res)) setStorageFolders(res);
          else if (res?.folders) setStorageFolders(res.folders);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
      setSuccessInfo(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg('');
      setSuccessInfo(null);
    }
  };

  const getFileCategoryIcon = (fileName) => {
    if (!fileName) return <FileText className="w-8 h-8 text-slate-500" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="w-8 h-8 text-red-600" />;
    if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)) return <Video className="w-8 h-8 text-sky-600" />;
    if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(ext)) return <ImageIcon className="w-8 h-8 text-emerald-600" />;
    if (['ppt', 'pptx'].includes(ext)) return <Presentation className="w-8 h-8 text-amber-600" />;
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return <Music className="w-8 h-8 text-purple-600" />;
    return <FileCode className="w-8 h-8 text-indigo-600" />;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn hoặc kéo thả tập tin để tải lên.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessInfo(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', currentUser?.id || 1);
    formData.append('classificationLevelId', Number(classificationId));
    formData.append('changeNote', changeNote.trim() || 'Nhập liệu học liệu lưu trữ nội bộ');
    if (selectedLectureId) {
      formData.append('lectureId', Number(selectedLectureId));
    }
    if (targetFolder) {
      formData.append('categoryFolder', targetFolder);
    }

    try {
      const res = await fileService.uploadFile(
        formData,
        currentUser?.id || 1,
        Number(classificationId),
        changeNote.trim() || 'Nhập liệu học liệu lưu trữ nội bộ',
        selectedLectureId ? Number(selectedLectureId) : null,
        targetFolder || null
      );

      setSuccessInfo(res);
      setSelectedFile(null);
      setChangeNote('');
      if (onUploaded) onUploaded();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi tải lên và lưu trữ máy chủ.');
    } finally {
      setUploading(false);
    }
  };

  const copyShaToClipboard = (sha) => {
    if (!sha) return;
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setErrorMsg('');
    setSuccessInfo(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Nhập liệu & Đăng tải Học liệu Lưu trữ Nội bộ" maxWidth="max-w-2xl">
      <form onSubmit={handleUpload} className="space-y-4 text-xs">
        {/* Supported Formats Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 rounded-lg border border-slate-200">
          <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-red-600" /> Hỗ trợ định dạng:
          </span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-semibold rounded text-[10px] flex items-center gap-1">
            📄 PDF Giáo trình
          </span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded text-[10px] flex items-center gap-1">
            📊 Slide PPT/PPTX
          </span>
          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-semibold rounded text-[10px] flex items-center gap-1">
            🎞️ Video MP4/MOV
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px] flex items-center gap-1">
            🖼️ Ảnh PNG/JPG/SVG
          </span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-semibold rounded text-[10px] flex items-center gap-1">
            🎵 Audio MP3/WAV
          </span>
        </div>

        {/* Dropzone Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-red-500 bg-red-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-red-500 bg-slate-50/70 hover:bg-red-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.ppt,.pptx,.mp4,.mov,.mkv,.webm,.avi,.jpg,.jpeg,.png,.svg,.webp,.gif,.mp3,.wav,.doc,.docx"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                {getFileCategoryIcon(selectedFile.name)}
              </div>
              <div className="text-left space-y-1">
                <p className="font-bold text-slate-800 text-sm">{selectedFile.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-medium bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span>Định dạng: {selectedFile.type || selectedFile.name.split('.').pop().toUpperCase()}</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng tính toán SHA-256 & lưu vào private storage
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Nhấp để chọn tập tin từ máy tính hoặc kéo & thả vào đây
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống tự động băm SHA-256, lưu vật lý phân cấp theo ngày <code className="text-red-700 font-mono">Storage/YYYY/MM/DD</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Target Storage Folder Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-red-600" />
              Thư mục lưu trữ hệ thống <span className="text-red-500">*</span>
            </label>
            <select
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-semibold text-slate-800"
            >
              <option value="">📁 Tự động phân loại theo định dạng file (Mặc định)</option>
              <option value="Videos">🎥 Thư mục Videos (Video bài giảng / thực hành)</option>
              <option value="PDFs">📄 Thư mục PDFs (Giáo trình / Tài liệu PDF)</option>
              <option value="Slides_PPT">📊 Thư mục Slides_PPT (Slide trình chiếu PPT / SVG)</option>
              <option value="Audios">🎵 Thư mục Audios (File ghi âm / Âm thanh nghiệp vụ)</option>
              <option value="Images">🖼️ Thư mục Images (Sơ đồ / Bản đồ / Ảnh hiện trường)</option>
              <option value="Documents">📑 Thư mục Documents (Biểu mẫu / Văn bản Word / Excel)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-red-600" />
              Cấp độ Bảo mật Học liệu <span className="text-red-500">*</span>
            </label>
            <select
              value={classificationId}
              onChange={(e) => setClassificationId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
            >
              <option value="1">Cấp 1: NORMAL (Công khai nội bộ học viện)</option>
              <option value="2">Cấp 2: INTERNAL (Lưu hành nội bộ học phần)</option>
              <option value="3">Cấp 3: CONFIDENTIAL (Tài liệu Mật nghiệp vụ)</option>
              <option value="4">Cấp 4: SECRET (Tối mật nghiệp vụ điều tra)</option>
            </select>
          </div>
        </div>

        {/* Real-time Storage Folders Status Pill Group */}
        {storageFolders.length > 0 && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-red-600" /> Cấu trúc Thư mục Lưu trữ Máy chủ (Server Storage):
              </span>
              <span className="text-slate-400 text-[10px]">Cập nhật thời gian thực</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[10px]">
              <div
                onClick={() => setTargetFolder('')}
                className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                  !targetFolder
                    ? 'bg-red-50 border-red-500 text-red-700 font-bold shadow-sm ring-1 ring-red-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold truncate">⚡ Tự động (Default)</p>
                <p className="text-slate-500 text-[9px] mt-0.5">Theo định dạng</p>
              </div>
              {storageFolders.map((f) => {
                const folderKey = f.folderId || f.name;
                const displayName = f.name || f.displayName || folderKey;
                const sizeText = f.totalSizeFormatted || f.formattedSize || '0 B';
                return (
                  <div
                    key={folderKey}
                    onClick={() => setTargetFolder(folderKey)}
                    className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                      targetFolder === folderKey
                        ? 'bg-red-50 border-red-500 text-red-700 font-bold shadow-sm ring-1 ring-red-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold truncate">{displayName}</p>
                    <p className="text-slate-500 text-[9px] mt-0.5">{f.fileCount} tệp • {sizeText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attach to Lecture & Change Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Gán trực tiếp vào Bài giảng điện tử (Tùy chọn)
            </label>
            <select
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white font-medium"
            >
              <option value="">-- Kho tài liệu chung (Không gán bài giảng) --</option>
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.subjectCode} - {l.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú phát hành & Phiên bản (Change Note)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Tài liệu bổ sung chuyên đề thực hành điều tra hình sự..."
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white"
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Card with Physical Storage & SHA-256 Details */}
        {successInfo && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2.5 text-emerald-900 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-sm">Đã nạp học liệu thành công vào máy tính cục bộ!</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 font-bold rounded text-[10px]">
                ID: #{successInfo.fileId} • {successInfo.fileType}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-3 border border-emerald-200 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tên tệp gốc:</span>
                <span className="font-bold text-slate-800">{successInfo.originalName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Vị trí lưu trữ vật lý:</span>
                <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                  {successInfo.storagePath || 'server/Storage/YYYY/MM/DD/...'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 shrink-0">Mã băm SHA-256:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <code className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 truncate max-w-[280px]">
                    {successInfo.checksumSha256}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyShaToClipboard(successInfo.checksumSha256)}
                    className="p-1 text-slate-500 hover:text-emerald-700 transition-colors"
                    title="Sao chép SHA-256"
                  >
                    {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-800 flex items-center gap-1">
              ✓ File đã được ghi nhận trong bảng MySQL <code className="font-mono bg-emerald-100 px-1 rounded">files</code> và kho học liệu trực tuyến.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={resetAndClose}
            className="btn-action-secondary"
            style={{ padding: '8px 18px', fontSize: '12.5px' }}
          >
            {successInfo ? 'Hoàn tất' : 'Hủy bỏ'}
          </button>

          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="btn-action-primary"
            style={{
              padding: '8px 20px',
              fontSize: '12.5px',
              opacity: uploading || !selectedFile ? 0.6 : 1,
              cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent' }}></span>
                <span>Đang tính SHA-256 & Lưu trữ cục bộ...</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Bắt đầu Nạp & Lưu trữ Học liệu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
