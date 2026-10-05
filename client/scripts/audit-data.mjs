// Read-only integrity audit. Uses the existing demo administrator scope, never switches users or writes to the database.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { BIEU_MAU_CATALOG, TTHD_DOCUMENTS } from '../src/data/bieuMauCatalog.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const base = process.env.AUDIT_API_URL || 'http://localhost:5000'
const userId = process.env.AUDIT_USER_ID || '1'
async function json(path) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  return response.json()
}
const report = { checkedAt: new Date().toISOString(), scope: 'Local demo administrator; published courses and catalog assets only', courses: [], failures: [], smallFiles: [], missingTeachers: [], assets: { catalogEntries: BIEU_MAU_CATALOG.length, guidanceEntries: TTHD_DOCUMENTS.length, uniquePaths: 0, valid: 0 } }
const courses = await json(`/api/courses?userId=${userId}`)
const subjects = await json('/api/academic/subjects')
report.missingTeacherAccounts = subjects.filter(s => !s.assignedTeachers?.length).map(s => ({ code: s.code, name: s.name }))
report.confirmedResponsibleTeachers = subjects.filter(s => s.responsibleTeacherName && s.responsibilitySource).map(s => ({ code: s.code, name: s.responsibleTeacherName, source: s.responsibilitySource }))
report.missingTeachers = subjects.filter(s => !s.assignedTeachers?.length && !s.responsibleTeacherName).map(s => ({ code: s.code, name: s.name }))
const checked = new Map()
for (const course of courses) {
  const detail = await json(`/api/courses/${course.id}?userId=${userId}`)
  let materialCount = 0
  for (const chapter of detail.chapters) {
    const contents = await json(`/api/courses/${course.id}/chapters/${chapter.id}?userId=${userId}`)
    materialCount += contents.materials.length
    for (const material of contents.materials) {
      if (checked.has(material.fileId)) continue
      checked.set(material.fileId, material)
      if (Number(material.fileSize) < 2048) report.smallFiles.push({ fileId: material.fileId, name: material.originalName, bytes: material.fileSize, course: course.code })
      try {
        const response = await fetch(`${base}/api/training/files/${material.fileId}/stream?userId=${userId}&chapterId=${chapter.id}`, { headers: { Range: 'bytes=0-15' }, signal: AbortSignal.timeout(15000) })
        if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`) }
        const reader = response.body.getReader()
        const { value } = await reader.read()
        await reader.cancel()
        if (!value?.length) throw new Error('Empty file')
        if (String(material.extension).replace(/^\./, '').toLowerCase() === 'pdf' && !Buffer.from(value).subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Invalid PDF signature')
      } catch (error) {
        report.failures.push({ fileId: material.fileId, name: material.originalName, reason: error.message })
      }
    }
  }
  const item = { code: course.code, name: course.name, chapters: detail.chapters.length, materials: materialCount, summaryConsistent: materialCount === course.materialCount && detail.chapters.length === course.chapterCount }
  report.courses.push(item)
  if (!item.summaryConsistent) report.failures.push({ course: course.code, reason: 'Course totals disagree with chapter contents' })
}
const assets = new Set([...BIEU_MAU_CATALOG.flatMap(item => [item.htmlPath, item.pdfPath]), ...TTHD_DOCUMENTS.map(item => item.pdfPath)].filter(Boolean))
report.assets.uniquePaths = assets.size
for (const asset of assets) {
  const path = resolve(root, 'client/public', asset.replace(/^\//, ''))
  try {
    const info = await stat(path)
    if (!info.size) throw new Error('Empty asset')
    if (asset.endsWith('.pdf')) {
      const bytes = await readFile(path)
      if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF signature')
    }
    report.assets.valid++
  } catch (error) { report.failures.push({ asset, reason: error.code || error.message }) }
}
report.uniqueCourseFiles = checked.size
report.emptyCourses = report.courses.filter(course => !course.materials).map(course => course.code)
await mkdir(resolve(root, 'docs/audits'), { recursive: true })
await writeFile(resolve(root, 'docs/audits/2026-10-04-data-audit.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ courses: report.courses.length, chapters: report.courses.reduce((sum, c) => sum + c.chapters, 0), materials: report.courses.reduce((sum, c) => sum + c.materials, 0), uniqueFiles: checked.size, assets: report.assets, emptyCourses: report.emptyCourses, missingTeachers: report.missingTeachers.map(s => s.code), smallFiles: report.smallFiles.length, failures: report.failures }, null, 2))
process.exitCode = report.failures.length ? 1 : 0
