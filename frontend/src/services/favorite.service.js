import api from './api';

const favoriteService = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  addFavorite: async (restaurantId) => {
    const response = await api.post(`/favorites/restaurants/${restaurantId}`);
    return response.data;
  },

  removeFavorite: async (restaurantId) => {
    await api.delete(`/favorites/restaurants/${restaurantId}`);
  },
};

export default favoriteService;
