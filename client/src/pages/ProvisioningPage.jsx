import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  Copy,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  LogIn,
  Layers,
  FileSpreadsheet,
  Check,
  FileText,
  Trash2,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { authService } from '../services/authService';
import Pagination from '../components/common/Pagination';
import { SortableTh, useTableSort } from '../utils/tableSort';

export default function ProvisioningPage({ onSwitchUser, currentUser, academicClasses = [] }) {
  const [tab, setTab] = useState('excel'); // 'excel' | 'batch' | 'single'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastProvisionResult, setLastProvisionResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Excel Import State
  const fileInputRef = useRef(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [parsedExcelStudents, setParsedExcelStudents] = useState([]);
  const [importing, setImporting] = useState(false);

  const cleanStudentName = (name) => {
    if (!name) return '';
    return String(name).replace(/^Học\s*viên\s+/i, '').trim();
  };

  const {
    sortedData: sortedStudents,
    sortField: studentSortField,
    sortDirection: studentSortDirection,
    handleSort: handleStudentSort
  } = useTableSort(students, 'username', 'desc');

  const {
    sortedData: sortedExcelStudents,
    sortField: excelSortField,
    sortDirection: excelSortDirection,
    handleSort: handleExcelSort
  } = useTableSort(parsedExcelStudents, 'index', 'asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Change Student Class State
  const [changeClassModalStudent, setChangeClassModalStudent] = useState(null);
  const [targetNewClassCode, setTargetNewClassCode] = useState('DT5B');
  const [changingClass, setChangingClass] = useState(false);

  // Batch Form State
  const [pattern, setPattern] = useState('(001->055)_DT5B');
  const [fromNum, setFromNum] = useState(1);
  const [toNum, setToNum] = useState(55);
  const [padding, setPadding] = useState(3);
  const [suffix, setSuffix] = useState('_DT5B');
  const [classCode, setClassCode] = useState('DT5B');
  const [className, setClassName] = useState('Lớp Đào tạo Nghiệp vụ DT5B');
  const [clearanceLevelId, setClearanceLevelId] = useState(2); // INTERNAL

  // Single Form State
  const [singleCode, setSingleCode] = useState('074_vb2d5b');
  const [singleClass, setSingleClass] = useState('VB2D5B');
  const [singleFullName, setSingleFullName] = useState('');

  // Self-Service Profile Update Modal State
  const [profileModalStudent, setProfileModalStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Load students with Server-Side Pagination and Search
  const loadStudents = async (p = currentPage, sz = pageSize, q = searchQuery, cls = selectedClassFilter) => {
    setLoading(true);
    try {
      const data = await authService.getProvisionedStudents({
        page: p,
        pageSize: sz,
        search: q,
        classCode: cls === 'ALL' ? '' : cls
      });

      if (data && data.items) {
        setStudents(data.items);
        setTotalCount(data.totalCount);
      } else {
        setStudents(data || []);
        setTotalCount((data || []).length);
      }
    } catch (err) {
      console.error('Error loading provisioned students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(currentPage, pageSize, searchQuery, selectedClassFilter);
  }, [currentPage, pageSize, selectedClassFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    loadStudents(1, pageSize, searchQuery, selectedClassFilter);
  };

  const handleChangeClassSubmit = async () => {
    if (!changeClassModalStudent || !targetNewClassCode) return;
    setChangingClass(true);
    try {
      await authService.enrollStudent(changeClassModalStudent.id, null, targetNewClassCode, true, currentUser?.id || 1);
      showToast('success', `Đã cập nhật học viên ${changeClassModalStudent.fullName} vào lớp ${targetNewClassCode} thành công!`);
      setChangeClassModalStudent(null);
      loadStudents(currentPage, pageSize, searchQuery, selectedClassFilter);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi cập nhật lớp học viên.');
    } finally {
      setChangingClass(false);
    }
  };

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  // ═════════════════════════════════════════════════════════════
  // 1. TẢI FILE MẪU EXCEL & CSV (TEMPLATE DOWNLOAD - SYNCHRONOUS & RELIABLE)
  // ═════════════════════════════════════════════════════════════
  const handleDownloadExcelTemplate = () => {
    try {
      showToast('success', 'Đang tải file mẫu Excel "Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx"...');
      const templateData = [
        {
          "STT": 1,
          "Mã sinh viên *": "001_DT5B",
          "Họ và tên": "Nguyễn Văn An",
          "Lớp học vụ": "DT5B",
          "Số điện thoại": "0912345001",
          "Email": "an.nv001@dhan.edu.vn",
          "Ghi chú": "Mẫu học viên Khóa Đào tạo Nghiệp vụ DT5B"
        },
        {
          "STT": 2,
          "Mã sinh viên *": "002_DT5B",
          "Họ và tên": "Trần Thị Bích",
          "Lớp học vụ": "DT5B",
          "Số điện thoại": "0912345002",
          "Email": "bich.tt002@dhan.edu.vn",
          "Ghi chú": ""
        },
        {
          "STT": 3,
          "Mã sinh viên *": "003_DT5B",
          "Họ và tên": "Lê Hoàng Cường",
          "Lớp học vụ": "DT5B",
          "Số điện thoại": "0912345003",
          "Email": "cuong.lh003@dhan.edu.vn",
          "Ghi chú": ""
        },
        {
          "STT": 4,
          "Mã sinh viên *": "074_VB2D5B",
          "Họ và tên": "Phạm Văn Dũng",
          "Lớp học vụ": "VB2D5B",
          "Số điện thoại": "0912345074",
          "Email": "dung.pv074@dhan.edu.vn",
          "Ghi chú": "Mẫu học viên Văn bằng 2 VB2D5B"
        },
        {
          "STT": 5,
          "Mã sinh viên *": "075_VB2D5B",
          "Họ và tên": "Vũ Minh Em",
          "Lớp học vụ": "VB2D5B",
          "Số điện thoại": "0912345075",
          "Email": "em.vm075@dhan.edu.vn",
          "Ghi chú": ""
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 24 },
        { wch: 14 },
        { wch: 16 },
        { wch: 28 },
        { wch: 35 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachHocVien");
      XLSX.writeFile(wb, "Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx");
    } catch (err) {
      console.error('Lỗi khi tạo và tải file mẫu Excel:', err);
      window.location.href = '/api/auth/template/excel';
    }
  };

  const handleDownloadCsvTemplate = () => {
    try {
      showToast('success', 'Đang tải file mẫu CSV "Mau_Nhap_Lieu_Hoc_Vien_T04.csv"...');
      const csvContent = "\uFEFF" +
        `STT,Mã sinh viên *,Họ và tên,Lớp học vụ,Số điện thoại,Email,Ghi chú
1,001_DT5B,Nguyễn Văn An,DT5B,0912345001,an.nv001@dhan.edu.vn,Mẫu học viên Khóa Đào tạo Nghiệp vụ DT5B
2,002_DT5B,Trần Thị Bích,DT5B,0912345002,bich.tt002@dhan.edu.vn,
3,003_DT5B,Lê Hoàng Cường,DT5B,0912345003,cuong.lh003@dhan.edu.vn,
4,074_VB2D5B,Phạm Văn Dũng,VB2D5B,0912345074,dung.pv074@dhan.edu.vn,Mẫu học viên Văn bằng 2 VB2D5B
5,075_VB2D5B,Vũ Minh Em,VB2D5B,0912345075,em.vm075@dhan.edu.vn,
`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Mau_Nhap_Lieu_Hoc_Vien_T04.csv';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch (err) {
      console.error('Lỗi khi tạo và tải file mẫu CSV:', err);
      window.location.href = '/api/auth/template/csv';
    }
  };

  // ═════════════════════════════════════════════════════════════
  // 2. ĐỌC VÀ PHÂN TÍCH FILE EXCEL (EXCEL PARSING)
  // ═════════════════════════════════════════════════════════════
  const handleExcelFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || rows.length === 0) {
          showToast('error', 'File Excel không có dữ liệu hàng nào.');
          setParsedExcelStudents([]);
          return;
        }

        const mapped = rows.map((r, idx) => {
          // Flexible mapping across header column names
          const studentCode = String(
            r['Mã sinh viên *'] || r['Mã sinh viên'] || r['Mã SV'] || r['Ma sinh vien'] || r['StudentCode'] || r['studentCode'] || r['Username'] || Object.values(r)[0] || ''
          ).trim();

          const fullName = String(
            r['Họ và tên'] || r['Họ tên'] || r['Ho va ten'] || r['FullName'] || r['fullName'] || ''
          ).trim();

          const classCode = String(
            r['Lớp học vụ'] || r['Lớp'] || r['Lop'] || r['ClassCode'] || r['classCode'] || 'DT5B'
          ).trim().toUpperCase();

          const phone = String(
            r['Số điện thoại'] || r['SĐT'] || r['SDT'] || r['Phone'] || r['phone'] || ''
          ).trim();

          const email = String(
            r['Email'] || r['Thư điện tử'] || r['email'] || ''
          ).trim();

          const password = String(
            r['Mật khẩu'] || r['Mật khẩu mặc định'] || r['Mật khẩu mặc định (tùy chọn)'] || r['Password'] || r['password'] || ''
          ).trim();

          return {
            index: idx + 1,
            studentCode,
            fullName: fullName || (studentCode ? `Học viên ${studentCode}` : ''),
            classCode: classCode || 'DT5B',
            phone,
            email,
            password: password || studentCode,
            isValid: Boolean(studentCode)
          };
        }).filter(item => item.studentCode);

        setParsedExcelStudents(mapped);
        showToast('success', `Đã đọc thành công ${mapped.length} học viên từ file "${file.name}"!`);
      } catch (err) {
        console.error('Lỗi đọc Excel:', err);
        showToast('error', 'Lỗi khi đọc file: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Submit Excel Data to Server
  const handleSubmitExcelImport = async () => {
    if (!parsedExcelStudents || parsedExcelStudents.length === 0) {
      showToast('error', 'Không có dữ liệu học viên hợp lệ để nạp.');
      return;
    }

    setImporting(true);
    try {
      const payload = parsedExcelStudents.map(s => ({
        studentCode: s.studentCode,
        fullName: s.fullName,
        classCode: s.classCode,
        phone: s.phone,
        email: s.email,
        password: s.password
      }));

      const res = await authService.provisionImport(payload, Number(clearanceLevelId));
      setLastProvisionResult(res);
      showToast('success', res.message || `Đã nạp thành công ${res.createdCount} học viên từ file Excel!`);
      setParsedExcelStudents([]);
      setExcelFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadStudents();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi nạp dữ liệu từ file Excel.');
    } finally {
      setImporting(false);
    }
  };

  // Preset Handlers
  const handleApplyPreset = (p, f, t, pad, sfx, cls, name) => {
    setPattern(p);
    setFromNum(f);
    setToNum(t);
    setPadding(pad);
    setSuffix(sfx);
    setClassCode(cls);
    setClassName(name);
  };

  // Synchronize pattern changes to inputs
  const handlePatternChange = (val) => {
    setPattern(val);
    const m = val.trim().match(/^(.*?)\((\d+)\s*->\s*(\d+)\)(.*)$/);
    if (m) {
      const f = parseInt(m[2], 10);
      const t = parseInt(m[3], 10);
      const pad = m[2].length;
      const sfx = m[4];
      setFromNum(f);
      setToNum(t);
      setPadding(pad);
      setSuffix(sfx);
      const code = sfx.replace(/^[-_\s]+/, '') || 'DT5B';
      setClassCode(code);
      setClassName(`Lớp Đào tạo ${code}`);
    }
  };

  // Real-time Preview Calculation
  const previewCount = Math.max(0, toNum - fromNum + 1);
  const getPreviewItem = (num) => {
    const numStr = String(num).padStart(padding, '0');
    return `${numStr}${suffix}`.trim();
  };
  const previewSample = [
    getPreviewItem(fromNum),
    getPreviewItem(fromNum + 1 <= toNum ? fromNum + 1 : fromNum),
    getPreviewItem(fromNum + 2 <= toNum ? fromNum + 2 : fromNum),
  ];
  const previewLast = getPreviewItem(toNum);

  // Handle Submit Batch
  const handleBatchProvision = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        pattern,
        fromNumber: fromNum,
        toNumber: toNum,
        padding,
        prefix: '',
        suffix,
        classCode,
        className,
        clearanceLevelId: Number(clearanceLevelId),
        mustChangePassword: true,
        isProfileLocked: false
      };
      const res = await authService.provisionBatch(payload);
      setLastProvisionResult(res);
      showToast('success', res.message || 'Cấp tài khoản hàng loạt thành công!');
      loadStudents();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi cấp tài khoản hàng loạt.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Submit Single
  const handleSingleProvision = async (e) => {
    e.preventDefault();
    if (!singleCode.trim()) {
      showToast('error', 'Vui lòng nhập Mã sinh viên.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        studentCode: singleCode.trim(),
        fullName: singleFullName.trim() || undefined,
        password: singleCode.trim(),
        classCode: singleClass.trim() || 'DT5B',
        clearanceLevelId: Number(clearanceLevelId),
        mustChangePassword: true,
        isProfileLocked: false
      };
      const res = await authService.provisionSingle(payload);
      setLastProvisionResult({ accounts: [res.account], createdCount: 1, skippedCount: 0 });
      showToast('success', res.message || 'Cấp tài khoản thành công!');
      setSingleCode('');
      setSingleFullName('');
      loadStudents();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi cấp tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (st) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn đặt lại mật khẩu cho học viên:\n"${st.username}" về mật khẩu mặc định (${st.studentCode || st.username})?`)) return;
    try {
      const res = await authService.resetStudentPassword(st.id);
      showToast('success', res.message);
      loadStudents();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu.');
    }
  };

  // Handle Profile First Time Update
  const handleOpenProfileModal = (st) => {
    setProfileModalStudent(st);
    setNewPassword('');
    setProfileFullName(st.fullName?.startsWith('Học viên ') ? '' : st.fullName);
    setProfilePhone(st.phone || '');
    setProfileEmail(st.email || '');
  };

  const handleSubmitProfileUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      alert('Vui lòng nhập mật khẩu mới ít nhất 4 ký tự.');
      return;
    }
    setUpdatingProfile(true);
    try {
      const res = await authService.updateStudentProfile({
        username: profileModalStudent.username,
        newPassword,
        fullName: profileFullName,
        phone: profilePhone,
        email: profileEmail
      });
      showToast('success', res.message);
      setProfileModalStudent(null);
      loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy All Provisioned Credentials
  const handleCopyAll = () => {
    const list = lastProvisionResult?.accounts || students;
    if (!list || list.length === 0) return;
    const text = list.map(a => `${a.username}\t${a.classCode || ''}\t${cleanStudentName(a.fullName)}`).join('\n');
    navigator.clipboard.writeText(`TÊN ĐĂNG NHẬP\tLỚP\tHỌ TÊN\n${text}`);
    showToast('success', `Đã sao chép danh sách ${list.length} tài khoản vào Clipboard.`);
  };

  // 3. XUẤT DANH SÁCH TÀI KHOẢN RA FILE EXCEL (.XLSX) & CSV (.CSV)
  const handleExportExcel = () => {
    const list = lastProvisionResult?.accounts || students;
    if (!list || list.length === 0) {
      showToast('error', 'Chưa có dữ liệu học viên trong hệ thống để xuất file Excel!');
      return;
    }

    try {
      showToast('success', `Đang xuất file Excel cho ${list.length} học viên...`);
      const exportData = list.map((st, idx) => ({
        "STT": idx + 1,
        "Tên đăng nhập": st.username,
        "Mã sinh viên": st.studentCode || st.username,
        "Lớp học vụ": st.classCode || 'DT5B',
        "Họ và tên": cleanStudentName(st.fullName),
        "Email": st.email || '',
        "Số điện thoại": st.phone || '',
        "Trạng thái đổi mật khẩu": st.mustChangePassword ? 'Chưa đổi pass' : 'Đã đổi pass',
        "Trạng thái khóa hồ sơ": st.isProfileLocked ? 'Đã khóa hồ sơ' : 'Chưa khóa'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 },
        { wch: 24 },
        { wch: 26 },
        { wch: 16 },
        { wch: 26 },
        { wch: 22 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachHocVien");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Danh_sach_tai_khoan_hoc_vien_${dateStr}.xlsx`);
      showToast('success', `Đã xuất thành công file Excel (${list.length} học viên).`);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      showToast('error', 'Không thể xuất file Excel: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    const list = lastProvisionResult?.accounts || students;
    if (!list || list.length === 0) {
      showToast('error', 'Chưa có dữ liệu học viên trong hệ thống để xuất file CSV!');
      return;
    }

    try {
      showToast('success', `Đang xuất file CSV cho ${list.length} học viên...`);
      let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Vietnamese display
      csvContent += 'STT,Tên đăng nhập,Mã sinh viên,Lớp học vụ,Họ và tên,Email,Số điện thoại,Trạng thái đổi pass,Khóa hồ sơ\n';

      list.forEach((st, idx) => {
        const code = st.studentCode || st.username;
        const cls = st.classCode || 'DT5B';
        const name = `"${cleanStudentName(st.fullName).replace(/"/g, '""')}"`;
        const email = st.email || '';
        const phone = st.phone || '';
        const mustChange = st.mustChangePassword ? 'Chưa đổi pass' : 'Đã đổi pass';
        const locked = st.isProfileLocked ? 'Đã khóa hồ sơ' : 'Chưa khóa';
        csvContent += `${idx + 1},${st.username},${code},${cls},${name},${email},${phone},${mustChange},${locked}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Danh_sach_tai_khoan_hoc_vien_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
      showToast('success', `Đã xuất thành công file CSV (${list.length} học viên).`);
    } catch (err) {
      console.error('Lỗi khi xuất file CSV:', err);
      showToast('error', 'Không thể xuất file CSV: ' + err.message);
    }
  };

  // Filter students
  const filteredStudents = students.filter(st => {
    const matchesSearch =
      st.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.classCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClassFilter === 'ALL' || st.classCode === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Unique classes for filter
  const classList = Array.from(new Set(students.map(s => s.classCode).filter(Boolean)));

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '50px' }}>
      <div className="dvc-tabs-container">
        {/* 1. HEADER */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #071527 0%, #0F2A4A 60%, #1E3A8A 100%)',
          color: '#FFFFFF',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#D97706', color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                HỌC VIỆN AN NINH NHÂN DÂN - T04
              </span>
              <span style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(147, 197, 253, 0.3)' }}>
                ⚡ KIỂM THỬ KHÔNG GIỚI HẠN
              </span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus size={24} color="#FDE047" />
              CẤP TÀI KHOẢN HỌC VIÊN TỰ ĐỘNG & QUẢN TRỊ ĐỒNG BỘ
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0' }}>
              Hỗ trợ nhập liệu từ file Excel có sẵn cột, cấp hàng loạt theo dải mã lớp hoặc cấp lẻ. Đảm bảo an toàn dữ liệu và yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleCopyAll}
              className="btn-icon-secondary"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12.5px', padding: '8px 14px', cursor: 'pointer' }}
              title="Sao chép danh sách tài khoản học viên"
            >
              <Copy size={15} />
              <span>Sao chép tất cả</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn-upload-primary"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                fontSize: '12.5px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                color: '#FFFFFF'
              }}
              title="Xuất toàn bộ danh sách tài khoản học viên ra file Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet size={16} />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <a
              href="/api/auth/export/csv"
              download="Danh_sach_tai_khoan_hoc_vien_T04.csv"
              onClick={() => showToast('success', 'Đang xuất file CSV danh sách học viên...')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '12.5px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
              title="Xuất danh sách học viên ra file Comma Separated Values (.csv)"
            >
              <FileText size={16} />
              <span>Xuất CSV (.csv)</span>
            </a>
          </div>
        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: message.type === 'success' ? '#DEF7EC' : '#FDE8E8',
            color: message.type === 'success' ? '#03543F' : '#9B1C1C',
            border: `1px solid ${message.type === 'success' ? '#31C48D' : '#F98080'}`
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div style={{ padding: '24px' }}>
          {/* 2. MODE SELECTOR TABS (3 OPTIONS) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', flexWrap: 'wrap' }}>
            {/* OPTION 1: NHẬP TỪ EXCEL */}
            <button
              onClick={() => setTab('excel')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px 8px 0 0',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                background: tab === 'excel' ? '#0B1E36' : '#F1F5F9',
                color: tab === 'excel' ? '#FFFFFF' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              <FileSpreadsheet size={17} color={tab === 'excel' ? '#FDE047' : '#059669'} />
              <span>Nhập Liệu Từ File Excel (.xlsx / .csv)</span>
              <span style={{ fontSize: '11px', background: tab === 'excel' ? '#059669' : '#DCFCE7', color: tab === 'excel' ? '#fff' : '#166534', padding: '1px 7px', borderRadius: '10px', fontWeight: 800 }}>
                Có File Mẫu
              </span>
            </button>

            {/* OPTION 2: BATCH RANGE */}
            <button
              onClick={() => setTab('batch')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px 8px 0 0',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                background: tab === 'batch' ? '#0B1E36' : '#F1F5F9',
                color: tab === 'batch' ? '#FFFFFF' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={17} />
              <span>Cấp Hàng Loạt Theo Dải Lớp (001-&gt;055)</span>
            </button>

            {/* OPTION 3: SINGLE */}
            <button
              onClick={() => setTab('single')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px 8px 0 0',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                background: tab === 'single' ? '#0B1E36' : '#F1F5F9',
                color: tab === 'single' ? '#FFFFFF' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              <UserPlus size={17} />
              <span>Cấp Tài Khoản Đơn Lẻ (Mã Sinh Viên)</span>
            </button>
          </div>

          {/* 3A. PROVISION TAB: NHẬP LIỆU TỪ FILE EXCEL */}
          {tab === 'excel' && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              {/* Top Banner: Template download buttons */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '18px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={18} color="#1E40AF" />
                    BƯỚC 1: TẢI FILE EXCEL MẪU CÓ SẴN CỘT THÔNG TIN
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: '4px 0 0' }}>
                    File mẫu đã chuẩn hóa sẵn các cột: <strong>Mã sinh viên *</strong>, <strong>Họ và tên</strong>, <strong>Lớp học vụ</strong>, <strong>Số điện thoại</strong>, <strong>Email</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href="/api/auth/template/excel"
                    download="Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx"
                    onClick={() => showToast('success', 'Đang tải file mẫu Excel "Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx"...')}
                    className="btn-upload-primary"
                    style={{
                      padding: '9px 18px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Tải File Mẫu Excel (.xlsx)</span>
                  </a>

                  <a
                    href="/api/auth/template/csv"
                    download="Mau_Nhap_Lieu_Hoc_Vien_T04.csv"
                    onClick={() => showToast('success', 'Đang tải file mẫu CSV "Mau_Nhap_Lieu_Hoc_Vien_T04.csv"...')}
                    style={{
                      padding: '9px 18px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0B1E36',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <FileText size={16} color="#059669" />
                    <span>Tải File Mẫu (.csv)</span>
                  </a>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div style={{
                background: '#FFFFFF',
                border: '2px dashed #94A3B8',
                borderRadius: '10px',
                padding: '30px',
                textAlign: 'center',
                marginBottom: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Upload size={26} color="#1E40AF" />
                </div>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0B1E36', margin: '0 0 6px' }}>
                  {excelFileName ? `Đã chọn file: ${excelFileName}` : 'BƯỚC 2: CHỌN HOẶC KÉO THẢ FILE EXCEL ĐÃ ĐIỀN VÀO ĐÂY'}
                </h5>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
                  Hỗ trợ định dạng Microsoft Excel (.xlsx, .xls) và Comma Separated Values (.csv).
                </p>
                <button
                  type="button"
                  style={{
                    marginTop: '12px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F1F5F9',
                    color: '#1E293B',
                    cursor: 'pointer'
                  }}
                >
                  Duyệt file từ máy tính...
                </button>
              </div>

              {/* Parsed Excel Preview Section */}
              {parsedExcelStudents.length > 0 && (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} color="#059669" />
                        BƯỚC 3: XÁC NHẬN DỮ LIỆU ĐÃ ĐỌC ĐƯỢC TỪ FILE ({parsedExcelStudents.length} HỌC VIÊN)
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                        Kiểm tra lại danh sách trước khi hệ thống tự động khởi tạo tài khoản và phân quyền.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => { setParsedExcelStudents([]); setExcelFileName(''); }}
                        style={{
                          padding: '7px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #FECACA',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Hủy file này</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitExcelImport}
                        disabled={importing}
                        className="btn-upload-primary"
                        style={{
                          padding: '8px 20px',
                          fontSize: '13px',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #1E3A8A 0%, #0B1E36 100%)',
                          cursor: importing ? 'wait' : 'pointer'
                        }}
                      >
                        {importing ? <RefreshCw size={15} className="spin-slow" /> : <Sparkles size={15} color="#FDE047" />}
                        <span>{importing ? 'Đang nạp dữ liệu...' : `⚡ Nạp ${parsedExcelStudents.length} Học Viên Lên Hệ Thống`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div style={{ overflowX: 'auto', maxHeight: '320px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 10 }}>
                        <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                          <SortableTh field="index" sortField={excelSortField} sortDirection={excelSortDirection} onSort={handleExcelSort} style={{ padding: '8px 12px', fontWeight: 800, color: '#475569' }}>STT</SortableTh>
                          <SortableTh field="studentCode" sortField={excelSortField} sortDirection={excelSortDirection} onSort={handleExcelSort} style={{ padding: '8px 12px', fontWeight: 800, color: '#475569' }}>Mã sinh viên *</SortableTh>
                          <SortableTh field="fullName" sortField={excelSortField} sortDirection={excelSortDirection} onSort={handleExcelSort} style={{ padding: '8px 12px', fontWeight: 800, color: '#475569' }}>Họ và tên</SortableTh>
                          <SortableTh field="classCode" sortField={excelSortField} sortDirection={excelSortDirection} onSort={handleExcelSort} style={{ padding: '8px 12px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>Lớp học vụ</SortableTh>
                          <SortableTh field="phone" sortField={excelSortField} sortDirection={excelSortDirection} onSort={handleExcelSort} style={{ padding: '8px 12px', fontWeight: 800, color: '#475569' }}>Số điện thoại</SortableTh>
                          <SortableTh field="email" sortField={excelSortField} sortDirection={excelSortDirection} onSort={handleExcelSort} style={{ padding: '8px 12px', fontWeight: 800, color: '#475569' }}>Email</SortableTh>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedExcelStudents.map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                            <td style={{ padding: '8px 12px', color: '#94A3B8', fontWeight: 700 }}>{s.index}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, fontFamily: 'monospace', color: '#1E3A8A' }}>{s.studentCode}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0B1E36' }}>{cleanStudentName(s.fullName)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1E40AF' }}>
                                {s.classCode}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>{s.phone || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>{s.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3B. PROVISION TAB: CẤP HÀNG LOẠT THEO DẢI LỚP (RANGE BATCH) */}
          {tab === 'batch' && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              {/* Presets */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#D97706" />
                  Mẫu Cấu Hình Nhanh Theo Yêu Cầu Thực Tế:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('(001->055)_DT5B', 1, 55, 3, '_DT5B', 'DT5B', 'Lớp Đào tạo Nghiệp vụ DT5B')}
                    style={{ fontSize: '12.5px', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', background: pattern === '(001->055)_DT5B' ? '#0B1E36' : '#FFFFFF', color: pattern === '(001->055)_DT5B' ? '#FDE047' : '#0B1E36', border: '1px solid #CBD5E1' }}
                  >
                    🎯 (001-&gt;055)_DT5B (55 học viên)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('(001->060)_VB2D5B', 1, 60, 3, '_VB2D5B', 'VB2D5B', 'Lớp Văn bằng 2 D5B')}
                    style={{ fontSize: '12.5px', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', background: pattern === '(001->060)_VB2D5B' ? '#0B1E36' : '#FFFFFF', color: pattern === '(001->060)_VB2D5B' ? '#FDE047' : '#0B1E36', border: '1px solid #CBD5E1' }}
                  >
                    🏛️ (001-&gt;060)_VB2D5B (60 học viên)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('(01->45)_ANM3', 1, 45, 2, '_ANM3', 'ANM3', 'Lớp An ninh mạng K3')}
                    style={{ fontSize: '12.5px', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', background: pattern === '(01->45)_ANM3' ? '#0B1E36' : '#FFFFFF', color: pattern === '(01->45)_ANM3' ? '#FDE047' : '#0B1E36', border: '1px solid #CBD5E1' }}
                  >
                    🛡️ (01-&gt;45)_ANM3 (45 học viên)
                  </button>
                </div>
              </div>

              <form onSubmit={handleBatchProvision}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Pattern input */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Cú pháp chuỗi dải cấp tài khoản (Pattern) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={pattern}
                      onChange={(e) => handlePatternChange(e.target.value)}
                      placeholder="Ví dụ: (001->055)_DT5B"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#0B1E36', background: '#FFFFFF' }}
                      required
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                      Định dạng chuẩn: <code style={{ color: '#1E40AF', fontWeight: 700 }}>(từ_số-&gt;đến_số)_mã_lớp</code>. Tự động nhận diện padding và mã lớp.
                    </span>
                  </div>

                  {/* Range parameters */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Từ số
                    </label>
                    <input
                      type="number"
                      value={fromNum}
                      onChange={(e) => setFromNum(parseInt(e.target.value, 10) || 1)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: '#FFFFFF' }}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Đến số
                    </label>
                    <input
                      type="number"
                      value={toNum}
                      onChange={(e) => setToNum(parseInt(e.target.value, 10) || 1)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: '#FFFFFF' }}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Chữ số số 0 đệm (Padding)
                    </label>
                    <input
                      type="number"
                      value={padding}
                      onChange={(e) => setPadding(parseInt(e.target.value, 10) || 3)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: '#FFFFFF' }}
                      min="1"
                      max="6"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Mã lớp học vụ
                    </label>
                    <input
                      type="text"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      placeholder="DT5B"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700, background: '#FFFFFF' }}
                      required
                    />
                  </div>
                </div>

                {/* Real-time Preview Card */}
                <div style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                      👁️ Xem Trước Danh Sách Tài Khoản Sẽ Sinh Tự Động:
                    </div>
                    <div style={{ fontSize: '13px', color: '#1E3A8A' }}>
                      Số lượng: <strong style={{ color: '#B91C1C', fontSize: '15px' }}>{previewCount} tài khoản</strong> |
                      Mẫu sinh viên: <code style={{ fontWeight: 800, color: '#0B1E36' }}>{previewSample.join(', ')} ... {previewLast}</code>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
                      <strong style={{ color: '#059669' }}>Bảo mật tài khoản:</strong> Mật khẩu khởi tạo được mã hóa an toàn, tự động kích hoạt cờ yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-upload-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: submitting ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, #1E3A8A 0%, #0B1E36 100%)',
                      boxShadow: '0 2px 6px rgba(11,30,54,0.25)'
                    }}
                  >
                    {submitting ? <RefreshCw size={16} className="spin-slow" /> : <Sparkles size={16} color="#FDE047" />}
                    <span>{submitting ? 'Đang cấp tài khoản...' : `⚡ Cấp ${previewCount} Tài Khoản Ngay`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3C. PROVISION TAB: CẤP ĐƠN LẺ (SINGLE) */}
          {tab === 'single' && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <form onSubmit={handleSingleProvision}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Mã sinh viên (Đồng thời là Username & Pass) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={singleCode}
                      onChange={(e) => setSingleCode(e.target.value)}
                      placeholder="Ví dụ: 074_vb2d5b"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700, fontFamily: 'monospace', background: '#FFFFFF' }}
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '3px' }}>
                      Ví dụ như trong yêu cầu: <code style={{ color: '#1E40AF', fontWeight: 700 }}>074_vb2d5b</code>
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Lớp học vụ <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={singleClass}
                      onChange={(e) => setSingleClass(e.target.value.toUpperCase())}
                      placeholder="VB2D5B hoặc DT5B"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 700, background: '#FFFFFF' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '6px' }}>
                      Họ và tên học viên (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={singleFullName}
                      onChange={(e) => setSingleFullName(e.target.value)}
                      placeholder="Để trống sẽ ghi Học viên [Mã SV]"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: '#FFFFFF' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-upload-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: submitting ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, #1E3A8A 0%, #0B1E36 100%)'
                    }}
                  >
                    {submitting ? <RefreshCw size={16} className="spin-slow" /> : <UserPlus size={16} />}
                    <span>{submitting ? 'Đang cấp tài khoản...' : '⚡ Cấp Tài Khoản Học Viên Này'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. RECENT PROVISION RESULTS BANNER */}
          {lastProvisionResult && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#16A34A" />
                  KẾT QUẢ CẤP TÀI KHOẢN VỪA THỰC HIỆN
                </div>
                <div style={{ fontSize: '12.5px', color: '#15803D', marginTop: '4px' }}>
                  Tạo mới: <strong>{lastProvisionResult.createdCount}</strong> học viên |
                  Đã tồn tại / cập nhật: <strong>{lastProvisionResult.skippedCount || lastProvisionResult.updatedCount || 0}</strong> học viên.
                  Dữ liệu tài khoản được bảo mật và yêu cầu đổi mật khẩu lần đầu.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopyAll}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #86EFAC',
                    background: '#FFFFFF',
                    color: '#166534',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Copy size={14} />
                  <span>Sao chép danh sách</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Xuất kết quả cấp tài khoản ra file Excel (.xlsx)"
                >
                  <FileSpreadsheet size={14} />
                  <span>Xuất Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #86EFAC',
                    background: '#FFFFFF',
                    color: '#166534',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Xuất kết quả cấp tài khoản ra file CSV (.csv)"
                >
                  <FileText size={14} />
                  <span>Xuất CSV (.csv)</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. STUDENT ROSTER TABLE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#A31A1A" />
                  Danh Sách Tài Khoản Đã Cấp Trong Hệ Thống ({totalCount || students.length} tài khoản)
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                  Đăng nhập bằng Mã sinh viên. Tự động cập nhật vào lớp học vụ tương ứng.
                </p>
              </div>

              {/* Filter and Search Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã SV, tên, SĐT, email..."
                    style={{ padding: '7px 12px 7px 32px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', width: '220px' }}
                  />
                </div>

                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    setSelectedClassFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', background: '#fff' }}
                >
                  <option value="ALL">Tất cả lớp học</option>
                  {classList.map(c => (
                    <option key={c} value={c}>Lớp {c}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="btn-upload-primary"
                  style={{ padding: '7px 14px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Tìm kiếm
                </button>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                      loadStudents(1, pageSize, '', selectedClassFilter);
                    }}
                    className="btn-action-delete"
                    style={{ padding: '7px 10px', fontSize: '12px' }}
                  >
                    Xóa tìm
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => loadStudents(currentPage, pageSize, searchQuery, selectedClassFilter)}
                  disabled={loading}
                  className="btn-icon-secondary"
                  style={{ padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}
                  title="Làm mới danh sách"
                >
                  <RefreshCw size={14} className={loading ? 'spin-slow' : ''} />
                  <span>Làm mới</span>
                </button>
              </form>
            </div>

            {/* Table */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <SortableTh field="id" sortField={studentSortField} sortDirection={studentSortDirection} onSort={handleStudentSort} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>STT</SortableTh>
                      <SortableTh field="username" sortField={studentSortField} sortDirection={studentSortDirection} onSort={handleStudentSort} style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Tên đăng nhập</SortableTh>
                      <SortableTh field="fullName" sortField={studentSortField} sortDirection={studentSortDirection} onSort={handleStudentSort} style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Họ và tên</SortableTh>
                      <SortableTh field="classCode" sortField={studentSortField} sortDirection={studentSortDirection} onSort={handleStudentSort} style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Lớp học vụ</SortableTh>
                      <SortableTh field="mustChangePassword" sortField={studentSortField} sortDirection={studentSortDirection} onSort={handleStudentSort} style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Trạng thái hồ sơ</SortableTh>
                      <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Thao tác kiểm thử</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                          Không có tài khoản học viên nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      sortedStudents.map((st, idx) => {
                        const isCurrentActive = currentUser?.username === st.username;
                        const sttNumber = (currentPage - 1) * pageSize + idx + 1;

                        return (
                          <tr
                            key={st.id}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isCurrentActive ? '#FEFCE8' : (idx % 2 === 0 ? '#FFFFFF' : '#FBFCFE'),
                              transition: 'background 0.15s'
                            }}
                          >
                            <td style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: 700, fontSize: '12px' }}>
                              {sttNumber}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 800, fontFamily: 'monospace', color: '#0B1E36', fontSize: '13.5px' }}>
                              {st.username}
                              {isCurrentActive && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', background: '#CA8A04', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                                  Đang chọn
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>
                              {cleanStudentName(st.fullName)}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1E40AF' }}>
                                  {st.classCode || 'DT5B'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChangeClassModalStudent(st);
                                    setTargetNewClassCode(st.classCode || 'DT5B');
                                  }}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '10.5px',
                                    background: '#F1F5F9',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '4px',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                  title="Chuyển học viên vào lớp khác"
                                >
                                  Đổi lớp
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {st.mustChangePassword ? (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Unlock size={12} />
                                  <span>Chờ đổi pass lần đầu</span>
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#DEF7EC', color: '#03543F', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Lock size={12} />
                                  <span>Đã khóa hồ sơ cố định</span>
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                {/* Quick Test Switch Login */}
                                <button
                                  onClick={() => {
                                    onSwitchUser(st.username);
                                    showToast('success', `Đã chuyển sang tài khoản học viên ${st.username} để kiểm thử!`);
                                  }}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    borderRadius: '5px',
                                    border: '1px solid #BFDBFE',
                                    background: isCurrentActive ? '#0B1E36' : '#EFF6FF',
                                    color: isCurrentActive ? '#FDE047' : '#1E40AF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Đăng nhập ngay dưới vai trò sinh viên này để test giao diện"
                                >
                                  <LogIn size={13} />
                                  <span>{isCurrentActive ? 'Đang xem' : '⚡ Test Login'}</span>
                                </button>

                                {/* Simulate Self-Service Change Password */}
                                <button
                                  onClick={() => handleOpenProfileModal(st)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    borderRadius: '5px',
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#334155',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Cập nhật thông tin & đổi mật khẩu học viên"
                                >
                                  <Key size={13} />
                                  <span>Đổi pass</span>
                                </button>

                                {/* Reset default pass */}
                                <button
                                  onClick={() => handleResetPassword(st)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '5px',
                                    border: '1px solid #FECACA',
                                    background: '#FEF2F2',
                                    color: '#DC2626',
                                    cursor: 'pointer'
                                  }}
                                  title="Khôi phục mật khẩu về mặc định (Mã SV)"
                                >
                                  Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION COMPONENT */}
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                totalCount={totalCount || students.length}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                pageSizeOptions={[10, 15, 25, 50]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CHUYỂN / ĐỔI LỚP HỌC VỤ CHO HỌC VIÊN */}
      {changeClassModalStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800, color: '#0B1E36', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} color="#2563EB" />
              Chuyển / Gán Lớp Học Vụ
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 16px 0' }}>
              Học viên: <strong style={{ color: '#0B1E36' }}>{changeClassModalStudent.fullName}</strong> ({changeClassModalStudent.username})
              <br />
              Lớp hiện tại: <span style={{ color: '#A31A1A', fontWeight: 700 }}>{changeClassModalStudent.classCode || 'DT5B'}</span>
            </p>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Chọn lớp học vụ chuyển tới:
            </label>
            <select
              value={targetNewClassCode}
              onChange={(e) => setTargetNewClassCode(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                background: '#FFFFFF'
              }}
            >
              <option value="DT5B">Lớp DT5B (Khóa Đào tạo Nghiệp vụ DT5B)</option>
              <option value="DT5A">Lớp DT5A (Khóa Đào tạo Nghiệp vụ DT5A)</option>
              <option value="VB2D5B">Lớp VB2D5B (Văn bằng 2 Đại học CAND)</option>
              <option value="ANQP_K1">Lớp ANQP_K1 (Chuyên ngành An ninh Điều tra)</option>
              {academicClasses
                .filter(ac => !['DT5B', 'DT5A', 'VB2D5B', 'ANQP_K1'].includes(ac.code))
                .map(ac => (
                  <option key={ac.code} value={ac.code}>Lớp {ac.code} - {ac.name}</option>
                ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setChangeClassModalStudent(null)}
                className="btn-action-secondary"
                style={{ padding: '7px 16px', fontSize: '12.5px' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleChangeClassSubmit}
                disabled={changingClass}
                className="btn-action-primary"
                style={{ padding: '7px 18px', fontSize: '12.5px' }}
              >
                {changingClass ? 'Đang cập nhật...' : 'Xác nhận chuyển lớp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL SIMULATE CHANGE PASSWORD & LOCK PROFILE */}
      {profileModalStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0B1E36 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  ĐỔI MẬT KHẨU & CẬP NHẬT HỒ SƠ HỌC VIÊN
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  Học viên: <strong style={{ color: '#FDE047' }}>{profileModalStudent.username}</strong> ({profileModalStudent.classCode})
                </p>
              </div>
              <button
                onClick={() => setProfileModalStudent(null)}
                style={{ border: 'none', background: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProfileUpdate} style={{ padding: '24px' }}>
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#92400E',
                marginBottom: '16px'
              }}>
                🔒 <strong>Lưu ý quan trọng:</strong> Mã sinh viên và tên đăng nhập <code style={{ fontWeight: 800 }}>{profileModalStudent.username}</code> sẽ bị <strong>khóa vĩnh viễn không cho chỉnh sửa lại</strong> sau khi lưu thông tin.
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '4px' }}>
                  Mã sinh viên / Tên đăng nhập (Bị khóa)
                </label>
                <input
                  type="text"
                  value={profileModalStudent.username}
                  disabled
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#64748B', fontWeight: 700, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '4px' }}>
                  Mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0B1E36', marginBottom: '4px' }}>
                  Họ và tên học viên đầy đủ
                </label>
                <input
                  type="text"
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B1E36', marginBottom: '4px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0987654321"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B1E36', marginBottom: '4px' }}>
                    Email liên lạc
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="hocvien@t04.gov.vn"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalStudent(null)}
                  style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn-upload-primary"
                  style={{ padding: '9px 20px', fontWeight: 700, cursor: updatingProfile ? 'wait' : 'pointer' }}
                >
                  {updatingProfile ? 'Đang lưu...' : 'Lưu & Khóa Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
