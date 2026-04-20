export default function SortSelect({ label = 'Sort', value, options, onChange, minWidth = '200px' }) {
  return (
    <label style={styles.wrap}>
      <span style={styles.label}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...styles.select, minWidth }}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-secondary)',
  },
  select: {
    padding: '11px 14px',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
};
