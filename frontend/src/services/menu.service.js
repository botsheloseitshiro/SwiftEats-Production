import api from './api';

const menuService = {

  /**
   * GET /api/menu/restaurant/{restaurantId}
   * Returns all available menu items for a specific restaurant.
   * This is public - no authentication required for browsing.
   */
  getMenuByRestaurant: async (restaurantId) => {
    const response = await api.get(`/menu/restaurant/${restaurantId}`);
    return response.data;
  },

  /**
   * GET /api/menu/restaurant/{restaurantId}/all
   * Returns ALL menu items (available and unavailable) for a restaurant.
   * Only accessible to ADMIN or RESTAURANT_ADMIN.
   * Used by the admin dashboard to manage all menu items.
   */
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

  /**
   * GET /api/menu/{id}
   * Returns a single menu item by ID.
   * Used when the frontend needs specific item details.
   */
  getMenuItemById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  /**
   * POST /api/menu
   * Creates a new menu item for a restaurant.
   * Requires authentication: ADMIN or RESTAURANT_ADMIN
   * 
   * For ADMIN: Can add items to any restaurant (restaurantId in DTO)
   * For RESTAURANT_ADMIN: Can only add items to their own restaurant
   *                       Backend validates ownership
   */
  createMenuItem: async (data) => {
    const response = await api.post('/menu', data);
    return response.data;
  },

  /**
   * PUT /api/menu/{id}
   * Updates an existing menu item.
   * Requires authentication: ADMIN or RESTAURANT_ADMIN
   * 
   * For ADMIN: Can update items in any restaurant
   * For RESTAURANT_ADMIN: Can only update items in their own restaurant
   *                       Backend validates ownership
   */
  updateMenuItem: async (id, data) => {
    const response = await api.put(`/menu/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/menu/{id}
   * Deletes a menu item.
   * Requires authentication: ADMIN or RESTAURANT_ADMIN
   * 
   * For ADMIN: Can delete items from any restaurant
   * For RESTAURANT_ADMIN: Can only delete items from their own restaurant
   *                       Backend validates ownership
   * 
   * Historical order items are unaffected because they store name/price as snapshots.
   */
  deleteMenuItem: async (id) => {
    await api.delete(`/menu/${id}`);
  },
};

export default menuService;
