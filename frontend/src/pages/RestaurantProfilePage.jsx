import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock3, Edit2, Eye, EyeOff, MapPin, Save, Star, Truck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import restaurantService from '../services/restaurant.service';
import { mergeValidationErrors, validateMaxLength, validateRequired } from '../utils/validation';

const defaultHours = {
  mondayHours: '09:00-21:00',
  tuesdayHours: '09:00-21:00',
  wednesdayHours: '09:00-21:00',
  thursdayHours: '09:00-21:00',
  fridayHours: '09:00-22:00',
  saturdayHours: '10:00-22:00',
  sundayHours: '10:00-20:00',
};

const initialForm = {
  name: '',
  description: '',
  address: '',
  city: '',
  latitude: '',
  longitude: '',
  deliveryRadiusKm: 10,
  category: '',
  imageUrl: '',
  deliveryTimeMinutes: 30,
  deliveryFee: 25.0,
  ...defaultHours,
};

const openingDays = [
  ['mondayHours', 'Monday'],
  ['tuesdayHours', 'Tuesday'],
  ['wednesdayHours', 'Wednesday'],
  ['thursdayHours', 'Thursday'],
  ['fridayHours', 'Friday'],
  ['saturdayHours', 'Saturday'],
  ['sundayHours', 'Sunday'],
];

