import Arrow from './Arrow.jsx';
import { DESTINATIONS, getDestination } from '../data/destinations.js';
import { RUSSIA_OUTLINE_PATH } from '../data/russiaOutline.js';

export default function DestinationMap({ value, onChange, onAccess }) {
  const selected = getDestination(value);
  const focus = selected || DESTINATIONS[0];
  const preview = selected || {
    number: '00',
    image: '/images/russia-highlights.webp',
    imageAlt: 'St. Basil’s Cathedral in Moscow',
  };

  return (
    <div className="destination-footer" data-section-reveal aria-labelledby="destination-title">
      <div className="destination-footer__heading" data-reveal-item>
        <div>
          <p className="eyebrow section-label"><span>04</span>DESTINATION SHORTLIST</p>
          <h2 id="destination-title">Put your plans <em>on the map.</em></h2>
        </div>
        <p>Choose a planning preference and carry it into your checklist. Compare current programmes, eligibility, and complete expenses directly with each university.</p>
      </div>

      <div className="destination-map" data-reveal-item>
        <div className="destination-map__visual">
          <div className="destination-map__topline">
            <span>RESEARCH ATLAS / RUSSIA</span>
            <span>{selected ? `${selected.number} SELECTED` : 'SELECT A DESTINATION'}</span>
          </div>
          <div
            className={`destination-map__canvas${selected ? ' has-selection' : ''}`}
            style={{
              '--focus-x': `${focus.x}%`,
              '--focus-y': `${focus.y}%`,
              '--focus-mobile-x': `${focus.mobileX}%`,
              '--focus-mobile-y': `${focus.mobileY}%`,
            }}
          >
            <svg viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id="destination-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M80 0H0V80" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
                <linearGradient id="destination-land" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7f011f" stopOpacity="0.82" />
                  <stop offset="55%" stopColor="#4b0719" stopOpacity="0.66" />
                  <stop offset="100%" stopColor="#7f011f" stopOpacity="0.36" />
                </linearGradient>
              </defs>
              <rect className="destination-map__grid" width="1000" height="440" fill="url(#destination-grid)" />
              <path className="destination-map__land" d={RUSSIA_OUTLINE_PATH} vectorEffect="non-scaling-stroke" />
              <path
                className={`destination-map__route${selected ? ' is-active' : ''}`}
                d="M80 228.8Q94 278 130 294.8Q172 308 220 281.6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="destination-map__focus" aria-hidden="true"><i /></div>
            <div className="destination-map__compass" aria-hidden="true"><span>N</span><i /></div>
            {DESTINATIONS.map((destination) => (
              <button
                key={destination.id}
                type="button"
                className={`destination-pin${value === destination.id ? ' is-selected' : ''}`}
                style={{
                  '--pin-x': `${destination.x}%`,
                  '--pin-y': `${destination.y}%`,
                  '--pin-mobile-x': `${destination.mobileX}%`,
                  '--pin-mobile-y': `${destination.mobileY}%`,
                }}
                aria-label={`Select ${destination.name} as your preferred study destination`}
                aria-pressed={value === destination.id}
                data-destination={destination.id}
                onClick={() => onChange(destination.id)}
              >
                <span className="destination-pin__dot" aria-hidden="true"><i /></span>
                <span className="destination-pin__label">{destination.name}</span>
              </button>
            ))}
          </div>
          <div className="destination-map__choices" aria-label="Preferred study destination">
            {DESTINATIONS.map((destination) => (
              <button
                key={destination.id}
                type="button"
                className={value === destination.id ? 'is-selected' : ''}
                aria-pressed={value === destination.id}
                onClick={() => onChange(destination.id)}
              >
                <span>{destination.number}</span>{destination.name}
              </button>
            ))}
          </div>
          <div className="destination-map__legend" aria-hidden="true">
            <span><i />YOUR RESEARCH ROUTE</span>
            <span>SCHEMATIC · NOT TO SCALE</span>
          </div>
        </div>

        <div className="destination-map__details">
          <div className="destination-map__preview" key={selected?.id || 'compare'}>
            <img src={preview.image} alt={preview.imageAlt} loading="lazy" />
            <span>{selected ? `${preview.number} / DESTINATION PREVIEW` : 'RUSSIA / START EXPLORING'}</span>
            {preview.credit && (
              <a href={preview.creditUrl} target="_blank" rel="noreferrer" className="destination-map__photo-credit">
                PHOTO: {preview.credit}
              </a>
            )}
          </div>
          <div className="destination-map__selection" aria-live="polite">
            <p className="eyebrow">{selected ? `${selected.number} / YOUR PREFERENCE` : 'YOUR PLANNING PREFERENCE'}</p>
            <h3>{selected ? selected.name : 'Still comparing?'}</h3>
            <p>{selected
              ? `${selected.name} will be included in your downloadable checklist.`
              : 'Select a marker, or build a general checklist while you compare destinations.'}</p>
            {selected && <span className="destination-map__coordinates">{selected.coordinates}</span>}
          </div>
          <button className="button button--light" type="button" onClick={onAccess}>
            {selected ? 'Build my destination checklist' : 'Build a general checklist'}<Arrow />
          </button>
          {selected && (
            <button className="destination-map__clear" type="button" onClick={() => onChange('')}>
              Clear destination
            </button>
          )}
          <p className="destination-map__note">A preference, not a recommendation or confirmation of programme availability. Saved only on this device.</p>
        </div>
      </div>
    </div>
  );
}
