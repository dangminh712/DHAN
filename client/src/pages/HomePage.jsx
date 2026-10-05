import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { ArrowRight, BookOpen, Building2, FileText, Library, Search, ShieldCheck } from 'lucide-react'
import CourseCard from '../components/course/CourseCard'
import { courseCollectionReducer, initialCourseCollectionState } from '../courseCollectionState'
import { getPortalGreetingName } from '../portalGreeting'
import { courseService } from '../services/courseService'
import { selectCatalogCourses } from '../courseCatalog'

const quickLinks = [
  { href: '#/mon-hoc', icon: BookOpen, title: 'Khám phá môn học', text: 'Tra cứu chương và học liệu theo môn.' },
  { href: '#/bieu-mau', icon: FileText, title: 'Biểu mẫu CAND', text: 'Mở kho biểu mẫu nghiệp vụ dùng chung.' },
  { href: '#/academic', icon: Building2, title: 'Khoa & Bộ môn', text: 'Xem cơ cấu đơn vị và chương trình đào tạo.' },
]

export default function HomePage({ currentUser }) {
  const [{ courses, status }, dispatchCourses] = useReducer(courseCollectionReducer, initialCourseCollectionState)
  const [search, setSearch] = useState('')
  const featuredCourses = useMemo(() => selectCatalogCourses(courses, { onlyReady: true, sort: 'materials' }).slice(0, 3), [courses])

  useEffect(() => {
    const controller = new AbortController()
    dispatchCourses({ type: 'start' })
    courseService.list({ userId: currentUser?.id, signal: controller.signal })
      .then((data) => {
        dispatchCourses({ type: 'ready', courses: Array.isArray(data) ? data : data?.items || [] })
      })
      .catch((error) => {
        if (error.name !== 'CanceledError') dispatchCourses({ type: 'error' })
      })
    return () => controller.abort()
  }, [currentUser?.id])

  const totals = useMemo(() => courses.reduce((summary, course) => ({
    chapters: summary.chapters + Number(course.chapterCount || 0),
    materials: summary.materials + Number(course.materialCount || 0),
  }), { chapters: 0, materials: 0 }), [courses])

  const firstName = getPortalGreetingName(currentUser)

  return (
    <main className="portal-home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__content">
          <span className="portal-eyebrow"><ShieldCheck size={16} /> Cổng học liệu nội bộ T04</span>
          <span className="home-greeting">{currentUser ? `Chào đồng chí ${firstName}` : 'Chào mừng đồng chí đến với cổng học liệu'}</span>
          <h1 id="home-title">Tri thức vững vàng.<br />Nghiệp vụ tinh thông.</h1>
          <p>Tra cứu môn học, đọc giáo trình và sử dụng biểu mẫu nghiệp vụ. Học liệu được tổ chức rõ ràng theo từng chương.</p>
          <form className="home-search" role="search" onSubmit={(event) => { event.preventDefault(); window.location.hash = `/mon-hoc?search=${encodeURIComponent(search.trim())}` }}>
            <Search size={20} aria-hidden="true" />
            <label className="sr-only" htmlFor="home-course-search">Tìm kiếm môn học</label>
            <input id="home-course-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tên hoặc mã môn học…" maxLength={200} />
            <button type="submit">Tìm kiếm <ArrowRight size={17} aria-hidden="true" /></button>
          </form>
          <div className="home-hero__actions">
            <a className="portal-button portal-button--primary" href="#/mon-hoc"><BookOpen size={19} /> Danh mục môn học <ArrowRight size={18} /></a>
            <a className="portal-button portal-button--secondary" href="#/bieu-mau"><FileText size={19} /> Mở kho biểu mẫu</a>
          </div>
        </div>
        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-emblem"><img src="/assets/logo-dhan.jpg" alt="" /></div>
          <span>HỌC LIỆU SỐ</span>
          <strong>Chính xác · Bảo mật · Thuận tiện</strong>
        </div>
      </section>

      <section className="home-stats" aria-label="Thống kê kho học liệu">
        <article><span>Môn học</span><strong>{status === 'ready' ? courses.length : '—'}</strong><BookOpen aria-hidden="true" /></article>
        <article><span>Chương đào tạo</span><strong>{status === 'ready' ? totals.chapters : '—'}</strong><Library aria-hidden="true" /></article>
        <article><span>Tài liệu số</span><strong>{status === 'ready' ? totals.materials : '—'}</strong><FileText aria-hidden="true" /></article>
      </section>

      <section className="home-section" aria-labelledby="quick-access-title">
        <div className="portal-section-heading"><div><span className="portal-eyebrow">Truy cập nhanh</span><h2 id="quick-access-title">Bắt đầu từ đây</h2></div></div>
        <div className="home-quick-grid">
          {quickLinks.map(({ href, icon: Icon, title, text }) => (
            <a href={href} className="home-quick-card" key={href}>
              <span className="home-quick-card__icon"><Icon size={23} /></span>
              <span><strong>{title}</strong><small>{text}</small></span>
              <ArrowRight size={19} className="home-quick-card__arrow" />
            </a>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="featured-courses-title">
        <div className="portal-section-heading">
          <div><span className="portal-eyebrow">Nội dung đào tạo</span><h2 id="featured-courses-title">Môn học nổi bật</h2></div>
          <a href="#/mon-hoc">Xem tất cả <ArrowRight size={17} /></a>
        </div>
        {status === 'loading' && <div className="home-featured-grid" aria-label="Đang tải môn học">{[0, 1, 2].map((item) => <div className="course-card skeleton-shimmer" key={item} />)}</div>}
        {status === 'error' && <div className="portal-inline-state">Chưa thể tải môn học. Đồng chí vẫn có thể mở danh mục để thử lại.</div>}
        {status === 'ready' && featuredCourses.length === 0 && <div className="portal-inline-state">Chưa có học liệu để giới thiệu. Đồng chí có thể mở danh mục môn học hoặc kho biểu mẫu.</div>}
        {featuredCourses.length > 0 && <div className="home-featured-grid">{featuredCourses.map((course) => <CourseCard course={course} key={course.id} />)}</div>}
      </section>
      <section className="home-guide" aria-labelledby="home-guide-title">
        <div><span className="portal-eyebrow">Hướng dẫn sử dụng</span><h2 id="home-guide-title">Học tập trong 3 bước</h2><p>Dành cho đồng chí lần đầu sử dụng cổng học liệu.</p></div>
        <ol>
          <li><span>01</span><div><strong>Tìm môn học</strong><p>Nhập tên hoặc mã môn; có thể tìm không dấu.</p></div></li>
          <li><span>02</span><div><strong>Chọn chương cần học</strong><p>Xem nội dung và lọc tài liệu theo định dạng.</p></div></li>
          <li><span>03</span><div><strong>Đọc, xem và ôn tập</strong><p>Mở học liệu trực tiếp hoặc tải về khi được cấp quyền.</p></div></li>
        </ol>
      </section>
    </main>
  )
}
