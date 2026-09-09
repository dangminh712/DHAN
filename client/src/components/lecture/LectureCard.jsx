import React from 'react';
import { BookOpen, User, Calendar, Paperclip, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { LectureStatusBadge } from '../common/Badge';

export default function LectureCard({ lecture, onOpenDetail, onOpenStudy }) {
  const isClosed = lecture.status === 'CLOSED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden">
      {/* Red accent top border for active published lectures */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isClosed ? 'bg-slate-300' : 'bg-red-600'}`} />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            {lecture.subjectCode}
          </span>
          <LectureStatusBadge status={lecture.status} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-red-700 transition-colors mb-2">
          {lecture.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {lecture.description || 'Chưa có mô tả bài giảng.'}
        </p>

        {/* Teacher & Subject */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{lecture.subject}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-700">{lecture.teacherName}</span>
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" />
            <span>{lecture.fileCount} học liệu đính kèm</span>
          </span>
          {lecture.assignedClasses?.length > 0 && (
            <span className="text-[11px] bg-slate-50 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
              {lecture.assignedClasses[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => onOpenDetail(lecture)}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
          >
            Học liệu ({lecture.fileCount})
          </button>
          <button
            onClick={() => onOpenStudy(lecture)}
            disabled={isClosed}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
              isClosed
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
            }`}
          >
            {isClosed ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Đã đóng</span>
              </>
            ) : (
              <>
                <span>Vào học</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
