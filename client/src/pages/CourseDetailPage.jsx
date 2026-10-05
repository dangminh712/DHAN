import React, { useDeferredValue, useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, FileText, Layers3 } from 'lucide-react'
import ChapterCard from '../components/course/ChapterCard'
import CourseFilters from '../components/course/CourseFilters'
import MaterialRow from '../components/course/MaterialRow'
import { courseService } from '../services/courseService'
import '../styles/courses.css'

export default function CourseDetailPage({ courseId, currentUser, onOpenMaterial }) {
  const [course, setCourse] = useState(null)
  const [search, setSearch] = useState('')
  const [chapterId, setChapterId] = useState('ALL')
  const [format, setFormat] = useState('ALL')
  const [materials, setMaterials] = useState([])
  const [status, setStatus] = useState('loading')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const controller = new AbortController()
    courseService.getDetail(courseId, { userId: currentUser?.id, signal: controller.signal })
      .then((data) => { setCourse(data); setStatus('ready') })
      .catch((error) => { if (error.name !== 'CanceledError') setStatus('error') })
    return () => controller.abort()
  }, [courseId, currentUser?.id])

  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!deferredSearch.trim() && chapterId === 'ALL' && format === 'ALL') { setMaterials([]); setIsSearching(false); return }
    const controller = new AbortController()
    setIsSearching(true)
    courseService.searchMaterials(courseId, { userId: currentUser?.id, q: deferredSearch, chapterId, format, signal: controller.signal })
      .then((data) => { setMaterials(data); setIsSearching(false); })
      .catch((error) => { if (error.name !== 'CanceledError') { setMaterials([]); setIsSearching(false); } })
    return () => controller.abort()
  }, [courseId, currentUser?.id, deferredSearch, chapterId, format])

  if (status === 'loading') {
    return (
      <main className="course-shell">
        <div style={{ width: '130px', height: '24px', marginBottom: '16px' }} className="skeleton-shimmer" />
        <div className="course-skeleton-heading">
          <div style={{ width: '54px', height: '54px', flexShrink: 0 }} className="skeleton-shimmer" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '80px', height: '16px' }} className="skeleton-shimmer" />
            <div style={{ width: '55%', height: '28px' }} className="skeleton-shimmer" />
            <div style={{ width: '40%', height: '16px' }} className="skeleton-shimmer" />
          </div>
          <div style={{ width: '160px', height: '44px' }} className="skeleton-shimmer" />
        </div>
        <div style={{ width: '100%', height: '54px', marginBottom: '20px' }} className="skeleton-shimmer" />
        <div className="course-skeleton-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="course-skeleton-item skeleton-shimmer" />
          ))}
        </div>
      </main>
    );
  }
  if (status === 'error' || !course) return <main className="course-shell"><div className="course-state course-state--error">Không tìm thấy môn học hoặc bạn không có quyền truy cập.</div></main>
  const filtering = deferredSearch.trim() || chapterId !== 'ALL' || format !== 'ALL'

  return (
    <main className="course-shell">
      <a className="course-back-link" href="#/mon-hoc"><ChevronLeft size={18} /> Tất cả môn học</a>
      <header className="course-detail-heading">
        <div className="course-detail-heading__icon"><BookOpen size={28} /></div>
        <div><span className="course-code">{course.code}</span><h1>{course.name}</h1><p>{course.description}</p></div>
        <div className="course-summary-stats"><span><Layers3 size={19} /><strong>{course.chapterCount}</strong> chương</span><span><FileText size={19} /><strong>{course.materialCount}</strong> tài liệu</span></div>
      </header>
      {course.responsibleTeacherName && <aside className="course-responsibility" aria-label="Giảng viên phụ trách đã đối chiếu"><strong>Giảng viên phụ trách: {course.responsibleTeacherName}</strong><p>Nguồn xác nhận: {course.responsibilitySource}</p></aside>}
      <CourseFilters search={search} onSearch={setSearch} format={format} onFormat={setFormat} chapters={course.chapters} chapterId={chapterId} onChapter={setChapterId} />
      {filtering ? (
        <section className="material-section">
          <div className="section-heading">
            <div>
              <span>Kết quả tìm kiếm</span>
              <h2>{isSearching ? 'Đang tìm kiếm...' : `${materials.length} tài liệu phù hợp`}</h2>
            </div>
          </div>
          <div className="material-list">
            {materials.map((material) => <MaterialRow key={material.id} material={material} currentUser={currentUser} onOpen={onOpenMaterial} showChapter />)}
            {!isSearching && materials.length === 0 && <div className="course-state">Không tìm thấy tài liệu phù hợp với bộ lọc.</div>}
          </div>
        </section>
      ) : (
        <section className="chapter-section"><div className="section-heading"><div><span>Nội dung môn học</span><h2>Danh sách {course.chapters.length} chương</h2></div></div><div className="chapter-list">{course.chapters.map((chapter) => <ChapterCard key={chapter.id} courseId={course.id} chapter={chapter} />)}</div></section>
      )}
    </main>
  )
}
