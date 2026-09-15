import api from './api';

export const academicService = {
  async getClasses(options = {}) {
    const params = {};
    if (typeof options === 'string') {
      if (options) params.search = options;
    } else {
      if (options.search) params.search = options.search;
      if (options.page) params.page = options.page;
      if (options.pageSize) params.pageSize = options.pageSize;
      if (options.sortBy) params.sortBy = options.sortBy;
      if (options.sortDir) params.sortDir = options.sortDir;
    }
    const res = await api.get('/training/academic/classes', { params });
    return res.data;
  },

  async getClassStudents(classId, search) {
    const params = typeof search === 'object' ? search : search ? { search } : {};
    const res = await api.get(`/training/academic/classes/${classId}/students`, { params });
    return res.data;
  },

  async getSubjects(options = {}) {
    const res = await api.get('/training/academic/subjects', { params: options });
    return res.data;
  },

  async getUnits() {
    const res = await api.get('/training/academic/units');
    return res.data;
  },

  async createSubject(dto) {
    const res = await api.post('/training/academic/subjects', dto);
    return res.data;
  },

  async updateSubject(id, dto) {
    const res = await api.put(`/training/academic/subjects/${id}`, dto);
    return res.data;
  },

  async deleteSubject(id) {
    const res = await api.delete(`/training/academic/subjects/${id}`);
    return res.data;
  },

  async createClass(dto) {
    const res = await api.post('/training/academic/classes', dto);
    return res.data;
  },

  async updateClass(id, dto) {
    const res = await api.put(`/training/academic/classes/${id}`, dto);
    return res.data;
  },

  async deleteClass(id) {
    const res = await api.delete(`/training/academic/classes/${id}`);
    return res.data;
  },
};

