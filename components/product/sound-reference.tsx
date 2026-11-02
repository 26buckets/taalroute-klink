'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Ear, ExternalLink, Volume2 } from 'lucide-react';
import { soundCards, soundById, soundGroups, soundHash, klankstudioUrl, wordsForSound, soundsForWord, lessonForSoundWord, type SoundCard } from '@/lib/sounds';
import type { LessonPosition } from '@/lib/package-content';
import { playMedia, stopMedia } from './shared';

const palette = (sound: SoundCard) => ({ '--sound-color': sound.group.posterColor, '--sound-line': sound.group.line, '--sound-soft': sound.group.soft }) as CSSProperties;

function useSoundPlayback() {
  const [playing, setPlaying] = useState<string>();
  const [error, setError] = useState(false);
  const playback = useRef(0);
  useEffect(() => {
    const interrupt = () => { playback.current++; setPlaying(undefined); setError(false); };
    window.addEventListener('klink-word-audio-start', interrupt);
    return () => window.removeEventListener('klink-word-audio-start', interrupt);
  }, []);
  useEffect(() => () => { playback.current++; stopMedia(); }, []);
  const stop = useCallback(() => { playback.current++; stopMedia(); setPlaying(undefined); setError(false); }, []);
  async function listen(source: string, playbackRate?: number) {
    const run = ++playback.current;
    setError(false); setPlaying(source);
    try {
      const heard = await playMedia(source, { waitUntilEnd: true, playbackRate });
      if (playback.current === run && !heard) setError(true);
    } catch { if (playback.current === run) setError(true); }
    finally { if (playback.current === run) setPlaying(undefined); }
  }
  return { playing, error, listen, stop };
}

function SoundTile({ sound, onPlay, onOpen, playing }: { sound: SoundCard; onPlay: () => void; onOpen?: () => void; playing: boolean }) {
  return <div className="cp-sound-tile" style={palette(sound)} data-sound={sound.id}>
    <button type="button" className="cp-sound-play" aria-label={`Luister naar de klank ${sound.label}`} aria-pressed={playing} onClick={onPlay}>
      <span className="cp-sound-glyph">{sound.label}</span><span className="cp-sound-example">{sound.example}</span><Volume2 aria-hidden="true" />
    </button>
    {onOpen && <button type="button" className="cp-sound-open" aria-label={`Woorden met ${sound.label}`} onClick={onOpen}>Woorden<ArrowRight aria-hidden="true" /></button>}
  </div>;
}

function SoundDetail({ sound, onLesson }: { sound: SoundCard; onLesson: (position: LessonPosition) => void }) {
  const { playing, error, listen } = useSoundPlayback();
  return <section className="cp-sound-detail" style={palette(sound)} aria-label={`Woorden met ${sound.label}`}>
    <div className="cp-sound-detail-top">
      <button type="button" className="cp-sound-anchor cp-sound-play" aria-label={`Luister naar de klank ${sound.label}`} aria-pressed={playing === sound.audio} onClick={() => sound.audio && void listen(sound.audio, 1)}>
        <span className="cp-sound-glyph">{sound.label}</span><span className="cp-sound-example">{sound.example}</span><Volume2 aria-hidden="true" />
      </button>
      <a className="text-back" href={klankstudioUrl(sound.id)} target="_blank" rel="noopener noreferrer">Klankstudio<ExternalLink aria-hidden="true" /><span className="sr-only"> (nieuw tabblad)</span></a>
    </div>
    <div className="cp-sound-words"><ul>{wordsForSound(sound).map(word => {
      const lesson = lessonForSoundWord(word.id);
      return <li key={word.id}>
        <button type="button" className="cp-sound-word" aria-label={`Luister naar het woord ${word.word}`} aria-pressed={playing === word.audio} disabled={!word.audio} onClick={() => word.audio && void listen(word.audio)}>{word.word}<Volume2 aria-hidden="true" /></button>
        {lesson && <button type="button" className="secondary-button" aria-label={`Oefen ${word.word}`} onClick={() => onLesson(lesson)}>Oefen<ArrowRight aria-hidden="true" /></button>}
      </li>;
    })}</ul></div>
    {error && <output>Luisteren lukt nu niet. Probeer opnieuw.</output>}
  </section>;
}

export function WordSounds({ wordId }: { wordId: string }) {
  const cards = soundsForWord(wordId);
  const { playing, error, listen, stop } = useSoundPlayback();
  if (!cards.length) return null;
  return <details className="cp-word-sounds" onToggle={event => { if (!event.currentTarget.open) stop(); }}>
    <summary><Ear aria-hidden="true" />Klanken bij dit woord</summary>
    <div className="cp-sound-tiles">{cards.map(card => <SoundTile key={card.id} sound={card} playing={playing === card.audio} onPlay={() => card.audio && void listen(card.audio, 1)} />)}</div>
    {error && <output>Luisteren lukt nu niet. Probeer opnieuw.</output>}
  </details>;
}

export function SoundReference({ onBack, onLesson }: { onBack: () => void; onLesson: (position: LessonPosition) => void }) {
  const [selected, setSelected] = useState<string>();
  const { playing, error, listen, stop } = useSoundPlayback();
  useEffect(() => {
    const restore = () => { stop(); const id = window.location.hash.split('/')[2]; setSelected(soundById.has(id) ? id : undefined); };
    restore(); window.addEventListener('hashchange', restore); window.addEventListener('popstate', restore);
    return () => { stopMedia(); window.removeEventListener('hashchange', restore); window.removeEventListener('popstate', restore); };
  }, [stop]);
  function open(id?: string) { stop(); setSelected(id); window.history.pushState(null, '', soundHash(id)); document.querySelector('.learner-main')?.scrollTo({ top: 0 }); }
  const sound = selected ? soundById.get(selected) : undefined;
  return <div className="learner-page cp-sounds">
    <header className="cp-context-header"><button className="text-back" type="button" aria-label={sound ? 'Alle klanken' : 'Terug naar Klanken'} onClick={() => { stop(); if (sound) open(); else onBack(); }}><ArrowLeft /></button><h1>{sound ? `Woorden met ${sound.label}` : 'Klankenkaart'}</h1></header>
    {sound ? <SoundDetail key={sound.id} sound={sound} onLesson={onLesson} /> : <>
      <div className="cp-sound-groups">{soundGroups.map(group => <section className="cp-sound-group" key={group.id} style={{ '--sound-color': group.posterColor, '--sound-line': group.line, '--sound-soft': group.soft } as CSSProperties}>
        <h2>{group.title}</h2><div className="cp-sound-tiles">{soundCards.filter(card => card.group.id === group.id).map(card => <SoundTile key={card.id} sound={card} playing={playing === card.audio} onPlay={() => card.audio && void listen(card.audio, 1)} onOpen={() => open(card.id)} />)}</div>
      </section>)}</div>
      {error && <output>Luisteren lukt nu niet. Probeer opnieuw.</output>}
    </>}
  </div>;
}
