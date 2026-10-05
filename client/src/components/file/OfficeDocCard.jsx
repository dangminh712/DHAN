import React from 'react';
import {
  Presentation,
  Archive,
  FileQuestion,
  Download,
  Shield,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';

export default function OfficeDocCard({ file, fileName, downloadUrl, formatType }) {
  const isPpt = formatType === 'slide' || formatType === 'powerpoint';
  const isArchive = formatType === 'archive';
  const sizeMb = file.fileSize ? (file.fileSize / (1024 * 1024)).toFixed(2) : null;
  const sizeKb = file.fileSize ? Math.round(file.fileSize / 1024) : null;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[440px] text-center bg-slate-900 text-white w-full">
      {/* Icon */}
      <div
        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg border ${
          isPpt
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            : isArchive
            ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
            : 'bg-blue-500/15 border-blue-500/40 text-blue-400'
        }`}
      >
        {isPpt ? (
          <Presentation className="w-10 h-10" />
        ) : isArchive ? (
          <Archive className="w-10 h-10" />
        ) : (
          <FileQuestion className="w-10 h-10" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-white max-w-lg mb-2 leading-snug">
        {fileName}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {isPpt
          ? 'Tập tin bài trình chiếu PowerPoint (.pptx / .ppt) phục vụ giảng dạy và thuyết trình. Hãy tải tệp về máy trạm để trình chiếu với đầy đủ hiệu ứng qua Microsoft PowerPoint.'
          : isArchive
          ? 'Tập tin nén dữ liệu (.zip / .rar) chứa gói học liệu và tài liệu đính kèm. Hãy tải về máy và giải nén để sử dụng.'
          : 'Tập tin học liệu nghiệp vụ đã được mã hóa lưu trữ an toàn trên máy chủ Intranet T04.'}
      </p>

      {/* Meta Specs Box */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs mb-6 max-w-lg w-full">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded text-slate-300">
          <span className="text-slate-400">Định dạng:</span>
          <span className="font-bold text-amber-300">
            {isPpt ? 'PowerPoint Presentation' : isArchive ? 'Tệp nén' : file.fileType || 'Tài liệu'}
          </span>
        </div>

        {file.fileSize > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded text-slate-300">
            <span className="text-slate-400">Dung lượng:</span>
            <span className="font-bold text-white">
              {sizeMb && parseFloat(sizeMb) >= 1 ? `${sizeMb} MB` : `${sizeKb} KB`}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded text-slate-300">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>{file.classification || 'Lưu hành nội bộ T04'}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={downloadUrl}
          download={fileName}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
            isPpt
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/40'
              : 'bg-red-700 hover:bg-red-800 text-white shadow-red-900/40'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{isPpt ? 'Tải slide về máy để trình chiếu' : 'Tải tài liệu về máy'}</span>
        </a>
      </div>

      {/* Notice */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-6">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Tập tin đã được kiểm tra tính toàn vẹn SHA-256 trước khi xuất</span>
      </div>
    </div>
  );
}
