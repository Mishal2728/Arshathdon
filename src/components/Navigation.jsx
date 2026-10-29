import { useEffect, useState } from 'react';
import Brand from './Brand.jsx';
import Arrow from './Arrow.jsx';

const LINKS = [
  { label: 'Costs', href: '#vision' },
  { label: 'Process', href: '#intelligence' },
  { label: 'Guidance', href: '#possibilities' },
];

export default function Navigation({ onAccess }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const requestAccess = () => {
    setMenuOpen(false);
    onAccess();
  };

  return (
    <>
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`} data-nav>
        <a className="nav__brand" href="#home" aria-label="Russia Guide home" onClick={() => setMenuOpen(false)}>
          <Brand />
        </a>
        <nav className="nav__links" aria-label="Primary navigation">
          {LINKS.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <button className="nav__access" type="button" onClick={requestAccess}>
          <span>Get the checklist</span><Arrow />
        </button>
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
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
              <span>0{index + 1}</span>{link.label}<Arrow />
            </a>
          ))}
        </nav>
        <button className="button button--light mobile-menu__cta" type="button" onClick={requestAccess} tabIndex={menuOpen ? 0 : -1}>
          Get the process checklist<Arrow />
        </button>
        <p>Independent guidance.<br />Informed decisions.</p>
      </div>
    </>
  );
}
