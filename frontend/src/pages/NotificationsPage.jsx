import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, RefreshCw } from 'lucide-react';
import notificationService from '../services/notification.service';
import PaginationControls from '../components/PaginationControls';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const { refreshNotifications, markNotificationRead } = useAuth();
  const [pageData, setPageData] = useState({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      setError('');
      const data = await notificationService.getNotificationsPage({
        page,
        size: pageData.size,
        sort: 'createdAt,desc',
      });
      setPageData((prev) => ({ ...prev, ...data }));
      await refreshNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [pageData.size, refreshNotifications]);

  useEffect(() => {
    loadNotifications(0);
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications(pageData.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notification.');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <CardSkeletonList count={4} />
      </div>
    );
  }

  if (error && pageData.content.length === 0) {
    return (
      <div style={styles.container}>
        <ErrorState title="Notifications unavailable" message={error} onRetry={() => loadNotifications(pageData.currentPage)} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Notifications</h1>
          <p style={styles.subtitle}>Everything assigned to your logged-in account appears here.</p>
        </div>
        <button style={styles.refreshBtn} onClick={() => loadNotifications(pageData.currentPage)}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {pageData.content.length === 0 ? (
        <EmptyState title="No notifications yet" message="New account, order, and driver updates will show up here." />
      ) : (
        <>
          <div style={styles.list}>
            {pageData.content.map((notification) => (
              <div key={notification.id} style={{ ...styles.card, ...(notification.read ? styles.cardRead : styles.cardUnread) }}>
                <div style={styles.iconWrap}>
                  <Bell size={18} />
                </div>
                <div style={styles.content}>
                  <div style={styles.topRow}>
                    <div>
                      <h3 style={styles.cardTitle}>{notification.title}</h3>
                      <p style={styles.cardMeta}>{notification.type.replaceAll('_', ' ')} . {new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.read && (
                      <button className="btn btn-secondary" onClick={() => handleMarkRead(notification.id)}>
                        <CheckCircle2 size={16} />
                        Mark Read
                      </button>
                    )}
                  </div>
                  <p style={styles.message}>{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={pageData.currentPage}
            totalPages={pageData.totalPages}
            onPageChange={(page) => loadNotifications(page)}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: 'calc(100vh - var(--navbar-height))', padding: '32px 16px', background: 'var(--bg)' },
  header: { maxWidth: '980px', width: '100%', margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' },
  title: { margin: 0, fontSize: '2rem', fontWeight: 800 },
  subtitle: { margin: '8px 0 0', color: 'var(--text-secondary)' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '12px', padding: '10px 14px', cursor: 'pointer' },
  errorBox: { maxWidth: '980px', width: '100%', margin: '0 auto 16px', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 14px' },
  list: { maxWidth: '980px', width: '100%', margin: '0 auto', display: 'grid', gap: '14px' },
  card: { display: 'flex', gap: '14px', padding: '18px', borderRadius: '18px', border: '1px solid var(--border)', background: 'var(--surface)' },
  cardUnread: { boxShadow: 'var(--shadow-sm)' },
  cardRead: { opacity: 0.82 },
  iconWrap: { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', color: 'var(--primary)', flexShrink: 0 },
  content: { flex: 1 },
  topRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' },
  cardTitle: { margin: 0, fontSize: '1rem' },
  cardMeta: { margin: '6px 0 0', color: 'var(--text-secondary)' },
  message: { margin: '12px 0 0', lineHeight: 1.55, color: 'var(--text-primary)' },
};
