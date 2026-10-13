'use client';

import { playAudio } from '@/components/product/shared';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bus,
  Check,
  Eye,
  Grid2X2,
  Headphones,
  ListOrdered,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  ScanText,
  Shapes,
  ShoppingBasket,
  Split,
  Volume2,
  WholeWord,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import Image from 'next/image';

export type ExerciseDemoId = 'picture' | 'syllables' | 'position' | 'sentence' | 'flash' | 'document' | 'dialogue' | 'timetable' | 'category';
type DemoFeedback = 'idle' | 'right' | 'wrong';

type DemoDefinition = {
  id: ExerciseDemoId;
  category: 'Klank' | 'Woord' | 'Lezen' | 'Praktijk';
  title: string;
  short: string;
  level: string;
  icon: ReactNode;
};

const demos: DemoDefinition[] = [
  { id: 'picture', category: 'Woord', title: 'Kijk en kies', short: 'Koppel geluid, beeld en woord.', level: 'Alfa A', icon: <Grid2X2 /> },
  { id: 'syllables', category: 'Klank', title: 'Tik de stukken', short: 'Hoor hoeveel stukken een woord heeft.', level: 'Alfa A', icon: <MousePointerClick /> },
  { id: 'position', category: 'Klank', title: 'Waar hoor je de klank?', short: 'Zoek een klank vooraan, midden of achteraan.', level: 'Alfa B', icon: <Split /> },
  { id: 'sentence', category: 'Lezen', title: 'Maak de zin', short: 'Zet woorden in een logische volgorde.', level: 'Alfa B', icon: <ListOrdered /> },
  { id: 'flash', category: 'Woord', title: 'Kijk, onthoud en typ', short: 'Train het woordbeeld zonder kopiëren.', level: 'Alfa B', icon: <Eye /> },
  { id: 'document', category: 'Praktijk', title: 'Lees de afspraak', short: 'Vind informatie op een echte tekstvorm.', level: 'A1', icon: <ScanText /> },
  { id: 'dialogue', category: 'Praktijk', title: 'Wat zeg je?', short: 'Kies een passende reactie in een gesprek.', level: 'A1', icon: <MessageCircle /> },
  { id: 'timetable', category: 'Praktijk', title: 'Zoek je bus', short: 'Lees een eenvoudig vertrekbord.', level: 'A1', icon: <Bus /> },
  { id: 'category', category: 'Woord', title: 'Wat hoort waar?', short: 'Orden woorden op betekenis.', level: 'Alfa B', icon: <Shapes /> },
];

const categories = ['Alles', 'Klank', 'Woord', 'Lezen', 'Praktijk'] as const;

