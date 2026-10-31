import { useEffect, useRef, useState } from 'react';
import Brand from './Brand.jsx';
import Arrow from './Arrow.jsx';
import { DESTINATIONS, getDestination } from '../data/destinations.js';
import { CHECKLIST_ITEMS } from '../data/checklist.js';

const OFFICIAL_PORTAL = 'https://education-in-russia.com/';

export default function AccessModal({ onClose, destination, onDestinationChange, onSound }) {
  const dialogRef = useRef(null);
  const nameRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [profile, setProfile] = useState({ firstName: '', course: '', destination: '' });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const onSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const course = String(data.get('course') || '').trim();
    const chosenDestination = String(data.get('destination') || '');
    try {
      localStorage.setItem('russia-study-checklist', JSON.stringify({
        name,
        course,
        destination: chosenDestination,
        createdAt: new Date().toISOString(),
      }));
    } catch {
      // The checklist and download still work when storage is unavailable.
    }
    setProfile({ firstName: name.split(' ')[0], course, destination: chosenDestination });
    setSubmitted(true);
    onSound?.('success');
  };

  const downloadChecklist = () => {
    const lines = [
      'HIGHER STUDIES IN RUSSIA — STARTER CHECKLIST',
      `Student: ${profile.firstName || 'Applicant'}`,
      `Intended course: ${profile.course}`,
      `Preferred destination: ${getDestination(profile.destination)?.name || 'Still comparing'}`,
      '',
      ...CHECKLIST_ITEMS.flatMap((item, index) => [
        `${index + 1}. ${item.title}`,
        `   ${item.text}`,
        '',
      ]),
      'NEXT STEPS',
      '5. Follow the current application instructions and deadlines on the official portal.',
      '6. Track communication from the relevant university or scholarship authority.',
      '7. Review the final offer and complete expenses before making a payment or travel decision.',
      '',
      `Official application portal: ${OFFICIAL_PORTAL}`,
      '',
      'Important: This is a preparation checklist, not confirmation of eligibility, admission, or a scholarship. Final decisions rest with the respective university or scholarship authority. Cost estimates must be verified for your specific course and circumstances.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'russia-study-checklist.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="modal" role="presentation">
      <button className="modal__backdrop" aria-label="Close application checklist" onClick={onClose} />
      <section className="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="access-title" ref={dialogRef}>
        <div className="modal__topline">
          <Brand compact />
          <button className="modal__close" type="button" onClick={onClose} aria-label="Close dialog">
            <span /><span />
          </button>
        </div>
        {!submitted ? (
          <div className="modal__content">
            <p className="eyebrow"><span className="status-dot" />HIGHER STUDIES IN RUSSIA</p>
            <h2 id="access-title">Start with a<br /><em>clear checklist.</em></h2>
            <p className="modal__intro">Tell us your intended course to create a starter checklist. Your answers stay on this device; no application is submitted.</p>
            <form onSubmit={onSubmit}>
              <label>
                <span>Your name</span>
                <input ref={nameRef} name="name" type="text" autoComplete="name" placeholder="Ada Lovelace" required minLength={2} maxLength={60} />
              </label>
              <label>
                <span>Intended course or field</span>
                <input name="course" type="text" autoComplete="off" placeholder="e.g. Computer Science" required minLength={2} maxLength={80} />
              </label>
              <label>
                <span>Preferred study destination</span>
                <select
                  name="destination"
                  value={destination}
                  onChange={(event) => onDestinationChange(event.target.value)}
                >
                  <option value="">Still comparing destinations</option>
                  {DESTINATIONS.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <button className="button button--light modal__submit" type="submit">
                Create my checklist<Arrow />
              </button>
            </form>
            <p className="modal__privacy">No email required. No data leaves this device.</p>
          </div>
        ) : (
          <div className="modal__success">
            <div className="success-orbit" aria-hidden="true"><span /></div>
            <p className="eyebrow">YOUR STARTER CHECKLIST</p>
            <h2 id="access-title">{profile.firstName ? `${profile.firstName}, plan` : 'Plan'}<br /><em>with clarity.</em></h2>
            <p>Use this as a preparation guide—not as confirmation of eligibility, admission, or a scholarship.</p>
            <p className="checklist__course">
              Intended course: <strong>{profile.course}</strong><br />
              Preferred destination: <strong>{getDestination(profile.destination)?.name || 'Still comparing'}</strong>
            </p>
            <ol className="checklist">
              {CHECKLIST_ITEMS.map((item, index) => (
                <li key={item.title}>
                  <span>0{index + 1}</span>
                  <p><strong>{item.title}</strong>{item.text}</p>
                </li>
              ))}
            </ol>
            <button className="button button--light modal__submit" type="button" onClick={downloadChecklist}>
              Download my checklist<Arrow />
            </button>
            <a className="official-link" href={OFFICIAL_PORTAL} target="_blank" rel="noreferrer">
              Open the official application portal<Arrow />
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
