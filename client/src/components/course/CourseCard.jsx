import React from 'react'
import { ArrowRight, BookOpen, FileText, Layers3 } from 'lucide-react'

export default function CourseCard({ course }) {
  return (
    <article className="course-card">
      <div className="course-card__icon" aria-hidden="true"><BookOpen size={24} /></div>
      <div className="course-card__body">
        <span className="course-code">{course.code}</span>
        <h2 title={course.name}>{course.name}</h2>
        <p>{course.description || 'Kho học liệu được tổ chức theo từng chương của môn học.'}</p>
        <div className="course-card__stats" aria-label="Thống kê môn học">
          <span><Layers3 size={17} /> {course.chapterCount} chương</span>
          <span><FileText size={17} /> {course.materialCount} tài liệu</span>
        </div>
      </div>
      <a className="course-primary-button" href={`#/mon-hoc/${course.id}`}>
        Xem môn học <ArrowRight size={18} aria-hidden="true" />
      </a>
    </article>
  )
}
