import api from './api';

export const fileService = {
  async getFiles(userId) {
    const params = userId ? { userId } : {};
    const res = await api.get('/training/files', { params });
    return res.data;
  },

  getStreamUrl(fileId, userId, lectureId) {
    let url = `http://localhost:5000/api/training/files/${fileId}/stream?userId=${userId || 1}`;
    if (lectureId) url += `&lectureId=${lectureId}`;
    return url;
  },

  getDownloadUrl(fileId, userId, lectureId) {
    let url = `http://localhost:5000/api/training/files/${fileId}/download?userId=${userId || 1}`;
    if (lectureId) url += `&lectureId=${lectureId}`;
    return url;
  },

  async getFolders() {
    const res = await api.get('/training/files/folders');
    return res.data;
  },

  async uploadFile(formData, userId, classificationLevelId, changeNote, lectureId, categoryFolder) {
    // Append fields to formData if not already appended
    if (userId && !formData.has('userId')) formData.append('userId', userId);
    if (classificationLevelId && !formData.has('classificationLevelId')) formData.append('classificationLevelId', classificationLevelId);
    if (changeNote && !formData.has('changeNote')) formData.append('changeNote', changeNote);
    if (lectureId && !formData.has('lectureId')) formData.append('lectureId', lectureId);
    if (categoryFolder && !formData.has('categoryFolder')) formData.append('categoryFolder', categoryFolder);

    const params = {
      qUserId: userId,
      qClassificationLevelId: classificationLevelId,
      qChangeNote: changeNote || '',
    };
    if (lectureId) params.qLectureId = lectureId;
    if (categoryFolder) params.qCategoryFolder = categoryFolder;

    const res = await api.post('/training/files/upload', formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async deleteFile(fileId, userId) {
    const params = userId ? { userId } : {};
    const res = await api.delete(`/training/files/${fileId}`, { params });
    return res.data;
  },

  async updateFile(fileId, dto, userId) {
    const params = userId ? { userId } : {};
    const res = await api.put(`/training/files/${fileId}`, dto, { params });
    return res.data;
  },
};

