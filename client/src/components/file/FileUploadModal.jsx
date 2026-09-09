import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

export default function FileUploadModal({ isOpen, onClose, onUploaded, lectures = [] }) {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [classificationId, setClassificationId] = useState('2'); // Default INTERNAL
  const [changeNote, setChangeNote] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
      setSuccessInfo(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn tập tin để tải lên.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessInfo(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fileService.uploadFile(
        formData,
        currentUser.id,
        Number(classificationId),
        changeNote.trim() || 'Tải lên học liệu mới',
        selectedLectureId ? Number(selectedLectureId) : null
      );

      setSuccessInfo(res);
      setSelectedFile(null);
      setChangeNote('');
      if (onUploaded) onUploaded();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi tải lên máy chủ.');
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setErrorMsg('');
    setSuccessInfo(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Tải lên Học liệu Số vào Kho lưu trữ Private" maxWidth="max-w-xl">
      <form onSubmit={handleUpload} className="space-y-4 text-xs">
        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-red-50/20 transition-all"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.mp4,.mov,.jpg,.jpeg,.png,.svg,.doc,.docx,.ppt,.pptx,.wav"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Tập tin'}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-700">Nhấp để chọn file hoặc kéo thả vào đây</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hỗ trợ: PDF, Video MP4, Ảnh JPG/PNG/SVG, Audio WAV, Văn bản DOCX
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Classification Level Selector (Section 13) */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Cấp độ Bảo mật Học liệu (Classification Level - Section 13) <span className="text-red-500">*</span>
          </label>
          <select
            value={classificationId}
            onChange={(e) => setClassificationId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white"
          >
            <option value="1">Cấp độ 1: NORMAL (Công khai nội bộ)</option>
            <option value="2">Cấp độ 2: INTERNAL (Lưu hành nội bộ học viện)</option>
            <option value="3">Cấp độ 3: CONFIDENTIAL (Mật nghiệp vụ - Bậc 3)</option>
            <option value="4">Cấp độ 4: SECRET (Tối mật nghiệp vụ - Bậc 4)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Quy tắc: Học viên có Clearance thấp hơn cấp độ này sẽ bị hệ thống từ chối truy cập (Section 37).
          </p>
        </div>

        {/* Attach to Lecture (Optional) */}
        {lectures.length > 0 && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Gán trực tiếp vào Bài giảng điện tử (Tùy chọn)
            </label>
            <select
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs bg-white"
            >
              <option value="">-- Không gán (Chỉ lưu trong kho học liệu chung) --</option>
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.subjectCode} - {l.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Version Change Note */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Ghi chú phát hành phiên bản (Change Note - Section 20, 44)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Cập nhật tài liệu số hóa năm học 2026..."
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 text-xs"
          />
        </div>

        {/* Alerts & Feedback */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold">Đăng tải học liệu thành công!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 truncate">
                Mã băm SHA-256: <code className="font-mono">{successInfo.checksumSha256}</code>
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Tập tin đã được lưu trữ vật lý an toàn vào đường dẫn phân cấp theo ngày.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={resetAndClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              uploading || !selectedFile
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
            }`}
          >
            {uploading ? 'Đang tính SHA-256 & Lưu trữ...' : 'Bắt đầu Tải lên'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
