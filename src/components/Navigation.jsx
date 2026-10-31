import { useEffect, useState } from 'react';
import Brand from './Brand.jsx';
import Arrow from './Arrow.jsx';
import SoundToggle from './SoundToggle.jsx';

const LINKS = [
  { label: 'Costs', href: '#vision' },
  { label: 'Process', href: '#intelligence' },
  { label: 'Guidance', href: '#possibilities' },
];

const SECTIONS = [
  { id: 'home', number: '00', title: 'Overview' },
  { id: 'vision', number: '01', title: 'Cost clarity' },
  { id: 'intelligence', number: '02', title: 'The process' },
  { id: 'possibilities', number: '03', title: 'Guidance' },
  { id: 'access', number: '04', title: 'Next steps' },
];

export default function Navigation({ onAccess, mapHidden = false, soundEnabled = false, soundSupported = true, onSoundToggle }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 32);
      const marker = window.scrollY + window.innerHeight * 0.38;
      let current = SECTIONS[0].id;
      SECTIONS.forEach(({ id }) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top + window.scrollY <= marker) current = id;
      });
      setActiveSection(current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (mapHidden) setMenuOpen(false);
  }, [mapHidden]);

  const requestAccess = () => {
    setMenuOpen(false);
    onAccess();
  };
  const currentSection = SECTIONS.find(({ id }) => id === activeSection) || SECTIONS[0];

  return (
    <>
      <header
        className={`nav ${scrolled ? 'nav--scrolled' : ''} ${menuOpen ? 'nav--menu-open' : ''} ${mapHidden ? 'nav--map-hidden' : ''}`}
        data-nav
        aria-hidden={mapHidden || undefined}
        inert={mapHidden ? '' : undefined}
      >
        <div className="nav__left">
          <a className="nav__brand" href="#home" aria-label="Russia Guide home" onClick={() => setMenuOpen(false)}>
            <Brand />
          </a>
          <div className="nav__edition" key={currentSection.id} aria-label={`Current section: ${currentSection.title}`}>
            <span className="nav__edition-number">{currentSection.number}</span>
            <span className="nav__edition-rule" aria-hidden="true" />
            <strong>{currentSection.title}</strong>
          </div>
        </div>
        <nav className="nav__links" aria-label="Primary navigation">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeSection === link.href.slice(1) ? 'location' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav__actions">
          <SoundToggle
            enabled={soundEnabled}
            supported={soundSupported}
            onToggle={onSoundToggle}
            variant="nav"
          />
          <button className="nav__access" type="button" onClick={requestAccess}>
            <span>Get the checklist</span><Arrow />
          </button>
        </div>
        <button
          className={`nav__toggle ${menuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span />
        </button>
      </header>
      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">
          {LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              aria-current={activeSection === link.href.slice(1) ? 'location' : undefined}
            >
              <span>0{index + 1}</span>{link.label}<Arrow />
            </a>
          ))}
        </nav>
        <SoundToggle
          enabled={soundEnabled}
          supported={soundSupported}
          onToggle={onSoundToggle}
          variant="menu"
          tabIndex={menuOpen ? 0 : -1}
        />
        <button className="button button--light mobile-menu__cta" type="button" onClick={requestAccess} tabIndex={menuOpen ? 0 : -1}>
          Get the process checklist<Arrow />
        </button>
        <p>Independent guidance.<br />Informed decisions.</p>
      </div>
    </>
  );
}
