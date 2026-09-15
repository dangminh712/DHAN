import api from './api';

export const systemService = {
  async getOverview() {
    const res = await api.get('/training/system/overview');
    return res.data;
  },

  async getAuditLogs(options = 50) {
    let params = {};
    if (typeof options === 'number') {
      params = { limit: options };
    } else if (typeof options === 'object') {
      if (options.limit) params.limit = options.limit;
      if (options.page) params.page = options.page;
      if (options.pageSize) params.pageSize = options.pageSize;
      if (options.sortBy) params.sortBy = options.sortBy;
      if (options.sortDir) params.sortDir = options.sortDir;
      if (options.search) params.search = options.search;
      if (options.action) params.action = options.action;
      if (options.entityType) params.entityType = options.entityType;
    }
    const res = await api.get('/training/system/audit-logs', { params });
    return res.data;
  },

  async getSecurityAlerts(options = {}) {
    const res = await api.get('/training/system/security-alerts', { params: options });
    return res.data;
  },

  async getUserSessions(userId, options = {}) {
    const params = { ...options, ...(userId ? { userId } : {}) };
    const res = await api.get('/training/system/sessions', { params });
    return res.data;
  },

  async revokeSession(sessionId, adminUserId) {
    const res = await api.post(`/training/system/sessions/${sessionId}/revoke`, null, {
      params: { adminUserId },
    });
    return res.data;
  },

  async getNotifications(userId) {
    const res = await api.get('/training/system/notifications', { params: { userId } });
    return res.data;
  },
};
