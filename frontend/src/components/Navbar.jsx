import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, User, ChefHat, Truck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isRestaurantAdmin, isDriver, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  // Highlight active nav link
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.inner}>

          {/* ---- Brand Logo ---- */}
          <Link to="/" style={styles.brand}>
            <span style={styles.brandIcon}>⚡</span>
            <span style={styles.brandText}>SwiftEats</span>
          </Link>

          {/* ---- Desktop Nav Items ---- */}
          <div style={styles.desktopNav}>
            {isAuthenticated ? (
              <>
                {/* Admin: Register Restaurant */}
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

                {/* Restaurant Admin: Dashboard & Profile */}
                {isRestaurantAdmin && (
                  <>
                    <Link to="/restaurant-admin/dashboard" style={{ ...styles.navLink, ...(isActive('/restaurant-admin/dashboard') ? styles.navLinkActive : {}) }}>
                      <ChefHat size={16} />
                      My Menu
                    </Link>
                    <Link to="/restaurant-admin/profile" style={{ ...styles.navLink, ...(isActive('/restaurant-admin/profile') ? styles.navLinkActive : {}) }}>
                      <ChefHat size={16} />
                      Restaurant Profile
                    </Link>
                  </>
                )}

                {/* Driver: Dashboard */}
                {isDriver && (
                  <Link to="/driver/dashboard" style={{ ...styles.navLink, ...(isActive('/driver/dashboard') ? styles.navLinkActive : {}) }}>
                    <Truck size={16} />
                    My Deliveries
                  </Link>
                )}

                {/* Cart icon with item count badge - only for regular customers (not admin, not restaurant admin, not driver) */}
                {!isAdmin && !isRestaurantAdmin && !isDriver && (
                  <Link to="/cart" style={styles.cartBtn}>
                    <ShoppingCart size={20} />
                    {itemCount > 0 && (
                      <span style={styles.cartBadge}>{itemCount > 9 ? '9+' : itemCount}</span>
                    )}
                  </Link>
                )}

                {/* Orders link - only for regular customers */}
                {!isAdmin && !isRestaurantAdmin && !isDriver && (
                  <Link
                    to="/orders"
                    style={{ ...styles.navLink, ...(isActive('/orders') ? styles.navLinkActive : {}) }}
                  >
                    My Orders
                  </Link>
                )}

                {/* User greeting - clickable to view profile */}
                <Link
                  to="/profile"
                  style={{ ...styles.userInfo, ...(isActive('/profile') ? styles.userInfoActive : {}) }}
                  title="View profile"
                >
                  <User size={15} />
                  <span>{user?.fullName?.split(' ')[0]}</span>
                </Link>

                {/* Logout button */}
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.loginBtn}>Log In</Link>
                <Link to="/register" style={styles.signupBtn}>Sign Up Free</Link>
              </>
            )}
          </div>

          {/* ---- Mobile Menu Toggle ---- */}
          <button
            style={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ---- Mobile Dropdown ---- */}
        {mobileOpen && (
          <div style={styles.mobileMenu}>
            {isAuthenticated ? (
              <>
                <div style={styles.mobileUserInfo}>
                  <User size={16} />
                  {user?.fullName} · {user?.role}
                </div>
                <Link to="/profile" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                  👤 My Profile
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/admin/register-restaurant" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      🏢 Register Restaurant
                    </Link>
                    <Link to="/admin/restaurants" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      🏢 All Restaurants
                    </Link>
                  </>
                )}
                {isRestaurantAdmin && (
                  <>
                    <Link to="/restaurant-admin/dashboard" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      🍳 My Menu
                    </Link>
                    <Link to="/restaurant-admin/profile" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      🏪 Restaurant Profile
                    </Link>
                  </>
                )}
                {isDriver && (
                  <Link to="/driver/dashboard" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    🚚 My Deliveries
                  </Link>
                )}
                {!isAdmin && !isRestaurantAdmin && !isDriver && (
                  <>
                    <Link to="/cart" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      🛒 Cart {itemCount > 0 && `(${itemCount})`}
                    </Link>
                    <Link to="/orders" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      📦 My Orders
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} style={styles.mobileLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>Log In</Link>
                <Link to="/register" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </nav>
      {/* Spacer so page content doesn't hide behind fixed navbar */}
      <div style={{ height: 'var(--navbar-height)' }} />
    </>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
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
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  brandIcon: { fontSize: '1.5rem' },
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
    '@media(maxWidth:768px)': { display: 'none' },
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    color: 'var(--primary)',
    background: 'var(--primary-glow)',
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
    transition: 'background 0.2s',
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
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userInfoActive: {
    background: 'var(--primary-glow)',
    color: 'var(--primary)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'transparent',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    '@media(maxWidth:768px)': { display: 'flex' },
  },
  mobileMenu: {
    position: 'absolute',
    top: 'var(--navbar-height)',
    left: 0, right: 0,
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
