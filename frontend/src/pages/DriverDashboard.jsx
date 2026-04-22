import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, Power } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import driverService from '../services/driver.service';
import orderService from '../services/order.service';
import PaginationControls from '../components/PaginationControls';
import SortSelect from '../components/SortSelect';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [pageState, setPageState] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 8,
  });
  const [sort, setSort] = useState('createdAt,desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driverState, setDriverState] = useState({
    online: false,
    available: false,
  });
  const [savingShift, setSavingShift] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [respondingOrderId, setRespondingOrderId] = useState(null);

  const loadDriverState = useCallback(async () => {
    try {
      const profile = await driverService.getMyDriverProfile();
      setDriverState({
        online: Boolean(profile.online),
        available: Boolean(profile.available),
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load driver status.');
    }
  }, []);

  const loadOrders = useCallback(async (page = 0, nextSort = sort) => {
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getDriverOrdersPage({
        page,
        size: pageState.size,
        sort: nextSort,
      });
      setPageState((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned orders.');
    } finally {
      setLoading(false);
    }
  }, [pageState.size, sort]);

  useEffect(() => {
    loadDriverState();
  }, [loadDriverState]);

  useEffect(() => {
    loadOrders(0, sort);
  }, [loadOrders, sort]);

  const pendingAssignments = useMemo(
    () => pageState.content.filter((order) => order.driverAssignmentStatus === 'PENDING_DRIVER_RESPONSE'),
    [pageState.content]
  );

  const activeOrders = useMemo(
    () => pageState.content.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)),
    [pageState.content]
  );

  const handleShiftToggle = async () => {
    try {
      setSavingShift(true);
      const next = await driverService.updateMyShift(!driverState.online);
      setDriverState((current) => ({ ...current, online: next.online, available: next.available }));
      await loadOrders(pageState.currentPage, sort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update shift status.');
    } finally {
      setSavingShift(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      setSavingShift(true);
      const next = await driverService.updateMyAvailability(!driverState.available);
      setDriverState((current) => ({ ...current, online: next.online, available: next.available }));
      await loadOrders(pageState.currentPage, sort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setSavingShift(false);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device/browser.');
      return;
    }

    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await driverService.updateMyLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to share your current location.');
        } finally {
          setSharingLocation(false);
        }
      },
      (geoError) => {
        setError(geoError.message || 'Location permission was denied.');
        setSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  };

  const handleAssignmentResponse = async (orderId, accept) => {
    try {
      setRespondingOrderId(orderId);
      await driverService.respondToAssignment(orderId, accept);
      await loadOrders(pageState.currentPage, sort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update driver response.');
    } finally {
      setRespondingOrderId(null);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setRespondingOrderId(orderId);
      await orderService.updateOrderStatus(orderId, status);
      await loadOrders(pageState.currentPage, sort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setRespondingOrderId(null);
    }
  };

  const getNextStatus = (status) => ({
    CONFIRMED: 'PREPARING',
    PREPARING: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'DELIVERED',
  }[status] || null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Driver Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {user?.fullName}. Manage your shift and deliveries.</p>
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={handleAvailabilityToggle}
            disabled={savingShift || !driverState.online}
            style={{
              ...styles.shiftButton,
              background: driverState.available ? '#dcfce7' : '#fef3c7',
              color: driverState.available ? '#166534' : '#92400e',
              opacity: !driverState.online ? 0.65 : 1,
            }}
          >
            {savingShift ? 'Saving...' : driverState.available ? 'Unavailable' : 'Available'}
          </button>
          <button
            type="button"
            onClick={handleShiftToggle}
            disabled={savingShift}
            style={{
              ...styles.shiftButton,
              background: driverState.online ? '#dcfce7' : '#fee2e2',
              color: driverState.online ? '#166534' : '#991b1b',
            }}
          >
            <Power size={16} />
            {savingShift ? 'Saving...' : driverState.online ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Pending Assignments</span>
          <strong style={styles.statValue}>{pendingAssignments.length}</strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Active Orders</span>
          <strong style={styles.statValue}>{activeOrders.length}</strong>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.locationPanel}>
          <div style={styles.locationHeading}>
            <MapPin size={16} />
            Share Current Location
          </div>
          <button type="button" style={styles.secondaryButton} onClick={handleShareLocation} disabled={sharingLocation}>
            {sharingLocation ? 'Sharing...' : 'Share Location'}
          </button>
        </div>

        <div style={styles.locationPanel}>
          <SortSelect
            label="Sort Orders"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'createdAt,desc', label: 'Newest first' },
              { value: 'createdAt,asc', label: 'Oldest first' },
              { value: 'status,asc', label: 'Status A-Z' },
            ]}
          />
        </div>
      </div>

      {loading && <CardSkeletonList count={4} />}

      {!loading && error && (
        <ErrorState
          title="Driver dashboard could not be loaded"
          message={error}
          onRetry={() => {
            loadOrders(pageState.currentPage, sort);
          }}
        />
      )}

      {!loading && !error && pageState.content.length === 0 && (
        <EmptyState
          title="No assigned orders"
          message="Assignments will show up here when dispatch routes deliveries to you."
        />
      )}

      {!loading && !error && pageState.content.length > 0 && (
        <>
          <div style={styles.orderList}>
            {pageState.content.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderTop}>
                    <div>
                      <h3 style={styles.orderTitle}>Order #{order.id}</h3>
                      <p style={styles.orderMeta}>
                        {order.restaurantName} . <Clock size={14} style={{ transform: 'translateY(2px)' }} />{' '}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span style={styles.statusBadge}>{order.status.replaceAll('_', ' ')}</span>
                  </div>

                  <p style={styles.address}>{order.deliveryAddress || 'Collection order'}</p>
                  <p style={styles.amount}>Total: R{Number(order.totalAmount || 0).toFixed(2)}</p>

                  {order.driverAssignmentStatus === 'PENDING_DRIVER_RESPONSE' && (
                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        style={styles.acceptButton}
                        disabled={respondingOrderId === order.id}
                        onClick={() => handleAssignmentResponse(order.id, true)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        style={styles.rejectButton}
                        disabled={respondingOrderId === order.id}
                        onClick={() => handleAssignmentResponse(order.id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {order.driverAssignmentStatus !== 'PENDING_DRIVER_RESPONSE' && nextStatus && (
                    <button
                      type="button"
                      style={styles.primaryButton}
                      disabled={respondingOrderId === order.id}
                      onClick={() => handleStatusChange(order.id, nextStatus)}
                    >
                      {respondingOrderId === order.id ? 'Updating...' : `Mark as ${nextStatus.replaceAll('_', ' ')}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <PaginationControls
            page={pageState.currentPage}
            totalPages={pageState.totalPages}
            onPageChange={(nextPage) => loadOrders(nextPage, sort)}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - var(--navbar-height))',
    padding: '32px 16px',
    background: 'var(--bg)',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: 'var(--text-secondary)',
  },
  shiftButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '12px 18px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statsGrid: {
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  statCard: {
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '18px',
    display: 'grid',
    gap: '8px',
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  statValue: {
    color: 'var(--text-primary)',
    fontSize: '1.5rem',
  },
  toolbar: {
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  locationPanel: {
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '18px',
    display: 'grid',
    gap: '12px',
  },
  locationHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  orderList: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gap: '16px',
  },
  orderCard: {
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '18px',
    display: 'grid',
    gap: '12px',
  },
  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },
  orderTitle: {
    margin: 0,
    color: 'var(--text-primary)',
  },
  orderMeta: {
    margin: '6px 0 0 0',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  statusBadge: {
    borderRadius: '999px',
    background: 'var(--primary-glow)',
    color: 'var(--primary)',
    padding: '8px 12px',
    fontSize: '0.8rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  address: {
    margin: 0,
    color: 'var(--text-secondary)',
  },
  amount: {
    margin: 0,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
  },
  primaryButton: {
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    background: 'var(--primary)',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    background: 'white',
    color: 'var(--text-primary)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  acceptButton: {
    flex: 1,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    background: '#dcfce7',
    color: '#166534',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rejectButton: {
    flex: 1,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    background: '#fee2e2',
    color: '#991b1b',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
