import api from './api';

const reviewService = {
  getRestaurantReviews: async (restaurantId) => {
    const response = await api.get(`/reviews/restaurants/${restaurantId}`);
    return response.data;
  },

  createRestaurantReview: async (restaurantId, payload) => {
    const response = await api.post(`/reviews/restaurants/${restaurantId}`, payload);
    return response.data;
  },

  getMenuItemReviews: async (menuItemId) => {
    const response = await api.get(`/reviews/menu-items/${menuItemId}`);
    return response.data;
  },

  getMyOrderReviews: async (orderId) => {
    const response = await api.get(`/reviews/orders/${orderId}/mine`);
    return response.data;
  },

  createMenuItemReview: async (menuItemId, payload) => {
    const response = await api.post(`/reviews/menu-items/${menuItemId}`, payload);
    return response.data;
  },
};

export default reviewService;
