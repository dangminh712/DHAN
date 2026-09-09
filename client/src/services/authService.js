import api from './api';

export const authService = {
  async getAvailableUsers() {
    const res = await api.get('/auth/users');
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
};
