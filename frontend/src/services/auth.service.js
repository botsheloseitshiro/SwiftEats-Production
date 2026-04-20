import api from './api';

const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (refreshToken) => {
    if (!refreshToken) {
      return;
    }
    await api.post('/auth/logout', { refreshToken });
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },
};

export default authService;
