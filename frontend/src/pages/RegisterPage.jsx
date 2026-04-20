import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phoneNumber: '', address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [fieldValidations, setFieldValidations] = useState({
    passwordHasNumber: false,
    passwordHasSpecial: false,
    passwordLengthOk: false,
    emailValid: false,
    phoneValid: true, 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');

    // Real-time validation for specific fields
    if (name === 'password') {
      validatePasswordRealtime(value);
    } else if (name === 'email') {
      validateEmailRealtime(value);
    } else if (name === 'phoneNumber') {
      validatePhoneRealtime(value);
    }
  };

  // Real-time password validation
  const validatePasswordRealtime = (password) => {
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*_=+-]/.test(password);
    const lengthOk = password.length >= 6 && password.length <= 100;

    setFieldValidations(prev => ({
      ...prev,
      passwordHasNumber: hasNumber,
      passwordHasSpecial: hasSpecial,
      passwordLengthOk: lengthOk,
    }));
  };

  // Real-time email validation
  const validateEmailRealtime = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setFieldValidations(prev => ({
      ...prev,
      emailValid: emailRegex.test(email),
    }));
  };

  // Real-time phone validation
  const validatePhoneRealtime = (phoneNumber) => {
    if (!phoneNumber.trim()) {
      setFieldValidations(prev => ({ ...prev, phoneValid: true }));
      return;
    }
    const digitsOnly = phoneNumber.replace(/[\s\-()]/g, '');
    const isValid = /^\d+$/.test(digitsOnly) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
    setFieldValidations(prev => ({ ...prev, phoneValid: isValid }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2)
      newErrors.fullName = 'Full name must be at least 2 characters';
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address';
    
    // Password validation: length + number + special character
    if (!formData.password)
      newErrors.password = 'Password is required';
    else if (formData.password.length < 6 || formData.password.length > 100)
      newErrors.password = 'Password must be 6-100 characters';
    else if (!/\d/.test(formData.password))
      newErrors.password = 'Password must contain at least 1 number';
    else if (!/[!@#$%^&*_=+-]/.test(formData.password))
      newErrors.password = 'Password must contain at least 1 special character (!@#$%^&*-_=+)';

    // Phone validation (optional but if provided must be valid)
    if (formData.phoneNumber.trim()) {
      const digitsOnly = formData.phoneNumber.replace(/[\s\-()]/g, '');
      if (!/^\d+$/.test(digitsOnly) || digitsOnly.length < 10 || digitsOnly.length > 15)
        newErrors.phoneNumber = 'Phone number must be 10-15 digits';
    }

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
      await register(formData);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={authPageStyle}>
      <div style={{ ...authCard, maxWidth: '480px' }}>
        <div style={authHeader}>
          <div style={authLogo}>⚡</div>
          <h1 style={authTitle}>Create account</h1>
          <p style={authSubtitle}>Join thousands of SwiftEats customers</p>
        </div>

        {apiError && <div style={errorBox}>{apiError}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input
              className={`form-input ${errors.fullName ? 'error' : ''}`}
              type="text" name="fullName"
              placeholder="Botshelo Seisthiro"
              value={formData.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              className={`form-input ${errors.email ? 'error' : formData.email && !fieldValidations.emailValid ? 'error' : ''}`}
              type="email" name="email"
              placeholder="botshelo@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
            {formData.email && !fieldValidations.emailValid && !errors.email && (
              <span className="form-error">Invalid email address</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={inputWrap}>
              <input
                className={`form-input ${errors.password ? 'error' : ''}`}
                style={{ paddingRight: '42px' }}
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 chars, 1 number, 1 special char"
                value={formData.password}
                onChange={handleChange}
              />
              <button type="button" style={togglePassBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password validation checklist */}
            {formData.password && (
              <div style={passwordChecklistStyle}>
                <div style={{ ...checkItemStyle, color: fieldValidations.passwordLengthOk ? '#10b981' : '#ef4444' }}>
                  {fieldValidations.passwordLengthOk ? '✓' : 'X'} 6-100 characters
                </div>
                <div style={{ ...checkItemStyle, color: fieldValidations.passwordHasNumber ? '#10b981' : '#ef4444' }}>
                  {fieldValidations.passwordHasNumber ? '✓' : '✗'} At least 1 number (0-9)
                </div>
                <div style={{ ...checkItemStyle, color: fieldValidations.passwordHasSpecial ? '#10b981' : '#ef4444' }}>
                  {fieldValidations.passwordHasSpecial ? '✓' : '✗'} At least 1 special character (!@#$%^&*-_=+)
                </div>
              </div>
            )}

            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {/* Phone (optional) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number <span style={{ color: 'var(--text-disabled)' }}>(optional)</span></label>
            <input
              className={`form-input ${errors.phoneNumber ? 'error' : formData.phoneNumber && !fieldValidations.phoneValid ? 'error' : ''}`}
              type="tel" name="phoneNumber"
              placeholder="082 123 4567"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
            {formData.phoneNumber && !fieldValidations.phoneValid && !errors.phoneNumber && (
              <span className="form-error">Phone must be 10-15 digits (spaces and hyphens allowed)</span>
            )}
          </div>

          {/* Address (optional) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Delivery Address <span style={{ color: 'var(--text-disabled)' }}>(optional)</span></label>
            <input
              className="form-input"
              type="text" name="address"
              placeholder="43 Kapteijn St, Johannesburg"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '6px' }}
          >
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Creating account...</>
            ) : 'Create Account'}
          </button>
        </form>

        <p style={authFooter}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ----styles ----
const authPageStyle = {
  minHeight: 'calc(100vh - var(--navbar-height))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '32px 16px',
  background: 'var(--bg)',
};
const authCard = {
  width: '100%', maxWidth: '420px',
  background: 'var(--surface)',
  borderRadius: 'var(--radius-xl)',
  padding: '40px 36px',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border)',
};
const authHeader = {
  textAlign: 'center', marginBottom: '28px',
};
const authLogo = {
  fontSize: '2.5rem', marginBottom: '12px',
};
const authTitle = {
  fontFamily: 'var(--font-display)', fontSize: '1.75rem',
  fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px',
};
const authSubtitle = {
  color: 'var(--text-secondary)', fontSize: '0.9375rem',
};
const errorBox = {
  background: 'var(--error-bg)', border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)', padding: '10px 14px',
  fontSize: '0.875rem', color: 'var(--error)',
  marginBottom: '16px',
};
const inputWrap = { position: 'relative' };
const togglePassBtn = {
  position: 'absolute', right: '12px',
  top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none',
  cursor: 'pointer', color: 'var(--text-disabled)',
  display: 'flex', padding: '4px',
};
const passwordChecklistStyle = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', padding: '10px 12px',
  fontSize: '0.8rem', marginTop: '8px', lineHeight: 1.6,
  display: 'flex', flexDirection: 'column', gap: '6px',
};
const checkItemStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontWeight: 500,
};
const authFooter = {
  textAlign: 'center', marginTop: '20px',
  fontSize: '0.9rem', color: 'var(--text-secondary)',
};
