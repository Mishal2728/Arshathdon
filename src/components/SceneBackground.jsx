import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePageVisibility } from '../hooks/useMedia.js';

const SCENES = [
  {
    src: '/videos/russia-highlights.mp4',
    poster: '/images/russia-highlights.webp',
    label: 'A multi-location Russian journey through Red Square in Moscow, Kazan Cathedral in Saint Petersburg, and Moscow State University',
    className: 'scene-video--highlights',
  },
  {
    src: '/videos/moscow-university.mp4',
    poster: '/images/moscow-university.webp',
    label: 'Aerial view of Moscow State University and the surrounding city',
    className: 'scene-video--university',
  },
  {
    src: '/videos/saint-petersburg.mp4',
    poster: '/images/saint-petersburg.webp',
    label: 'Aerial view of the Peter and Paul Fortress in Saint Petersburg',
    className: 'scene-video--petersburg',
  },
];

const WAVE_DURATION = 1.5;
const WAVE_CLIP = 'polygon(0% -4%, 8.33% -1%, 16.66% -5%, 25% -2%, 33.33% -6%, 41.66% -2%, 50% -5%, 58.33% -1%, 66.66% -5%, 75% -2%, 83.33% -6%, 91.66% -2%, 100% -4%, 100% 110%, 0% 110%)';

function playVideo(video) {
  if (!video) return;
  const playPromise = video.play();
  if (playPromise) playPromise.catch(() => {});
}

