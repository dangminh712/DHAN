import React from 'react'
import { Filter, Search } from 'lucide-react'

export const FORMAT_OPTIONS = [
  ['ALL', 'Tất cả'], ['PDF', 'PDF'], ['VIDEO', 'Video'], ['POWERPOINT', 'PowerPoint'], ['WORD', 'Word'], ['IMAGE', 'Hình ảnh'],
]

export default function CourseFilters({ search, onSearch, format = 'ALL', onFormat, chapters, chapterId = 'ALL', onChapter }) {
  return (
    <div className="course-filters">
      <label className="course-search">
        <span className="sr-only">Tìm tài liệu</span>
        <Search size={21} aria-hidden="true" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tìm tên tài liệu, loại tài liệu hoặc nội dung chương..." />
      </label>
      <div className="course-filter-row">
        {chapters && (
          <label className="course-select">
            <span><Filter size={17} /> Chương</span>
            <select value={chapterId} onChange={(event) => onChapter(event.target.value)}>
              <option value="ALL">Tất cả chương</option>
              {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>Chương {chapter.chapterNumber} — {chapter.title}</option>)}
            </select>
          </label>
        )}
        {onFormat && <div className="format-filters" aria-label="Lọc theo định dạng">
          {FORMAT_OPTIONS.map(([value, label]) => (
            <button key={value} type="button" className={format === value ? 'active' : ''} onClick={() => onFormat(value)}>{label}</button>
          ))}
        </div>}
      </div>
    </div>
  )
}
