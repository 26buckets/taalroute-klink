'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react';
import { playMedia } from '@/lib/media-player';
import { wordAudioIndex, wordAudioParts, isLocalWordAudioHost } from '@/lib/word-audio';
const subscribeToHost = () => () => {}; // Hostname is fixed for this page; server rendering has no local playback approval.

export function isWordAudioClick(event: MouseEvent) {
  return event.target instanceof Element && Boolean(event.target.closest('button.cp-inline-word'));
}
export function WordAudioText({ text }: { text: string }) {
  const playback = useRef<AbortController | undefined>(undefined);
  const [active, setActive] = useState<number>();
  const [error, setError] = useState('');
  const localAudio = useSyncExternalStore(subscribeToHost, () => isLocalWordAudioHost(window.location.hostname), () => false);
  useEffect(() => () => playback.current?.abort(), [text]);
  async function listen(src: string, start: number) {
    playback.current?.abort();
    const controller = new AbortController(); playback.current = controller;
    setError(''); setActive(start);
    try { await playMedia(src, { signal: controller.signal, waitUntilEnd: true }); }
    catch { if (!controller.signal.aborted) setError('Het woordgeluid werkt niet. Tik nog eens op het woord.'); }
    finally { if (playback.current === controller) setActive(undefined); }
  }
  return <span>{wordAudioParts(text).map(part => {
    if (!part.word) return part.text;
    const audio = wordAudioIndex.get(part.word);
    return audio?.src && (!audio.localOnly || localAudio) ? <button key={part.start} type="button" className="cp-inline-word" data-word-audio={part.word} data-word-state={active === part.start ? 'playing' : undefined} aria-label={`Luister naar ${part.text}`} onClick={event => { event.stopPropagation(); void listen(audio.src!, part.start); }}>{part.text}</button>
      : <span key={part.start} data-word-audio-missing={audio?.status ?? 'missing'} title="Voor dit woord is nog geen eenduidige opname gekoppeld.">{part.text}</span>;
  })}{error && <span role="alert" className="cp-word-audio-error">{error}</span>}</span>;
}
