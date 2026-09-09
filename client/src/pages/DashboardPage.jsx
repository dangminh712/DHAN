import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Users,
  ShieldCheck,
  AlertTriangle,
  Database,
  PlusCircle,
  UploadCloud,
  ChevronRight,
  Clock,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import { systemService } from '../services/systemService';
import { lectureService } from '../services/lectureService';
import { useAuth } from '../context/AuthContext';
import LectureCard from '../components/lecture/LectureCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage({ onNavigate, onOpenDetail, onOpenStudy, onOpenCreate, onOpenUpload }) {
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [recentLectures, setRecentLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [ovData, lecData] = await Promise.all([
          systemService.getOverview(),
          lectureService.getLectures(currentUser?.id),
        ]);
        setOverview(ovData);
        setRecentLectures(lecData.slice(0, 4));
      } catch (err) {
        console.error('Lỗi tải Dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [currentUser]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu tổng quan T04..." />;

  const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner with T04 Police Red Accent */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-red-500/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/60 border border-red-400/40 text-xs font-semibold text-amber-300 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trường Đại học An ninh Nhân dân • Cổng Học vụ & Học liệu Số</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-2">
            Xin chào, {currentUser?.fullName || 'Đồng chí'}!
          </h2>
          <p className="text-xs sm:text-sm text-red-100 leading-relaxed max-w-2xl">
            Chào mừng bạn đến với hệ thống quản lý bài giảng điện tử và học liệu bảo mật.
            Cấp độ phê chuẩn an ninh hiện tại: <strong className="text-amber-300 underline">{currentUser?.maxClearance}</strong>.
            Tất cả hoạt động tra cứu và tải tài liệu đều được kiểm toán tự động theo quy định.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('lectures')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-red-700 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-red-600" />
              <span>Khám phá Bài giảng</span>
            </button>

            {isTeacher && (
              <button
                onClick={onOpenCreate}
                className="px-4 py-2.5 bg-red-900/80 hover:bg-red-950 text-white rounded-xl text-xs sm:text-sm font-bold border border-red-400/40 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>Biên soạn bài giảng mới</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('dbms')}
              className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/70 text-red-100 rounded-xl text-xs sm:text-sm font-semibold border border-red-400/20 transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>Xem CSDL (27 bảng)</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute right-0 bottom-0 top-0 w-96 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <BookOpen className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{overview?.totalLectures || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Bài giảng điện tử</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{overview?.totalFiles || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Học liệu số hóa</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{overview?.totalClasses || 0} Lớp</div>
            <div className="text-xs font-semibold text-slate-500">{overview?.totalUsers || 0} Cán bộ / Học viên</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{overview?.totalAuditLogs || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Bản ghi kiểm toán an ninh</div>
          </div>
        </div>
      </div>

      {/* Recent Lectures Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-600" />
              <span>Bài giảng điện tử nổi bật</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động phân quyền hiển thị theo lớp học và cấp độ bảo mật của bạn
            </p>
          </div>

          <button
            onClick={() => onNavigate('lectures')}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentLectures.map((lec) => (
            <LectureCard
              key={lec.id}
              lecture={lec}
              onOpenDetail={onOpenDetail}
              onOpenStudy={onOpenStudy}
            />
          ))}
        </div>
      </div>

      {/* System Settings & Compliance Banner */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Quy chuẩn Vận hành & Cấu hình Động (System Settings - Section 30)</span>
          </h4>
          <span className="text-[11px] text-slate-500">Áp dụng cho toàn bộ mạng nội bộ T04</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {overview?.settings?.slice(0, 6).map((s) => (
            <div key={s.key} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
              <div className="font-mono text-[11px] font-bold text-slate-700">{s.key}</div>
              <div className="text-slate-500 text-[11px] truncate mt-0.5">{s.description}</div>
              <div className="text-red-700 font-bold font-mono text-xs mt-1">
                Giá trị: <span className="bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
