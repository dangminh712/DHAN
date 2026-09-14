import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  PlusCircle,
  Edit,
  Trash2,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
  Building,
  Users,
  Search
} from 'lucide-react';
import { academicService } from '../services/academicService';
import AcademicModal from '../components/common/AcademicModal';
import ClassRosterModal from '../components/common/ClassRosterModal';
import { SortableTh, useTableSort } from '../utils/tableSort';

export default function AcademicPage({ academicUnits: propUnits = [], academicSubjects: propSubjects = [] }) {
  const [units, setUnits] = useState(propUnits);
  const [subjects, setSubjects] = useState(propSubjects);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('subject'); // 'subject' | 'class'
  const [itemToEdit, setItemToEdit] = useState(null);

  // Class Roster Modal State
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  const {
    sortedData: sortedSubjects,
    sortField: subjectSortField,
    sortDirection: subjectSortDirection,
    handleSort: handleSubjectSort
  } = useTableSort(subjects, 'code', 'asc');

  const filteredClasses = classes.filter(c =>
    !classSearch ||
    c.code?.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.name?.toLowerCase().includes(classSearch.toLowerCase())
  );

  const {
    sortedData: sortedClasses,
    sortField: classSortField,
    sortDirection: classSortDirection,
    handleSort: handleClassSort
  } = useTableSort(filteredClasses, 'code', 'asc');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, cRes] = await Promise.all([
        academicService.getUnits().catch(() => propUnits),
        academicService.getSubjects().catch(() => propSubjects),
        academicService.getClasses().catch(() => [])
      ]);
      setUnits(uRes || propUnits);
      setSubjects(sRes || propSubjects);
      setClasses(cRes || []);
    } catch (err) {
      console.error('Error loading academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleOpenCreateSubject = () => {
    setModalType('subject');
    setItemToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setModalType('subject');
    setItemToEdit(sub);
    setModalOpen(true);
  };

  const handleDeleteSubject = async (sub) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa môn học:\n"${sub.name} (${sub.code})"?`)) return;
    try {
      await academicService.deleteSubject(sub.id);
      showToast('success', `Đã xóa môn học ${sub.code} thành công.`);
      loadData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi xóa môn học.');
    }
  };

  const handleOpenCreateClass = () => {
    setModalType('class');
    setItemToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditClass = (cls) => {
    setModalType('class');
    setItemToEdit(cls);
    setModalOpen(true);
  };

  const handleDeleteClass = async (cls) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa lớp học vụ:\n"${cls.name} (${cls.code})"?`)) return;
    try {
      await academicService.deleteClass(cls.id);
      showToast('success', `Đã xóa lớp học vụ ${cls.code} thành công.`);
      loadData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi xóa lớp học vụ.');
    }
  };

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0B1E36',
    borderBottom: '2px solid #CBD5E1',
    background: '#F1F5F9',
    whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #E2E8F0',
    verticalAlign: 'middle'
  };

  return (
    <main className="main-content-layout" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="dvc-tabs-container">
        {/* HEADER */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #081729 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderKanban size={22} color="#FDE047" />
              QUẢN TRỊ CƠ CẤU HỌC VỤ & CHƯƠNG TRÌNH NGHIỆP VỤ (T04)
            </h3>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>
              Quản lý danh mục Khoa/Bộ môn, Môn học đào tạo nghiệp vụ và Lớp học vụ niên khóa.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleOpenCreateSubject}
              className="btn-upload-primary"
              style={{ padding: '8px 16px', fontSize: '12.5px', cursor: 'pointer', background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
            >
              <BookOpen size={15} />
              <span>+ Thêm Môn Học Mới</span>
            </button>

            <button
              onClick={handleOpenCreateClass}
              className="btn-icon-secondary"
              style={{ padding: '8px 16px', fontSize: '12.5px', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <GraduationCap size={15} />
              <span>+ Thêm Lớp Học Vụ</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTICE */}
        {message && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: message.type === 'success' ? '#DEF7EC' : '#FDE8E8',
            color: message.type === 'success' ? '#03543F' : '#9B1C1C',
            border: `1px solid ${message.type === 'success' ? '#31C48D' : '#F98080'}`
          }}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <div style={{ padding: '24px' }}>
          {/* 1. KHOA & BỘ MÔN */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={20} color="#A31A1A" />
                  1. Danh Mục Các Khoa & Bộ Môn Trực Thuộc ({units.length} đơn vị đào tạo)
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                  Cơ cấu tổ chức đào tạo nghiệp vụ bao gồm Khoa chuyên ngành và Bộ môn chuyên sâu trực thuộc T04.
                </p>
              </div>

              {/* STAT COUNTERS */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                  🏛️ {units.filter(u => u.unitType === 'FACULTY').length} Khoa Chuyên Ngành
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                  📚 {units.filter(u => u.unitType === 'DEPARTMENT').length} Bộ Môn Trực Thuộc
                </span>
              </div>
            </div>

            {/* A. CÁC KHOA CHUYÊN NGÀNH */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏛️ CÁC KHOA CHUYÊN NGÀNH</span>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#1E3A8A', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>
                  {units.filter(u => u.unitType === 'FACULTY').length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {units.filter(u => u.unitType === 'FACULTY').map((u) => (
                  <div key={u.id} style={{
                    background: '#FFFFFF',
                    border: '1px solid #BFDBFE',
                    borderLeft: '4px solid #1E40AF',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 4px rgba(30, 64, 175, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.5px'
                        }}>
                          KHOA CHUYÊN NGÀNH
                        </span>
                        <code style={{ fontSize: '11.5px', color: '#1E40AF', fontWeight: 700, background: '#EFF6FF', padding: '1px 6px', borderRadius: '4px' }}>
                          {u.code}
                        </code>
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0B1E36', lineHeight: 1.4 }}>
                        {u.name}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B' }}>
                      <span>Trực thuộc: <strong style={{ color: '#0B1E36' }}>{u.parentName || 'T04'}</strong></span>
                      {u.childCount > 0 && (
                        <span style={{ color: '#D97706', fontWeight: 700 }}>{u.childCount} bộ môn con</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B. CÁC BỘ MÔN TRỰC THUỘC */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📚 CÁC BỘ MÔN TRỰC THUỘC KHOA</span>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#D97706', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>
                  {units.filter(u => u.unitType === 'DEPARTMENT').length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {units.filter(u => u.unitType === 'DEPARTMENT').map((u) => (
                  <div key={u.id} style={{
                    background: '#FFFFFF',
                    border: '1px solid #FDE68A',
                    borderLeft: '4px solid #D97706',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.5px'
                        }}>
                          BỘ MÔN TRỰC THUỘC
                        </span>
                        <code style={{ fontSize: '11.5px', color: '#B45309', fontWeight: 700, background: '#FFFBEB', padding: '1px 6px', borderRadius: '4px' }}>
                          {u.code}
                        </code>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0B1E36', lineHeight: 1.4 }}>
                        {u.name}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B' }}>
                      <span>Khoa quản lý: <strong style={{ color: '#1E40AF' }}>{u.parentName || 'Khoa Chuyên ngành'}</strong></span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>● Hoạt động</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. MÔN HỌC */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#A31A1A" />
                2. Học Phần & Môn Học Nghiệp Vụ Chuyên Sâu ({subjects.length} môn)
              </h4>
              <button
                onClick={handleOpenCreateSubject}
                className="btn-upload-primary"
                style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}
              >
                <PlusCircle size={14} />
                <span>+ Thêm Môn Học</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <SortableTh field="code" sortField={subjectSortField} sortDirection={subjectSortDirection} onSort={handleSubjectSort} style={thStyle}>Mã môn</SortableTh>
                    <SortableTh field="name" sortField={subjectSortField} sortDirection={subjectSortDirection} onSort={handleSubjectSort} style={thStyle}>Tên học phần nghiệp vụ</SortableTh>
                    <SortableTh field="departmentName" sortField={subjectSortField} sortDirection={subjectSortDirection} onSort={handleSubjectSort} style={thStyle}>Khoa phụ trách</SortableTh>
                    <SortableTh field="credits" sortField={subjectSortField} sortDirection={subjectSortDirection} onSort={handleSubjectSort} style={{ ...thStyle, textAlign: 'center' }}>Số tín chỉ</SortableTh>
                    <SortableTh field="description" sortField={subjectSortField} sortDirection={subjectSortDirection} onSort={handleSubjectSort} style={thStyle}>Mô tả tóm tắt</SortableTh>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubjects.map((s) => (
                    <tr key={s.id} style={{ background: '#FFFFFF' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#A31A1A' }}>{s.code}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>{s.name}</td>
                      <td style={tdStyle}>{s.departmentName || s.facultyName || 'Khoa Nghiệp vụ T04'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#059669' }}>{s.credits || 3}</td>
                      <td style={{ ...tdStyle, color: '#64748B', maxWidth: '300px' }} className="truncate">{s.description || 'Chương trình đào tạo CAND chuẩn'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditSubject(s)}
                            className="btn-action-edit"
                            title="Chỉnh sửa môn học"
                          >
                            <Edit size={12} />
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSubject(s)}
                            className="btn-action-delete"
                            title="Xóa môn học"
                          >
                            <Trash2 size={12} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. LỚP HỌC VỤ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0B1E36', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} color="#2563EB" />
                3. Danh Sách Lớp Học Vụ & Niên Khóa Đào Tạo ({classes.length} lớp)
              </h4>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Tìm lớp học vụ..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 30px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      width: '180px'
                    }}
                  />
                </div>

                <button
                  onClick={handleOpenCreateClass}
                  className="btn-upload-primary"
                  style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                >
                  <PlusCircle size={14} />
                  <span>+ Thêm Lớp Học Vụ</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <SortableTh field="code" sortField={classSortField} sortDirection={classSortDirection} onSort={handleClassSort} style={thStyle}>Mã lớp</SortableTh>
                    <SortableTh field="name" sortField={classSortField} sortDirection={classSortDirection} onSort={handleClassSort} style={thStyle}>Tên lớp học vụ</SortableTh>
                    <SortableTh field="facultyName" sortField={classSortField} sortDirection={classSortDirection} onSort={handleClassSort} style={thStyle}>Khoa chủ quản</SortableTh>
                    <SortableTh field="academicYear" sortField={classSortField} sortDirection={classSortDirection} onSort={handleClassSort} style={thStyle}>Niên khóa</SortableTh>
                    <SortableTh field="semester" sortField={classSortField} sortDirection={classSortDirection} onSort={handleClassSort} style={thStyle}>Học kỳ</SortableTh>
                    <SortableTh field="studentCount" sortField={classSortField} sortDirection={classSortDirection} onSort={handleClassSort} style={{ ...thStyle, textAlign: 'center' }}>Sĩ số & Danh sách</SortableTh>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                        Chưa có dữ liệu lớp học vụ hoặc không khớp kết quả tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    sortedClasses.map((cls) => (
                      <tr key={cls.id} style={{ background: '#FFFFFF' }}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#1D4ED8' }}>{cls.code}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0B1E36' }}>{cls.name}</td>
                        <td style={tdStyle}>{cls.facultyName || 'T04'}</td>
                        <td style={tdStyle}>{cls.academicYear || '2025-2026'}</td>
                        <td style={tdStyle}>{cls.semester || 'Học kỳ 1'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedClassForRoster(cls);
                              setRosterModalOpen(true);
                            }}
                            className="btn-icon-secondary"
                            style={{
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            title="Bấm để xem danh sách toàn bộ học viên và thêm học viên vào lớp này"
                          >
                            <Users size={13} color="#2563EB" />
                            <span>{cls.studentCount ?? 0} học viên</span>
                            <span style={{ fontSize: '10px', opacity: 0.8, textDecoration: 'underline' }}>Xem DS</span>
                          </button>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEditClass(cls)}
                              className="btn-action-edit"
                              title="Chỉnh sửa lớp học vụ"
                            >
                              <Edit size={12} />
                              <span>Sửa</span>
                            </button>

                            <button
                              onClick={() => handleDeleteClass(cls)}
                              className="btn-action-delete"
                              title="Xóa lớp học vụ"
                            >
                              <Trash2 size={12} />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CLASS ROSTER MODAL */}
      <ClassRosterModal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        targetClass={selectedClassForRoster}
        onRosterChanged={loadData}
      />

      {/* ACADEMIC MODAL */}
      <AcademicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        itemToEdit={itemToEdit}
        onSaved={loadData}
      />
    </main>
  );
}
