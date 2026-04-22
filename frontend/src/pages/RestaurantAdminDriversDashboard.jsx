import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Save, Search, UserPlus, X } from 'lucide-react';
import userService from '../services/user.service';
import driverService from '../services/driver.service';
import PaginationControls from '../components/PaginationControls';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';

const emptyDriverForm = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  address: '',
  vehicleType: '',
  licensePlate: '',
};

const driverSortOptions = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'deliveries-desc', label: 'Most deliveries' },
  { value: 'deliveries-asc', label: 'Least deliveries' },
  { value: 'available-first', label: 'Available first' },
  { value: 'online-first', label: 'Online first' },
];

const toSlug = (value = '') => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '.')
  .replace(/^\.+|\.+$/g, '');

export default function RestaurantAdminDriversDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [driverPage, setDriverPage] = useState({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 10 });
  const [driverSearch, setDriverSearch] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [driverSort, setDriverSort] = useState('name-asc');
  const [loading, setLoading] = useState(true);
  const [driverLoading, setDriverLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverFormData, setDriverFormData] = useState(emptyDriverForm);

  const sortDrivers = useCallback((drivers, sortKey) => {
    const sorted = [...drivers];
    sorted.sort((left, right) => {
      switch (sortKey) {
        case 'name-desc':
          return (right.fullName || '').localeCompare(left.fullName || '');
        case 'deliveries-desc':
          return (right.totalDeliveries || 0) - (left.totalDeliveries || 0);
        case 'deliveries-asc':
          return (left.totalDeliveries || 0) - (right.totalDeliveries || 0);
        case 'available-first':
          if ((left.available ? 1 : 0) !== (right.available ? 1 : 0)) {
            return (right.available ? 1 : 0) - (left.available ? 1 : 0);
          }
          return (left.fullName || '').localeCompare(right.fullName || '');
        case 'online-first':
          if ((left.online ? 1 : 0) !== (right.online ? 1 : 0)) {
            return (right.online ? 1 : 0) - (left.online ? 1 : 0);
          }
          return (left.fullName || '').localeCompare(right.fullName || '');
        case 'name-asc':
        default:
          return (left.fullName || '').localeCompare(right.fullName || '');
      }
    });
    return sorted;
  }, []);

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const profileData = await userService.getProfile();
      const managedRestaurants = profileData.managedRestaurants || [];
      setRestaurants(managedRestaurants);
      setSelectedRestaurant((current) => current || managedRestaurants[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant drivers.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDrivers = useCallback(async (page = 0, nextSearch = driverSearch, nextSort = driverSort) => {
    if (!selectedRestaurant) {
      return;
    }

    try {
      setDriverLoading(true);
      setError('');
      const drivers = await driverService.getRestaurantDriversPage({
        page,
        size: driverPage.size,
        restaurantId: selectedRestaurant.id,
        active: true,
        search: nextSearch || undefined,
        sort: 'id,desc',
      });
      setDriverPage((prev) => ({
        ...prev,
        ...drivers,
        content: sortDrivers(drivers.content || [], nextSort),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drivers.');
    } finally {
      setDriverLoading(false);
    }
  }, [driverPage.size, driverSearch, driverSort, selectedRestaurant, sortDrivers]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!selectedRestaurant) {
      return;
    }
    loadDrivers(0, driverSearch, driverSort);
  }, [selectedRestaurant, driverSearch, driverSort, loadDrivers]);

  const resetDriverForm = () => {
    setDriverFormData(emptyDriverForm);
    setEditingDriverId(null);
    setShowDriverForm(false);
  };

  const generatedEmail = useMemo(() => {
    if (!selectedRestaurant || !driverFormData.fullName) {
      return '';
    }

    const driverSlug = toSlug(driverFormData.fullName);
    const restaurantSlug = toSlug(selectedRestaurant.name);
    return `${driverSlug}@${restaurantSlug}.co.za`;
  }, [driverFormData.fullName, selectedRestaurant]);

  const handleSaveDriver = async () => {
    try {
      if (editingDriverId) {
        const { password, ...payload } = driverFormData;
        payload.email = driverFormData.email.trim() || generatedEmail;
        await driverService.updateRestaurantDriver(editingDriverId, payload, selectedRestaurant.id);
      } else {
        await driverService.createRestaurantDriver({
          ...driverFormData,
          email: driverFormData.email.trim() || generatedEmail,
        }, selectedRestaurant.id);
      }

      resetDriverForm();
      await loadDrivers(driverPage.currentPage, driverSearch, driverSort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save driver.');
    }
  };

  const handleDriverAvailabilityToggle = async (driverId, available) => {
    try {
      await driverService.setRestaurantDriverAvailability(driverId, available, selectedRestaurant.id);
      await loadDrivers(driverPage.currentPage, driverSearch, driverSort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update driver availability.');
    }
  };

  const openCreateModal = () => {
    setEditingDriverId(null);
    setDriverFormData({
      ...emptyDriverForm,
      email: generatedEmail,
    });
    setShowDriverForm(true);
  };

  const openEditModal = (driver) => {
    setEditingDriverId(driver.id);
    setDriverFormData({
      fullName: driver.fullName || '',
      email: driver.email || '',
      password: '',
      phoneNumber: driver.phoneNumber || '',
      address: driver.address || '',
      vehicleType: driver.vehicleType || '',
      licensePlate: driver.licensePlate || '',
    });
    setShowDriverForm(true);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <CardSkeletonList count={4} />
      </div>
    );
  }

  if (error && !selectedRestaurant) {
    return (
      <div style={styles.container}>
        <ErrorState title="Driver dashboard unavailable" message={error} onRetry={loadRestaurants} />
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div style={styles.container}>
        <EmptyState title="No managed restaurant yet" message="Ask an admin to assign your restaurant account." />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Restaurant Drivers Dashboard</h1>
          <p style={styles.subtitle}>Manage only this branch&apos;s drivers and their availability state.</p>
        </div>
        {restaurants.length > 1 && (
          <select
            value={selectedRestaurant.id}
            onChange={(event) => {
              const restaurant = restaurants.find((item) => String(item.id) === event.target.value);
              setSelectedRestaurant(restaurant || null);
            }}
            style={styles.select}
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} - {restaurant.city}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Branch Drivers</h2>
            <p style={styles.sectionSubtitle}>{selectedRestaurant.name} . {selectedRestaurant.city}</p>
          </div>
          <button onClick={openCreateModal} style={styles.primaryBtn}>
            <UserPlus size={16} />
            Add Driver
          </button>
        </div>

        <div style={styles.controlPanel}>
          <form
            style={styles.searchWrap}
            onSubmit={(event) => {
              event.preventDefault();
              setDriverSearch(driverSearchTerm.trim());
            }}
          >
            <Search size={16} style={styles.searchIcon} />
            <input
              type="search"
              value={driverSearchTerm}
              onChange={(event) => setDriverSearchTerm(event.target.value)}
              placeholder="Search drivers by name, email, phone, or vehicle"
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>Apply</button>
          </form>
          <div style={styles.filterRow}>
            <select value={driverSort} onChange={(event) => setDriverSort(event.target.value)} style={styles.select}>
              {driverSortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {driverLoading ? <CardSkeletonList count={3} /> : driverPage.content.length === 0 ? (
          <EmptyState title="No drivers added yet" message="Create branch-specific drivers for this restaurant." />
        ) : (
          <>
            <div style={styles.driverGrid}>
              {driverPage.content.map((driver) => (
                <div key={driver.id} style={styles.driverCard}>
                  <div style={styles.driverAvatar}>
                    {driver.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'DR'}
                  </div>
                  <div style={styles.driverContent}>
                    <div style={styles.driverInfo}>
                      <div style={styles.titleRow}>
                        <h3 style={styles.cardTitle}>{driver.fullName}</h3>
                        <span style={{ ...styles.statusPill, ...(driver.available ? styles.statusPillActive : styles.statusPillInactive) }}>
                          {driver.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p style={styles.cardMeta}>{driver.email}</p>
                      <p style={styles.cardMeta}>{driver.phoneNumber || 'No phone number yet'}</p>
                      <p style={styles.cardMeta}>
                        {driver.vehicleType || 'Vehicle not set'} . {driver.licensePlate || 'No plate yet'}
                      </p>
                      <p style={styles.cardMeta}>
                        Deliveries: {driver.totalDeliveries || 0} . {driver.online ? 'Online' : 'Offline'}
                      </p>
                      <p style={styles.cardMeta}>{driver.address || 'No address captured'}</p>
                    </div>

                    <div style={styles.driverActions}>
                      <button className="btn btn-secondary" onClick={() => openEditModal(driver)}>
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDriverAvailabilityToggle(driver.id, !driver.available)}>
                        {driver.available ? 'Unavailable' : 'Available'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={driverPage.currentPage}
              totalPages={driverPage.totalPages}
              onPageChange={(page) => loadDrivers(page, driverSearch, driverSort)}
              disabled={driverLoading}
            />
          </>
        )}
      </div>

      {showDriverForm && (
        <div style={styles.modalOverlay} onClick={resetDriverForm}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{editingDriverId ? 'Edit Driver' : 'Add Driver'}</h3>
                <p style={styles.modalSubtitle}>{selectedRestaurant.name} . {selectedRestaurant.city}</p>
              </div>
              <button type="button" onClick={resetDriverForm} style={styles.modalCloseBtn} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <div style={styles.formContainer}>
              <input className="form-input" placeholder="Full name" value={driverFormData.fullName} onChange={(event) => setDriverFormData((prev) => ({ ...prev, fullName: event.target.value }))} />
              <input className="form-input" placeholder="Email address" value={driverFormData.email} onChange={(event) => setDriverFormData((prev) => ({ ...prev, email: event.target.value }))} />
              {generatedEmail && <p style={styles.previewText}>Suggested email: {generatedEmail}</p>}
              {!editingDriverId && (
                <input className="form-input" type="password" placeholder="Temporary password" value={driverFormData.password} onChange={(event) => setDriverFormData((prev) => ({ ...prev, password: event.target.value }))} />
              )}
              <div style={styles.formRow}>
                <input className="form-input" placeholder="Phone number" value={driverFormData.phoneNumber} onChange={(event) => setDriverFormData((prev) => ({ ...prev, phoneNumber: event.target.value }))} />
                <input className="form-input" placeholder="Vehicle type" value={driverFormData.vehicleType} onChange={(event) => setDriverFormData((prev) => ({ ...prev, vehicleType: event.target.value }))} />
              </div>
              <div style={styles.formRow}>
                <input className="form-input" placeholder="License plate" value={driverFormData.licensePlate} onChange={(event) => setDriverFormData((prev) => ({ ...prev, licensePlate: event.target.value }))} />
                <input className="form-input" placeholder="Driver address" value={driverFormData.address} onChange={(event) => setDriverFormData((prev) => ({ ...prev, address: event.target.value }))} />
              </div>
              <div style={styles.actionRow}>
                <button className="btn btn-primary" onClick={handleSaveDriver}><Save size={16} /> {editingDriverId ? 'Update Driver' : 'Create Driver'}</button>
                <button className="btn btn-secondary" onClick={resetDriverForm}><X size={16} /> Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: 'calc(100vh - var(--navbar-height))', padding: '32px 16px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', margin: '8px 0 0' },
  sectionCard: { maxWidth: '1200px', width: '100%', margin: '0 auto', background: 'var(--surface)', borderRadius: '18px', padding: '24px', border: '1px solid var(--border)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' },
  sectionTitle: { margin: 0, fontSize: '1.3rem' },
  sectionSubtitle: { margin: '6px 0 0', color: 'var(--text-secondary)' },
  select: { minWidth: '180px', padding: '11px 14px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' },
  errorBox: { maxWidth: '1200px', width: '100%', margin: '0 auto', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 14px' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-2)', borderRadius: '14px', padding: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  actionRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  controlPanel: { display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 360px', minWidth: '280px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '6px 8px' },
  searchIcon: { color: 'var(--text-secondary)', marginLeft: '6px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', flex: 1, padding: '10px 6px' },
  searchButton: { border: 'none', borderRadius: '10px', background: 'var(--primary)', color: 'white', padding: '10px 14px', fontWeight: 600, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  previewText: { margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' },
  driverGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
  driverCard: { display: 'flex', gap: '18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', padding: '18px', boxShadow: 'var(--shadow-sm)', alignItems: 'stretch' },
  driverAvatar: { width: '110px', height: '110px', borderRadius: 'var(--radius-md)', flexShrink: 0, background: 'linear-gradient(135deg, #F97316, #EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.08em' },
  driverContent: { flex: 1, display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'stretch' },
  driverInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  titleRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  driverActions: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px', minWidth: '138px' },
  statusPill: { borderRadius: '999px', padding: '6px 10px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' },
  statusPillActive: { background: '#DCFCE7', color: '#166534' },
  statusPillInactive: { background: '#FEE2E2', color: '#991B1B' },
  cardTitle: { margin: 0, fontSize: '1rem' },
  cardMeta: { margin: '8px 0 0', color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 1200 },
  modalCard: { width: 'min(640px, 100%)', background: 'var(--surface)', borderRadius: '18px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', padding: '20px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 800 },
  modalSubtitle: { margin: '6px 0 0', color: 'var(--text-secondary)' },
  modalCloseBtn: { border: '1px solid var(--border)', background: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
};
