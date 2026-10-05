export const initialCourseCollectionState = { status: 'loading', courses: [] }

export function courseCollectionReducer(state, action) {
  if (action.type === 'start') return initialCourseCollectionState
  if (action.type === 'ready') return { status: 'ready', courses: action.courses }
  if (action.type === 'error') return { status: 'error', courses: [] }
  return state
}
