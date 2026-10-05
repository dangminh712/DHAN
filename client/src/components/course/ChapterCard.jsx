import React from 'react'
import { ArrowRight, FileText, GraduationCap } from 'lucide-react'

export default function ChapterCard({ courseId, chapter }) {
  return (
    <article className="chapter-card">
      <div className="chapter-number" aria-hidden="true">{String(chapter.chapterNumber).padStart(2, '0')}</div>
      <div className="chapter-card__content">
        <span className="chapter-eyebrow">Chương {chapter.chapterNumber}</span>
        <h3>{chapter.title}</h3>
        <p>{chapter.description || 'Tài liệu học tập và tư liệu chuyên môn của chương.'}</p>
        <div className="chapter-meta">
          <span><FileText size={16} /> {chapter.materialCount} tài liệu</span>
          {chapter.formats?.slice(0, 4).map((format) => <span className="format-tag" key={format}>{format}</span>)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
        <a className="course-secondary-button" href={`#/mon-hoc/${courseId}/chuong/${chapter.id}`}>
          Xem tài liệu <ArrowRight size={16} aria-hidden="true" />
        </a>
        <a 
          className="portal-button portal-button--primary" 
          href={`#/study/${courseId}`}
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
        >
          <GraduationCap size={15} /> Phòng học
        </a>
      </div>
    </article>
  )
}
