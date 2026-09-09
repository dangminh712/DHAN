import api from './api';

export const academicService = {
  async getClasses() {
    const res = await api.get('/training/academic/classes');
    return res.data;
  },

  async getSubjects() {
    const res = await api.get('/training/academic/subjects');
    return res.data;
  },

  async getUnits() {
    const res = await api.get('/training/academic/units');
    return res.data;
  },
};
