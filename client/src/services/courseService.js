import api from './api'

function compact(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export const courseService = {
  async list({ userId, search, signal } = {}) {
    const response = await api.get('/courses', { params: compact({ userId, search }), signal })
    return response.data
  },
  async getDetail(courseId, { userId, signal } = {}) {
    const response = await api.get(`/courses/${courseId}`, { params: compact({ userId }), signal })
    return response.data
  },
  async getChapter(courseId, chapterId, { userId, format, search, signal } = {}) {
    const response = await api.get(`/courses/${courseId}/chapters/${chapterId}`, {
      params: compact({ userId, format: format === 'ALL' ? undefined : format, search }),
      signal,
    })
    return response.data
  },
  async searchMaterials(courseId, { userId, q, chapterId, format, signal } = {}) {
    const response = await api.get(`/courses/${courseId}/materials/search`, {
      params: compact({ userId, q, chapterId: chapterId === 'ALL' ? undefined : chapterId, format: format === 'ALL' ? undefined : format }),
      signal,
    })
    return response.data
  },
  async createChapter(courseId, dto, userId) {
    return (await api.post(`/courses/${courseId}/chapters`, dto, { params: { userId } })).data
  },
  async updateChapter(courseId, chapterId, dto, userId) {
    return (await api.put(`/courses/${courseId}/chapters/${chapterId}`, dto, { params: { userId } })).data
  },
  async removeChapter(courseId, chapterId, userId) {
    return (await api.delete(`/courses/${courseId}/chapters/${chapterId}`, { params: { userId } })).data
  },
  async addMaterial(courseId, chapterId, dto, userId) {
    return (await api.post(`/courses/${courseId}/chapters/${chapterId}/materials`, dto, { params: { userId } })).data
  },
}
