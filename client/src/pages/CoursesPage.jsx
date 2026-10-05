import React, { useDeferredValue, useEffect, useMemo, useReducer, useState } from 'react'
import { BookOpen, PlusCircle, RefreshCw, Search, X } from 'lucide-react'
import CourseCard from '../components/course/CourseCard'
import AcademicModal from '../components/common/AcademicModal'
import { courseCollectionReducer, initialCourseCollectionState } from '../courseCollectionState'
import { courseService } from '../services/courseService'
import { selectCatalogCourses } from '../courseCatalog'
import '../styles/courses.css'

export default function CoursesPage({ currentUser }) {
  const [{ courses, status }, dispatchCourses] = useReducer(courseCollectionReducer, initialCourseCollectionState)
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('search') || '')
  const [onlyReady, setOnlyReady] = useState(false)
  const [sort, setSort] = useState('name')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const deferredSearch = useDeferredValue(search)
  const visibleCourses = useMemo(() => selectCatalogCourses(courses, { search: deferredSearch, onlyReady, sort }), [courses, deferredSearch, onlyReady, sort])

  const loadCourses = () => {
    dispatchCourses({ type: 'start' })
    courseService.list({ userId: currentUser?.id })
      .then((data) => dispatchCourses({ type: 'ready', courses: Array.isArray(data) ? data : data?.items || [] }))
      .catch((error) => { if (error.name !== 'CanceledError') dispatchCourses({ type: 'error' }) })
  }

  useEffect(() => {
    const controller = new AbortController()
    dispatchCourses({ type: 'start' })
    courseService.list({ userId: currentUser?.id, signal: controller.signal })
      .then((data) => dispatchCourses({ type: 'ready', courses: Array.isArray(data) ? data : data?.items || [] }))
      .catch((error) => { if (error.name !== 'CanceledError') dispatchCourses({ type: 'error' }) })
    return () => controller.abort()
  }, [currentUser?.id])

  return (
    <main className="course-shell">
      <header className="course-page-heading">
        <div><span className="course-kicker">Kho học liệu số</span><h1>Danh sách môn học</h1><p>Tìm kiếm và truy cập nội dung đào tạo được phân quyền cho tài khoản của đồng chí.</p></div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            type="button"
            className="portal-button portal-button--primary"
            onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={18} />
            <span>Thêm môn học</span>
          </button>
          <div className="course-heading-summary" aria-label={`${visibleCourses.length} môn học phù hợp`}><strong>{status === 'ready' ? visibleCourses.length : '—'}</strong><span>Môn học<br />phù hợp</span></div>
        </div>
      </header>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <Search size={21} aria-hidden="true" />
          <span className="sr-only">Tìm môn học</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, mã hoặc mô tả môn học..." autoComplete="off" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Xóa từ khóa tìm kiếm"><X size={18} /></button>}
        </label>
        <span className="course-results-label" role="status">{status === 'loading' ? 'Đang tải môn học…' : status === 'error' ? 'Chưa tải được dữ liệu' : <>Hiển thị <strong>{visibleCourses.length}</strong> kết quả</>}</span>
      </div>
      <div className="catalog-options">
        <label className="catalog-ready"><input type="checkbox" checked={onlyReady} onChange={event => setOnlyReady(event.target.checked)} /> Chỉ hiện môn có học liệu</label>
        <label className="catalog-sort">Sắp xếp theo <select value={sort} onChange={event => setSort(event.target.value)}><option value="name">Tên môn học A–Z</option><option value="materials">Nhiều học liệu nhất</option></select></label>
      </div>
      {status === 'loading' && courses.length === 0 && (
        <section className="course-grid" aria-label="Đang tải danh sách môn học">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="course-card skeleton-shimmer" style={{ height: '220px' }} />
          ))}
        </section>
      )}
      {status === 'error' && courses.length === 0 && <div className="course-state course-state--error"><p>Không thể tải danh sách môn học.</p><button onClick={() => window.location.reload()}><RefreshCw size={18} /> Thử lại</button></div>}
      {status === 'ready' && visibleCourses.length === 0 && <div className="course-state"><BookOpen size={42} /><strong>Không tìm thấy môn học</strong><p>Thử một từ khóa ngắn hơn hoặc bỏ bộ lọc học liệu.</p>{(search || onlyReady) && <button type="button" onClick={() => { setSearch(''); setOnlyReady(false) }}>Xóa tìm kiếm và bộ lọc</button>}</div>}
      {visibleCourses.length > 0 && <section className="course-grid" aria-label="Các môn học">{visibleCourses.map((course) => <CourseCard course={course} key={course.id} />)}</section>}
      <AcademicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="subject"
        itemToEdit={editingCourse}
        onSaved={loadCourses}
      />
    </main>
  )
}
