import React from 'react'
import { Download, Eye, File, FileImage, FileSpreadsheet, FileText, Presentation, Video } from 'lucide-react'
import { formatFileSize, getMaterialFormat } from '../../courseSearch'
import { getMediaStreamUrl } from '../../pdfViewer'

const GROUP_LABELS = { LECTURE: 'Bài giảng', LESSON_PLAN: 'Giáo án', EXERCISE: 'Bài tập', QA: 'Câu hỏi và đáp án', REFERENCE: 'Tham khảo', OTHER: 'Tài liệu khác' }

function FormatIcon({ format }) {
  const Icon =
    format === 'VIDEO'
      ? Video
      : format === 'POWERPOINT'
      ? Presentation
      : format === 'IMAGE'
      ? FileImage
      : format === 'EXCEL'
      ? FileSpreadsheet
      : format === 'PDF' || format === 'WORD'
      ? FileText
      : File
  return <Icon size={23} aria-hidden="true" />
}

export default function MaterialRow({ material, currentUser, onOpen, showChapter = false }) {
  const format = getMaterialFormat(material)
  const downloadUrl = `/api/training/files/${material.fileId}/download?userId=${currentUser?.id || 1}&chapterId=${material.chapterId}`

  const getFormatLabel = (fmt) => {
    switch (fmt) {
      case 'EXCEL': return 'Bảng tính Excel'
      case 'WORD': return 'Văn bản Word'
      case 'POWERPOINT': return 'Slide PowerPoint'
      case 'IMAGE': return 'Hình ảnh'
      case 'VIDEO': return 'Video'
      case 'PDF': return 'Tài liệu PDF'
      default: return fmt
    }
  }

  return (
    <article className="material-row">
      <div className={`material-format material-format--${format.toLowerCase()}`}><FormatIcon format={format} /></div>
      <div className="material-main">
        <h3 title={material.originalName}>{material.originalName}</h3>
        <div className="material-meta">
          <span>{getFormatLabel(format)}</span>
          <span>{formatFileSize(material.fileSize)}</span>
          <span>{GROUP_LABELS[material.materialGroup] || GROUP_LABELS.OTHER}</span>
          {showChapter && <span>Chương {material.chapterNumber}: {material.chapterTitle}</span>}
        </div>
      </div>
      <div className="material-actions">
        <button type="button" className="course-primary-button" onClick={() => onOpen(material)} title="Xem tài liệu trực tiếp">
          <Eye size={17} />
          <span>Xem tài liệu</span>
        </button>
        {material.canDownload && (
          <a className="course-download-button" href={downloadUrl} title="Tải tài liệu về máy tính">
            <Download size={17} />
            <span>Tải về</span>
          </a>
        )}
      </div>
    </article>
  )
}
