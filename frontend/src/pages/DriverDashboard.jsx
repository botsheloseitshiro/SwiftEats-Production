import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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
    loadOrders(0, sort);
  }, [loadOrders, sort]);

  const getNextStatus = (currentStatus) => ({
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'DELIVERED',
    DELIVERED: null,
    CANCELLED: null,
  }[currentStatus]);

  const getStatusColor = (status) => ({
    PENDING: { bg: '#fef3c7', text: '#92400e' },
    CONFIRMED: { bg: '#e0f2fe', text: '#0c4a6e' },
    PREPARING: { bg: '#fce7f3', text: '#831843' },
    OUT_FOR_DELIVERY: { bg: '#d1fae5', text: '#065f46' },
    DELIVERED: { bg: '#d1fae5', text: '#065f46' },
    CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  }[status] || { bg: '#f3f4f6', text: '#374151' });

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadOrders(pageState.currentPage, sort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const activeCount = useMemo(
    () => pageState.content.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length,
    [pageState.content]
  );
  const completedCount = useMemo(
    () => pageState.content.filter((order) => ['DELIVERED', 'CANCELLED'].includes(order.status)).length,
    [pageState.content]
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Driver Dashboard</h1>
        <p style={styles.subtitle}>Welcome, {user?.fullName}. Manage your deliveries.</p>
      </div>

      <div style={styles.topBar}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{activeCount}</div>
            <div style={styles.statLabel}>Visible Active Orders</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{completedCount}</div>
            <div style={styles.statLabel}>Visible Completed Orders</div>
          </div>
        </div>
        <div style={styles.ordersToolbar}>
          <h2 style={styles.ordersHeading}>Assigned Orders</h2>
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
          title="Orders could not be loaded"
          message={error}
          onRetry={() => loadOrders(pageState.currentPage, sort)}
        />
      )}

      {!loading && !error && pageState.content.length === 0 && (
        <EmptyState
          title="No assigned orders"
          message="Assigned deliveries will appear here when dispatch starts routing orders to you."
        />
      )}

      {!loading && !error && pageState.content.length > 0 && (
        <>
          <div style={styles.ordersList}>
            {pageState.content.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div
                  style={styles.orderHeader}
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div style={styles.orderInfo}>
                    <h3 style={styles.orderTitle}>Order #{order.id} from {order.restaurantName}</h3>
                    <p style={styles.orderTime}>
                      <Clock size={14} style={{ marginRight: '4px' }} />
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div style={styles.rightContent}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: getStatusColor(order.status).bg,
                        color: getStatusColor(order.status).text,
                      }}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                    {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {expandedOrderId === order.id && (
                  <div style={styles.orderDetails}>
                    <div style={styles.detailSection}>
                      <h4 style={styles.detailLabel}>Delivery Address</h4>
                      <p style={styles.detailValue}>{order.deliveryAddress}</p>
                    </div>

                    <div style={styles.detailSection}>
                      <h4 style={styles.detailLabel}>Items</h4>
                      {order.items?.map((item, index) => (
                        <div key={`${order.id}-${index}`} style={styles.itemRow}>
                          <div>
                            <p style={styles.itemName}>{item.itemName}</p>
                            <p style={styles.itemPrice}>R{item.unitPrice.toFixed(2)} x {item.quantity}</p>
                          </div>
                          <p style={styles.itemSubtotal}>R{item.subtotal.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div style={styles.detailSection}>
                        <h4 style={styles.detailLabel}>Notes</h4>
                        <p style={styles.detailValue}>{order.notes}</p>
                      </div>
                    )}

                    <div style={{ ...styles.detailSection, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div style={styles.totalRow}>
                        <span>Delivery Fee:</span>
                        <span>R{order.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>
                        <span>Total:</span>
                        <span>R{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}
                        disabled={updatingOrderId === order.id}
                        style={{
                          ...styles.updateStatusBtn,
                          opacity: updatingOrderId === order.id ? 0.6 : 1,
                          cursor: updatingOrderId === order.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {updatingOrderId === order.id
                          ? 'Updating...'
                          : `Mark as ${getNextStatus(order.status).replace('_', ' ')}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
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
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
  },
  topBar: {
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'stretch',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    flex: 1,
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: 'var(--primary)',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  ordersToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '16px',
    flexWrap: 'wrap',
  },
  ordersHeading: {
    fontSize: '1.25rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--text-primary)',
  },
  ordersList: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  orderCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 6px 0',
  },
  orderTime: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  rightContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '6px 12px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
  },
  orderDetails: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface-2)',
  },
  detailSection: {
    marginBottom: '16px',
  },
  detailLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 8px 0',
  },
  detailValue: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  itemName: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
  },
  itemPrice: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    margin: '2px 0 0 0',
  },
  itemSubtotal: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--primary)',
    margin: 0,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  updateStatusBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '16px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
  },
};
