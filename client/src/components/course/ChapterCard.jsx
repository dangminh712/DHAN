import React from 'react'
import { ArrowRight, FileText } from 'lucide-react'

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
      <a className="course-secondary-button" href={`#/mon-hoc/${courseId}/chuong/${chapter.id}`}>
        Xem tài liệu <ArrowRight size={17} aria-hidden="true" />
      </a>
    </article>
  )
}
