import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'russia-study-sound';
let audioContext = null;

const RECIPES = {
  enable: [
    { frequency: 440, duration: 0.09, volume: 0.025 },
    { frequency: 660, at: 0.07, duration: 0.12, volume: 0.022 },
  ],
  tap: [
    { frequency: 420, endFrequency: 330, duration: 0.06, volume: 0.024 },
  ],
  close: [
    { frequency: 350, endFrequency: 260, duration: 0.07, volume: 0.021 },
  ],
  select: [
    { frequency: 520, duration: 0.09, volume: 0.025 },
    { frequency: 760, at: 0.07, duration: 0.12, volume: 0.021 },
  ],
  download: [
    { frequency: 460, duration: 0.07, volume: 0.022 },
    { frequency: 620, at: 0.055, duration: 0.1, volume: 0.02 },
  ],
  success: [
    { frequency: 523.25, duration: 0.18, volume: 0.024, type: 'triangle' },
    { frequency: 659.25, at: 0.08, duration: 0.18, volume: 0.021, type: 'triangle' },
    { frequency: 783.99, at: 0.16, duration: 0.22, volume: 0.019, type: 'triangle' },
  ],
};

function audioContextClass() {
  return typeof window === 'undefined' ? null : window.AudioContext || window.webkitAudioContext || null;
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass = audioContextClass();
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
}

function playTone(context, recipe, start) {
  const {
    frequency,
    endFrequency,
    at = 0,
    duration,
    volume,
    type = 'sine',
  } = recipe;
  const startTime = start + at;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
  }
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + Math.min(0.012, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

async function playInterfaceSound(name) {
  const recipe = RECIPES[name];
  const context = getAudioContext();
  if (!recipe || !context) return;
  try {
    if (context.state === 'suspended') await context.resume();
    if (context.state !== 'running') return;
    const start = context.currentTime + 0.005;
    recipe.forEach((tone) => playTone(context, tone, start));
  } catch {
    // Audio is optional; a blocked or interrupted context never breaks interactions.
  }
}

function suspendInterfaceSound() {
  if (audioContext?.state === 'running') {
    audioContext.suspend().catch(() => {});
  }
}

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function useInterfaceSounds() {
  const [supported] = useState(() => Boolean(audioContextClass()));
  const [enabled, setEnabled] = useState(readPreference);
  const play = useCallback((name) => {
    if (enabled && supported) playInterfaceSound(name);
  }, [enabled, supported]);

  const toggle = useCallback(() => {
    if (!supported) return;
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // The preference still works for this session when storage is unavailable.
    }
    if (next) playInterfaceSound('enable');
    else suspendInterfaceSound();
  }, [enabled, supported]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) suspendInterfaceSound();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return undefined;

    const onClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest('button, a');
      if (!control || control.hasAttribute('data-sound-toggle') || control.getAttribute('aria-disabled') === 'true') return;
      if (control.matches('button:disabled')) return;
      // A valid form submission gets its own completion sound; invalid forms stay silent.
      if (control.matches('button[type="submit"][form], form button[type="submit"]')) return;

      let sound = 'tap';
      if (control.matches('.globe-marker, .destination-checklist__cities button')) {
        sound = control.getAttribute('aria-pressed') === 'true' ? 'tap' : 'select';
      } else if (control.matches('.modal__success .modal__submit')) {
        sound = 'download';
      } else if (control.matches('.modal__close, .modal__backdrop')) {
        sound = 'close';
      }
      playInterfaceSound(sound);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [enabled, supported]);

  return { enabled, supported, toggle, play };
}
