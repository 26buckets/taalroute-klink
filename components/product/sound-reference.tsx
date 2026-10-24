'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Ear, ExternalLink, Volume2 } from 'lucide-react';
import { soundCards, soundById, soundGroups, soundHash, soundPosterUrl, klankstudioUrl, wordsForSound, soundsForWord, lessonForSoundWord, type SoundCard } from '@/lib/sounds';
import type { LessonPosition } from '@/lib/package-content';
import { playMedia, stopMedia } from './shared';

const palette = (sound: SoundCard) => ({ '--sound-color': sound.group.posterColor, '--sound-line': sound.group.line, '--sound-soft': sound.group.soft }) as CSSProperties;

function SoundTile({ sound, onClick, selected = false }: { sound: SoundCard; onClick: () => void; selected?: boolean }) {
  return <button type="button" className="cp-sound-tile" style={palette(sound)} aria-label={`${sound.label}: ${sound.example}`} aria-pressed={selected} onClick={onClick} data-sound={sound.id}>
    <span className="cp-sound-glyph">{sound.label}</span><span>{sound.example}</span>
  </button>;
}

function SoundDetail({ sound, onLesson }: { sound: SoundCard; onLesson?: (position: LessonPosition) => void }) {
  const [audioError, setAudioError] = useState(false);
  const playback = useRef(0);
  useEffect(() => () => { playback.current++; stopMedia(); }, []);
  async function listen(source: string) {
    const run = ++playback.current;
    setAudioError(false);
    try {
      const heard = await playMedia(source, { waitUntilEnd: true });
      if (playback.current === run && !heard) setAudioError(true);
    } catch { if (playback.current === run) setAudioError(true); }
  }
  return <section className="cp-sound-detail" style={palette(sound)} aria-label={`De klank ${sound.label}`}>
    <p className="cp-sound-group-label">{sound.group.title}</p>
    <div className="cp-sound-anchor"><span className="cp-sound-glyph">{sound.label}</span><span>{sound.example}</span></div>
    <p>Kijk op de poster. Luister en zeg de klank samen met je docent.</p>
    <a className="secondary-button" href={klankstudioUrl(sound.id)} target="_blank" rel="noopener noreferrer">Open deze klank in Klankstudio<ExternalLink aria-hidden="true" /><span className="sr-only"> (nieuw tabblad)</span></a>
    {onLesson && wordsForSound(sound).length > 0 && <div className="cp-sound-words"><h2>Woorden in Klink</h2><p>Luister naar het hele woord. Waar hoor je de klank?</p>
      <ul>{wordsForSound(sound).map(word => {
        const lesson = lessonForSoundWord(word.id);
        return <li key={word.id}><span>{word.word}</span><div>
          {word.audio && <button type="button" className="secondary-button" aria-label={`Luister naar het woord ${word.word}`} onClick={() => void listen(word.audio!)}><Volume2 aria-hidden="true" />Luister</button>}
          {lesson && <button type="button" className="secondary-button" onClick={() => onLesson(lesson)}>Oefen {word.word}<ArrowRight aria-hidden="true" /></button>}
        </div></li>;
      })}</ul>
      {audioError && <output>Luisteren lukt nu niet. Probeer opnieuw of lees samen met je docent.</output>}
    </div>}
  </section>;
}

export function WordSounds({ wordId }: { wordId: string }) {
  const cards = soundsForWord(wordId);
  const [selected, setSelected] = useState<string>();
  const sound = cards.find(card => card.id === selected);
  if (!cards.length) return null;
  return <details className="cp-word-sounds" onToggle={event => { if (!event.currentTarget.open) setSelected(undefined); }}>
    <summary><Ear aria-hidden="true" />Klanken bij dit woord</summary>
    <div className="cp-sound-tiles">{cards.map(card => <SoundTile key={card.id} sound={card} selected={selected === card.id} onClick={() => { stopMedia(); setSelected(card.id); }} />)}</div>
    {sound && <SoundDetail key={sound.id} sound={sound} />}
  </details>;
}

export function SoundReference({ onBack, onLesson }: { onBack: () => void; onLesson: (position: LessonPosition) => void }) {
  const [selected, setSelected] = useState<string>();
  useEffect(() => {
    const restore = () => { stopMedia(); const id = window.location.hash.split('/')[2]; setSelected(soundById.has(id) ? id : undefined); };
    restore(); window.addEventListener('hashchange', restore); window.addEventListener('popstate', restore);
    return () => { stopMedia(); window.removeEventListener('hashchange', restore); window.removeEventListener('popstate', restore); };
  }, []);
  function open(id?: string) { stopMedia(); setSelected(id); window.history.pushState(null, '', soundHash(id)); document.querySelector('.learner-main')?.scrollTo({ top: 0 }); }
  const sound = selected ? soundById.get(selected) : undefined;
  return <div className="learner-page cp-sounds">
    <header className="cp-context-header"><button className="text-back" type="button" aria-label={sound ? 'Alle klanken' : 'Terug naar Oefenen'} onClick={() => sound ? open() : onBack()}><ArrowLeft /></button><div><h1>{sound ? `De klank ${sound.label}` : 'Klanken'}</h1><small>Dezelfde klanken als op de klankenkaart</small></div></header>
    {sound ? <SoundDetail key={sound.id} sound={sound} onLesson={onLesson} /> : <>
      <p>Kies een klank. Kijk op de poster en oefen samen.</p>
      <a className="text-back" href={soundPosterUrl} target="_blank" rel="noopener noreferrer">Open de klankenkaart<ExternalLink aria-hidden="true" /><span className="sr-only"> (nieuw tabblad)</span></a>
      <div className="cp-sound-groups">{soundGroups.map(group => <section className="cp-sound-group" key={group.id} style={{ '--sound-color': group.posterColor, '--sound-line': group.line, '--sound-soft': group.soft } as CSSProperties}>
        <h2>{group.title}</h2><div className="cp-sound-tiles">{soundCards.filter(card => card.group.id === group.id).map(card => <SoundTile key={card.id} sound={card} onClick={() => open(card.id)} />)}</div>
      </section>)}</div>
    </>}
  </div>;
}