export default function SceneBackground({ activeScene, reducedMotion }) {
  const slotRefs = useRef([]);
  const videoRefs = useRef([]);
  const fallbackRef = useRef(null);
  const transitionVeilRef = useRef(null);
  const currentSceneRef = useRef(0);
  const transitionRef = useRef(null);
  const pageVisible = usePageVisibility();
  const pageVisibleRef = useRef(pageVisible);
  pageVisibleRef.current = pageVisible;

  useEffect(() => {
    const slots = slotRefs.current;
    const videos = videoRefs.current;
    const veil = transitionVeilRef.current;
    const nextScene = activeScene;
    const previousScene = currentSceneRef.current;

    transitionRef.current?.kill();
    transitionRef.current = null;
    gsap.killTweensOf([...slots, ...videos, veil].filter(Boolean));
    if (veil) gsap.set(veil, { opacity: 0 });
    slots.forEach((slot) => {
      gsap.set(slot, { clearProps: 'clipPath,zIndex,willChange,transform' });
    });
    videos.forEach((video) => {
      gsap.set(video, { clearProps: 'willChange,transform,filter' });
    });

    if (reducedMotion) {
      currentSceneRef.current = nextScene;
      gsap.set(fallbackRef.current, { autoAlpha: nextScene === -1 ? 0 : 1 });
      // Inline visibility must match the active scene immediately, including the -1 final scene.
      slots.forEach((slot, index) => gsap.set(slot, { autoAlpha: index === nextScene ? 1 : 0 }));
      videos.forEach((video) => video.pause());
      return;
    }

    gsap.to(fallbackRef.current, {
      autoAlpha: nextScene === -1 ? 0 : 1,
      duration: 1,
      ease: 'power1.inOut',
      overwrite: true,
    });

    if (nextScene === previousScene) {
      slots.forEach((slot, index) => {
        if (index !== nextScene) gsap.set(slot, { autoAlpha: 0 });
      });
      videos.forEach((video, index) => {
        if (index !== nextScene) video.pause();
      });
      if (nextScene >= 0 && pageVisibleRef.current) playVideo(videos[nextScene]);
      return;
    }

    currentSceneRef.current = nextScene;
    const outgoing = previousScene >= 0 ? videos[previousScene] : null;
    const incoming = nextScene >= 0 ? videos[nextScene] : null;
    const outgoingSlot = previousScene >= 0 ? slots[previousScene] : null;
    const incomingSlot = nextScene >= 0 ? slots[nextScene] : null;

    slots.forEach((slot, index) => {
      if (index !== previousScene && index !== nextScene) gsap.set(slot, { autoAlpha: 0 });
    });
    videos.forEach((video, index) => {
      if (index !== previousScene && index !== nextScene) video.pause();
    });

    if (incoming && pageVisibleRef.current) playVideo(incoming);
    // Keep the outgoing frame, but do not decode a second video during the wipe.
    outgoing?.pause();

    if (!incoming || !incomingSlot) {
      if (!outgoingSlot) return;
      gsap.set(outgoingSlot, { zIndex: 2, willChange: 'opacity' });
      transitionRef.current = gsap.to(outgoingSlot, {
        autoAlpha: 0,
        duration: 1,
        ease: 'power1.inOut',
        onComplete: () => {
          gsap.set(outgoingSlot, { clearProps: 'zIndex,willChange' });
          transitionRef.current = null;
        },
      });
      return;
    }

    gsap.set(incomingSlot, {
      autoAlpha: 0.72,
      zIndex: 2,
      yPercent: 100,
      clipPath: WAVE_CLIP,
      willChange: 'transform,opacity',
    });
    gsap.set(incoming, {
      yPercent: -100,
      scale: 1.025,
      willChange: 'transform',
    });
    if (outgoingSlot) {
      gsap.set(outgoingSlot, { autoAlpha: 1, zIndex: 1, willChange: 'opacity' });
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        if (outgoingSlot) gsap.set(outgoingSlot, { autoAlpha: 0 });
        gsap.set(incomingSlot, { autoAlpha: 1 });
        gsap.set([incomingSlot, outgoingSlot].filter(Boolean), {
          clearProps: 'clipPath,zIndex,willChange,transform',
        });
        gsap.set([incoming, outgoing].filter(Boolean), { clearProps: 'willChange,transform' });
        gsap.set(incoming, { filter: 'none' });
        if (veil) gsap.set(veil, { opacity: 0 });
        transitionRef.current = null;
      },
    });

    // Counter-moving transforms keep the footage stationary while the wave edge rises.
    timeline
      .to(incomingSlot, { yPercent: 0, opacity: 1, duration: WAVE_DURATION, ease: 'power2.inOut' }, 0)
      .to(incoming, {
        yPercent: 0,
        scale: 1.015,
        duration: WAVE_DURATION,
        ease: 'power2.inOut',
      }, 0);

    if (veil) {
      timeline
        .to(veil, { opacity: 0.12, duration: 0.55, ease: 'sine.inOut' }, 0.1)
        .to(veil, { opacity: 0, duration: 0.85, ease: 'sine.inOut' }, 0.65);
    }

    if (outgoingSlot) {
      timeline.to(outgoingSlot, { opacity: 0, duration: 1.15, ease: 'sine.inOut' }, 0.35);
    }

    transitionRef.current = timeline;
  }, [activeScene, reducedMotion]);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentSceneRef.current];
    if (!pageVisible || reducedMotion) {
      transitionRef.current?.pause();
      videoRefs.current.forEach((video) => video?.pause());
    } else {
      transitionRef.current?.resume();
      playVideo(currentVideo);
    }
  }, [activeScene, pageVisible, reducedMotion]);

  useEffect(() => () => {
    transitionRef.current?.kill();
    gsap.killTweensOf([...slotRefs.current, ...videoRefs.current, transitionVeilRef.current].filter(Boolean));
    videoRefs.current.forEach((video) => video?.pause());
  }, []);

  return (
    <div className="scene-background" aria-hidden="true">
      <div className="scene-background__fallback" ref={fallbackRef} />
      {SCENES.map((scene, index) => (
        <div
          key={scene.src}
          ref={(node) => { slotRefs.current[index] = node; }}
          className={`scene-video-slot scene-video-slot--${index}`}
        >
          <video
            ref={(node) => { videoRefs.current[index] = node; }}
            className={`scene-video ${scene.className}`}
            src={scene.src}
            poster={scene.poster}
            aria-label={scene.label}
            muted
            loop
            playsInline
            preload={index === 0 ? 'auto' : 'metadata'}
            disablePictureInPicture
            tabIndex={-1}
            onCanPlay={(event) => event.currentTarget.classList.add('is-loaded')}
          />
        </div>
      ))}
      <div className="scene-background__transition-veil" ref={transitionVeilRef} />
    </div>
  );
}
