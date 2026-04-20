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

const extractContent = (data) => normalizePage(data).content || [];
const defaultPageParams = {
  page: 0,
  size: 50,
  sort: 'createdAt,desc',
};

const orderService = {
  placeOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getMyOrdersPage: async (params = {}) => {
    const response = await api.get('/orders/my-orders', { params: { ...defaultPageParams, ...params } });
    return normalizePage(response.data);
  },

  getMyOrders: async (params = {}) => {
    const response = await api.get('/orders/my-orders', { params: { ...defaultPageParams, ...params } });
    return extractContent(response.data);
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  getAllOrdersPage: async (params = {}) => {
    const response = await api.get('/orders', { params: { ...defaultPageParams, ...params } });
    return normalizePage(response.data);
  },

  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params: { ...defaultPageParams, ...params } });
    return extractContent(response.data);
  },

  getDriverOrdersPage: async (params = {}) => {
    const response = await api.get('/orders/driver/assigned', { params: { ...defaultPageParams, ...params } });
    return normalizePage(response.data);
  },

  getDriverOrders: async (params = {}) => {
    const response = await api.get('/orders/driver/assigned', { params: { ...defaultPageParams, ...params } });
    return extractContent(response.data);
  },

  getManagedRestaurantOrdersPage: async (params = {}) => {
    const response = await api.get('/orders/restaurant-admin/managed', { params: { ...defaultPageParams, ...params } });
    return normalizePage(response.data);
  },

  updateManagedRestaurantOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/restaurant-admin/${orderId}/status`, { status });
    return response.data;
  },
};

export default orderService;
