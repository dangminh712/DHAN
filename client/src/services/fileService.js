import api from './api';

export const fileService = {
  async getFiles(userId) {
    const params = userId ? { userId } : {};
    const res = await api.get('/training/files', { params });
    return res.data;
  },

  getStreamUrl(fileId, userId, lectureId) {
    let url = `http://localhost:5000/api/training/files/${fileId}/stream?userId=${userId}`;
    if (lectureId) url += `&lectureId=${lectureId}`;
    return url;
  },

  getDownloadUrl(fileId, userId, lectureId) {
    let url = `http://localhost:5000/api/training/files/${fileId}/download?userId=${userId}`;
    if (lectureId) url += `&lectureId=${lectureId}`;
    return url;
  },

  async uploadFile(formData, userId, classificationLevelId, changeNote, lectureId) {
    const params = { userId, classificationLevelId };
    if (changeNote) params.changeNote = changeNote;
    if (lectureId) params.lectureId = lectureId;

    const res = await api.post('/training/files/upload', formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
