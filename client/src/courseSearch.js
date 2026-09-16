export function normalizeVietnamese(value = '') {
  return String(value)
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .trim()
    .replace(/\s+/g, ' ')
}

export function matchesCourseSearch(value, query) {
  return normalizeVietnamese(value).includes(normalizeVietnamese(query))
}

export function getMaterialFormat(material = {}) {
  const extension = String(material.extension || material.originalName?.split('.').pop() || '')
    .replace(/^\./, '')
    .toLowerCase()
  const mime = String(material.mimeType || '').toLowerCase()
  const fileType = String(material.fileType || '').toUpperCase()

  if (extension === 'pdf' || fileType === 'PDF' || mime === 'application/pdf') return 'PDF'
  if (['ppt', 'pptx'].includes(extension)) return 'POWERPOINT'
  if (['doc', 'docx'].includes(extension)) return 'WORD'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension) || mime.startsWith('image/') || fileType === 'IMAGE') return 'IMAGE'
  if (['mp4', 'webm', 'mov', 'mkv'].includes(extension) || mime.startsWith('video/') || fileType === 'VIDEO') return 'VIDEO'
  return fileType || 'OTHER'
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 ** 2) return `${Number((size / 1024).toFixed(1))} KB`
  if (size < 1024 ** 3) return `${Number((size / 1024 ** 2).toFixed(1))} MB`
  return `${Number((size / 1024 ** 3).toFixed(1))} GB`
}

export function parseCourseRoute(route) {
  if (route === '/mon-hoc') return { name: 'courses' }
  const courseMatch = route.match(/^\/mon-hoc\/(\d+)$/)
  if (courseMatch) return { name: 'course', courseId: courseMatch[1] }
  const chapterMatch = route.match(/^\/mon-hoc\/(\d+)\/chuong\/(\d+)$/)
  if (chapterMatch) return { name: 'chapter', courseId: chapterMatch[1], chapterId: chapterMatch[2] }
  return null
}
