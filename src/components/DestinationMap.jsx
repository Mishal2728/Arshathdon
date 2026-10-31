import Arrow from './Arrow.jsx';
import { CHECKLIST_ITEMS } from '../data/checklist.js';
import { DESTINATIONS, getDestination } from '../data/destinations.js';

export default function DestinationMap({ destination, onDestinationChange, onAccess }) {
  const selectedDestination = getDestination(destination);

  return (
    <div className="destination-footer destination-footer--globe" data-section-reveal aria-labelledby="destination-title">
      <div className="destination-footer__heading" data-reveal-item>
        <div>
          <p className="eyebrow section-label"><span>04</span>DESTINATION SHORTLIST</p>
          <h2 id="destination-title">Put your plans <em>on the map.</em></h2>
        </div>
        <p>Select a floating marker, then use the checklist beside the globe. Compare current programmes, eligibility, and complete expenses directly with each university.</p>
      </div>

      <div className="destination-footer__layout">
        <aside className="destination-checklist" data-reveal-item aria-labelledby="destination-checklist-title">
          <div className="destination-checklist__topline">
            <span>YOUR APPLICATION CHECKLIST</span>
            <span>04 STEPS</span>
          </div>

          <div className="destination-checklist__destination" aria-live="polite">
            <span>PLANNING PREFERENCE</span>
            <h3 id="destination-checklist-title">{selectedDestination?.name || 'Choose a destination.'}</h3>
            <p>{selectedDestination?.coordinates || `${DESTINATIONS.length} destinations across Russia`}</p>
            {selectedDestination?.markerCity && <small>Map marker: {selectedDestination.markerCity} · administrative centre</small>}
          </div>

          <div className="destination-checklist__cities" role="group" aria-label="Preferred study destination">
            {DESTINATIONS.map((item) => {
              const selected = item.id === destination;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={selected ? 'is-selected' : ''}
                  data-destination={item.id}
                  aria-pressed={selected}
                  onClick={() => onDestinationChange?.(selected ? '' : item.id)}
                >
                  {item.id === 'saint-petersburg' ? 'St. Petersburg' : item.name}
                </button>
              );
            })}
          </div>

          <ol className="destination-checklist__steps">
            {CHECKLIST_ITEMS.map((item, index) => (
              <li key={item.title}>
                <span>0{index + 1}</span>
                <div><strong>{item.title}</strong><p>{item.summary}</p></div>
              </li>
            ))}
          </ol>

          <button className="button button--light destination-checklist__button" type="button" onClick={onAccess}>
            Build my checklist<Arrow />
          </button>

          <div className="destination-checklist__links">
            <a href="https://education-in-russia.com/" target="_blank" rel="noreferrer">
              Official application portal<Arrow />
            </a>
            {selectedDestination && (
              <button type="button" onClick={() => onDestinationChange?.('')}>Clear selection</button>
            )}
          </div>

          <p className="destination-checklist__note">Guidance only—not an admission or scholarship guarantee. Verify current requirements through official sources.</p>
        </aside>
      </div>
    </div>
  );
}
