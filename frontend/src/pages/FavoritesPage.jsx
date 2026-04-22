import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RestaurantCard } from '../components/ProtectedRoute';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesPage() {
  const { favorites, favoriteCount, loading, loaded, refreshFavorites } = useFavorites();
  const restaurants = favorites.map((favorite) => favorite.restaurant).filter(Boolean);

  if (loading && !loaded) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your favorites...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <section style={heroStyle}>
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '32px' }}>
          <div style={heroContent}>
            <span style={eyebrow}>
              <Heart size={14} />
              Saved restaurants
            </span>
            <h1 style={heroTitle}>Your Favorites</h1>
            <p style={heroText}>
              Keep your go-to restaurants close so reordering takes a lot less effort.
            </p>
            <div style={heroMeta}>
              <span>{favoriteCount} saved</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container" style={{ paddingTop: '28px', paddingBottom: '64px' }}>
        {restaurants.length === 0 ? (
          <div className="empty-state" style={emptyCard}>
            <div style={iconWrap}>
              <Heart size={24} />
            </div>
            <h3>No favorites yet</h3>
            <p>Tap the heart on any restaurant card to save it here for later.</p>
            <Link to="/" className="btn btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <>
            <div style={summaryRow}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your saved restaurants are ready whenever you want a quick reorder.
              </p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => refreshFavorites()}>
                Refresh
              </button>
            </div>

            <div className="grid-restaurants animate-fade-in">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const heroStyle = {
  background: 'linear-gradient(135deg, #201714 0%, #3E241D 55%, #201714 100%)',
  color: 'white',
};
const heroContent = { maxWidth: '620px' };
const eyebrow = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 12px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  fontSize: '0.8rem',
  fontWeight: 700,
  marginBottom: '16px',
};
const heroTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(2rem, 5vw, 3.25rem)',
  lineHeight: 1.05,
  marginBottom: '12px',
};
const heroText = {
  color: 'rgba(255,255,255,0.72)',
  maxWidth: '500px',
  fontSize: '1rem',
};
const heroMeta = {
  marginTop: '18px',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.92)',
  fontSize: '0.875rem',
  fontWeight: 600,
};
const summaryRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};
const emptyCard = {
  minHeight: '320px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '24px',
  boxShadow: 'var(--shadow-sm)',
};
const iconWrap = {
  width: '56px',
  height: '56px',
  borderRadius: '999px',
  background: 'var(--primary-glow)',
  color: 'var(--primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
