import React, { createContext, useCallback, useContext, useState } from 'react';
import authService from '../services/auth.service';
import { clearSession, clearSessionExpiredFlag, persistSession } from '../services/api';

const TOKEN_KEY = 'swifteats_token';
const REFRESH_TOKEN_KEY = 'swifteats_refresh_token';
const USER_KEY = 'swifteats_user';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY)));
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  const saveAuthData = useCallback((data) => {
    const userData = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
    };

    setToken(data.token);
    setUser(userData);
    persistSession(data);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      clearSessionExpiredFlag();
      const data = await authService.login({ email, password });
      saveAuthData(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [saveAuthData]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      clearSessionExpiredFlag();
      const data = await authService.register(userData);
      saveAuthData(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [saveAuthData]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      await authService.logout(refreshToken);
    } catch (error) {
      // Ignore transport errors. Local session state still has to be cleared.
    } finally {
      setUser(null);
      setToken(null);
      clearSession();
      clearSessionExpiredFlag();
    }
  }, []);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isRestaurantAdmin = user?.role === 'RESTAURANT_ADMIN';
  const isDriver = user?.role === 'DRIVER';

  const hasAnyRole = useCallback((roles = []) => {
    if (!user?.role || !roles.length) {
      return true;
    }
    return roles.includes(user.role);
  }, [user?.role]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isRestaurantAdmin,
    isDriver,
    hasAnyRole,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
