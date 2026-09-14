import api from './api';
const root = '/training/learning';
export const learningService = {
  getProgress: (lecture, userId) => api.get(`${root}/${lecture}/progress`, { params: userId ? { userId } : {} }).then(r => r.data),
  patchProgress: (lecture, value, userId) => api.patch(`${root}/${lecture}/progress`, value, { params: userId ? { userId } : {} }).then(r => r.data),
  notes: (lecture, file, pdfPage, afterId = 0, signal, userId) => api.get(`${root}/${lecture}/files/${file}/notes`, { params: { pdfPage, afterId, ...(userId ? { userId } : {}) }, signal }).then(r => r.data),
  addNote: (lecture, file, data, userId) => api.post(`${root}/${lecture}/files/${file}/notes`, data, { params: userId ? { userId } : {} }).then(r => r.data),
  editNote: (id, data, userId) => api.patch(`${root}/notes/${id}`, data, { params: userId ? { userId } : {} }).then(r => r.data),
  deleteNote: (id, userId) => api.delete(`${root}/notes/${id}`, { params: userId ? { userId } : {} }),
  attempts: (lecture, userId) => api.get(`${root}/${lecture}/quiz-attempts`, { params: userId ? { userId } : {} }).then(r => r.data),
};

export function progressSender(lecture) {
  // Capture this session, so cleanup after a user switch cannot write into the new user's records.
  const token = localStorage.getItem('dhan_session_token');
  const userId = localStorage.getItem('dhan_active_user_id');
  return async (value) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;
    const response = await fetch(`${api.defaults.baseURL}${root}/${lecture}/progress?userId=${userId || ''}`, {
      method: 'PATCH', keepalive: true,
      headers,
      body: JSON.stringify(value),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Không lưu được tiến độ.');
    return result;
  };
}
