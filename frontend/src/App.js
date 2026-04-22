import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';

import Navbar from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProfilePage from './pages/ProfilePage';
import AdminRestaurantRegistrationPage from './pages/AdminRestaurantRegistrationPage';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantAdminDashboard from './pages/RestaurantAdminDashboard';
import RestaurantAdminDriversDashboard from './pages/RestaurantAdminDriversDashboard';
import RestaurantProfilePage from './pages/RestaurantProfilePage';
import AdminRestaurantDetailsPage from './pages/AdminRestaurantDetailsPage';
import DriverDashboard from './pages/DriverDashboard';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';

import './styles/index.css';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <Navbar />

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/menu/:restaurantId" element={<MenuPage />} />

              <Route path="/cart" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CartPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderHistoryPage /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><FavoritesPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              <Route
                path="/admin/register-restaurant"
                element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRestaurantRegistrationPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/restaurants"
                element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>}
              />
              <Route
                path="/admin/restaurant/:restaurantId"
                element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRestaurantDetailsPage /></ProtectedRoute>}
              />
              <Route
                path="/restaurant-admin/dashboard"
                element={<ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']}><RestaurantAdminDashboard /></ProtectedRoute>}
              />
              <Route
                path="/restaurant-admin/drivers"
                element={<ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']}><RestaurantAdminDriversDashboard /></ProtectedRoute>}
              />
              <Route
                path="/restaurant-admin/profile"
                element={<ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']}><RestaurantProfilePage /></ProtectedRoute>}
              />
              <Route
                path="/driver/dashboard"
                element={<ProtectedRoute allowedRoles={['DRIVER']}><DriverDashboard /></ProtectedRoute>}
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
