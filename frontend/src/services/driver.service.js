import api from './api';

const normalizePage = (data) => {
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      currentPage: 0,
      size: data.length,
      first: true,
      last: true,
      sort: 'createdAt: DESC',
    };
  }
  return data;
};

const driverService = {
  createDriver: async (payload) => {
    const response = await api.post('/drivers', payload);
    return response.data;
  },

  createRestaurantDriver: async (payload, restaurantId) => {
    const response = await api.post('/drivers/restaurant-admin', payload, {
      params: restaurantId ? { restaurantId } : {},
    });
    return response.data;
  },

  getDriversPage: async (params = {}) => {
    const response = await api.get('/drivers', {
      params: {
        page: 0,
        size: 12,
        sort: 'id,desc',
        ...params,
      },
    });
    return normalizePage(response.data);
  },

  getRestaurantDriversPage: async (params = {}) => {
    const response = await api.get('/drivers/restaurant-admin', {
      params: {
        page: 0,
        size: 12,
        sort: 'id,desc',
        ...params,
      },
    });
    return normalizePage(response.data);
  },

  updateRestaurantDriver: async (driverId, payload, restaurantId) => {
    const response = await api.put(`/drivers/restaurant-admin/${driverId}`, payload, {
      params: restaurantId ? { restaurantId } : {},
    });
    return response.data;
  },

  setDriverActive: async (driverId, active) => {
    const response = await api.put(`/drivers/${driverId}/active`, { active });
    return response.data;
  },

  setRestaurantDriverActive: async (driverId, active, restaurantId) => {
    const response = await api.put(`/drivers/restaurant-admin/${driverId}/active`, { active }, {
      params: restaurantId ? { restaurantId } : {},
    });
    return response.data;
  },

  setRestaurantDriverAvailability: async (driverId, available, restaurantId) => {
    const response = await api.put(`/drivers/restaurant-admin/${driverId}/availability`, { available }, {
      params: restaurantId ? { restaurantId } : {},
    });
    return response.data;
  },

  manuallyAssignOrder: async (driverId, orderId) => {
    const response = await api.put(`/drivers/${driverId}/assignments/${orderId}`);
    return response.data;
  },

  manuallyAssignRestaurantOrder: async (driverId, orderId, restaurantId) => {
    const response = await api.put(`/drivers/restaurant-admin/${driverId}/assignments/${orderId}`, null, {
      params: restaurantId ? { restaurantId } : {},
    });
    return response.data;
  },

  updateMyLocation: async (payload) => {
    const response = await api.put('/drivers/me/location', payload);
    return response.data;
  },

  getMyDriverProfile: async () => {
    const response = await api.get('/drivers/me');
    return response.data;
  },

  updateMyShift: async (online) => {
    const response = await api.put('/drivers/me/shift', { online });
    return response.data;
  },

  updateMyAvailability: async (available) => {
    const response = await api.put('/drivers/me/availability', { available });
    return response.data;
  },

  respondToAssignment: async (orderId, accept) => {
    await api.post(`/drivers/me/orders/${orderId}/response`, { accept });
  },

  getMyEarnings: async () => {
    const response = await api.get('/drivers/me/earnings');
    return response.data;
  },
};

export default driverService;
