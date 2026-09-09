import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, PlusCircle, CheckCircle2, Lock, Clock, Archive } from 'lucide-react';
import { lectureService } from '../services/lectureService';
import { useAuth } from '../context/AuthContext';
import LectureCard from '../components/lecture/LectureCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LecturesPage({ onOpenDetail, onOpenStudy, onOpenCreate }) {
  const { currentUser } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  useEffect(() => {
    loadLectures();
  }, [currentUser, selectedStatus]);

  const loadLectures = async () => {
    setLoading(true);
    try {
      const data = await lectureService.getLectures(currentUser?.id, selectedStatus);
      setLectures(data);
    } catch (err) {
      console.error('Lỗi tải bài giảng:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLectures = lectures.filter((lec) => {
    const term = searchTerm.toLowerCase();
    return (
      lec.title?.toLowerCase().includes(term) ||
      lec.subject?.toLowerCase().includes(term) ||
      lec.subjectCode?.toLowerCase().includes(term) ||
      lec.teacherName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            <span>Danh mục Bài giảng Điện tử Nghiệp vụ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu các học phần đào tạo theo phân quyền lớp học và cấp độ bảo mật của bạn
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Biên soạn bài giảng mới</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm bài giảng, mã môn học, giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PUBLISHED', label: 'Đang phát hành' },
            { id: 'SCHEDULED', label: 'Đã lên lịch' },
            { id: 'CLOSED', label: 'Đã đóng' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === status.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lectures Grid */}
      {loading ? (
        <LoadingSpinner text="Đang đồng bộ bài giảng theo phân quyền lớp..." />
      ) : filteredLectures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-sm text-slate-700">Không tìm thấy bài giảng phù hợp</p>
          <p className="text-slate-400 mt-1">
            Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc quyền hạn truy cập của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLectures.map((lec) => (
            <LectureCard
              key={lec.id}
              lecture={lec}
              onOpenDetail={onOpenDetail}
              onOpenStudy={onOpenStudy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
