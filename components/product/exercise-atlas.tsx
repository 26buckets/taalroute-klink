'use client';

import Image from 'next/image';
import type { ExerciseDemoId } from '@/components/product/exercise-sampler';
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpenCheck,
  Check,
  CircleDot,
  FileInput,
  FormInput,
  Headphones,
  Image as ImageIcon,
  Keyboard,
  LetterText,
  ListOrdered,
  MessageCircle,
  Mic,
  MousePointerClick,
  ScanText,
  Shapes,
  Shuffle,
  Split,
  Volume2,
  WholeWord,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

type LevelId = 'alpha-a' | 'alpha-b' | 'alpha-c' | 'a1';
type Visual = 'audio' | 'contrast' | 'letters' | 'picture' | 'tiles' | 'type' | 'sentence' | 'document' | 'sequence' | 'dialogue' | 'form' | 'speak';

type ExerciseOption = {
  title: string;
  group: string;
  cue: string;
  visual: Visual;
  icon: ReactNode;
  demoId?: ExerciseDemoId;
};

type Level = {
  id: LevelId;
  label: string;
  phase: string;
  goal: string;
  image: string;
  exercises: ExerciseOption[];
};

const levels: Level[] = [
  {
    id: 'alpha-a',
    label: 'Alfa A',
    phase: 'Horen en herkennen',
    goal: 'Klanken, letters en concrete woorden',
    image: '/levels/alpha-a.png',
    exercises: [
      { title: 'Luister en kies', group: 'Horen', cue: 'Geluid naar foto', visual: 'picture', icon: <Headphones />, demoId: 'picture' },
      { title: 'Dezelfde klank?', group: 'Horen', cue: 'Gelijk of anders', visual: 'contrast', icon: <AudioLines /> },
      { title: 'Klank bij letter', group: 'Letter', cue: 'Hoor en tik', visual: 'letters', icon: <LetterText /> },
      { title: 'Eerste letter', group: 'Letter', cue: 'Begin van het woord', visual: 'contrast', icon: <CircleDot /> },
      { title: 'Letters leggen', group: 'Bouwen', cue: 'Van klank naar woord', visual: 'tiles', icon: <MousePointerClick /> },
      { title: 'Tik de stukken', group: 'Woord', cue: 'Ritme en lettergrepen', visual: 'audio', icon: <Split />, demoId: 'syllables' },
    ],
  },
  {
    id: 'alpha-b',
    label: 'Alfa B',
    phase: 'Bouwen en lezen',
    goal: 'Woordstructuur, woordbeeld en korte zinnen',
    image: '/levels/alpha-b.png',
    exercises: [
      { title: 'Waar hoor je de klank?', group: 'Horen', cue: 'Voor, midden of achter', visual: 'contrast', icon: <Split />, demoId: 'position' },
      { title: 'Minimale paren', group: 'Horen', cue: 'p–b, m–n, ui–uu', visual: 'audio', icon: <Headphones /> },
      { title: 'Ontbrekende letter', group: 'Bouwen', cue: 'Vul de lege plek', visual: 'letters', icon: <FileInput /> },
      { title: 'Kijk, onthoud en typ', group: 'Schrijven', cue: 'Woordbeeld uit geheugen', visual: 'type', icon: <Keyboard />, demoId: 'flash' },
      { title: 'Maak de zin', group: 'Zinsbouw', cue: 'Woorden op volgorde', visual: 'sentence', icon: <ListOrdered />, demoId: 'sentence' },
      { title: 'Wat hoort waar?', group: 'Woordenschat', cue: 'Orden op betekenis', visual: 'tiles', icon: <Shapes />, demoId: 'category' },
    ],
  },
  {
    id: 'alpha-c',
    label: 'Alfa C',
    phase: 'Lezen en handelen',
    goal: 'Korte teksten, zinnen en dagelijkse situaties',
    image: '/levels/alpha-c.png',
    exercises: [
      { title: 'Zin bij foto', group: 'Lezen', cue: 'Beeld en betekenis', visual: 'picture', icon: <ImageIcon /> },
      { title: 'Zinnen op volgorde', group: 'Lezen', cue: 'Van eerst naar daarna', visual: 'sequence', icon: <Shuffle /> },
      { title: 'Lees de afspraak', group: 'Praktijk', cue: 'Dag, tijd en plaats', visual: 'document', icon: <ScanText />, demoId: 'document' },
      { title: 'Wie, waar, wanneer?', group: 'Begrijpen', cue: 'Zoek gerichte informatie', visual: 'document', icon: <BookOpenCheck /> },
      { title: 'Wat zeg je?', group: 'Gesprek', cue: 'Kies de reactie', visual: 'dialogue', icon: <MessageCircle /> },
      { title: 'Spreek je antwoord in', group: 'Spreken', cue: 'Luister en vergelijk', visual: 'speak', icon: <Mic /> },
    ],
  },
  {
    id: 'a1',
    label: 'A1',
    phase: 'Zelfstandig gebruiken',
    goal: 'Functionele taal in wonen, werk, zorg en reizen',
    image: '/levels/a1.png',
    exercises: [
      { title: 'Luister naar gesprek', group: 'Luisteren', cue: 'Wie wil wat?', visual: 'dialogue', icon: <Headphones /> },
      { title: 'Kies de reactie', group: 'Gesprek', cue: 'Passend antwoord', visual: 'dialogue', icon: <MessageCircle />, demoId: 'dialogue' },
      { title: 'Vul het formulier', group: 'Schrijven', cue: 'Naam, datum en adres', visual: 'form', icon: <FormInput /> },
      { title: 'Lees de dienstregeling', group: 'Praktijk', cue: 'Lijn, tijd en richting', visual: 'document', icon: <ScanText />, demoId: 'timetable' },
      { title: 'Zet handelingen op volgorde', group: 'Begrijpen', cue: 'Eerst, dan, daarna', visual: 'sequence', icon: <ListOrdered /> },
      { title: 'Vertel wat je nodig hebt', group: 'Spreken', cue: 'Opnemen en terugluisteren', visual: 'speak', icon: <Mic /> },
    ],
  },
];

