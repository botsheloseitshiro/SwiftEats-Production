import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff, MapPin, Clock3, Truck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import restaurantService from '../services/restaurant.service';

export default function AdminRestaurantDetailsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getById(restaurantId);
      setRestaurant(data);
      setError(null);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    loadRestaurant();
  }, [isAuthenticated, isAdmin, loadRestaurant, navigate]);

  const handleToggleActive = async () => {
    if (!restaurant) return;

    try {
      setSaving(true);
      const updated = await restaurantService.toggleRestaurantActive(restaurant.id, !restaurant.active);
      setRestaurant(updated);
    } catch (err) {
      console.error('Failed to update restaurant status:', err);
      setError(err.response?.data?.message || 'Failed to update restaurant status');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p>Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <AlertCircle size={20} />
          <p>{error || 'Restaurant not found'}</p>
          <button onClick={loadRestaurant} style={styles.secondaryBtn}>Retry</button>
          <button onClick={() => navigate('/admin/restaurants')} style={styles.secondaryBtn}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={() => navigate('/admin/restaurants')} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Restaurants
        </button>
        <button
          onClick={handleToggleActive}
          disabled={saving}
          style={{
            ...styles.toggleBtn,
            ...(restaurant.active ? styles.toggleBtnActive : styles.toggleBtnInactive),
          }}
        >
          {restaurant.active ? <Eye size={16} /> : <EyeOff size={16} />}
          {restaurant.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div style={styles.hero}>
        {restaurant.imageUrl ? (
          <img src={restaurant.imageUrl} alt={restaurant.name} style={styles.image} />
        ) : (
          <div style={styles.imagePlaceholder}>No Image</div>
        )}

        <div style={styles.heroContent}>
          <p style={styles.badge}>{restaurant.category || 'Restaurant'}</p>
          <h1 style={styles.title}>{restaurant.name}</h1>
          <p style={styles.description}>{restaurant.description || 'No description provided.'}</p>

          <div style={styles.metaGrid}>
            <div style={styles.metaCard}>
              <MapPin size={16} />
              <span>{restaurant.address || 'No address provided'}</span>
            </div>
            <div style={styles.metaCard}>
              <Clock3 size={16} />
              <span>{restaurant.deliveryTimeMinutes || 0} min</span>
            </div>
            <div style={styles.metaCard}>
              <Truck size={16} />
              <span>R{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
            </div>
            <div style={styles.metaCard}>
              <Star size={16} />
              <span>{Number(restaurant.rating || 0).toFixed(1)}</span>
            </div>
          </div>

          <p style={{ ...styles.status, color: restaurant.active ? '#15803d' : '#991b1b' }}>
            {restaurant.active ? 'Active and visible to customers' : 'Inactive and hidden from customers'}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: 'var(--space-xl)',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '320px',
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--border)',
    borderTop: '4px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'white',
    cursor: 'pointer',
    fontWeight: '600',
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
  },
  toggleBtnActive: {
    background: '#dcfce7',
    color: '#15803d',
  },
  toggleBtnInactive: {
    background: '#fee2e2',
    color: '#991b1b',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 360px) 1fr',
    gap: '24px',
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: '320px',
    objectFit: 'cover',
    background: 'var(--bg-secondary)',
  },
  imagePlaceholder: {
    minHeight: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  heroContent: {
    padding: '28px',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    background: 'var(--primary-glow)',
    color: 'var(--primary)',
    fontWeight: '700',
    fontSize: '12px',
    margin: '0 0 12px 0',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '32px',
    color: 'var(--text-primary)',
  },
  description: {
    margin: '0 0 20px 0',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  metaCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '10px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  status: {
    margin: '20px 0 0 0',
    fontWeight: '700',
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '16px',
    color: '#991b1b',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid currentColor',
    background: 'transparent',
    cursor: 'pointer',
  },
};
