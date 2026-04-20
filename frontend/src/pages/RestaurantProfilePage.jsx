
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import restaurantService from '../services/restaurant.service';
import { Edit2, Save, X, Eye, EyeOff, AlertCircle, Star } from 'lucide-react';
import { mergeValidationErrors, validateMaxLength, validateRequired } from '../utils/validation';

export default function RestaurantProfilePage() {
  const { isRestaurantAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
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
    deliveryFee: 25.00,
    mondayHours: '09:00-21:00',
    tuesdayHours: '09:00-21:00',
    wednesdayHours: '09:00-21:00',
    thursdayHours: '09:00-21:00',
    fridayHours: '09:00-22:00',
    saturdayHours: '10:00-22:00',
    sundayHours: '10:00-20:00',
  });

  const [errors, setErrors] = useState({});

  // Load restaurant profile on mount
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
  }, [isAuthenticated, isRestaurantAdmin, navigate]);

  const loadRestaurantProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getProfile();
      
      // Get the first managed restaurant
      if (profile.managedRestaurants && profile.managedRestaurants.length > 0) {
        const restaurantData = profile.managedRestaurants[0];
        setRestaurant(restaurantData);
        setFormData({
          name: restaurantData.name,
          description: restaurantData.description || '',
          address: restaurantData.address || '',
          city: restaurantData.city || '',
          latitude: restaurantData.latitude ?? '',
          longitude: restaurantData.longitude ?? '',
          deliveryRadiusKm: restaurantData.deliveryRadiusKm ?? 10,
          category: restaurantData.category || '',
          imageUrl: restaurantData.imageUrl || '',
          deliveryTimeMinutes: restaurantData.deliveryTimeMinutes || 30,
          deliveryFee: restaurantData.deliveryFee || 25.00,
          mondayHours: restaurantData.mondayHours || '09:00-21:00',
          tuesdayHours: restaurantData.tuesdayHours || '09:00-21:00',
          wednesdayHours: restaurantData.wednesdayHours || '09:00-21:00',
          thursdayHours: restaurantData.thursdayHours || '09:00-21:00',
          fridayHours: restaurantData.fridayHours || '09:00-22:00',
          saturdayHours: restaurantData.saturdayHours || '10:00-22:00',
          sundayHours: restaurantData.sundayHours || '10:00-20:00',
        });
      } else {
        setError('No restaurant assigned to your account');
      }
    } catch (err) {
      console.error('Failed to load restaurant profile:', err);
      setError(err.response?.data?.message || 'Failed to load restaurant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    return mergeValidationErrors([
      ['name', validateRequired(formData.name, 'Restaurant name', 2)],
      ['address', validateRequired(formData.address, 'Address', 5)],
      ['city', validateRequired(formData.city, 'City', 2)],
      ['category', validateRequired(formData.category, 'Category', 1)],
      ['description', validateMaxLength(formData.description, 'Description', 500)],
      ['deliveryRadiusKm', Number(formData.deliveryRadiusKm) <= 0 ? 'Delivery radius must be positive' : ''],
      ['deliveryTimeMinutes', Number(formData.deliveryTimeMinutes) <= 0 ? 'Delivery time must be positive' : ''],
      ['deliveryFee', Number(formData.deliveryFee) <= 0 ? 'Delivery fee must be positive' : ''],
    ]);
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude === '' ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === '' ? null : parseFloat(formData.longitude),
        deliveryRadiusKm: parseFloat(formData.deliveryRadiusKm),
        category: formData.category,
        imageUrl: formData.imageUrl,
        deliveryTimeMinutes: parseInt(formData.deliveryTimeMinutes),
        deliveryFee: parseFloat(formData.deliveryFee),
        mondayHours: formData.mondayHours,
        tuesdayHours: formData.tuesdayHours,
        wednesdayHours: formData.wednesdayHours,
        thursdayHours: formData.thursdayHours,
        fridayHours: formData.fridayHours,
        saturdayHours: formData.saturdayHours,
        sundayHours: formData.sundayHours,
        active: restaurant.active,
      };

      const updated = await restaurantService.update(restaurant.id, updateData);
      setRestaurant(updated);
      setMode('view');
      setError(null);
    } catch (err) {
      console.error('Failed to update restaurant:', err);
      setError(err.response?.data?.message || 'Failed to update restaurant');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setSaving(true);
      const updated = await restaurantService.toggleRestaurantActive(
        restaurant.id,
        !restaurant.active
      );
      setRestaurant(updated);
    } catch (err) {
      console.error('Failed to toggle restaurant status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !isRestaurantAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p>Loading restaurant profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <AlertCircle size={20} />
          <p>{error}</p>
          <button onClick={loadRestaurantProfile} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <AlertCircle size={20} />
          <p>No restaurant found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Restaurant Profile</h1>
      </div>

      {/* View Mode */}
      {mode === 'view' && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>{restaurant.name}</h2>
            <div style={styles.cardActions}>
              <button
                onClick={() => handleToggleActive()}
                disabled={saving}
                style={{
                  ...styles.actionBtn,
                  ...(restaurant.active ? styles.activeBtn : styles.inactiveBtn)
                }}
              >
                {restaurant.active ? (
                  <>
                    <Eye size={16} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <EyeOff size={16} />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={() => setMode('edit')}
                style={styles.editBtn}
              >
                <Edit2 size={16} />
                Edit Details
              </button>
            </div>
          </div>

          <div style={styles.viewContent}>
            {restaurant.imageUrl && (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                style={styles.image}
              />
            )}

            <div style={styles.details}>
              <div style={styles.detailRow}>
                <label style={styles.detailLabel}>Category</label>
                <p style={styles.detailValue}>{restaurant.category}</p>
              </div>

              <div style={styles.detailRow}>
                <label style={styles.detailLabel}>Description</label>
                <p style={styles.detailValue}>{restaurant.description || 'No description'}</p>
              </div>

              <div style={styles.detailRow}>
                <label style={styles.detailLabel}>Address</label>
                <p style={styles.detailValue}>{restaurant.address}</p>
              </div>

              <div style={styles.twoColumn}>
                <div style={styles.detailRow}>
                  <label style={styles.detailLabel}>City</label>
                  <p style={styles.detailValue}>{restaurant.city || 'Not set'}</p>
                </div>
                <div style={styles.detailRow}>
                  <label style={styles.detailLabel}>Delivery Radius</label>
                  <p style={styles.detailValue}>{restaurant.deliveryRadiusKm || 0} km</p>
                </div>
              </div>

              <div style={styles.twoColumn}>
                <div style={styles.detailRow}>
                  <label style={styles.detailLabel}>Delivery Time</label>
                  <p style={styles.detailValue}>~{restaurant.deliveryTimeMinutes} minutes</p>
                </div>
                <div style={styles.detailRow}>
                  <label style={styles.detailLabel}>Delivery Fee</label>
                  <p style={styles.detailValue}>R{restaurant.deliveryFee?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <div style={styles.twoColumn}>
                <div style={styles.detailRow}>
                  <label style={styles.detailLabel}>Rating</label>
                  <p style={styles.detailValue}> <Star size={13} /> {restaurant.rating?.toFixed(1) || '0.0'}</p>
                </div>
                <div style={styles.detailRow}>
                  <label style={styles.detailLabel}>Status</label>
                  <p style={{
                    ...styles.detailValue,
                    color: restaurant.active ? '#15803d' : '#991b1b',
                    fontWeight: '600'
                  }}>
                    {restaurant.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div style={styles.detailRow}>
                <label style={styles.detailLabel}>Operating Hours</label>
                <div style={styles.hoursGrid}>
                  {[
                    ['Monday', restaurant.mondayHours],
                    ['Tuesday', restaurant.tuesdayHours],
                    ['Wednesday', restaurant.wednesdayHours],
                    ['Thursday', restaurant.thursdayHours],
                    ['Friday', restaurant.fridayHours],
                    ['Saturday', restaurant.saturdayHours],
                    ['Sunday', restaurant.sundayHours],
                  ].map(([day, hours]) => (
                    <div key={day} style={styles.hoursRow}>
                      <span>{day}</span>
                      <strong>{hours}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {mode === 'edit' && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Edit Restaurant Details</h2>
          </div>

          <form style={styles.editForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Restaurant Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Nando's Johannesburg"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Chicken, Pizza, Burgers"
              />
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="Brief description of your restaurant"
                rows={3}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
                placeholder="123 Main St, City"
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            <div style={styles.twoColumnForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Johannesburg"
                />
                {errors.city && <span className="form-error">{errors.city}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Delivery Radius (km) *</label>
                <input
                  type="number"
                  name="deliveryRadiusKm"
                  value={formData.deliveryRadiusKm}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  step="0.1"
                />
                {errors.deliveryRadiusKm && <span className="form-error">{errors.deliveryRadiusKm}</span>}
              </div>
            </div>

            <div style={styles.twoColumnForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="form-input"
                  step="0.000001"
                  placeholder="-26.2041"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="form-input"
                  step="0.000001"
                  placeholder="28.0473"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div style={styles.twoColumnForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Delivery Time (minutes) *</label>
                <input
                  type="number"
                  name="deliveryTimeMinutes"
                  value={formData.deliveryTimeMinutes}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                />
                {errors.deliveryTimeMinutes && <span className="form-error">{errors.deliveryTimeMinutes}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Delivery Fee (R) *</label>
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
                {errors.deliveryFee && <span className="form-error">{errors.deliveryFee}</span>}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Operating Hours (Monday to Sunday)</label>
              <div style={styles.hoursFormGrid}>
                {[
                  ['mondayHours', 'Monday'],
                  ['tuesdayHours', 'Tuesday'],
                  ['wednesdayHours', 'Wednesday'],
                  ['thursdayHours', 'Thursday'],
                  ['fridayHours', 'Friday'],
                  ['saturdayHours', 'Saturday'],
                  ['sundayHours', 'Sunday'],
                ].map(([key, label]) => (
                  <div key={key} style={styles.formGroup}>
                    <label style={styles.detailLabel}>{label}</label>
                    <input
                      type="text"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="09:00-21:00 or CLOSED"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={styles.saveBtn}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('view');
                  setErrors({});
                }}
                style={styles.cancelBtn}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: 'var(--space-xl)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  linkBtn: {
    padding: '10px 16px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'white',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
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
  retryBtn: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: '#dc2626',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  card: {
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
  },
  actionBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  activeBtn: {
    background: '#dcfce7',
    color: '#15803d',
  },
  inactiveBtn: {
    background: '#fee2e2',
    color: '#991b1b',
  },
  editBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'white',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  viewContent: {
    padding: '20px',
  },
  image: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    margin: 0,
  },
  hoursGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  hoursRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'var(--surface-2)',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  editForm: {
    padding: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  twoColumnForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  hoursFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)',
  },
  saveBtn: {
    flex: 1,
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--primary)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 24px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'white',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};
