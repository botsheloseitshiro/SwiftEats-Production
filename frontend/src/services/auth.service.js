import api from './api';

const normalizeEmail = (email) => email?.trim().toLowerCase() ?? email;

const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', {
      ...userData,
      email: normalizeEmail(userData.email),
    });
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', {
      ...credentials,
      email: normalizeEmail(credentials.email),
    });
    return response.data;
  },

  logout: async (refreshToken) => {
    if (!refreshToken) {
      return;
    }
    await api.post('/auth/logout', { refreshToken });
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email: normalizeEmail(email) });
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },
};

export default authService;
