import api from './api';

export const lectureService = {
  async getLectures(userId, options = {}) {
    const params = {};
    if (userId) params.userId = userId;
    if (typeof options === 'string') {
      if (options !== 'ALL') params.status = options;
    } else {
      if (options.status && options.status !== 'ALL') params.status = options.status;
      if (options.search) params.search = options.search;
      if (options.subjectId) params.subjectId = options.subjectId;
      if (options.page) params.page = options.page;
      if (options.pageSize) params.pageSize = options.pageSize;
    }
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

  async updateLecture(id, dto, userId) {
    const res = await api.put(`/training/lectures/${id}`, dto, { params: { userId } });
    return res.data;
  },

  async deleteLecture(id, userId) {
    const res = await api.delete(`/training/lectures/${id}`, { params: { userId } });
    return res.data;
  },

  async updateStatus(id, status, userId) {
    const res = await api.put(`/training/lectures/${id}/status`, { status }, { params: { userId } });
    return res.data;
  },

  async updatePermissions(id, { scope, classIds }, userId) {
    const res = await api.put(`/training/lectures/${id}/permissions`, { scope, classIds }, { params: { userId } });
    return res.data;
  },

  async toggleFileDownloadable(id, fileId, isDownloadable, userId) {
    const res = await api.put(`/training/lectures/${id}/files/${fileId}/downloadable`, { isDownloadable }, { params: { userId } });
    return res.data;
  },

  async getProgress(id, userId) {
    const res = await api.get(`/training/lectures/${id}/progress`, { params: { userId } });
    return res.data;
  },

  async saveProgress(id, dto) {
    const res = await api.post(`/training/lectures/${id}/progress`, dto);
    return res.data;
  },

  async submitQuiz(id, { userId, answers }) {
    const res = await api.post(`/training/lectures/${id}/quiz/submit`, { userId, answers });
    return res.data;
  },
};

