'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Eye, Pause, Snail, Volume2 } from 'lucide-react';
import { getSlowAudio, setSlowAudio, subscribeSlowAudio } from '@/lib/media-player';
import type { PackageExercise } from '@/lib/package-content';

export type DialogueControls = {
  active: number;
  playing: boolean;
  completedPlays: number;
  play: (turn?: number) => void;
  pause: () => void;
  select: (turn: number) => void;
};

export function DialogueSurface({ exercise, controls, guided, canAnswer, onFinish }: {
  exercise: PackageExercise; controls: DialogueControls; guided: boolean; canAnswer: boolean;
  onFinish: (answer: string, correct: boolean) => void;
}) {
  const blocks = exercise.textBlocks as { id: string; text: string; speaker?: string }[];
  const [readAlong, setReadAlong] = useState(true);
  const [perTurn, setPerTurn] = useState(false);
  const slow = useSyncExternalStore(subscribeSlowAudio, getSlowAudio, () => false);
  const active = Math.min(controls.active, blocks.length - 1);
  const block = blocks[active];
  const image = exercise.prompt?.image;
  const transcript = useRef<HTMLDetailsElement>(null);
  function play() {
    if (!perTurn && controls.completedPlays === 1) {
      setReadAlong(false);
      if (transcript.current) transcript.current.open = false;
    }
    controls.play(perTurn ? active : undefined);
  }
  return <section className="cp-task-card cp-dialogue" aria-label="Gesprek">
    <fieldset className="cp-dialogue-support" aria-label="Oefenvorm">
      <legend>Luisteren</legend>
      <button className="secondary-button" aria-pressed={!perTurn} onClick={() => { controls.pause(); setPerTurn(false); }}>Hele gesprek</button>
      <button className="secondary-button" aria-pressed={perTurn} onClick={() => { controls.pause(); setPerTurn(true); }}>Oefen per beurt</button>
    </fieldset>
    <div className={`cp-dialogue-scene${image?.src ? ' has-image' : ''}`}>
      {image?.src && <Image src={image.src} alt={image.altText ?? ''} width={1536} height={1024} unoptimized />}
      <div className="cp-dialogue-current" aria-live="polite" aria-atomic="true">
        <span className="cp-dialogue-position">{active + 1} / {blocks.length}</span>
        <h3>{block.speaker}</h3>
        {readAlong ? <p>{block.text}</p> : <p className="cp-dialogue-listen-label"><Volume2 aria-hidden="true" />Luister naar {block.speaker}.</p>}
      </div>
    </div>
    <nav className="cp-dialogue-controls" aria-label="Gesprek afspelen">
      <button className="secondary-button" disabled={active === 0} onClick={() => controls.select(active - 1)} aria-label="Vorige spreekbeurt"><ArrowLeft /></button>
      <button className="primary-button" onClick={play}><Volume2 />{perTurn ? 'Luister naar deze beurt' : 'Luister naar het gesprek'}</button>
      <button className="secondary-button" disabled={active === blocks.length - 1} onClick={() => controls.select(active + 1)} aria-label="Volgende spreekbeurt"><ArrowRight /></button>
      <button className="secondary-button" disabled={!controls.playing} onClick={controls.pause}><Pause />Pauze</button>
      <button type="button" className="secondary-button cp-slow-audio" aria-label="Langzamer afspelen" aria-pressed={slow} title="Langzamer luisteren in alle onderdelen tijdens deze sessie" onClick={() => setSlowAudio(!slow)}><Snail aria-hidden="true" />Langzamer</button>
      <button className="secondary-button" aria-pressed={readAlong} onClick={() => setReadAlong(!readAlong)}><Eye />{readAlong ? 'Tekst verbergen' : 'Meelezen'}</button>
    </nav>
    <p className="cp-dialogue-support-note">{perTurn ? 'Luister per beurt. Herhaal en bespreek samen wat je hoort.' : 'Luister naar het hele gesprek. Vertel daarna wat de mensen afspreken.'}</p>
    <details ref={transcript} className="cp-dialogue-transcript"><summary>Hele gesprek meelezen</summary>{blocks.map((turn, index) => <button key={turn.id} className="secondary-button" aria-label={`Luister naar beurt ${index + 1} van ${turn.speaker}`} onClick={() => controls.play(index)}><Volume2 /><span><strong>{turn.speaker}</strong>{turn.text}</span></button>)}</details>
    {!guided && <button className="primary-button" disabled={!canAnswer} onClick={() => onFinish('samen geoefend', true)}>Klaar<Check /></button>}
  </section>;
}
