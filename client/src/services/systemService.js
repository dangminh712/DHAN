import api from './api';

export const systemService = {
  async getOverview() {
    const res = await api.get('/training/system/overview');
    return res.data;
  },

  async getAuditLogs(limit = 50) {
    const res = await api.get('/training/system/audit-logs', { params: { limit } });
    return res.data;
  },

  async getSecurityAlerts() {
    const res = await api.get('/training/system/security-alerts');
    return res.data;
  },

  async getUserSessions(userId) {
    const params = userId ? { userId } : {};
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
