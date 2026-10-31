import { lazy, Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SceneBackground from './components/SceneBackground.jsx';
import Navigation from './components/Navigation.jsx';
import AccessModal from './components/AccessModal.jsx';
import DestinationMap from './components/DestinationMap.jsx';
import Brand from './components/Brand.jsx';
import Arrow from './components/Arrow.jsx';
import { getDestination } from './data/destinations.js';
import { useMediaQuery } from './hooks/useMedia.js';
import { useInterfaceSounds } from './hooks/useInterfaceSounds.js';

const SphereExperience = lazy(() => import('./components/SphereExperience.jsx'));

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

function FeatureIcon({ type }) {
  if (type === 'anticipate') {
    return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="10" stroke="currentColor" /><circle cx="16" cy="16" r="5" stroke="currentColor" /><path d="M16 2v5M16 25v5M2 16h5M25 16h5" stroke="currentColor" /></svg>;
  }
  if (type === 'connect') {
    return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="8" cy="16" r="3" stroke="currentColor" /><circle cx="24" cy="8" r="3" stroke="currentColor" /><circle cx="24" cy="24" r="3" stroke="currentColor" /><path d="m10.7 14.6 10.6-5.2M10.7 17.4l10.6 5.2" stroke="currentColor" /></svg>;
  }
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 3 27 7v8c0 7-4.6 11.5-11 14-6.4-2.5-11-7-11-14V7l11-4Z" stroke="currentColor" /><path d="m11 16 3.2 3.2L21.5 12" stroke="currentColor" /></svg>;
}

const HERO_SPHERE_SCALE = 0.74;

const CAPABILITIES = [
  {
    number: '01',
    icon: 'anticipate',
    title: 'Eligibility',
    text: 'Understand course, academic, language, and university requirements before you apply.',
  },
  {
    number: '02',
    icon: 'connect',
    title: 'Documentation',
    text: 'Organise transcripts, passport, and supporting documents; confirm translations or attestations where required.',
  },
  {
    number: '03',
    icon: 'protect',
    title: 'Expense clarity',
    text: 'Compare tuition, accommodation, insurance, travel, and living costs before making a decision.',
  },
];

function readStoredDestination() {
  try {
    const saved = localStorage.getItem('russia-study-destination');
    if (saved !== null) return getDestination(saved) ? saved : '';
    const checklist = JSON.parse(localStorage.getItem('russia-study-checklist') || 'null');
    return getDestination(checklist?.destination) ? checklist.destination : '';
  } catch {
    return '';
  }
}

export default function App() {
  const experienceRef = useRef(null);
  const motion = useRef({ x: 0, y: 0, scale: 0.24, cameraZ: 6.8, opacity: 0 });
  const [activeScene, setActiveScene] = useState(0);
  const [activeSphereScene, setActiveSphereScene] = useState(0);
  const [destinationMarkersVisible, setDestinationMarkersVisible] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [destination, setDestination] = useState(readStoredDestination);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const interfaceSounds = useInterfaceSounds();
  const closeAccess = useCallback(() => setAccessOpen(false), []);
  const openAccess = useCallback(() => setAccessOpen(true), []);
  const changeDestination = useCallback((nextDestination) => {
    setDestination(nextDestination);
    try {
      localStorage.setItem('russia-study-destination', nextDestination);
    } catch {
      // Selection still works for this session when storage is unavailable.
    }
  }, []);

  useLayoutEffect(() => {
    let active = true;
    let introFallback;
    const context = gsap.context(() => {
      const sections = gsap.utils.toArray('[data-scene]');

      if (reducedMotion) {
        gsap.set('.intro-veil', { display: 'none' });
        gsap.set('[data-title-line], [data-hero-reveal], [data-nav], [data-reveal-item]', {
          clearProps: 'all',
          opacity: 1,
          y: 0,
          yPercent: 0,
        });
        Object.assign(motion.current, { x: 0, y: 0, scale: HERO_SPHERE_SCALE, cameraZ: 6.8, opacity: 1 });
      } else {
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
        intro
          .to('.intro-veil__inner', { opacity: 0, y: -10, duration: 0.55 }, 0.35)
          .to('.intro-veil', { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 0.62)
          .to(motion.current, { opacity: 1, scale: HERO_SPHERE_SCALE, duration: 2.1 }, 0.7)
          .fromTo('[data-title-line]', { yPercent: 115 }, { yPercent: 0, duration: 1.45, stagger: 0.12 }, 1.02)
          .fromTo('[data-nav]', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 1.12)
          .fromTo('[data-hero-reveal]', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 1.42)
          .set('.intro-veil', { display: 'none' });
        // Complete the non-essential intro even on severely GPU-constrained devices.
        introFallback = window.setTimeout(() => intro.progress(1), 4000);

        const scroll = gsap.timeline({
          scrollTrigger: {
            trigger: experienceRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });
        scroll
          // The core expands past the viewport, creating a cinematic wipe into the next scene.
          .to(motion.current, { x: 0, y: 0, scale: 3.4, cameraZ: 5.6, duration: 0.85, ease: 'power2.inOut' }, 0)
          .to(motion.current, { x: 1.8, y: 0, scale: 0.88, cameraZ: 6.4, duration: 0.85, ease: 'power2.inOut' }, 0.85)
          .to(motion.current, { x: -1.8, y: 0.05, scale: 0.94, cameraZ: 6.2, duration: 1.1, ease: 'power2.inOut' }, 2.55)
          .to(motion.current, { x: 0, y: 0.15, scale: 1.25, cameraZ: 5.8, duration: 1.05, ease: 'power2.inOut' }, 4.45)
          .to(motion.current, { x: -0.45, y: 0, scale: 1.9, cameraZ: 6.4, opacity: 0.96, duration: 1, ease: 'power2.inOut' }, 5.5)
          // Hold the close-up throughout the destination checklist instead of zooming only at the page end.
          .to(motion.current, { opacity: 0.96, duration: 1, ease: 'none' }, 6.5);

        gsap.utils.toArray('[data-section-reveal]').forEach((section) => {
          const items = section.querySelectorAll('[data-reveal-item]');
          gsap.fromTo(items, { y: 32 }, {
            y: 0,
            duration: 1.05,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: section, start: 'top 70%', once: true },
          });
        });
      }

      sections.forEach((section) => {
        const scene = Number(section.dataset.scene);
        const sphereScene = Number(section.dataset.sphereScene ?? scene);
        const activateSection = () => {
          setActiveScene(scene);
          setActiveSphereScene(sphereScene);
        };
        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: activateSection,
          onEnterBack: activateSection,
        });
      });

      const destinationFooter = document.querySelector('.destination-footer');
      if (destinationFooter) {
        ScrollTrigger.create({
          trigger: destinationFooter,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: () => setDestinationMarkersVisible(true),
          onEnterBack: () => setDestinationMarkersVisible(true),
          onLeave: () => setDestinationMarkersVisible(false),
          onLeaveBack: () => setDestinationMarkersVisible(false),
        });
      }
    });

    document.fonts?.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });

    return () => {
      active = false;
      window.clearTimeout(introFallback);
      context.revert();
    };
  }, [reducedMotion]);

  const scrollToVision = () => {
    document.getElementById('vision')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <SceneBackground activeScene={activeScene} reducedMotion={reducedMotion} />
      <Suspense fallback={null}>
        <SphereExperience
          motion={motion}
          reducedMotion={reducedMotion}
          activeScene={activeSphereScene}
          destinationMarkersVisible={destinationMarkersVisible}
          destinationValue={destination}
          onDestinationChange={changeDestination}
        />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <Navigation
        onAccess={openAccess}
        mapHidden={destinationMarkersVisible}
        soundEnabled={interfaceSounds.enabled}
        soundSupported={interfaceSounds.supported}
        onSoundToggle={interfaceSounds.toggle}
      />

      <main id="experience" ref={experienceRef}>
        <section className="panel hero" id="home" data-scene="0" aria-labelledby="hero-title">
          <div className="hero__edition" data-hero-reveal>
            <span>INDEPENDENT GUIDANCE · INDIA → RUSSIA</span>
            <span className="hero__edition-line" />
            <span className="hero__edition-location">MOSCOW · ST. PETERSBURG</span>
          </div>
          <div className="hero__heading">
            <p className="eyebrow hero__eyebrow" data-hero-reveal><span className="status-dot" />HIGHER STUDIES IN RUSSIA · FOR INDIAN STUDENTS</p>
            <h1 id="hero-title">
              <span className="title-mask"><span data-title-line>Study in</span></span>
              <span className="title-mask"><span data-title-line><em>Russia.</em></span></span>
            </h1>
          </div>
          <div className="hero__bottom" data-hero-reveal>
            <p>Independent guidance on universities, scholarships, documents,<br className="desktop-break" /> and actual expenses—so you can make an informed decision.</p>
            <button className="button button--light" type="button" onClick={openAccess}>
              Get the process checklist<Arrow />
            </button>
          </div>
          <div className="hero__side-note" data-hero-reveal>
            <span>RESEARCH</span><span>APPLY</span><span>PREPARE</span>
          </div>
          <button className="scroll-cue" type="button" onClick={scrollToVision} data-hero-reveal aria-label="Explore the Russia admission process">
            <span>Scroll to explore</span><i />
          </button>
        </section>

        <section className="panel vision" id="vision" data-scene="1" aria-labelledby="vision-title">
          <div className="panel__content panel__content--left" data-section-reveal>
            <p className="eyebrow section-label" data-reveal-item><span>01</span>UNDERSTAND THE COSTS</p>
            <h2 id="vision-title" data-reveal-item>Compare routes.<br /><em>Not promises.</em></h2>
            <p className="section-copy" data-reveal-item>An agent-led route can cost around <strong className="cost-highlight">₹6–7 lakh</strong> in some cases. Scholarship opportunities for eligible Indian students may reduce overall expenses to around <strong className="cost-highlight">₹2–3 lakh</strong>. These are illustrative estimates—not fixed fees or guaranteed budgets. Confirm tuition, accommodation, insurance, travel, and living-cost inclusions.</p>
            <div className="section-signature" data-reveal-item><span className="signature-line" />ESTIMATES REQUIRE OFFICIAL VERIFICATION.</div>
          </div>
          <div className="object-note object-note--right" aria-hidden="true">
            <span className="object-note__line" /><span>COST CLARITY<br />ESTIMATES / 01</span>
          </div>
          <div className="scene-caption" aria-hidden="true"><span>02</span>COMPARE THE COMPLETE EXPENSES</div>
        </section>

        <section className="panel intelligence" id="intelligence" data-scene="2" aria-labelledby="intelligence-title">
          <div className="panel__content panel__content--right" data-section-reveal>
            <p className="eyebrow section-label" data-reveal-item><span>02</span>APPLICATION PROCESS</p>
            <h2 id="intelligence-title" data-reveal-item>You can apply.<br /><em>We help you prepare.</em></h2>
            <p className="section-copy" data-reveal-item>You can apply for scholarships independently. The process involves university selection, eligibility checks, documentation, and official application procedures. Our role is simply to assist and guide you through these steps.</p>
            <div className="flow-list" data-reveal-item>
              <div><span>01</span><p>Choose your course & universities</p><i>Compare official requirements</i></div>
              <div><span>02</span><p>Prepare your documents</p><i>Passport, transcripts & more</i></div>
              <div><span>03</span><p>Follow the official process</p><i>Track decisions & next steps</i></div>
            </div>
          </div>
          <div className="object-note object-note--left" aria-hidden="true">
            <span>GUIDANCE ONLY<br />NOT RECRUITMENT</span><span className="object-note__line" />
          </div>
          <div className="scene-caption" aria-hidden="true"><span>03</span>DECISIONS REST WITH OFFICIAL AUTHORITIES</div>
        </section>

        <section className="panel possibilities" id="possibilities" data-scene="2" data-sphere-scene="3" aria-labelledby="possibilities-title">
          <div className="possibilities__heading" data-section-reveal>
            <p className="eyebrow section-label" data-reveal-item><span>03</span>WHAT WE HELP WITH</p>
            <h2 id="possibilities-title" data-reveal-item>Guidance, not <em>guarantees.</em></h2>
          </div>
          <div className="capability-grid" data-section-reveal>
            {CAPABILITIES.map((capability) => (
              <article className="capability" key={capability.title} data-reveal-item>
                <div className="capability__top"><FeatureIcon type={capability.icon} /><span>{capability.number}</span></div>
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel final" id="access" data-scene="-1" data-sphere-scene="4" aria-labelledby="final-title">
          <div className="final__content" data-section-reveal>
            <p className="eyebrow section-label" data-reveal-item><span className="status-dot" />INDEPENDENT GUIDANCE · NO GUARANTEES</p>
            <h2 id="final-title" data-reveal-item>Make an informed<br /><em>decision.</em></h2>
            <p className="section-copy" data-reveal-item>We are not an education agent or recruitment agency. We do not guarantee scholarships or admissions.<br />Final decisions rest with the respective university or scholarship authority.</p>
            <button className="button button--light" type="button" onClick={openAccess} data-reveal-item>
              Build my application checklist<Arrow />
            </button>
            <a className="official-link" href="https://education-in-russia.com/" target="_blank" rel="noreferrer" data-reveal-item>
              Verify on the official application portal<Arrow />
            </a>
          </div>
          <DestinationMap destination={destination} onDestinationChange={changeDestination} onAccess={openAccess} />
          <footer className="footer">
            <a href="#home" aria-label="Back to top"><Brand compact /></a>
            <p>© 2026 Russia Guide</p>
            <p>Independent guidance. Official decisions.</p>
          </footer>
        </section>
      </main>

      {accessOpen && (
        <AccessModal
          onClose={closeAccess}
          destination={destination}
          onDestinationChange={changeDestination}
          onSound={interfaceSounds.play}
        />
      )}
      <div className="intro-veil" aria-hidden="true">
        <div className="intro-veil__inner"><Brand /><span>HIGHER STUDIES IN RUSSIA</span></div>
      </div>
    </>
  );
}
