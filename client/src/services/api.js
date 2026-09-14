import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dhan_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const userId = localStorage.getItem('dhan_active_user_id');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

export default api;
