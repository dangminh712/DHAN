import React, { useState, useEffect } from 'react';
import {
  Edit3,
  PlusCircle,
  UploadCloud,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Eye,
  Download,
  BookOpen
} from 'lucide-react';
import { lectureService } from '../services/lectureService';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { LectureStatusBadge, ClearanceBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function TeacherStudioPage({ onOpenCreate, onOpenUpload, onViewFile, onDownloadFile }) {
  const { currentUser } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadStudioData();
  }, [currentUser]);

  const loadStudioData = async () => {
    setLoading(true);
    try {
      const [lecList, fileList] = await Promise.all([
        lectureService.getLectures(currentUser?.id),
        fileService.getFiles(currentUser?.id),
      ]);
      setLectures(lecList);
      setFiles(fileList);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu Giảng viên:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (lecture) => {
    const nextStatus = lecture.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    const msg =
      nextStatus === 'CLOSED'
        ? 'Bạn có chắc muốn ĐÓNG bài giảng này? Toàn bộ học viên sẽ bị ngắt quyền truy cập học liệu (Section 34).'
        : 'Bạn có chắc muốn XUẤT BẢN bài giảng cho học viên?';

    if (!window.confirm(msg)) return;

    setUpdatingId(lecture.id);
    try {
      await lectureService.updateStatus(lecture.id, nextStatus, currentUser.id);
      await loadStudioData();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Đang nạp không gian biên soạn giảng dạy..." />;

  return (
    <div className="space-y-8 animate-fade-in text-xs">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-slate-900">Không Gian Biên Soạn & Quản Trị Học Liệu</span>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
              Dành cho Giảng viên Sĩ quan
            </span>
          </div>
          <p className="text-slate-500">
            Giảng viên: <strong>{currentUser?.fullName}</strong> ({currentUser?.department}) • Quản lý các bài giảng phụ trách
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Tải lên Học liệu</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Biên soạn Bài giảng mới</span>
          </button>
        </div>
      </div>

      {/* Lectures Management Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-600" />
            <span>Danh sách Bài giảng do bạn quản lý ({lectures.length})</span>
          </h3>
          <span className="text-slate-400">Section 34, 38, 52: Kiểm soát đóng/mở bài giảng</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Mã môn</th>
                <th className="py-3 px-4">Tên bài giảng điện tử</th>
                <th className="py-3 px-4">Lớp phân quyền</th>
                <th className="py-3 px-4">Số học liệu</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Hành động nghiệp vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lectures.map((lec) => {
                const isClosed = lec.status === 'CLOSED';
                return (
                  <tr key={lec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{lec.subjectCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 max-w-sm truncate">
                      {lec.title}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {lec.assignedClasses?.join(', ') || 'Chưa gán'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{lec.fileCount} file</td>
                    <td className="py-3 px-4">
                      <LectureStatusBadge status={lec.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(lec)}
                        disabled={updatingId === lec.id}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          isClosed
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {isClosed ? 'Mở lại bài giảng' : 'Đóng bài giảng (Khóa học viên)'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Files Repository Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Kho Lưu Trữ Học Liệu Số của Nhà Trường ({files.length})</span>
          </h3>
          <span className="text-slate-400">Section 17, 20: Phân loại & Phiên bản bất biến</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Tên tập tin</th>
                <th className="py-3 px-4">Định dạng</th>
                <th className="py-3 px-4">Cấp độ bảo mật</th>
                <th className="py-3 px-4">Phiên bản</th>
                <th className="py-3 px-4">Mã băm SHA-256</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                    {f.originalName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{f.fileType}</td>
                  <td className="py-3 px-4">
                    <ClearanceBadge level={f.classificationName} order={f.classificationOrder} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                      v{f.versions?.length || 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={f.checksumSha256}>
                    {f.checksumSha256}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => onViewFile(f)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => onDownloadFile(f)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                    >
                      Tải
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
