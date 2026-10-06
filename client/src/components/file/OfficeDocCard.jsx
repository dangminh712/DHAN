import React from 'react';
import {
  Presentation,
  Archive,
  FileQuestion,
  Download,
  Shield,
  CheckCircle2,
  FileCheck2,
  Award
} from 'lucide-react';

export default function OfficeDocCard({ file, fileName, downloadUrl, formatType }) {
  const isPpt = formatType === 'slide' || formatType === 'powerpoint';
  const isArchive = formatType === 'archive';
  const sizeMb = file?.fileSize ? (file.fileSize / (1024 * 1024)).toFixed(2) : null;
  const sizeKb = file?.fileSize ? Math.round(file.fileSize / 1024) : null;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 min-h-full w-full bg-slate-100 select-none">
      {/* Central Dossier Presentation Card */}
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-xl w-full text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isPpt
              ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500'
              : isArchive
              ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500'
              : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500'
          }`}
        />

        {/* Institution Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Học liệu nghiệp vụ • Đại học An ninh Nhân dân</span>
        </div>

        {/* Main Format Emblem Icon */}
        <div
          className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-sm border ${
            isPpt
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : isArchive
              ? 'bg-purple-50 border-purple-200 text-purple-600'
              : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}
        >
          {isPpt ? (
            <Presentation className="w-10 h-10 stroke-[1.8]" />
          ) : isArchive ? (
            <Archive className="w-10 h-10 stroke-[1.8]" />
          ) : (
            <FileQuestion className="w-10 h-10 stroke-[1.8]" />
          )}
        </div>

        {/* File Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-lg mx-auto mb-3 leading-snug break-words">
          {fileName}
        </h3>

        {/* Description / Instructions */}
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          {isPpt
            ? 'Tập tin bài trình chiếu PowerPoint (.pptx / .ppt) phục vụ giảng dạy và thuyết trình. Hãy tải tệp về máy trạm để trình chiếu với đầy đủ hiệu ứng qua Microsoft PowerPoint.'
            : isArchive
            ? 'Tập tin nén dữ liệu (.zip / .rar) chứa gói học liệu và tài liệu nghiệp vụ đính kèm. Đồng chí tải về máy trạm và giải nén an toàn để sử dụng.'
            : 'Tập tin học liệu nghiệp vụ đã được mã hóa lưu trữ an toàn trên máy chủ Intranet T04.'}
        </p>

        {/* Meta Specifications Box */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6 w-full">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium">
            <span className="text-slate-400">Định dạng:</span>
            <span className="font-bold text-slate-900">
              {isPpt ? 'PowerPoint Presentation' : isArchive ? 'Tệp nén hồ sơ' : file?.fileType || 'Tài liệu'}
            </span>
          </div>

          {file?.fileSize > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium">
              <span className="text-slate-400">Dung lượng:</span>
              <span className="font-bold text-slate-900">
                {sizeMb && parseFloat(sizeMb) >= 1 ? `${sizeMb} MB` : `${sizeKb} KB`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-blue-900">{file?.classification || 'Lưu hành nội bộ T04'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={downloadUrl}
            download={fileName}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all duration-200 cursor-pointer text-white ${
              isPpt
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 active:scale-95'
                : 'bg-red-700 hover:bg-red-800 shadow-red-700/25 active:scale-95'
            }`}
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>{isPpt ? 'Tải slide về máy để trình chiếu' : 'Tải tài liệu về máy'}</span>
          </a>
        </div>

        {/* Integrity Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-6 pt-4 border-t border-slate-100">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tập tin đã được kiểm tra tính toàn vẹn SHA-256 an toàn</span>
        </div>
      </div>
    </div>
  );
}
