import { matchesCourseSearch } from './courseSearch.js'

export function selectCatalogCourses(courses, { search = '', onlyReady = false, sort = 'name' } = {}) {
  return courses.filter(course =>
    (!onlyReady || Number(course.materialCount) > 0) &&
    matchesCourseSearch(`${course.name || ''} ${course.code || ''} ${course.description || ''}`, search)
  ).sort((a, b) =>
    (sort === 'materials' ? Number(b.materialCount || 0) - Number(a.materialCount || 0) : 0) ||
    String(a.name || '').localeCompare(String(b.name || ''), 'vi', { numeric: true })
  )
}
