'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Eye, Pause, Volume2 } from 'lucide-react';
import type { PackageExercise } from '@/lib/package-content';

export type DialogueControls = {
  active: number;
  playing: boolean;
  play: (turn?: number) => void;
  pause: () => void;
  select: (turn: number) => void;
};

export function DialogueSurface({ exercise, controls, guided, canAnswer, onFinish }: {
  exercise: PackageExercise; controls: DialogueControls; guided: boolean; canAnswer: boolean;
  onFinish: (answer: string, correct: boolean) => void;
}) {
  const blocks = exercise.textBlocks as { id: string; text: string; speaker?: string }[];
  const [readAlong, setReadAlong] = useState(false);
  const [perTurn, setPerTurn] = useState(false);
  const active = Math.min(controls.active, blocks.length - 1);
  const block = blocks[active];
  const image = exercise.prompt?.image;
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
      <button className="primary-button" onClick={() => controls.play(perTurn ? active : undefined)}><Volume2 />{perTurn ? 'Luister naar deze beurt' : 'Luister naar het gesprek'}</button>
      <button className="secondary-button" disabled={active === blocks.length - 1} onClick={() => controls.select(active + 1)} aria-label="Volgende spreekbeurt"><ArrowRight /></button>
      <button className="secondary-button" disabled={!controls.playing} onClick={controls.pause}><Pause />Pauze</button>
      <button className="secondary-button" aria-pressed={readAlong} onClick={() => setReadAlong(!readAlong)}><Eye />{readAlong ? 'Tekst verbergen' : 'Meelezen'}</button>
    </nav>
    <p className="cp-dialogue-support-note">{perTurn ? 'Luister per beurt. Herhaal en bespreek samen wat je hoort.' : 'Luister naar het hele gesprek. Vertel daarna wat de mensen afspreken.'}</p>
    <details className="cp-dialogue-transcript"><summary>Hele gesprek meelezen</summary>{blocks.map((turn, index) => <button key={turn.id} className="secondary-button" aria-label={`Luister naar beurt ${index + 1} van ${turn.speaker}`} onClick={() => controls.play(index)}><Volume2 /><span><strong>{turn.speaker}</strong>{turn.text}</span></button>)}</details>
    {!guided && <button className="primary-button" disabled={!canAnswer} onClick={() => onFinish('samen geoefend', true)}>Klaar<Check /></button>}
  </section>;
}
