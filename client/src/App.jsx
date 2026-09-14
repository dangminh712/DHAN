import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Layout Components
import Header from './components/layout/Header';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Common Modals
import FileUploadModal from './components/file/FileUploadModal';
import LectureModal from './components/lecture/LectureModal';
import NetworkModal from './components/common/NetworkModal';
import { lectureService } from './services/lectureService';

// Dedicated URL Pages
import HomePage from './pages/HomePage';
import StudentPortalPage from './pages/StudentPortalPage';
import TeacherPortalPage from './pages/TeacherPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import AcademicPage from './pages/AcademicPage';
import ProvisioningPage from './pages/ProvisioningPage';
import DbmsAdminPage from './pages/DbmsAdminPage';
import LectureStudyPage from './LectureStudyPage';
import DirectMediaViewerModal from './components/common/DirectMediaViewerModal';

export default function App() {
  // 1. Hash-based Router (Hỗ trợ định tuyến URL riêng biệt trong mạng Intranet)
  const getHashRoute = () => {
    const hash = window.location.hash || '#/';
    return hash.replace(/^#/, '') || '/';
  };

  const [route, setRoute] = useState(getHashRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. State quản lý học liệu và người dùng
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Dữ liệu từ MySQL CSDL
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [academicUnits, setAcademicUnits] = useState([]);
  const [academicSubjects, setAcademicSubjects] = useState([]);
  const [academicClasses, setAcademicClasses] = useState([]);
  const [lectures, setLectures] = useState([]);

  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // 3. Tải danh sách người dùng & Thiết lập phiên ban đầu
  const fetchUsersAndInitAuth = async () => {
    try {
      const res = await axios.get('/api/auth/users');
      setAvailableUsers(res.data);
      const savedUser = localStorage.getItem('dhan_active_username') || 'admin';
      const target = res.data.find(u => u.username === savedUser) || res.data[0];
      if (target) {
        handleSwitchUser(target.username, false);
      }
    } catch (err) {
      console.warn('Chưa nạp được danh sách người dùng MySQL:', err.message);
      const defaultAdmin = {
        id: 1,
        username: 'admin',
        fullName: 'Đại tá Trần Văn Quyết (Quản trị T04)',
        role: 'SUPER_ADMIN',
        clearanceLevelOrder: 4,
        maxClearance: 'Tuyệt mật'
      };
      setAvailableUsers([defaultAdmin]);
      setCurrentUser(defaultAdmin);
    }
  };

  // 4. Chuyển đổi người dùng (Persona)
  const handleSwitchUser = async (username, showNotice = true) => {
    try {
      const res = await axios.post('/api/auth/switch-user', { username });
      const user = res.data.user || res.data;
      localStorage.setItem('dhan_session_token', res.data.token || '');
      localStorage.setItem('dhan_active_user_id', user.id || '1');
      setCurrentUser(user);
      localStorage.setItem('dhan_active_username', user.username);
      if (showNotice) {
        showToast('success', `Đã chuyển đổi sang tài khoản: ${user.fullName} (${user.maxClearance})`);
      }
    } catch (err) {
      console.error('Lỗi chuyển đổi user:', err);
      const fallback = availableUsers.find(u => u.username === username);
      if (fallback) {
        localStorage.setItem('dhan_active_user_id', fallback.id || '1');
        setCurrentUser(fallback);
        localStorage.setItem('dhan_active_username', fallback.username);
      }
    }
  };

  // 5. Nạp danh mục đơn vị và học phần đào tạo
  const fetchAcademicData = async () => {
    try {
      const [unitsRes, subjectsRes, classesRes] = await Promise.all([
        axios.get('/api/academic/units').catch(() => ({ data: [] })),
        axios.get('/api/academic/subjects').catch(() => ({ data: [] })),
        axios.get('/api/academic/classes').catch(() => ({ data: [] }))
      ]);
      setAcademicUnits(unitsRes.data || []);
      setAcademicSubjects(subjectsRes.data || []);
      setAcademicClasses(classesRes.data || []);
    } catch (err) {
      console.warn('Lỗi nạp danh mục Khoa, Môn học & Lớp:', err.message);
    }
  };

  // 6. Nạp danh sách bài giảng & học liệu từ Backend
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;

      const res = await axios.get('/api/media', { params });
      setFiles(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách tệp tin:', err);
      showToast('error', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Tải thông số mạng LAN nội bộ
  const fetchNetworkInfo = async () => {
    try {
      const res = await axios.get('/api/media/network-info');
      setNetworkInfo(res.data);
    } catch (err) {
      console.warn('Không lấy được thông số mạng LAN:', err.message);
    }
  };

  useEffect(() => {
    fetchUsersAndInitAuth();
    fetchAcademicData();
    fetchFiles();
    fetchNetworkInfo();
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const data = await lectureService.getLectures();
      setLectures(data || []);
    } catch (err) {
      console.warn('Chưa nạp bài giảng:', err.message);
    }
  };

  // 8. Đăng tải bài giảng
  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', currentUser?.username || 'admin');
    formData.append('notes', 'Tải lên từ Cổng Học liệu T04');

    setUploading(true);
    setUploadProgress(0);

    try {
      await axios.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      showToast('success', `Đăng tải bài giảng "${file.name}" thành công!`);
      setIsUploadModalOpen(false);
      fetchFiles();
    } catch (err) {
      console.error('Lỗi đăng tải:', err);
      showToast('error', `Đăng tải thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 9. Xóa học liệu
  const handleDeleteFile = async (id, fileName) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa học liệu:\n"${fileName}" khỏi hệ thống?`)) {
      return;
    }

    try {
      await axios.delete(`/api/media/${id}`);
      showToast('success', `Đã xóa học liệu "${fileName}" an toàn.`);
      fetchFiles();
    } catch (err) {
      console.error('Lỗi xóa tập tin:', err);
      showToast('error', 'Không thể xóa học liệu này.');
    }
  };

  // 10. Sao chép mã SHA-256
  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    showToast('success', 'Đã sao chép mã băm SHA-256 vào clipboard.');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // ═════════════════════════════════════════════════════════
  // 11. ĐIỀU HƯỚNG URL RIÊNG: PHÒNG HỌC BÀI GIẢNG ĐA HỌC LIỆU
  // URL: #/study/:id (VD: #/study/1, #/study/2)
  // ═════════════════════════════════════════════════════════
  if (route.startsWith('/study/')) {
    const lectureId = route.replace('/study/', '');
    return (
      <LectureStudyPage
        lectureId={lectureId}
        allFiles={files}
        currentUser={currentUser}
        onBack={() => { window.location.hash = '#/'; }}
      />
    );
  }

  // 11b. ĐIỀU HƯỚNG URL RIÊNG: XEM TRỰC TIẾP TÀI LIỆU
  // URL: #/view/:id (VD: #/view/1)
  if (route.startsWith('/view/')) {
    const viewId = route.replace('/view/', '');
    const targetFile = files.find(f => String(f.id) === String(viewId)) || {
      id: viewId,
      originalFileName: `Tài liệu nghiệp vụ #${viewId}`,
      category: 'document',
      fileSize: 0
    };
    return (
      <DirectMediaViewerModal
        isOpen={true}
        onClose={() => { window.location.hash = '#/'; }}
        file={targetFile}
        onCopyHash={copyToClipboard}
        copiedHash={copiedHash}
      />
    );
  }

  // Danh sách giảng viên và học viên từ danh sách users
  const teachersList = availableUsers.filter(u => u.role === 'TEACHER' || u.role === 'SUPER_ADMIN');
  const studentsList = availableUsers.filter(u => u.role === 'STUDENT');

  // ═════════════════════════════════════════════════════════
  // 12. RENDER GIAO DIỆN THEO URL ĐỘC LẬP
  // ═════════════════════════════════════════════════════════
  return (
    <div className="app-portal">
      {/* HEADER & THANH VĂN PHÒNG BỘ CÔNG AN */}
      <Header
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenNetwork={() => setIsNetworkModalOpen(true)}
        onRefresh={fetchFiles}
        loading={loading}
      />

      {/* NAVBAR ĐIỀU HƯỚNG CÁC URL RIÊNG BIỆT */}
      <Navbar currentRoute={route} />

      {/* CẢNH BÁO YÊU CẦU ĐỔI MẬT KHẨU LẦN ĐẦU CHO HỌC VIÊN */}
      {currentUser?.mustChangePassword && (
        <div style={{
          background: 'linear-gradient(90deg, #78350F 0%, #B45309 100%)',
          color: '#FEF3C7',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '13px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>
              Tài khoản học viên <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>{currentUser.username}</strong> đang sử dụng mật khẩu mặc định. Đồng chí cần đổi mật khẩu mới và cập nhật hồ sơ để bảo mật hệ thống.
            </span>
          </div>
          <a
            href="#/cap-tai-khoan"
            style={{
              padding: '4px 12px',
              borderRadius: '5px',
              background: '#FDE047',
              color: '#78350F',
              fontWeight: 800,
              fontSize: '12px',
              textDecoration: 'none'
            }}
          >
            Đổi mật khẩu ngay →
          </a>
        </div>
      )}

      {/* NỘI DUNG TỪNG TRANG THEO URL RIÊNG */}
      {/* 1. CỔNG HỌC VIÊN (DÀNH RIÊNG CHO HỌC VIÊN SĨ QUAN) */}
      {(route === '/hoc-vien' || route === '/student' || route === '/students') && (
        <StudentPortalPage
          files={files}
          loading={loading}
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          academicUnits={academicUnits}
          currentUser={currentUser}
          onSearch={fetchFiles}
          onCopyHash={copyToClipboard}
          copiedHash={copiedHash}
          onSelectFile={(f) => setSelectedFile(f)}
          lectures={lectures}
        />
      )}

      {/* 2. PHÒNG LÀM VIỆC GIẢNG VIÊN (DÀNH RIÊNG CHO GIẢNG VIÊN BIÊN SOẠN) */}
      {(route === '/giang-vien' || route === '/teacher' || route === '/teachers') && (
        <TeacherPortalPage
          files={files}
          teachersList={teachersList}
          currentUser={currentUser}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onDeleteFile={handleDeleteFile}
          onSelectFile={(f) => setSelectedFile(f)}
          onCopyHash={copyToClipboard}
          copiedHash={copiedHash}
          onSwitchUser={handleSwitchUser}
        />
      )}

      {/* 3. TRUNG TÂM QUẢN TRỊ HỆ THỐNG (DÀNH CHO ADMIN & BGH) */}
      {(route === '/admin' || route === '/audit') && (
        <AdminPortalPage
          availableUsers={availableUsers}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
        />
      )}

      {/* 3b. CẤP TÀI KHOẢN HỌC VIÊN TỰ ĐỘNG & QUẢN TRỊ ĐỒNG BỘ */}
      {(route === '/cap-tai-khoan' || route === '/provision' || route === '/provisioning') && (
        <ProvisioningPage
          onSwitchUser={handleSwitchUser}
          currentUser={currentUser}
          academicClasses={academicClasses}
        />
      )}

      {/* 4. KHOA & BỘ MÔN */}
      {route === '/academic' && (
        <AcademicPage
          academicUnits={academicUnits}
          academicSubjects={academicSubjects}
        />
      )}

      {/* 5. CSDL 27 BẢNG */}
      {route === '/dbms' && (
        <DbmsAdminPage />
      )}

      {/* 6. TRANG CHỦ TỔNG QUAN */}
      {(route === '/' || route === '') && (
        <HomePage
          files={files}
          loading={loading}
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          activeRoleTab={activeRoleTab}
          setActiveRoleTab={setActiveRoleTab}
          academicUnits={academicUnits}
          currentUser={currentUser}
          onSearch={fetchFiles}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenCreateLecture={() => setIsLectureModalOpen(true)}
          onCopyHash={copyToClipboard}
          copiedHash={copiedHash}
          onDeleteFile={handleDeleteFile}
          onSelectFile={(f) => setSelectedFile(f)}
          lectures={lectures}
        />
      )}

      {/* MODAL XEM TRỰC TIẾP TẬP TIN / TÀI LIỆU (KHÔNG CẦN VÀO PHÒNG HỌC BÀI GIẢNG) */}
      <DirectMediaViewerModal
        isOpen={Boolean(selectedFile)}
        onClose={() => setSelectedFile(null)}
        file={selectedFile}
        onCopyHash={copyToClipboard}
        copiedHash={copiedHash}
      />

      {/* MODAL NHẬP LIỆU FILE (PDF, PPT, VIDEO, ẢNH, AUDIO) LƯU NỘI BỘ MÁY TÍNH */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => {
          fetchFiles();
          fetchLectures();
          showToast('success', 'Đã nạp học liệu và lưu trữ nội bộ thành công!');
        }}
        currentUser={currentUser}
        lectures={lectures}
      />

      {/* MODAL SOẠN / TẠO VÀ LƯU BÀI GIẢNG ĐIỆN TỬ */}
      <LectureModal
        isOpen={isLectureModalOpen}
        onClose={() => setIsLectureModalOpen(false)}
        onSaved={() => {
          fetchLectures();
          fetchFiles();
          showToast('success', 'Đã tạo và lưu bài giảng điện tử thành công vào CSDL!');
        }}
        currentUser={currentUser}
      />

      {/* MODAL THÔNG SỐ MẠNG INTRANET */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        networkInfo={networkInfo}
        onCopy={copyToClipboard}
      />

      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {statusMessage.text && (
        <div className={`toast-notification ${statusMessage.type}`}>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* CHÂN TRANG */}
      <Footer />
    </div>
  );
}
