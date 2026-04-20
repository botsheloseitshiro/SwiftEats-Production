import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import restaurantService from '../services/restaurant.service';
import { Building2, Lock } from 'lucide-react';

export default function AdminRestaurantRegistrationPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    category: '',
    imageUrl: '',
    deliveryTimeMinutes: 30,
    deliveryFee: 25.00,
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successResponse, setSuccessResponse] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [fieldValidations, setFieldValidations] = useState({
    passwordHasNumber: false,
    passwordHasSpecial: false,
    passwordLengthOk: false,
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!isAdmin) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Real-time password validation
    if (name === 'adminPassword') {
      validatePasswordRealtime(value);
    }
  };

  // Real-time password validation
  const validatePasswordRealtime = (password) => {
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*\-_=+]/.test(password);
    const lengthOk = password.length >= 6 && password.length <= 100;

    setFieldValidations(prev => ({
      ...prev,
      passwordHasNumber: hasNumber,
      passwordHasSpecial: hasSpecial,
      passwordLengthOk: lengthOk,
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    // Restaurant validations
    if (!formData.name.trim() || formData.name.trim().length < 2)
      newErrors.name = 'Restaurant name must be at least 2 characters';
    
    if (!formData.address.trim() || formData.address.trim().length < 5)
      newErrors.address = 'Address must be at least 5 characters';
    
    if (!formData.category || formData.category.trim().length === 0)
      newErrors.category = 'Category is required';
    
    if (formData.deliveryTimeMinutes <= 0)
      newErrors.deliveryTimeMinutes = 'Delivery time must be positive';
    
    if (formData.deliveryFee <= 0)
      newErrors.deliveryFee = 'Delivery fee must be positive';

    // Admin account validations
    if (!formData.adminFullName.trim() || formData.adminFullName.trim().length < 2)
      newErrors.adminFullName = 'Admin name must be at least 2 characters';
    
    if (!formData.adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail))
      newErrors.adminEmail = 'Valid email is required';
    
    // Password validation: length + number + special character
    if (!formData.adminPassword)
      newErrors.adminPassword = 'Password is required';
    else if (formData.adminPassword.length < 6 || formData.adminPassword.length > 100)
      newErrors.adminPassword = 'Password must be 6-100 characters';
    else if (!/\d/.test(formData.adminPassword))
      newErrors.adminPassword = 'Password must contain at least 1 number';
    else if (!/[!@#$%^&*\-_=+]/.test(formData.adminPassword))
      newErrors.adminPassword = 'Password must contain at least 1 special character (!@#$%^&*-_=+)';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      const response = await restaurantService.registerRestaurant(formData);
      setSuccessResponse(response);
      // Reset form
      setFormData({
        name: '',
        description: '',
        address: '',
        category: '',
        imageUrl: '',
        deliveryTimeMinutes: 30,
        deliveryFee: 25.00,
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
      });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to register restaurant');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Building2 size={32} style={{ color: 'var(--primary)' }} />
          <h1 style={styles.title}>Register New Restaurant</h1>
          <p style={styles.subtitle}>Add a new restaurant and create an admin account</p>
        </div>

        {successResponse && (
          <div style={styles.successBox}>
            <h3 style={{ margin: '0 0 12px 0', color: '#10b981' }}>✓ Restaurant Registered!</h3>
            <div style={styles.successDetails}>
              <p><strong>Restaurant:</strong> {successResponse.restaurantName}</p>
              <p><strong>Admin Email:</strong> {successResponse.adminEmail}</p>
              <p><strong>Admin Name:</strong> {successResponse.adminFullName}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                Share the above email and the password you set with the restaurant owner.
                They can now login to manage their menu items.
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <div style={styles.errorBox}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* === RESTAURANT SECTION === */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Restaurant Details</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Restaurant Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g., Nando's Johannesburg"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Flame-grilled chicken with PERi-PERi sauce"
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
                className={`form-input ${errors.address ? 'error' : ''}`}
                placeholder="123 Main St, Johannesburg"
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Category *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`form-input ${errors.category ? 'error' : ''}`}
                  placeholder="e.g., Chicken, Pizza, Sushi"
                />
                {errors.category && <span className="form-error">{errors.category}</span>}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Logo/Banner Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Delivery Time (minutes) *</label>
                <input
                  type="number"
                  name="deliveryTimeMinutes"
                  value={formData.deliveryTimeMinutes}
                  onChange={handleChange}
                  className={`form-input ${errors.deliveryTimeMinutes ? 'error' : ''}`}
                  placeholder="30"
                />
                {errors.deliveryTimeMinutes && <span className="form-error">{errors.deliveryTimeMinutes}</span>}
              </div>
              <div style={{ flex: 1, marginLeft: '16px' }}>
                <label style={styles.label}>Delivery Fee (R) *</label>
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleChange}
                  className={`form-input ${errors.deliveryFee ? 'error' : ''}`}
                  placeholder="25.00"
                  step="0.01"
                />
                {errors.deliveryFee && <span className="form-error">{errors.deliveryFee}</span>}
              </div>
            </div>
          </div>

          {/* === ADMIN ACCOUNT SECTION === */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Lock size={18} style={{ marginRight: '8px' }} />
              Restaurant Admin Account
            </h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Admin Full Name *</label>
              <input
                type="text"
                name="adminFullName"
                value={formData.adminFullName}
                onChange={handleChange}
                className={`form-input ${errors.adminFullName ? 'error' : ''}`}
                placeholder="Botshelo Seitshiro"
              />
              {errors.adminFullName && <span className="form-error">{errors.adminFullName}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Admin Email *</label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                className={`form-input ${errors.adminEmail ? 'error' : ''}`}
                placeholder="admin@nandos.com"
              />
              {errors.adminEmail && <span className="form-error">{errors.adminEmail}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Admin Password *</label>
              <div style={styles.inputWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.adminPassword ? 'error' : ''}`}
                  placeholder="Min. 8 characters with number and special char"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePassBtn}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.adminPassword && <span className="form-error">{errors.adminPassword}</span>}
              
              {/* Password validation checklist */}
              {formData.adminPassword && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}>
                  <p style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Password requirements:</p>
                  <p style={{ margin: '6px 0', color: fieldValidations.passwordLengthOk ? '#10b981' : '#666' }}>
                    {fieldValidations.passwordLengthOk ? '✓' : '✗'} 6-100 characters
                  </p>
                  <p style={{ margin: '6px 0', color: fieldValidations.passwordHasNumber ? '#10b981' : '#666' }}>
                    {fieldValidations.passwordHasNumber ? '✓' : '✗'} At least 1 number (0-9)
                  </p>
                  <p style={{ margin: '6px 0', color: fieldValidations.passwordHasSpecial ? '#10b981' : '#666' }}>
                    {fieldValidations.passwordHasSpecial ? '✓' : '✗'} At least 1 special character (!@#$%^&*-_=+)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '24px' }}
          >
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Registering...</>
            ) : 'Register Restaurant'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - var(--navbar-height))',
    padding: '32px 16px',
    background: 'var(--bg)',
  },
  card: {
    maxWidth: '700px',
    margin: '0 auto',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px 32px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '12px 0 6px 0',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  successBox: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    marginBottom: '24px',
  },
  successDetails: {
    fontSize: '0.9rem',
    color: '#166534',
  },
  errorBox: {
    background: 'var(--error-bg)',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    marginBottom: '24px',
    color: 'var(--error)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  inputWrap: {
    position: 'relative',
  },
  togglePassBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};
