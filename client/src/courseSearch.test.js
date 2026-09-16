import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatFileSize,
  getMaterialFormat,
  matchesCourseSearch,
  normalizeVietnamese,
  parseCourseRoute,
} from './courseSearch.js'

test('Vietnamese search ignores accents and letter case', () => {
  assert.equal(normalizeVietnamese('KẾ HOẠCH GIẢNG DẠY'), 'ke hoach giang day')
  assert.equal(matchesCourseSearch('KẾ HOẠCH GIẢNG DẠY HP NVCB2.pdf', 'ke hoach giang day'), true)
})

test('material format maps office and media extensions', () => {
  assert.equal(getMaterialFormat({ extension: '.pptx' }), 'POWERPOINT')
  assert.equal(getMaterialFormat({ extension: 'docx' }), 'WORD')
  assert.equal(getMaterialFormat({ mimeType: 'image/png' }), 'IMAGE')
  assert.equal(getMaterialFormat({ fileType: 'VIDEO' }), 'VIDEO')
})

test('file size uses readable binary units', () => {
  assert.equal(formatFileSize(0), '0 B')
  assert.equal(formatFileSize(1536), '1.5 KB')
  assert.equal(formatFileSize(2 * 1024 * 1024), '2 MB')
})

test('course route parser accepts only supported route shapes', () => {
  assert.deepEqual(parseCourseRoute('/mon-hoc'), { name: 'courses' })
  assert.deepEqual(parseCourseRoute('/mon-hoc/12'), { name: 'course', courseId: '12' })
  assert.deepEqual(parseCourseRoute('/mon-hoc/12/chuong/8'), { name: 'chapter', courseId: '12', chapterId: '8' })
  assert.equal(parseCourseRoute('/mon-hoc/abc/chuong/8'), null)
})