export function ExerciseSampler({ onBack, initialId = 'picture' }: { onBack: () => void; initialId?: ExerciseDemoId }) {
  const [selectedId, setSelectedId] = useState<ExerciseDemoId>(initialId);
  const [category, setCategory] = useState<(typeof categories)[number]>('Alles');
  const [feedback, setFeedback] = useState<DemoFeedback>('idle');
  const [chosenTiles, setChosenTiles] = useState<string[]>([]);
  const [flashVisible, setFlashVisible] = useState(true);
  const [typed, setTyped] = useState('');

  const selected = demos.find((demo) => demo.id === selectedId) ?? demos[0];
  const visible = category === 'Alles' ? demos : demos.filter((demo) => demo.category === category);

  function resetTask() {
    setFeedback('idle');
    setChosenTiles([]);
    setFlashVisible(true);
    setTyped('');
  }

  function openDemo(id: ExerciseDemoId) {
    setSelectedId(id);
    resetTask();
  }

  function filterDemos(nextCategory: (typeof categories)[number]) {
    setCategory(nextCategory);
    if (nextCategory === 'Alles' || selected.category === nextCategory) return;
    const firstMatch = demos.find((demo) => demo.category === nextCategory);
    if (firstMatch) openDemo(firstMatch.id);
  }

  function saveDemo(answer: string, isCorrect: boolean) {
    void fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: `demo.${selectedId}`,
        skillKey: `demo.${selectedId}`,
        answer,
        isCorrect,
        helpCount: isCorrect ? 0 : 1,
        responseMs: 1200,
      }),
    }).catch(() => undefined);
  }

  function answer(value: string, correct: string) {
    const isCorrect = value.toLocaleLowerCase('nl-NL') === correct.toLocaleLowerCase('nl-NL');
    setFeedback(isCorrect ? 'right' : 'wrong');
    saveDemo(value, isCorrect);
  }

  function addTile(tile: string) {
    if (chosenTiles.includes(tile)) return;
    setChosenTiles([...chosenTiles, tile]);
    setFeedback('idle');
  }

  return (
    <div className="sampler-page">
      <header className="sampler-heading">
        <div>
          <button className="text-back" onClick={onBack}><ArrowLeft />Terug naar oefenkaart</button>
          <span className="eyebrow">Oefenplein</span>
          <h1>Probeer verschillende manieren van leren</h1>
          <p>Negen werkende oefenvormen uit vier leergebieden. Kies links een oefening.</p>
        </div>
        <div className="sampler-count"><strong>9</strong><span>oefenvormen</span><small>direct te proberen</small></div>
      </header>

      <div className="sampler-filters" aria-label="Filter oefenvormen">
        {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => filterDemos(item)}>{item}</button>)}
      </div>

      <div className="sampler-workspace">
        <aside className="sampler-list" aria-label="Oefenvormen">
          {visible.map((demo, index) => (
            <button key={demo.id} className={selectedId === demo.id ? 'active' : ''} onClick={() => openDemo(demo.id)}>
              <span className="sampler-list-icon">{demo.icon}</span>
              <span><small>{demo.category} · {demo.level}</small><strong>{demo.title}</strong><em>{demo.short}</em></span>
              <b>{String(index + 1).padStart(2, '0')}</b>
            </button>
          ))}
        </aside>

        <main className="sampler-player">
          <header>
            <div><span className="eyebrow">{selected.category} · {selected.level}</span><h2>{selected.title}</h2><p>{selected.short}</p></div>
            <button className="secondary-button" onClick={resetTask}><RefreshCw />Opnieuw</button>
          </header>
          <div className="sampler-stage">
            <DemoCanvas
              id={selected.id}
              feedback={feedback}
              answer={answer}
              chosenTiles={chosenTiles}
              addTile={addTile}
              removeTile={() => { setChosenTiles(chosenTiles.slice(0, -1)); setFeedback('idle'); }}
              flashVisible={flashVisible}
              hideFlash={() => setFlashVisible(false)}
              typed={typed}
              setTyped={setTyped}
            />
          </div>
          <footer className={`sampler-feedback ${feedback}`}>
            {feedback === 'idle' && <><Headphones /><span><strong>Probeer het zelf</strong><small>Je krijgt meteen duidelijke feedback.</small></span></>}
            {feedback === 'right' && <><Check /><span><strong>Goed gedaan</strong><small>Deze stap is beheerst.</small></span></>}
            {feedback === 'wrong' && <><RefreshCw /><span><strong>Nog een keer</strong><small>Kijk of luister opnieuw. Je mag blijven proberen.</small></span></>}
            <button className="secondary-button" onClick={() => openDemo(demos[(demos.findIndex((demo) => demo.id === selectedId) + 1) % demos.length].id)}>Volgende vorm<ArrowRight /></button>
          </footer>
        </main>
      </div>
    </div>
  );
}

