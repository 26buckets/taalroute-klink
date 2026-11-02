'use client';

import { useEffect, useEffectEvent, type RefObject } from 'react';

export function useWordListeningHelp(root: RefObject<HTMLElement | null>, onListen: (phase: 'request' | 'browse' | 'start' | 'end') => void) {
  const requested = useEffectEvent(onListen);
  useEffect(() => {
    let active = 0;
    const listen = (event: Event) => {
      const phase = event.type === 'klink-word-audio-start' ? 'start' : event.type === 'klink-word-audio-end' ? 'end' : event.type === 'klink-word-audio-browse' ? 'browse' : 'request';
      if ((phase === 'request' || phase === 'browse') && (!(event.target instanceof Node) || !root.current?.contains(event.target))) return;
      const id = (event as CustomEvent<number>).detail;
      if (phase === 'start') active = id;
      if (phase === 'end') { if (id !== active) return; active = 0; }
      requested(phase);
    };
    window.addEventListener('klink-word-audio-request', listen);
    window.addEventListener('klink-word-audio-start', listen);
    window.addEventListener('klink-word-audio-end', listen);
    window.addEventListener('klink-word-audio-browse', listen);
    return () => { window.removeEventListener('klink-word-audio-browse', listen); window.removeEventListener('klink-word-audio-end', listen); window.removeEventListener('klink-word-audio-request', listen); window.removeEventListener('klink-word-audio-start', listen); };
  }, [root]);
}
