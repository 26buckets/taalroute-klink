'use client';

import { useEffect } from 'react';

// Playback owns its timing; this component only reflects actual media events.
export function MotionFeedback() {
  useEffect(() => {
    let clicked: HTMLElement | null = null;
    let clickReset: number | undefined;
    let releaseAudio = () => {};
    const remember = (event: MouseEvent) => {
      clicked = event.target instanceof Element ? event.target.closest<HTMLElement>('button, a[href]') : null;
      clearTimeout(clickReset);
      clickReset = window.setTimeout(() => { clicked = null; }, 0);
    };
    const source = (event: Event) => {
      releaseAudio();
      const audio = (event as CustomEvent<HTMLAudioElement>).detail;
      const control = audio.dataset.wordListening === 'true' ? null : clicked?.matches('[data-practice-listen], [aria-label^="Luister"], .cp-sound-play, .cp-sound-word') || clicked?.querySelector('.lucide-volume-2')
        ? clicked : document.querySelector<HTMLElement>('[data-practice-listen]');
      const active = () => { if (control?.isConnected) control.dataset.audioActive = 'true'; };
      const clear = () => { control?.removeAttribute('data-audio-active'); };
      audio.addEventListener('playing', active);
      for (const type of ['pause', 'ended', 'error', 'waiting', 'emptied']) audio.addEventListener(type, clear);
      releaseAudio = () => {
        clear();
        audio.removeEventListener('playing', active);
        for (const type of ['pause', 'ended', 'error', 'waiting', 'emptied']) audio.removeEventListener(type, clear);
      };
    };
    const navigate = () => { releaseAudio(); clearTimeout(clickReset); clicked = null; };
    document.addEventListener('click', remember, true);
    window.addEventListener('klink-audio-source', source);
    window.addEventListener('hashchange', navigate);
    return () => {
      navigate();
      document.removeEventListener('click', remember, true);
      window.removeEventListener('klink-audio-source', source);
      window.removeEventListener('hashchange', navigate);
    };
  }, []);
  return null;
}
