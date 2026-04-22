import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import favoriteService from '../services/favorite.service';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(undefined);

export function FavoritesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setFavorites([]);
      setLoaded(false);
      return [];
    }

    setLoading(true);
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(Array.isArray(data) ? data : []);
      setLoaded(true);
      return data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) {
      setFavorites([]);
      setPendingIds([]);
      setLoaded(false);
      setLoading(false);
      return;
    }

    refreshFavorites().catch(() => {
      setFavorites([]);
      setLoaded(true);
      setLoading(false);
    });
  }, [isAuthenticated, isCustomer, refreshFavorites]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.restaurant?.id).filter(Boolean)),
    [favorites]
  );

  const isFavorite = useCallback((restaurantId) => favoriteIds.has(restaurantId), [favoriteIds]);

  const isFavoritePending = useCallback(
    (restaurantId) => pendingIds.includes(restaurantId),
    [pendingIds]
  );

  const addFavorite = useCallback(async (restaurant) => {
    if (!restaurant?.id || !isCustomer) {
      return null;
    }

    setPendingIds((current) => [...new Set([...current, restaurant.id])]);
    try {
      const createdFavorite = await favoriteService.addFavorite(restaurant.id);
      setFavorites((current) => {
        const next = current.filter((favorite) => favorite.restaurant?.id !== restaurant.id);
        return [createdFavorite, ...next];
      });
      return createdFavorite;
    } finally {
      setPendingIds((current) => current.filter((id) => id !== restaurant.id));
    }
  }, [isCustomer]);

  const removeFavorite = useCallback(async (restaurantId) => {
    if (!restaurantId || !isCustomer) {
      return;
    }

    setPendingIds((current) => [...new Set([...current, restaurantId])]);
    try {
      await favoriteService.removeFavorite(restaurantId);
      setFavorites((current) => current.filter((favorite) => favorite.restaurant?.id !== restaurantId));
    } finally {
      setPendingIds((current) => current.filter((id) => id !== restaurantId));
    }
  }, [isCustomer]);

  const toggleFavorite = useCallback(async (restaurant) => {
    if (!restaurant?.id || !isCustomer) {
      return false;
    }

    if (favoriteIds.has(restaurant.id)) {
      await removeFavorite(restaurant.id);
      return false;
    }

    await addFavorite(restaurant);
    return true;
  }, [addFavorite, favoriteIds, isCustomer, removeFavorite]);

  const value = {
    favorites,
    favoriteCount: favorites.length,
    loading,
    loaded,
    refreshFavorites,
    isFavorite,
    isFavoritePending,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider.');
  }
  return context;
}
