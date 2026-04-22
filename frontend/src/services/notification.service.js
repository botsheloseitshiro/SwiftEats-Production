import api from './api';

const notificationService = {
  getNotificationsPage: async (params = {}) => {
    const response = await api.get('/notifications', {
      params: {
        page: 0,
        size: 20,
        sort: 'createdAt,desc',
        ...params,
      },
    });
    return response.data;
  },

  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
};

export default notificationService;
