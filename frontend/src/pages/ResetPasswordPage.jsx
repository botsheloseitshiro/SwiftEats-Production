import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import authService from '../services/auth.service';

function validatePasswordRules(password) {
  if (!password) return 'Please enter a new password.';
  if (password.length < 6 || password.length > 100) return 'Password must be 6-100 characters.';
  if (!/\d/.test(password)) return 'Password must contain at least 1 number.';
  if (!/[!@#$%^&*_=+-]/.test(password)) return 'Password must contain at least 1 special character.';
  return '';
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!token) {
      nextErrors.token = 'This password reset link is missing a token.';
    }
    const passwordError = validatePasswordRules(newPassword);
    if (passwordError) nextErrors.newPassword = passwordError;
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.resetPassword({ token, newPassword });
      setMessage(response.message);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authPageStyle}>
      <div style={authCard}>
        <div style={authHeader}>
          <div style={authLogo}>⚡</div>
          <h1 style={authTitle}>Choose a new password</h1>
          <p style={authSubtitle}>
            Set a strong password with at least one number and one special character.
          </p>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {message && <div style={successBox}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password</label>
            <div style={inputWrap}>
              <Lock size={16} style={inputIcon} />
              <input
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder="Enter a new password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (error) setError('');
                  if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                }}
                autoComplete="new-password"
              />
              <button type="button" style={togglePassBtn} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.newPassword && <span className="form-error">{fieldErrors.newPassword}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm Password</label>
            <div style={inputWrap}>
              <Lock size={16} style={inputIcon} />
              <input
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (error) setError('');
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                autoComplete="new-password"
              />
              <button type="button" style={togglePassBtn} onClick={() => setShowConfirmPassword((value) => !value)}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
          </div>

          <div style={passwordRulesBox}>
            Password rules: 6-100 characters, at least 1 number, at least 1 special character.
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !token}>
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Updating password...</>
            ) : 'Reset password'}
          </button>
        </form>

        <p style={authFooter}>
          <Link to="/login" style={subtleLink}>
            Return to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

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
const successBox = {
  background: 'var(--success-bg)', border: '1px solid #BBF7D0',
  borderRadius: 'var(--radius-md)', padding: '10px 14px',
  fontSize: '0.875rem', color: 'var(--success)',
  marginBottom: '16px',
};
const inputWrap = { position: 'relative' };
const inputIcon = {
  position: 'absolute', left: '14px',
  top: '50%', transform: 'translateY(-50%)',
  color: 'var(--text-disabled)', pointerEvents: 'none',
};
const togglePassBtn = {
  position: 'absolute', right: '12px',
  top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none',
  cursor: 'pointer', color: 'var(--text-disabled)',
  display: 'flex', padding: '4px',
};
const authFooter = {
  textAlign: 'center', marginTop: '20px',
  fontSize: '0.9rem', color: 'var(--text-secondary)',
};
const subtleLink = {
  color: 'var(--primary)',
  fontWeight: 600,
};
const passwordRulesBox = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
};
