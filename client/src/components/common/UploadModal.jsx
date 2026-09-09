import React, { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, uploading, uploadProgress, onUpload }) {
  const fileInputRef = useRef(null);
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => !uploading && onClose()}>
      <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <UploadCloud size={20} color="#FEF08A" />
            <h3>ĐĂNG TẢI BÀI GIẢNG VÀ HỌC LIỆU SỐ</h3>
          </div>
          <button
            className="modal-close-btn"
            disabled={uploading}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
            Hỗ trợ đăng tải các tập tin bài giảng: <strong>Video MP4, Giáo trình PDF, Slide PPTX, Giáo án DOCX, File ghi âm MP3</strong>.
            Dung lượng tối đa lên đến <strong>1 GB</strong> mỗi tập tin. Tự động mã băm SHA-256 và lưu trữ phân thư mục ngày tháng.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => onUpload(e.target.files)}
        />

        <div
          className="upload-dropzone"
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!uploading && e.dataTransfer.files) {
              onUpload(e.dataTransfer.files);
            }
          }}
        >
          <UploadCloud className="upload-cloud-icon" />
          <div className="upload-title">
            {uploading ? 'Đang truyền dữ liệu lên máy chủ...' : 'Nhấp để chọn tập tin hoặc Kéo thả bài giảng vào đây'}
          </div>
          <div className="upload-hint">
            Hệ thống tự động tính toán mã băm SHA-256 xác thực bản quyền tập tin
          </div>
        </div>

        {uploading && (
          <div className="upload-progress-box">
            <div className="progress-info">
              <span>Tiến độ tải lên máy chủ:</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn-icon-secondary"
            disabled={uploading}
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            className="btn-upload-primary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={16} />
            Chọn tập tin
          </button>
        </div>
      </div>
    </div>
  );
}
