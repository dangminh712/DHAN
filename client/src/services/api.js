import axios from 'axios';
import { installApiCache } from './cachedApi.js';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

installApiCache(api);
// The application shell still uses the default Axios instance.
installApiCache(axios);

export default api;