export function ExerciseAtlas({ context = 'learner', onBack, onAction }: {
  context?: 'learner' | 'teacher';
  onBack?: () => void;
  onAction: (title: string, demoId?: ExerciseDemoId) => void;
}) {
  const [levelId, setLevelId] = useState<LevelId>('alpha-a');
  const level = levels.find((item) => item.id === levelId) ?? levels[0];

  return (
    <div className={`exercise-atlas ${context}`}>
      <header className="atlas-heading">
        <div>
          {onBack && <button className="text-back" onClick={onBack}><ArrowLeft />Terug</button>}
          <span className="eyebrow">Oefenkaart</span>
          <h1>Van eerste klank tot zelfstandig handelen</h1>
          <p>Vier niveaus. Vierentwintig oefenvormen. Eén rustige leerlijn.</p>
        </div>
        <div className="atlas-summary" aria-label="Overzicht oefenkaart">
          <span><strong>4</strong><small>niveaus</small></span>
          <span><strong>24</strong><small>vormen</small></span>
          <span><strong>9</strong><small>werkend</small></span>
        </div>
      </header>

      <nav className="level-selector" aria-label="Kies niveau">
        {levels.map((item) => (
          <button key={item.id} className={level.id === item.id ? 'active' : ''} onClick={() => setLevelId(item.id)}>
            <Image src={item.image} alt="" width={1672} height={941} />
            <span className="level-photo-shade" />
            <span className="level-copy"><small>{item.phase}</small><strong>{item.label}</strong><em>{item.goal}</em></span>
            <span className="level-check">{level.id === item.id ? <Check /> : <ArrowRight />}</span>
          </button>
        ))}
      </nav>

      <section className="atlas-workbench">
        <header>
          <div className="atlas-current-level"><span>{level.label}</span><div><strong>{level.phase}</strong><small>{level.goal}</small></div></div>
          <div className="atlas-legend"><span><i className="live" />Werkend voorbeeld</span><span><i />Kan worden gebouwd</span></div>
        </header>
        <div className="exercise-capability-grid">
          {level.exercises.map((exercise, index) => (
            <article className={exercise.demoId ? 'working' : ''} key={exercise.title}>
              <div className="capability-top">
                <span className="capability-icon">{exercise.icon}</span>
                <span className={`build-status ${exercise.demoId ? 'live' : ''}`}>{exercise.demoId ? 'Werkend' : 'Uitbouw'}</span>
              </div>
              <MiniCanvas visual={exercise.visual} image={level.image} />
              <span className="capability-index">{String(index + 1).padStart(2, '0')} · {exercise.group}</span>
              <h2>{exercise.title}</h2>
              <p>{exercise.cue}</p>
              <button onClick={() => onAction(exercise.title, exercise.demoId)}>
                {context === 'teacher' ? (exercise.demoId ? 'Zet klaar' : 'Bekijk ontwerp') : (exercise.demoId ? 'Probeer' : 'Bekijk hoe het werkt')}
                <ArrowRight />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniCanvas({ visual, image }: { visual: Visual; image: string }) {
  if (visual === 'picture') return <div className="mini-canvas mini-picture"><Image src={image} alt="" fill sizes="220px" /><span><Volume2 /></span><i /><i /></div>;
  if (visual === 'audio') return <div className="mini-canvas mini-audio"><span><Volume2 /></span><i /><i /><i /><b>1</b><b>2</b><b>3</b></div>;
  if (visual === 'contrast') return <div className="mini-canvas mini-contrast"><span>p</span><em>of</em><span>b</span><i>● ○ ○</i></div>;
  if (visual === 'letters') return <div className="mini-canvas mini-letters"><span>_</span><strong>ak</strong><i>p</i><i>b</i><i>d</i></div>;
  if (visual === 'tiles') return <div className="mini-canvas mini-tiles"><span /><span /><span /><i>b</i><i>o</i><i>e</i><i>k</i></div>;
  if (visual === 'type') return <div className="mini-canvas mini-type"><span><WholeWord /></span><i>s l e u t e l</i><strong>sleu_</strong></div>;
  if (visual === 'sentence') return <div className="mini-canvas mini-sentence"><span>Ik</span><span>ga</span><span>met</span><span>de</span><span>bus</span><i /></div>;
  if (visual === 'document') return <div className="mini-canvas mini-document"><span><ScanText /></span><i /><i /><strong>09:30</strong><i /></div>;
  if (visual === 'sequence') return <div className="mini-canvas mini-sequence"><span>1</span><i /><span>2</span><i /><span>3</span></div>;
  if (visual === 'dialogue') return <div className="mini-canvas mini-dialogue"><span>?</span><i>Goedemorgen</i><strong>Ja, graag.</strong></div>;
  if (visual === 'form') return <div className="mini-canvas mini-form"><i>Naam</i><span /><i>Datum</i><span /><i>Adres</i><span /></div>;
  return <div className="mini-canvas mini-speak"><span><Mic /></span><i /><i /><i /><i /><i /></div>;
}
