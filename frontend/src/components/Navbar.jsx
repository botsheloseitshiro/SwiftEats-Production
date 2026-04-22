import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChefHat, Heart, LogOut, Menu, ShoppingCart, Truck, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isRestaurantAdmin,
    isDriver,
    notificationsLoadedAt,
    unreadNotificationCount,
    refreshNotifications,
    logout,
  } = useAuth();
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    const notificationsAreFresh = notificationsLoadedAt && (Date.now() - notificationsLoadedAt) < 60000;
    if (!notificationsAreFresh) {
      refreshNotifications().catch(() => {});
    }
    const intervalId = window.setInterval(() => {
      refreshNotifications().catch(() => {});
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, notificationsLoadedAt, refreshNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const closeMobile = () => setMobileOpen(false);
  const navButtonStyle = (path) => ({
    ...styles.actionButton,
    ...(isActive(path) ? styles.actionButtonActive : {}),
  });

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.inner}>
          <Link to="/" style={styles.brand}>
            <span style={styles.brandIcon}>⚡</span>
            <span style={styles.brandText}>SwiftEats</span>
          </Link>

          <div style={styles.desktopNav}>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <>
                    <Link to="/admin/register-restaurant" style={{ ...styles.navLink, ...(isActive('/admin/register-restaurant') ? styles.navLinkActive : {}) }}>
                      <ChefHat size={16} />
                      Register Restaurant
                    </Link>
                    <Link to="/admin/restaurants" style={{ ...styles.navLink, ...(isActive('/admin/restaurants') ? styles.navLinkActive : {}) }}>
                      <ChefHat size={16} />
                      All Restaurants
                    </Link>
                  </>
                )}

                {isRestaurantAdmin && (
                  <>
                    <Link to="/restaurant-admin/dashboard" style={navButtonStyle('/restaurant-admin/dashboard')}>
                      <ChefHat size={16} />
                      Menu Dashboard
                    </Link>
                    <Link to="/restaurant-admin/drivers" style={navButtonStyle('/restaurant-admin/drivers')}>
                      <Truck size={16} />
                      Drivers Dashboard
                    </Link>
                    <Link to="/restaurant-admin/profile" style={navButtonStyle('/restaurant-admin/profile')}>
                      <ChefHat size={16} />
                      Restaurant Profile
                    </Link>
                  </>
                )}

                {isDriver && (
                  <Link to="/driver/dashboard" style={navButtonStyle('/driver/dashboard')}>
                    <Truck size={16} />
                    My Deliveries
                  </Link>
                )}

                {!isAdmin && !isRestaurantAdmin && !isDriver && (
                  <>
                    <Link to="/cart" style={styles.cartBtn}>
                      <ShoppingCart size={20} />
                      {itemCount > 0 && (
                        <span style={styles.cartBadge}>{itemCount > 9 ? '9+' : itemCount}</span>
                      )}
                    </Link>
                    <Link to="/favorites" style={navButtonStyle('/favorites')}>
                      <Heart size={16} />
                      Favorites
                      {favoriteCount > 0 && <span style={styles.inlineCount}>{favoriteCount}</span>}
                    </Link>
                    <Link to="/orders" style={navButtonStyle('/orders')}>
                      My Orders
                    </Link>
                  </>
                )}

                <Link to="/profile" style={navButtonStyle('/profile')} title="View profile">
                  <User size={15} />
                  <span>{isRestaurantAdmin ? 'Profile' : (user?.fullName?.split(' ')[0] || 'Profile')}</span>
                </Link>

                <Link to="/notifications" style={{ ...styles.notificationBtn, ...(isActive('/notifications') ? styles.actionButtonActive : {}) }} title="My notifications">
                  <Bell size={18} />
                  {unreadNotificationCount > 0 && (
                    <span style={styles.notificationBadge}>
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>

                <button onClick={handleLogout} style={styles.logoutBtn} title="Log out" aria-label="Log out">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.loginBtn}>Log In</Link>
                <Link to="/register" style={styles.signupBtn}>Sign Up</Link>
              </>
            )}
          </div>

          <button style={styles.mobileToggle} onClick={() => setMobileOpen((current) => !current)} aria-label="Toggle menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div style={styles.mobileMenu}>
            {isAuthenticated ? (
              <>
                <div style={styles.mobileUserInfo}>
                  <User size={16} />
                  {user?.fullName} . {user?.role}
                </div>
                <Link to="/notifications" style={styles.mobileLink} onClick={closeMobile}>
                  Notifications {unreadNotificationCount > 0 ? `(${unreadNotificationCount})` : ''}
                </Link>
                <Link to="/profile" style={styles.mobileLink} onClick={closeMobile}>My Profile</Link>
                {isAdmin && (
                  <>
                    <Link to="/admin/register-restaurant" style={styles.mobileLink} onClick={closeMobile}>Register Restaurant</Link>
                    <Link to="/admin/restaurants" style={styles.mobileLink} onClick={closeMobile}>All Restaurants</Link>
                  </>
                )}
                {isRestaurantAdmin && (
                  <>
                    <Link to="/restaurant-admin/dashboard" style={styles.mobileLink} onClick={closeMobile}>Menu Dashboard</Link>
                    <Link to="/restaurant-admin/drivers" style={styles.mobileLink} onClick={closeMobile}>Drivers Dashboard</Link>
                    <Link to="/restaurant-admin/profile" style={styles.mobileLink} onClick={closeMobile}>Restaurant Profile</Link>
                  </>
                )}
                {isDriver && (
                  <Link to="/driver/dashboard" style={styles.mobileLink} onClick={closeMobile}>My Deliveries</Link>
                )}
                {!isAdmin && !isRestaurantAdmin && !isDriver && (
                  <>
                    <Link to="/cart" style={styles.mobileLink} onClick={closeMobile}>Cart {itemCount > 0 ? `(${itemCount})` : ''}</Link>
                    <Link to="/favorites" style={styles.mobileLink} onClick={closeMobile}>Favorites {favoriteCount > 0 ? `(${favoriteCount})` : ''}</Link>
                    <Link to="/orders" style={styles.mobileLink} onClick={closeMobile}>My Orders</Link>
                  </>
                )}
                <button onClick={handleLogout} style={styles.mobileLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.mobileLink} onClick={closeMobile}>Log In</Link>
                <Link to="/register" style={styles.mobileLink} onClick={closeMobile}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </nav>
      <div style={{ height: 'var(--navbar-height)' }} />
    </>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 'var(--navbar-height)',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  inner: {
    maxWidth: 'var(--container-max)',
    margin: '0 auto',
    padding: '0 var(--space-lg)',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  brandIcon: {
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '1.3rem',
    lineHeight: 1,
  },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--primary)',
    letterSpacing: '-0.02em',
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)',
    background: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)',
    background: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    color: 'var(--primary)',
    background: 'var(--primary-glow)',
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  actionButtonActive: {
    color: 'var(--primary)',
    background: 'var(--primary-glow)',
    borderColor: 'rgba(248, 243, 243, 0.22)',
  },
  inlineCount: {
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    borderRadius: '999px',
    background: 'var(--primary-glow)',
    color: 'var(--primary)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  cartBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    background: 'transparent',
  },
  cartBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'var(--primary)',
    color: 'white',
    borderRadius: '999px',
    fontSize: '0.65rem',
    fontWeight: 700,
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  notificationBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)',
    background: 'white',
    color: 'var(--text-primary)',
    textDecoration: 'none',
  },
  notificationBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: '999px',
    background: 'var(--primary)',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {},
  userInfoActive: {},
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '42px',
    background: 'white',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  loginBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    border: '1.5px solid var(--border)',
  },
  signupBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: 600,
    background: 'var(--primary)',
    color: 'white',
    textDecoration: 'none',
    boxShadow: 'var(--shadow-primary)',
  },
  mobileToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
  mobileMenu: {
    position: 'absolute',
    top: 'var(--navbar-height)',
    left: 0,
    right: 0,
    background: 'white',
    borderBottom: '1px solid var(--border)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: 'var(--shadow-md)',
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  mobileLink: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontWeight: 500,
    display: 'block',
  },
  mobileLogout: {
    width: '100%',
    padding: '12px',
    background: 'var(--error-bg)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--error)',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
};
