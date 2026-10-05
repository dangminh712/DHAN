import test from 'node:test'
import assert from 'node:assert/strict'
import { selectCatalogCourses } from './courseCatalog.js'
import { parseCourseRoute } from './courseSearch.js'
import { isPortalRouteActive, portalNavigation } from './portalNavigation.js'

const courses = [
  { id: 1, name: 'An ninh', code: 'AN', materialCount: 0 },
  { id: 2, name: 'Nghiệp vụ', code: 'NV', description: 'Giáo trình cơ bản', materialCount: 197 },
  { id: 3, name: 'Điều tra', code: 'DT', materialCount: 12 },
]

test('catalog searches Vietnamese descriptions and filters available material without mutating data', () => {
  assert.deepEqual(selectCatalogCourses(courses, { search: 'giao trinh' }).map(c => c.id), [2])
  assert.deepEqual(selectCatalogCourses(courses, { onlyReady: true, sort: 'materials' }).map(c => c.id), [2, 3])
  assert.deepEqual(courses.map(c => c.id), [1, 2, 3])
})

test('home search links retain course routing and active navigation', () => {
  const route = '/mon-hoc?search=nghiep%20vu'
  assert.deepEqual(parseCourseRoute(route), { name: 'courses' })
  assert.equal(isPortalRouteActive(portalNavigation.find(item => item.id === 'courses'), route), true)
})
