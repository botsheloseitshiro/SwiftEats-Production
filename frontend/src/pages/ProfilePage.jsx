import React, { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Edit2, KeyRound, MapPin, Mail, Phone, Save, User, X } from 'lucide-react';
import userService from '../services/user.service';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';
import { mergeValidationErrors, validateMaxLength, validatePhoneNumber, validateRequired } from '../utils/validation';

function validatePasswordRules(password) {
  if (!password) return 'Password is required';
  if (password.length < 6 || password.length > 100) return 'Password must be 6-100 characters';
  if (!/\d/.test(password)) return 'Password must contain at least 1 number';
  if (!/[!@#$%^&*_=+-]/.test(password)) return 'Password must contain at least 1 special character';
  return '';
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
  });
  const [addressForm, setAddressForm] = useState({ id: null, label: '', addressLine: '', isDefault: false });
  const [cardForm, setCardForm] = useState({ id: null, cardHolderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', isDefault: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
      });
      setCardForm((current) => ({ ...current, cardHolderName: data.fullName || '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const validateProfile = () => (
    mergeValidationErrors([
      ['fullName', validateRequired(formData.fullName, 'Full name', 2)],
      ['phoneNumber', validatePhoneNumber(formData.phoneNumber)],
      ['address', validateMaxLength(formData.address, 'Address', 500)],
    ])
  );

  const validateCard = () => {
    const sanitized = cardForm.cardNumber.replace(/\s+/g, '');
    if (!cardForm.cardHolderName.trim()) return 'Card holder name is required.';
    if (!/^\d{16}$/.test(sanitized)) return 'Card number must contain exactly 16 digits.';
    if (!['4', '5'].includes(sanitized.charAt(0))) return 'Only Visa and Mastercard are supported.';
    if (!cardForm.expiryMonth || Number(cardForm.expiryMonth) < 1 || Number(cardForm.expiryMonth) > 12) return 'Enter a valid expiry month.';
    if (!cardForm.expiryYear || Number(cardForm.expiryYear) < new Date().getFullYear()) return 'Enter a valid expiry year.';
    return '';
  };

  const handleSaveProfile = async () => {
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      clearMessages();
      setSaving(true);
      const updated = await userService.updateProfile(formData);
      setProfile(updated);
      setIsEditing(false);
      setErrors({});
      setSuccessMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const submitAddress = async () => {
    if (!addressForm.label.trim() || !addressForm.addressLine.trim()) {
      setError('Saved addresses need both a label and address.');
      return;
    }

    try {
      clearMessages();
      if (addressForm.id) {
        await userService.updateSavedAddress(addressForm.id, addressForm);
      } else {
        await userService.createSavedAddress(addressForm);
      }
      setAddressForm({ id: null, label: '', addressLine: '', isDefault: false });
      setShowAddressForm(false);
      await loadProfile();
      setSuccessMessage('Address saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address.');
    }
  };

  const submitCard = async () => {
    const validationMessage = validateCard();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      clearMessages();
      if (cardForm.id) {
        await userService.updateSavedCard(cardForm.id, cardForm);
      } else {
        await userService.createSavedCard(cardForm);
      }
      setCardForm({ id: null, cardHolderName: profile.fullName || '', cardNumber: '', expiryMonth: '', expiryYear: '', isDefault: false });
      setShowCardForm(false);
      await loadProfile();
      setSuccessMessage('Card saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save card.');
    }
  };

  const submitPassword = async () => {
    const nextErrors = {};
    if (!passwordForm.currentPassword) nextErrors.currentPassword = 'Current password is required';
    const newPasswordError = validatePasswordRules(passwordForm.newPassword);
    if (newPasswordError) nextErrors.newPassword = newPasswordError;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    if (!passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    }

    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      clearMessages();
      await userService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setShowPasswordForm(false);
      setSuccessMessage('Password updated successfully.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update password.';
      if (message.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: message });
      } else if (message.toLowerCase().includes('confirm password') || message.toLowerCase().includes('do not match')) {
        setPasswordErrors({ confirmPassword: message });
      } else if (message.toLowerCase().includes('password')) {
        setPasswordErrors({ newPassword: message });
      } else {
        setError(message);
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <CardSkeletonList count={3} />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ErrorState title="Profile unavailable" message={error} onRetry={loadProfile} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <EmptyState title="No profile found" message="Sign in again and retry." />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <h1 style={styles.title}>My Profile</h1>
            {!isEditing && (
              <button onClick={() => { clearMessages(); setIsEditing(true); }} style={styles.editBtn}>
                <Edit2 size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {successMessage && (
          <div style={styles.successBox}>
            <CheckCircle2 size={16} />
            {successMessage}
          </div>
        )}

        {isEditing ? (
          <div style={styles.form}>
            <Field label="Full Name" icon={<User size={16} />}>
              <input className={`form-input ${errors.fullName ? 'error' : ''}`} value={formData.fullName} onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))} />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </Field>
            <Field label="Email Address" icon={<Mail size={16} />}>
              <div style={styles.readOnlyField}>{profile.email}</div>
            </Field>
            <Field label="Phone Number" icon={<Phone size={16} />}>
              <input className="form-input" value={formData.phoneNumber} onChange={(event) => setFormData((prev) => ({ ...prev, phoneNumber: event.target.value }))} />
              {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
            </Field>
            <Field label="Primary Delivery Address" icon={<MapPin size={16} />}>
              <textarea className={`form-input ${errors.address ? 'error' : ''}`} rows={3} value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </Field>
            <div style={styles.buttonGroup}>
              <button type="button" onClick={handleSaveProfile} disabled={saving} className="btn btn-primary" style={styles.actionBtn}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ fullName: profile.fullName, phoneNumber: profile.phoneNumber || '', address: profile.address || '' });
                  setErrors({});
                }}
                className="btn btn-secondary"
                style={styles.actionBtn}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.viewMode}>
            <ProfileField icon={<User size={16} />} label="Full Name" value={profile.fullName} />
            <ProfileField icon={<Mail size={16} />} label="Email Address" value={profile.email} />
            <ProfileField icon={<Phone size={16} />} label="Phone Number" value={profile.phoneNumber || 'Not provided'} />
            <ProfileField icon={<MapPin size={16} />} label="Primary Delivery Address" value={profile.address || 'Not provided'} />
          </div>
        )}

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Reset Password</h2>
            <button type="button" className="btn btn-secondary" onClick={() => { clearMessages(); setShowPasswordForm((value) => !value); }}>
              <KeyRound size={16} />
              {showPasswordForm ? 'Hide Form' : 'Reset Password'}
            </button>
          </div>
          {showPasswordForm && (
            <div style={styles.editor}>
              <input className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`} type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))} />
              {passwordErrors.currentPassword && <span className="form-error">{passwordErrors.currentPassword}</span>}
              <input className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`} type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
              {passwordErrors.newPassword && <span className="form-error">{passwordErrors.newPassword}</span>}
              <input className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`} type="password" placeholder="Confirm password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
              {passwordErrors.confirmPassword && <span className="form-error">{passwordErrors.confirmPassword}</span>}
              <div style={styles.supportedCards}>Password rules: 6-100 characters, at least 1 number, at least 1 special character.</div>
              <button type="button" className="btn btn-primary" onClick={submitPassword}>Save New Password</button>
            </div>
          )}
        </div>

        {profile.role === 'CUSTOMER' && (
          <>
            <Section
              title="Saved Addresses"
              actionLabel={showAddressForm ? 'Hide Form' : 'New Address'}
              onAction={() => {
                clearMessages();
                setShowAddressForm((value) => !value);
                if (showAddressForm) {
                  setAddressForm({ id: null, label: '', addressLine: '', isDefault: false });
                }
              }}
            >
              {showAddressForm && (
                <div style={styles.editor}>
                  <input className="form-input" placeholder="Label" value={addressForm.label} onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))} />
                  <textarea className="form-input" rows={3} placeholder="Full address" value={addressForm.addressLine} onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine: event.target.value }))} />
                  <label style={styles.checkbox}>
                    <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
                    <span>Set as default</span>
                  </label>
                  <button type="button" className="btn btn-primary" onClick={submitAddress}>{addressForm.id ? 'Update Address' : 'Save Address'}</button>
                </div>
              )}

              {profile.savedAddresses?.length ? (
                <div style={styles.list}>
                  {profile.savedAddresses.map((address) => (
                    <div key={address.id} style={styles.itemCard}>
                      <div>
                        <div style={styles.itemLabel}>
                          {address.label}
                          {address.isDefault && <span style={styles.defaultBadge}>Default</span>}
                        </div>
                        <p style={styles.itemText}>{address.addressLine}</p>
                      </div>
                      <div style={styles.actions}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setAddressForm(address); setShowAddressForm(true); }}>Edit</button>
                        {!address.isDefault && <button type="button" className="btn btn-secondary" onClick={() => userService.setDefaultAddress(address.id).then(loadProfile)}>Make Default</button>}
                        <button type="button" className="btn btn-secondary" onClick={() => userService.deleteSavedAddress(address.id).then(loadProfile)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No saved addresses yet" message="Add home, work, or campus addresses to speed up checkout." />
              )}
            </Section>

            <Section
              title="Saved Cards"
              actionLabel={showCardForm ? 'Hide Form' : 'New Card'}
              onAction={() => {
                clearMessages();
                setShowCardForm((value) => !value);
                if (showCardForm) {
                  setCardForm({ id: null, cardHolderName: profile.fullName || '', cardNumber: '', expiryMonth: '', expiryYear: '', isDefault: false });
                }
              }}
            >
              {showCardForm && (
                <div style={styles.editor}>
                  <input className="form-input" placeholder="Card holder name" value={cardForm.cardHolderName} onChange={(event) => setCardForm((prev) => ({ ...prev, cardHolderName: event.target.value }))} />
                  <input className="form-input" placeholder="Visa or Mastercard only" value={cardForm.cardNumber} onChange={(event) => setCardForm((prev) => ({ ...prev, cardNumber: event.target.value.replace(/[^\d\s]/g, '') }))} />
                  <div style={styles.inlineGrid}>
                    <input className="form-input" type="number" placeholder="Expiry month" min="1" max="12" value={cardForm.expiryMonth} onChange={(event) => setCardForm((prev) => ({ ...prev, expiryMonth: event.target.value }))} />
                    <input className="form-input" type="number" placeholder="Expiry year" min={new Date().getFullYear()} value={cardForm.expiryYear} onChange={(event) => setCardForm((prev) => ({ ...prev, expiryYear: event.target.value }))} />
                  </div>
                  <label style={styles.checkbox}>
                    <input type="checkbox" checked={cardForm.isDefault} onChange={(event) => setCardForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
                    <span>Set as default</span>
                  </label>
                  <div style={styles.supportedCards}>Supported cards: Visa and Mastercard only.</div>
                  <button type="button" className="btn btn-primary" onClick={submitCard}>{cardForm.id ? 'Update Card' : 'Save Card'}</button>
                </div>
              )}

              {profile.savedCards?.length ? (
                <div style={styles.list}>
                  {profile.savedCards.map((card) => (
                    <div key={card.id} style={styles.itemCard}>
                      <div>
                        <div style={styles.itemLabel}>
                          <CreditCard size={14} />
                          {card.cardType} {card.maskedCardNumber}
                          {card.isDefault && <span style={styles.defaultBadge}>Default</span>}
                        </div>
                        <p style={styles.itemText}>{card.cardHolderName} . Expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
                      </div>
                      <div style={styles.actions}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setCardForm({ id: card.id, cardHolderName: card.cardHolderName, cardNumber: '', expiryMonth: card.expiryMonth, expiryYear: card.expiryYear, isDefault: card.isDefault });
                            setShowCardForm(true);
                          }}
                        >
                          Edit
                        </button>
                        {!card.isDefault && <button type="button" className="btn btn-secondary" onClick={() => userService.setDefaultCard(card.id).then(loadProfile)}>Make Default</button>}
                        <button type="button" className="btn btn-secondary" onClick={() => userService.deleteSavedCard(card.id).then(loadProfile)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No saved cards yet" message="Save a Visa or Mastercard here so checkout is faster next time." />
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>
        {icon}
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}

function ProfileField({ icon, label, value }) {
  return (
    <div style={styles.profileField}>
      <div style={styles.fieldHeader}>
        {icon}
        <span style={styles.fieldLabel}>{label}</span>
      </div>
      <p style={styles.fieldValue}>{value}</p>
    </div>
  );
}

function Section({ title, actionLabel, onAction, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <button type="button" className="btn btn-secondary" onClick={onAction}>{actionLabel}</button>
      </div>
      {children}
    </div>
  );
}

const styles = {
  container: { minHeight: 'calc(100vh - var(--navbar-height))', padding: '32px 16px', background: 'var(--bg)' },
  card: { maxWidth: '880px', margin: '0 auto', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' },
  header: { marginBottom: '24px' },
  headerTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  title: { fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
  editBtn: { background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  errorBox: { background: 'var(--error-bg)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.875rem', color: 'var(--error)', marginBottom: '16px' },
  successBox: { background: 'var(--success-bg)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.875rem', color: 'var(--success)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' },
  readOnlyField: { padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' },
  buttonGroup: { display: 'flex', gap: '12px' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  viewMode: { display: 'flex', flexDirection: 'column', gap: '20px' },
  profileField: { paddingBottom: '20px', borderBottom: '1px solid var(--border)' },
  fieldHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  fieldLabel: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' },
  fieldValue: { fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500 },
  section: { marginTop: '36px', paddingTop: '28px', borderTop: '1px solid var(--border)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' },
  sectionTitle: { margin: 0, fontSize: '1.3rem', fontWeight: 700 },
  editor: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  inlineGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' },
  supportedCards: { color: 'var(--text-secondary)', fontSize: '0.85rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  itemCard: { border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px' },
  itemLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px', flexWrap: 'wrap' },
  defaultBadge: { background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '3px 8px', fontSize: '0.7rem' },
  itemText: { margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 },
  actions: { display: 'flex', flexDirection: 'column', gap: '8px' },
};
