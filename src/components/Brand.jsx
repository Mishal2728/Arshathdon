export default function Brand({ compact = false }) {
  return (
    <span className={`brand ${compact ? 'brand--compact' : ''}`}>
      <svg className="brand__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="11.25" stroke="currentColor" strokeWidth="1.1" />
        <ellipse cx="16" cy="16" rx="5.4" ry="11.25" stroke="currentColor" strokeWidth="1.1" transform="rotate(36 16 16)" />
        <circle cx="23.7" cy="7.6" r="1.65" fill="currentColor" />
      </svg>
      <span className="brand__word">RUSSIA GUIDE</span>
    </span>
  );
}
