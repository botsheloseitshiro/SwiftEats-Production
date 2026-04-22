import api from './api';

const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsersPage: async (params = {}) => {
    const response = await api.get('/admin/users', {
      params: {
        page: 0,
        size: 20,
        sort: 'id,desc',
        ...params,
      },
    });
    return response.data;
  },

  getAuditLogsPage: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', {
      params: {
        page: 0,
        size: 20,
        sort: 'createdAt,desc',
        ...params,
      },
    });
    return response.data;
  },
};

export default adminService;
