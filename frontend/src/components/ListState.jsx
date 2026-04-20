import React from 'react';

export function ErrorState({ title, message, onRetry }) {
  return (
    <div style={styles.box}>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} style={styles.button}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div style={styles.box}>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.message}>{message}</p>
      {action}
    </div>
  );
}

export function CardSkeletonList({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={styles.skeletonCard}>
          <div style={styles.skeletonLineWide} />
          <div style={styles.skeletonLineMid} />
          <div style={styles.skeletonLineNarrow} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  box: {
    padding: '32px 24px',
    borderRadius: '18px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 8px',
    color: 'var(--text-primary)',
    fontSize: '1.1rem',
  },
  message: {
    margin: '0 0 16px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  button: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--primary)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
  },
  skeletonCard: {
    borderRadius: '18px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    padding: '20px',
  },
  skeletonLineWide: {
    width: '45%',
    height: '16px',
    borderRadius: '999px',
    background: 'var(--surface-2)',
    marginBottom: '14px',
  },
  skeletonLineMid: {
    width: '70%',
    height: '12px',
    borderRadius: '999px',
    background: 'var(--surface-2)',
    marginBottom: '12px',
  },
  skeletonLineNarrow: {
    width: '32%',
    height: '12px',
    borderRadius: '999px',
    background: 'var(--surface-2)',
  },
};
