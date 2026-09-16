import React, { useDeferredValue, useEffect, useState } from 'react'
import { BookOpen, RefreshCw, Search } from 'lucide-react'
import CourseCard from '../components/course/CourseCard'
import { courseService } from '../services/courseService'
import '../styles/courses.css'

export default function CoursesPage({ currentUser }) {
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    courseService.list({ userId: currentUser?.id, search: deferredSearch, signal: controller.signal })
      .then((data) => { setCourses(Array.isArray(data) ? data : data?.items || []); setStatus('ready') })
      .catch((error) => { if (error.name !== 'CanceledError') setStatus('error') })
    return () => controller.abort()
  }, [currentUser?.id, deferredSearch])

  return (
    <main className="course-shell">
      <header className="course-page-heading">
        <div><span className="course-kicker">Kho học liệu số</span><h1>Danh sách môn học</h1><p>Chọn môn học để xem chương và tài liệu được phép truy cập.</p></div>
        <div className="course-heading-mark" aria-hidden="true"><BookOpen size={28} /></div>
      </header>
      <label className="catalog-search">
        <Search size={22} aria-hidden="true" />
        <span className="sr-only">Tìm môn học</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc mã môn học..." autoComplete="off" />
      </label>
      <div className="course-results-label"><strong>{courses.length}</strong> môn học phù hợp</div>
      {status === 'loading' && <div className="course-state" role="status">Đang tải danh sách môn học...</div>}
      {status === 'error' && <div className="course-state course-state--error"><p>Không thể tải danh sách môn học.</p><button onClick={() => window.location.reload()}><RefreshCw size={18} /> Thử lại</button></div>}
      {status === 'ready' && courses.length === 0 && <div className="course-state"><BookOpen size={42} /><p>Không tìm thấy môn học phù hợp.</p></div>}
      {status === 'ready' && courses.length > 0 && <section className="course-grid" aria-label="Các môn học">{courses.map((course) => <CourseCard course={course} key={course.id} />)}</section>}
    </main>
  )
}
