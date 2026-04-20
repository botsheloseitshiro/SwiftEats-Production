import React from 'react';

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        style={styles.button}
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page === 0}
      >
        Previous
      </button>
      <span style={styles.label}>
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        style={styles.button}
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page + 1 >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)',
  },
  button: {
    minWidth: '110px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: 600,
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
};
