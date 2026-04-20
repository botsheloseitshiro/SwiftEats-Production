import api from './api';

const userService = {
  
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/users/profile/password', passwordData);
    return response.data;
  },

  
  getProfileById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  eProfileById: async (userId, profileData) => {
    const response = await api.put(`/users/${userId}`, profileData);
    return response.data;
  },

  getSavedAddresses: async () => {
    const response = await api.get('/users/profile/addresses');
    return response.data;
  },

  getSavedCards: async () => {
    const response = await api.get('/users/profile/cards');
    return response.data;
  },

  createSavedAddress: async (addressData) => {
    const response = await api.post('/users/profile/addresses', addressData);
    return response.data;
  },

  createSavedCard: async (cardData) => {
    const response = await api.post('/users/profile/cards', cardData);
    return response.data;
  },

  updateSavedAddress: async (addressId, addressData) => {
    const response = await api.put(`/users/profile/addresses/${addressId}`, addressData);
    return response.data;
  },

  updateSavedCard: async (cardId, cardData) => {
    const response = await api.put(`/users/profile/cards/${cardId}`, cardData);
    return response.data;
  },

  setDefaultAddress: async (addressId) => {
    const response = await api.put(`/users/profile/addresses/${addressId}/default`);
    return response.data;
  },

  setDefaultCard: async (cardId) => {
    const response = await api.put(`/users/profile/cards/${cardId}/default`);
    return response.data;
  },

  deleteSavedAddress: async (addressId) => {
    await api.delete(`/users/profile/addresses/${addressId}`);
  },

  deleteSavedCard: async (cardId) => {
    await api.delete(`/users/profile/cards/${cardId}`);
  },
};

export default userService;
