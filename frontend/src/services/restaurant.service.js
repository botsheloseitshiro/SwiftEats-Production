import api from './api';

const restaurantService = {
  getNearby: async (lat, lon, radiusKm = 10, filters = {}) => {
    const response = await api.get('/restaurants/nearby', {
      params: {
        lat,
        lon,
        radiusKm,
        ...filters,
      },
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/restaurants');
    return response.data;
  },

  browse: async (params = {}) => {
    const response = await api.get('/restaurants/browse', {
      params: {
        page: 0,
        size: 9,
        sort: 'rating,desc',
        ...params,
      },
    });
    return response.data;
  },

  search: async (term) => {
    const response = await api.get('/restaurants', { params: { search: term } });
    return response.data;
  },

  getByCategory: async (category) => {
    const response = await api.get('/restaurants', { params: { category } });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/restaurants', data);
    return response.data;
  },

  registerRestaurant: async (data) => {
    const response = await api.post('/restaurants/register', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/restaurants/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/restaurants/${id}`);
  },

  getAllRestaurantsForAdmin: async (params = {}) => {
    const response = await api.get('/restaurants/admin/all', {
      params: {
        page: 0,
        size: 8,
        sort: 'name,asc',
        ...params,
      },
    });
    return response.data;
  },

  toggleRestaurantActive: async (restaurantId, active) => {
    const response = await api.put(`/restaurants/${restaurantId}/active`, { active });
    return response.data;
  },

  updateOperations: async (restaurantId, payload) => {
    const response = await api.put(`/restaurants/${restaurantId}/operations`, payload);
    return response.data;
  },

  getRestaurantAdminAnalytics: async (restaurantId) => {
    const response = await api.get('/restaurants/restaurant-admin/analytics', {
      params: restaurantId ? { restaurantId } : {},
    });
    return response.data;
  },

  assignManager: async (restaurantId, adminUserId) => {
    const response = await api.put(`/restaurants/${restaurantId}/manager`, { adminUserId });
    return response.data;
  },
};

export default restaurantService;
