import test from 'node:test'
import assert from 'node:assert/strict'
import { courseCollectionReducer, initialCourseCollectionState } from './courseCollectionState.js'

test('starting a permission-scoped course request clears prior results', () => {
  const prior = { status: 'ready', courses: [{ id: 1 }] }
  assert.deepEqual(courseCollectionReducer(prior, { type: 'start' }), initialCourseCollectionState)
})

test('failed and successful course requests never retain stale results', () => {
  const prior = { status: 'ready', courses: [{ id: 1 }] }
  assert.deepEqual(courseCollectionReducer(prior, { type: 'error' }), { status: 'error', courses: [] })
  assert.deepEqual(courseCollectionReducer(prior, { type: 'ready', courses: [{ id: 2 }] }), { status: 'ready', courses: [{ id: 2 }] })
})
