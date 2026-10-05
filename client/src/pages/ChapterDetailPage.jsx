import React, { useDeferredValue, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, GraduationCap } from 'lucide-react'
import CourseFilters from '../components/course/CourseFilters'
import MaterialRow from '../components/course/MaterialRow'
import { courseService } from '../services/courseService'
import '../styles/courses.css'

export default function ChapterDetailPage({ courseId, chapterId, currentUser, onOpenMaterial }) {
  const [chapter, setChapter] = useState(null)
  const [search, setSearch] = useState('')
  const [format, setFormat] = useState('ALL')
  const [status, setStatus] = useState('loading')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const controller = new AbortController()
    if (!chapter) setStatus('loading')
    courseService.getChapter(courseId, chapterId, { userId: currentUser?.id, format, search: deferredSearch, signal: controller.signal })
      .then((data) => { setChapter(data); setStatus('ready') })
      .catch((error) => { if (error.name !== 'CanceledError') setStatus('error') })
    return () => controller.abort()
  }, [courseId, chapterId, currentUser?.id, deferredSearch, format])

  if (status === 'loading' && !chapter) {
    return (
      <main className="course-shell">
        <div style={{ width: '220px', height: '20px', marginBottom: '14px' }} className="skeleton-shimmer" />
        <div style={{ width: '140px', height: '20px', marginBottom: '16px' }} className="skeleton-shimmer" />
        <div className="chapter-detail-heading" style={{ borderLeft: '5px solid #CBD5E1' }}>
          <div style={{ width: '70px', height: '14px', marginBottom: '8px' }} className="skeleton-shimmer" />
          <div style={{ width: '50%', height: '28px', marginBottom: '8px' }} className="skeleton-shimmer" />
          <div style={{ width: '30%', height: '16px' }} className="skeleton-shimmer" />
        </div>
        <div style={{ width: '100%', height: '54px', margin: '20px 0' }} className="skeleton-shimmer" />
        <div className="course-skeleton-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="course-skeleton-item skeleton-shimmer" />
          ))}
        </div>
      </main>
    );
  }
  if (status === 'error' || !chapter) return <main className="course-shell"><div className="course-state course-state--error">Không tìm thấy chương hoặc bạn không có quyền truy cập.</div></main>

  return (
    <main className="course-shell">
      <nav className="course-breadcrumb" aria-label="Đường dẫn"><a href="#/mon-hoc">Môn học</a><ChevronRight size={15} /><a href={`#/mon-hoc/${courseId}`}>{chapter.courseName}</a><ChevronRight size={15} /><span>Chương {chapter.chapterNumber}</span></nav>
      <a className="course-back-link" href={`#/mon-hoc/${courseId}`}><ChevronLeft size={18} /> Trở lại môn học</a>
      <header className="chapter-detail-heading">
        <span>Chương {chapter.chapterNumber}</span>
        <h1>{chapter.title}</h1>
        <p>{chapter.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '14px' }}>
          <div><FileText size={18} /> {chapter.materialCount} tài liệu</div>
          <a
            href={`#/study/${courseId}`}
            className="portal-button portal-button--primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <GraduationCap size={18} />
            <span>Vào phòng học chuyên đề 5 phần</span>
          </a>
        </div>
      </header>
      <CourseFilters search={search} onSearch={setSearch} format={format} onFormat={setFormat} />
      <section className="material-section"><div className="section-heading"><div><span>Học liệu của chương</span><h2>Danh sách tài liệu</h2></div></div><div className="material-list">{chapter.materials.map((material) => <MaterialRow key={material.id} material={material} currentUser={currentUser} onOpen={onOpenMaterial} />)}{chapter.materials.length === 0 && <div className="course-state">Chưa có tài liệu phù hợp.</div>}</div></section>
    </main>
  )
}
