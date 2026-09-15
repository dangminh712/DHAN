import api from './api';

export const authService = {
  async getAvailableUsers(options = {}) {
    const res = await api.get('/auth/users', { params: options });
    return res.data;
  },

  async login(username, password = 'T04@Security2026!', deviceId = 'WEB_WORKSTATION') {
    const res = await api.post('/auth/login', { username, password, deviceId });
    return res.data;
  },

  async switchPersona(username) {
    const res = await api.post('/auth/switch-persona', { username });
    return res.data;
  },

  async createUser(dto, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.post('/auth/users', dto, { params });
    return res.data;
  },

  async updateUser(id, dto, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.put(`/auth/users/${id}`, dto, { params });
    return res.data;
  },

  async deleteUser(id, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.delete(`/auth/users/${id}`, { params });
    return res.data;
  },

  async provisionBatch(dto, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.post('/auth/provision-batch', dto, { params });
    return res.data;
  },

  async provisionSingle(dto, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.post('/auth/provision-single', dto, { params });
    return res.data;
  },

  async updateStudentProfile(dto) {
    const res = await api.post('/auth/update-student-profile', dto);
    return res.data;
  },

  async getProvisionedStudents(options = {}) {
    const params = {};
    if (typeof options === 'string') {
      if (options) params.classCode = options;
    } else {
      if (options.classCode) params.classCode = options.classCode;
      if (options.search) params.search = options.search;
      if (options.status) params.status = options.status;
      if (options.page) params.page = options.page;
      if (options.pageSize) params.pageSize = options.pageSize;
      if (options.sortBy) params.sortBy = options.sortBy;
      if (options.sortDir) params.sortDir = options.sortDir;
    }
    const res = await api.get('/auth/provisioned-students', { params });
    return res.data;
  },

  async enrollStudent(studentId, classId, classCode, replaceExisting = true, adminUserId, studentCode) {
    const params = adminUserId ? { adminUserId } : {};
    const payload = {
      studentId: studentId ? Number(studentId) : 0,
      studentCode: studentCode ? String(studentCode).trim() : (typeof studentId === 'string' && isNaN(Number(studentId)) ? studentId.trim() : undefined),
      classId,
      classCode,
      replaceExisting
    };
    const res = await api.post('/auth/enroll-student', payload, { params });
    return res.data;
  },

  async resetStudentPassword(id, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.post(`/auth/reset-student-password/${id}`, {}, { params });
    return res.data;
  },

  async provisionImport(students, clearanceLevelId = 2, adminUserId) {
    const params = adminUserId ? { adminUserId } : {};
    const res = await api.post('/auth/provision-import', { students, clearanceLevelId }, { params });
    return res.data;
  },
};