function DemoCanvas({ id, feedback, answer, chosenTiles, addTile, removeTile, flashVisible, hideFlash, typed, setTyped }: {
  id: ExerciseDemoId;
  feedback: DemoFeedback;
  answer: (value: string, correct: string) => void;
  chosenTiles: string[];
  addTile: (tile: string) => void;
  removeTile: () => void;
  flashVisible: boolean;
  hideFlash: () => void;
  typed: string;
  setTyped: (value: string) => void;
}) {
  if (id === 'picture') return (
    <section className="demo-task picture-task">
      <Instruction audio="boek" title="Luister. Kies het goede plaatje." />
      <div className="picture-options">
        {[['peer', '/word-peer.png'], ['boek', '/word-boek.png'], ['bus', '/word-bus.png']].map(([word, src]) => (
          <button key={word} onClick={() => answer(word, 'boek')} disabled={feedback === 'right'}><Image src={src} alt={word} width={1254} height={1254} /><span>{word}</span></button>
        ))}
      </div>
    </section>
  );

  if (id === 'syllables') return (
    <section className="demo-task">
      <Instruction audio="banaan" title="Luister. Hoeveel stukken hoor je?" />
      <div className="rhythm-word"><span>ba</span><i /><span>naan</span></div>
      <div className="demo-options numbered">{['1', '2', '3'].map((option) => <button key={option} onClick={() => answer(option, '2')} disabled={feedback === 'right'}>{option}<small>stuk{option !== '1' ? 'ken' : ''}</small></button>)}</div>
    </section>
  );

  if (id === 'position') return (
    <section className="demo-task">
      <Instruction audio="markt" title="Waar hoor je de m in markt?" />
      <div className="sound-position-word"><strong>m</strong><span>arkt</span></div>
      <div className="position-options">{[['begin', 'vooraan'], ['midden', 'midden'], ['eind', 'achteraan']].map(([value, label], index) => <button key={value} onClick={() => answer(value, 'begin')} disabled={feedback === 'right'}><i>{index === 0 ? '●○○' : index === 1 ? '○●○' : '○○●'}</i><span>{label}</span></button>)}</div>
    </section>
  );

  if (id === 'sentence') {
    const tiles = ['bus', 'Ik', 'de', 'met', 'ga'];
    const sentence = chosenTiles.join(' ');
    return (
      <section className="demo-task sentence-builder">
        <Instruction title="Maak een goede zin." />
        <div className="sentence-line">{chosenTiles.length ? chosenTiles.map((tile) => <span key={tile}>{tile}</span>) : <small>Tik de woorden in de goede volgorde.</small>}</div>
        <div className="sentence-tiles">{tiles.map((tile) => <button key={tile} onClick={() => addTile(tile)} disabled={chosenTiles.includes(tile) || feedback === 'right'}>{tile}</button>)}</div>
        <div className="demo-actions"><button className="secondary-button" onClick={removeTile} disabled={!chosenTiles.length}>Eén terug</button><button className="primary-button" onClick={() => answer(sentence, 'Ik ga met de bus')} disabled={chosenTiles.length !== tiles.length || feedback === 'right'}>Controleer<Check /></button></div>
      </section>
    );
  }

  if (id === 'flash') return (
    <section className="demo-task flash-task">
      <Instruction audio="sleutel" title="Kijk. Onthoud. Typ daarna het woord." />
      {flashVisible ? <><div className="flash-word">sleutel</div><button className="primary-button" onClick={hideFlash}>Ik heb gekeken<Eye /></button></> : <form onSubmit={(event) => { event.preventDefault(); answer(typed, 'sleutel'); }}><label><span>Typ het woord</span><input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" /></label><button className="primary-button" disabled={!typed || feedback === 'right'}>Controleer<Check /></button></form>}
    </section>
  );

  if (id === 'document') return (
    <section className="demo-task document-task">
      <Instruction title="Lees de kaart. Hoe laat is de afspraak?" />
      <div className="appointment-card"><div><BookOpen /><span><small>GEZONDHEIDSCENTRUM WEST</small><strong>Afspraak</strong></span></div><dl><div><dt>Naam</dt><dd>Fatima Ali</dd></div><div><dt>Dag</dt><dd>maandag 7 september</dd></div><div className="marked"><dt>Tijd</dt><dd>09:30 uur</dd></div><div><dt>Met</dt><dd>dokter De Jong</dd></div></dl></div>
      <div className="demo-options compact">{['08:30', '09:30', '10:30'].map((option) => <button key={option} onClick={() => answer(option, '09:30')} disabled={feedback === 'right'}>{option}</button>)}</div>
    </section>
  );

  if (id === 'dialogue') return (
    <section className="demo-task dialogue-task">
      <Instruction audio="afspraak" title="Wat zeg je bij de balie?" />
      <div className="dialogue"><span className="avatar">M</span><p><small>Medewerker</small>Goedemorgen. Heeft u een afspraak?</p></div>
      <div className="dialogue-options">
        <button onClick={() => answer('Ja, om half tien.', 'Ja, om half tien.')} disabled={feedback === 'right'}><span className="avatar learner">F</span><span>Ja, om half tien.</span></button>
        <button onClick={() => answer('Ik ga met de bus.', 'Ja, om half tien.')} disabled={feedback === 'right'}><span className="avatar learner">F</span><span>Ik ga met de bus.</span></button>
        <button onClick={() => answer('Twee kilo, graag.', 'Ja, om half tien.')} disabled={feedback === 'right'}><span className="avatar learner">F</span><span>Twee kilo, graag.</span></button>
      </div>
    </section>
  );

  if (id === 'timetable') return (
    <section className="demo-task timetable-task">
      <Instruction title="Welke bus gaat naar Centrum?" />
      <div className="departure-board"><header><Bus /><strong>Vertrek</strong><span>halte Markt</span></header><div><b>4</b><span><strong>Station</strong><small>4 min</small></span><em>08:42</em></div><div className="highlight"><b>12</b><span><strong>Centrum</strong><small>7 min</small></span><em>08:47</em></div><div><b>22</b><span><strong>Ziekenhuis</strong><small>12 min</small></span><em>08:53</em></div></div>
      <div className="demo-options compact">{['4', '12', '22'].map((option) => <button key={option} onClick={() => answer(option, '12')} disabled={feedback === 'right'}>bus {option}</button>)}</div>
    </section>
  );

  return (
    <section className="demo-task category-task">
      <Instruction audio="melk" title="Waar hoort melk bij?" />
      <div className="category-word"><ShoppingBasket /><strong>melk</strong></div>
      <div className="category-options"><button onClick={() => answer('boodschappen', 'boodschappen')} disabled={feedback === 'right'}><ShoppingBasket /><span>Boodschappen</span></button><button onClick={() => answer('verkeer', 'boodschappen')} disabled={feedback === 'right'}><Bus /><span>Verkeer</span></button><button onClick={() => answer('lezen', 'boodschappen')} disabled={feedback === 'right'}><WholeWord /><span>Lezen</span></button></div>
    </section>
  );
}

function Instruction({ audio, title }: { audio?: string; title: string }) {
  return <div className="demo-instruction">{audio ? <button onClick={() => playAudio(audio)} aria-label="Luister naar de opdracht"><Volume2 /></button> : <span><BookOpen /></span>}<h3>{title}</h3></div>;
}
