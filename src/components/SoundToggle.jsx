export default function SoundToggle({ enabled, supported = true, onToggle, variant = 'nav', tabIndex }) {
  const label = !supported ? 'Interface sounds unavailable' : enabled ? 'Mute interface sounds' : 'Enable interface sounds';

  return (
    <button
      type="button"
      className={`sound-toggle sound-toggle--${variant}${enabled ? ' is-enabled' : ''}`}
      aria-label={label}
      aria-pressed={enabled}
      title={label}
      data-sound-toggle
      data-sound-enabled={enabled ? 'true' : 'false'}
      disabled={!supported}
      tabIndex={tabIndex}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9.2v5.6h3.8l4.7 3.7v-13L7.8 9.2H4Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
        {enabled ? (
          <>
            <path d="M15.5 8.4c1.8 1.9 1.8 5.3 0 7.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
            <path d="M18.2 6c3.1 3.3 3.1 8.7 0 12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          </>
        ) : (
          <path d="m16 9 4.5 4.5m0-4.5L16 13.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        )}
      </svg>
      <span className="sound-toggle__label">Interface sound</span>
      <span className="sound-toggle__status">{enabled ? 'ON' : 'OFF'}</span>
    </button>
  );
}
