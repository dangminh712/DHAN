import axios from 'axios';
import { createRequestCache } from './requestCache.js';

const cache = createRequestCache();
let sessionKey;
export const invalidateApiCache = () => cache.clear();

export function installApiCache(client, getSession = () => ({
  token: localStorage.getItem('dhan_session_token') || '',
  userId: localStorage.getItem('dhan_active_user_id') || '',
})) {
  const adapter = axios.getAdapter(client.defaults.adapter);
  client.interceptors.request.use(config => {
    const session = getSession();
    const identity = `${session.token}:${session.userId}`;
    if (identity !== sessionKey) { cache.clear(); sessionKey = identity; }
    if (session.token) config.headers.set('Authorization', `Bearer ${session.token}`);
    if (session.userId) config.headers.set('X-User-Id', session.userId);
    return config;
  });
  client.defaults.adapter = async config => {
    const method = (config.method || 'get').toLowerCase();
    if (!['get', 'head', 'options'].includes(method)) {
      cache.clear();
      try { return await adapter(config); } finally { cache.clear(); }
    }
    const path = config.url.split('?')[0].replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '');
    if (path.startsWith('/media/stream') || path.startsWith('/media/download') || config.headers?.Range || config.headers?.range) return adapter(config);
    const cacheable = /^\/(auth\/users|auth\/provisioned-students|(?:training\/)?academic\/(classes(?:\/\d+\/students)?|subjects|units)|(?:training\/)?system\/(overview|audit-logs|sessions|security-alerts|notifications)|training\/lectures(?:\/\d+)?|training\/files(?:\/folders)?|media)$/.test(path);
    if (method !== 'get' || !cacheable || config.cache === false || config.signal || config.cancelToken || (config.responseType && config.responseType !== 'json')) return adapter(config);
    const key = JSON.stringify([sessionKey, client.getUri(config), config.headers.toJSON()]);
    const result = await cache.read(key, async () => {
      const response = await adapter(config);
      return { data: response.data, status: response.status, statusText: response.statusText, headers: { ...response.headers } };
    });
    return { ...result, config };
  };
}
