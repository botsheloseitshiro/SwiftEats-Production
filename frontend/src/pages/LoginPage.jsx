import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { consumeSessionExpiredMessage } from '../services/api';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const nextPath = searchParams.get('next');
  const from = location.state?.from?.pathname
    || (nextPath ? decodeURIComponent(nextPath) : '/');

  const initialMessage = useMemo(() => {
    if (location.state?.reason === 'auth_required') {
      return 'Please sign in to continue.';
    }

    const expiredMessage = consumeSessionExpiredMessage();
    if (expiredMessage) {
      return expiredMessage;
    }

    return '';
  }, [location.state]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialMessage) {
      setError(initialMessage);
    }
  }, [initialMessage]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'email' ? value.toLowerCase() : value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={authPageStyle}>
      <div style={authCard}>
        <div style={authHeader}>
          <div style={authLogo}>⚡</div>
          <h1 style={authTitle}>Welcome back</h1>
          <p style={authSubtitle}>Sign in to your SwiftEats account</p>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={inputWrap}>
              <Mail size={16} style={inputIcon} />
              <input
                className="form-input"
                style={{ paddingLeft: '42px' }}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={inputWrap}>
              <Lock size={16} style={inputIcon} />
              <input
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={togglePassBtn}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={auxRow}>
            <Link to="/forgot-password" style={subtleLink}>
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '4px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={authFooter}>
          Do not have an account? <Link to="/register" style={subtleLink}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}

const authPageStyle = {
  minHeight: 'calc(100vh - var(--navbar-height))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 16px',
  background: 'var(--bg)',
};

const authCard = {
  width: '100%',
  maxWidth: '420px',
  background: 'var(--surface)',
  borderRadius: 'var(--radius-xl)',
  padding: '40px 36px',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border)',
};

const authHeader = {
  textAlign: 'center',
  marginBottom: '28px',
};

const authLogo = {
  width: '52px',
  height: '52px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  color: 'white',
  fontWeight: 800,
  fontSize: '1.4rem',
  marginBottom: '12px',
};

const authTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.75rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: '6px',
};

const authSubtitle = {
  color: 'var(--text-secondary)',
  fontSize: '0.9375rem',
};

const errorBox = {
  background: 'var(--error-bg)',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: '0.875rem',
  color: 'var(--error)',
  marginBottom: '16px',
};

const inputWrap = { position: 'relative' };

const inputIcon = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-disabled)',
  pointerEvents: 'none',
};

const togglePassBtn = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-disabled)',
  display: 'flex',
  padding: '4px',
};

const auxRow = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '-4px',
};

const authFooter = {
  textAlign: 'center',
  marginTop: '20px',
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
};

const subtleLink = {
  color: 'var(--primary)',
  fontWeight: 600,
};