export default function RestaurantProfilePage() {
  const { isRestaurantAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [editSection, setEditSection] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(initialForm);

  const syncFormData = (managedRestaurant) => {
    setFormData({
      name: managedRestaurant.name || '',
      description: managedRestaurant.description || '',
      address: managedRestaurant.address || '',
      city: managedRestaurant.city || '',
      latitude: managedRestaurant.latitude ?? '',
      longitude: managedRestaurant.longitude ?? '',
      deliveryRadiusKm: managedRestaurant.deliveryRadiusKm ?? 10,
      category: managedRestaurant.category || '',
      imageUrl: managedRestaurant.imageUrl || '',
      deliveryTimeMinutes: managedRestaurant.deliveryTimeMinutes ?? 30,
      deliveryFee: managedRestaurant.deliveryFee ?? 25.0,
      mondayHours: managedRestaurant.mondayHours || defaultHours.mondayHours,
      tuesdayHours: managedRestaurant.tuesdayHours || defaultHours.tuesdayHours,
      wednesdayHours: managedRestaurant.wednesdayHours || defaultHours.wednesdayHours,
      thursdayHours: managedRestaurant.thursdayHours || defaultHours.thursdayHours,
      fridayHours: managedRestaurant.fridayHours || defaultHours.fridayHours,
      saturdayHours: managedRestaurant.saturdayHours || defaultHours.saturdayHours,
      sundayHours: managedRestaurant.sundayHours || defaultHours.sundayHours,
    });
  };

  const loadRestaurantProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await userService.getProfile();
      const managedRestaurant = profile.managedRestaurants?.[0];

      if (!managedRestaurant) {
        setError('No restaurant assigned to your account.');
        return;
      }

      setRestaurant(managedRestaurant);
      syncFormData(managedRestaurant);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isRestaurantAdmin) {
      navigate('/');
      return;
    }
    loadRestaurantProfile();
  }, [isAuthenticated, isRestaurantAdmin, loadRestaurantProfile, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateOverview = () => mergeValidationErrors([
    ['name', validateRequired(formData.name, 'Restaurant name', 2)],
    ['address', validateRequired(formData.address, 'Address', 5)],
    ['city', validateRequired(formData.city, 'City', 2)],
    ['category', validateRequired(formData.category, 'Category', 1)],
    ['description', validateMaxLength(formData.description, 'Description', 500)],
    ['deliveryRadiusKm', Number(formData.deliveryRadiusKm) <= 0 ? 'Delivery radius must be positive' : ''],
    ['deliveryTimeMinutes', Number(formData.deliveryTimeMinutes) <= 0 ? 'Delivery time must be positive' : ''],
    ['deliveryFee', Number(formData.deliveryFee) < 0 ? 'Delivery fee cannot be negative' : ''],
  ]);

  const validateHours = () => mergeValidationErrors(
    openingDays.map(([key, label]) => [key, validateRequired(formData[key], `${label} hours`, 3)]),
  );

  const saveSection = async (section) => {
    const validationErrors = section === 'overview' ? validateOverview() : validateHours();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      const updated = await restaurantService.update(restaurant.id, {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude === '' ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === '' ? null : parseFloat(formData.longitude),
        deliveryRadiusKm: parseFloat(formData.deliveryRadiusKm),
        category: formData.category,
        imageUrl: formData.imageUrl,
        deliveryTimeMinutes: parseInt(formData.deliveryTimeMinutes, 10),
        deliveryFee: parseFloat(formData.deliveryFee),
        mondayHours: formData.mondayHours,
        tuesdayHours: formData.tuesdayHours,
        wednesdayHours: formData.wednesdayHours,
        thursdayHours: formData.thursdayHours,
        fridayHours: formData.fridayHours,
        saturdayHours: formData.saturdayHours,
        sundayHours: formData.sundayHours,
        active: restaurant.active,
      });
      setRestaurant(updated);
      syncFormData(updated);
      setEditSection(null);
      setErrors({});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update restaurant.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (restaurant) {
      syncFormData(restaurant);
    }
    setErrors({});
    setEditSection(null);
  };

  const handleToggleActive = async () => {
    try {
      setSaving(true);
      const updated = await restaurantService.toggleRestaurantActive(restaurant.id, !restaurant.active);
      setRestaurant(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update restaurant status.');
    } finally {
      setSaving(false);
    }
  };

  const heroImage = useMemo(
    () => restaurant?.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    [restaurant?.imageUrl],
  );

  if (!isAuthenticated || !isRestaurantAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.feedbackCard}>
          <div style={styles.spinner} />
          <p style={styles.feedbackText}>Loading restaurant profile...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={loadRestaurantProfile} style={styles.inlineRetryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <AlertCircle size={18} />
          <span>No restaurant profile found.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <img src={heroImage} alt={restaurant.name} style={styles.heroImage} />
          <div style={styles.heroOverlay}>
            <div style={styles.heroTopRow}>
              <span style={{ ...styles.statusBadge, ...(restaurant.active ? styles.statusOpen : styles.statusClosed) }}>
                {restaurant.active ? 'Branch Active' : 'Branch Inactive'}
              </span>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={saving}
                style={{ ...styles.heroGhostButton, ...(restaurant.active ? styles.warningButton : styles.successButton) }}
              >
                {restaurant.active ? <EyeOff size={16} /> : <Eye size={16} />}
                {restaurant.active ? 'Pause Branch' : 'Activate Branch'}
              </button>
            </div>

            <div style={styles.heroCopy}>
              <p style={styles.eyebrow}>Restaurant Admin Profile</p>
              <h1 style={styles.heroTitle}>{restaurant.name}</h1>
              <p style={styles.heroDescription}>{restaurant.description || 'Keep your branch details, hours, and delivery settings up to date from one place.'}</p>
            </div>

            <div style={styles.metricGrid}>
              <div style={styles.metricCard}>
                <MapPin size={16} />
                <div>
                  <p style={styles.metricLabel}>Location</p>
                  <strong style={styles.metricValue}>{restaurant.city || 'City not set'}</strong>
                </div>
              </div>
              <div style={styles.metricCard}>
                <Truck size={16} />
                <div>
                  <p style={styles.metricLabel}>Delivery</p>
                  <strong style={styles.metricValue}>{restaurant.deliveryRadiusKm || 0} km radius</strong>
                </div>
              </div>
              <div style={styles.metricCard}>
                <Clock3 size={16} />
                <div>
                  <p style={styles.metricLabel}>Prep Time</p>
                  <strong style={styles.metricValue}>{restaurant.deliveryTimeMinutes || 0} mins</strong>
                </div>
              </div>
              <div style={styles.metricCard}>
                <Star size={16} />
                <div>
                  <p style={styles.metricLabel}>Rating</p>
                  <strong style={styles.metricValue}>{restaurant.rating?.toFixed(1) || '0.0'} / 5</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && <div style={styles.errorCard}><AlertCircle size={18} /><span>{error}</span></div>}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Branch Overview</h2>
              <p style={styles.panelSubtitle}>Core branch details for customers, restaurant staff, and delivery coverage.</p>
            </div>
            {editSection === 'overview' ? (
              <div style={styles.panelActions}>
                <button type="button" className="btn btn-primary" onClick={() => saveSection('overview')} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Overview'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => { setEditSection('overview'); setErrors({}); }}>
                <Edit2 size={16} />
                Edit Branch Overview
              </button>
            )}
          </div>

          {editSection === 'overview' ? (
            <div style={styles.formSection}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Restaurant Name *</label>
                  <input className="form-input" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. KFC Johannesburg" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <input className="form-input" name="category" value={formData.category} onChange={handleChange} placeholder="Chicken, Pizza, Burgers" />
                  {errors.category && <span className="form-error">{errors.category}</span>}
                </div>
                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Description</label>
                  <textarea className="form-input" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe the branch, menu focus, and delivery coverage." />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>
                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Address *</label>
                  <input className="form-input" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street" />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>City *</label>
                  <input className="form-input" name="city" value={formData.city} onChange={handleChange} placeholder="Johannesburg" />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Image URL</label>
                  <input className="form-input" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/restaurant.jpg" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Radius (km) *</label>
                  <input className="form-input" type="number" min="1" step="0.1" name="deliveryRadiusKm" value={formData.deliveryRadiusKm} onChange={handleChange} />
                  {errors.deliveryRadiusKm && <span className="form-error">{errors.deliveryRadiusKm}</span>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Time (mins) *</label>
                  <input className="form-input" type="number" min="1" name="deliveryTimeMinutes" value={formData.deliveryTimeMinutes} onChange={handleChange} />
                  {errors.deliveryTimeMinutes && <span className="form-error">{errors.deliveryTimeMinutes}</span>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Fee (R) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" name="deliveryFee" value={formData.deliveryFee} onChange={handleChange} />
                  {errors.deliveryFee && <span className="form-error">{errors.deliveryFee}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.detailGrid}>
              <article style={styles.detailCard}>
                <span style={styles.detailLabel}>Category</span>
                <p style={styles.detailValue}>{restaurant.category || 'Not set'}</p>
              </article>
              <article style={styles.detailCard}>
                <span style={styles.detailLabel}>Delivery Fee</span>
                <p style={styles.detailValue}>R{restaurant.deliveryFee?.toFixed(2) || '0.00'}</p>
              </article>
              <article style={styles.detailCard}>
                <span style={styles.detailLabel}>Delivery Radius</span>
                <p style={styles.detailValue}>{restaurant.deliveryRadiusKm || 0} km</p>
              </article>
              <article style={styles.detailCard}>
                <span style={styles.detailLabel}>Prep Time</span>
                <p style={styles.detailValue}>{restaurant.deliveryTimeMinutes || 0} mins</p>
              </article>
              <article style={styles.detailCardWide}>
                <span style={styles.detailLabel}>Address</span>
                <p style={styles.detailValue}>{restaurant.address || 'No address saved yet.'}</p>
              </article>
              <article style={styles.detailCardWide}>
                <span style={styles.detailLabel}>Description</span>
                <p style={styles.detailValue}>{restaurant.description || 'No branch description added yet.'}</p>
              </article>
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Trading Hours</h2>
              <p style={styles.panelSubtitle}>Customer ordering windows for each day of the week.</p>
            </div>
            {editSection === 'hours' ? (
              <div style={styles.panelActions}>
                <button type="button" className="btn btn-primary" onClick={() => saveSection('hours')} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Trading Hours'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => { setEditSection('hours'); setErrors({}); }}>
                <Edit2 size={16} />
                Edit Trading Hours
              </button>
            )}
          </div>

          {editSection === 'hours' ? (
            <div style={styles.hoursFormGrid}>
              {openingDays.map(([key, label]) => (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>{label}</label>
                  <input className="form-input" name={key} value={formData[key]} onChange={handleChange} placeholder="09:00-21:00 or CLOSED" />
                  {errors[key] && <span className="form-error">{errors[key]}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.hoursGrid}>
              {openingDays.map(([key, label]) => (
                <div key={key} style={styles.hoursRow}>
                  <span style={styles.hoursDay}>{label}</span>
                  <strong style={styles.hoursValue}>{restaurant[key] || 'Closed'}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - var(--navbar-height))',
    background: 'var(--bg)',
    padding: '32px 16px 56px',
  },
  shell: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '24px',
    minHeight: '340px',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: 'var(--shadow-lg)',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'relative',
    zIndex: 1,
    minHeight: '340px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '28px',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.74), rgba(239,68,68,0.60))',
    color: '#fff',
  },
  heroTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  heroCopy: {
    maxWidth: '720px',
  },
  eyebrow: {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontSize: '0.78rem',
    opacity: 0.82,
  },
  heroTitle: {
    margin: '12px 0 10px',
    fontSize: 'clamp(2rem, 4vw, 3.25rem)',
    fontWeight: 800,
    lineHeight: 1.05,
  },
  heroDescription: {
    margin: 0,
    maxWidth: '620px',
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.86)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '999px',
    padding: '10px 14px',
    fontWeight: 700,
    backdropFilter: 'blur(8px)',
  },
  statusOpen: {
    background: 'rgba(34,197,94,0.18)',
    color: '#DCFCE7',
    border: '1px solid rgba(187,247,208,0.28)',
  },
  statusClosed: {
    background: 'rgba(248,113,113,0.18)',
    color: '#FEE2E2',
    border: '1px solid rgba(254,202,202,0.28)',
  },
  heroGhostButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '14px',
    padding: '11px 16px',
    border: '1px solid rgba(255,255,255,0.24)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  warningButton: {
    color: '#FDE68A',
  },
  successButton: {
    color: '#DCFCE7',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.16)',
    backdropFilter: 'blur(6px)',
  },
  metricLabel: {
    margin: 0,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.72)',
  },
  metricValue: {
    fontSize: '0.98rem',
  },
  feedbackCard: {
    maxWidth: '440px',
    margin: '80px auto 0',
    padding: '28px',
    borderRadius: '20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  feedbackText: {
    margin: 0,
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '999px',
    border: '4px solid var(--border)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 1s linear infinite',
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--error-bg)',
    color: 'var(--error)',
    border: '1px solid #FECACA',
    borderRadius: '16px',
    padding: '14px 16px',
    flexWrap: 'wrap',
  },
  inlineRetryBtn: {
    border: 'none',
    borderRadius: '10px',
    background: 'var(--error)',
    color: 'white',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  panel: {
    background: 'var(--surface)',
    borderRadius: '22px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '24px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '1.35rem',
    fontWeight: 800,
  },
  panelSubtitle: {
    margin: '6px 0 0',
    color: 'var(--text-secondary)',
  },
  panelActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
  },
  detailCard: {
    borderRadius: '18px',
    background: 'var(--surface-2)',
    padding: '18px',
    border: '1px solid var(--border)',
  },
  detailCardWide: {
    gridColumn: '1 / -1',
    borderRadius: '18px',
    background: 'var(--surface-2)',
    padding: '18px',
    border: '1px solid var(--border)',
  },
  detailLabel: {
    display: 'block',
    marginBottom: '10px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.76rem',
    fontWeight: 700,
  },
  detailValue: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  hoursGrid: {
    display: 'grid',
    gap: '12px',
  },
  hoursRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 16px',
    borderRadius: '16px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
  },
  hoursDay: {
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  hoursValue: {
    color: 'var(--text-secondary)',
  },
  formSection: {
    borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    padding: '18px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  hoursFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
};
