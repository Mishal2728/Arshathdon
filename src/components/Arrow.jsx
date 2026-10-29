export default function Arrow({ direction = 'up-right', className = '' }) {
  return (
    <svg className={`arrow arrow--${direction} ${className}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
