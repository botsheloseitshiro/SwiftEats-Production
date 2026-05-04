import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import authService from '../services/auth.service';

const RESET_PASSWORD_FALLBACK_URL = 'http://localhost:3000/reset-password';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [showSuccessPanel, setShowSuccessPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setResetUrl('');
    setShowSuccessPanel(false);

    try {
      const response = await authService.forgotPassword(email.trim());
      setMessage(response.message);
      setResetUrl(response.resetUrl || '');
      setShowSuccessPanel(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authPageStyle}>
      <div style={authCard}>
        <div style={authHeader}>
          <div style={authLogo}>⚡</div>
          <h1 style={authTitle}>Reset your password</h1>
          <p style={authSubtitle}>
            Enter the email linked to your account and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {message && <div style={successBox}>{message}</div>}
        {showSuccessPanel && (
          <div style={successPanel}>
            <div style={successPanelHeader}>
              <CheckCircle2 size={18} />
              <span>Password reset link generated successfully.</span>
            </div>
            <p style={successPanelText}>
              Continue to the reset page to finish the password update flow.
            </p>
            <div style={successPanelActions}>
              <a
                href={resetUrl || RESET_PASSWORD_FALLBACK_URL}
                style={primaryActionLink}
              >
                Open reset password page
                <ArrowRight size={15} />
              </a>
              {resetUrl && (
                <a href={resetUrl} style={resetLinkStyle}>
                  Use generated link
                </a>
              )}
            </div>
          </div>
        )}

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
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value.toLowerCase());
                  if (error) setError('');
                }}
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Sending link...</>
            ) : 'Send reset link'}
          </button>
        </form>

        <p style={authFooter}>
          Remembered your password?{' '}
          <Link to="/login" style={subtleLink}>
            Back to sign in
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
const successPanel = {
  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(34, 197, 94, 0.06))',
  border: '1px solid rgba(34, 197, 94, 0.25)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  marginBottom: '16px',
};
const successPanelHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--success)',
  fontWeight: 700,
  marginBottom: '8px',
};
const successPanelText = {
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  marginBottom: '12px',
};
const successPanelActions = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};
const primaryActionLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 700,
  textDecoration: 'none',
};
const inputWrap = { position: 'relative' };
const inputIcon = {
  position: 'absolute', left: '14px',
  top: '50%', transform: 'translateY(-50%)',
  color: 'var(--text-disabled)', pointerEvents: 'none',
};
const authFooter = {
  textAlign: 'center', marginTop: '20px',
  fontSize: '0.9rem', color: 'var(--text-secondary)',
};
const subtleLink = {
  color: 'var(--primary)',
  fontWeight: 600,
};
const resetLinkStyle = {
  color: 'var(--primary)',
  fontWeight: 600,
  wordBreak: 'break-all',
};
