import api from './api';

export const lectureService = {
  async getLectures(userId, status = 'ALL') {
    const params = {};
    if (userId) params.userId = userId;
    if (status && status !== 'ALL') params.status = status;
    const res = await api.get('/training/lectures', { params });
    return res.data;
  },

  async getLectureDetail(id, userId) {
    const params = userId ? { userId } : {};
    const res = await api.get(`/training/lectures/${id}`, { params });
    return res.data;
  },

  async createLecture(dto, userId) {
    const res = await api.post('/training/lectures', dto, { params: { userId } });
    return res.data;
  },

  async updateStatus(id, status, userId) {
    const res = await api.put(`/training/lectures/${id}/status`, { status }, { params: { userId } });
    return res.data;
  },
};
