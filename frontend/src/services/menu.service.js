import api from './api';

const menuService = {
  getMenuByRestaurant: async (restaurantId) => {
    const response = await api.get(`/menu/restaurant/${restaurantId}`);
    return response.data;
  },

  getAllMenuItemsForAdmin: async (restaurantId) => {
    const response = await api.get(`/menu/restaurant/${restaurantId}/all`, {
      params: {
        page: 0,
        size: 50,
        sort: 'name,asc',
      },
    });
    return response.data;
  },

  getAllMenuItemsPageForAdmin: async (restaurantId, params = {}) => {
    const response = await api.get(`/menu/restaurant/${restaurantId}/all`, {
      params: {
        page: 0,
        size: 12,
        sort: 'name,asc',
        ...params,
      },
    });
    return response.data;
  },

  getMenuItemById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  createMenuItem: async (payload) => {
    const response = await api.post('/menu', payload);
    return response.data;
  },

  updateMenuItem: async (id, payload) => {
    const response = await api.put(`/menu/${id}`, payload);
    return response.data;
  },

  updateStockStatus: async (id, available) => {
    const response = await api.put(`/menu/${id}/stock`, { available });
    return response.data;
  },

  deleteMenuItem: async (id) => {
    await api.delete(`/menu/${id}`);
  },
};

export default menuService;
