'use client';

import { PackageExerciseBrowser } from '@/components/product/package-exercise-browser';
import { playMedia } from '@/components/product/shared';
import {
  contentPackages,
  getPackage,
  type PackageDefinition,
  type PackageExercise,
  type PackageId,
  type PackageLesson,
} from '@/lib/package-content';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  CircleAlert,
  FileText,
  Gamepad2,
  Headphones,
  Images,
  Layers3,
  LibraryBig,
  ListChecks,
  MessageCircle,
  PackageOpen,
  Route,
  Shapes,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type PackageTab =
  | 'overview'
  | 'words'
  | 'lessons'
  | 'practice'
  | 'texts'
  | 'dialogues'
  | 'media';

const tabLabels: { id: PackageTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overzicht', icon: Layers3 },
  { id: 'words', label: 'Woorden', icon: WholeWord },
  { id: 'lessons', label: 'Lessen', icon: Route },
  { id: 'practice', label: 'Oefeningen', icon: Shapes },
  { id: 'texts', label: 'Teksten', icon: FileText },
  { id: 'dialogues', label: 'Gesprekken', icon: MessageCircle },
  { id: 'media', label: 'Beeld en audio', icon: Images },
];

const stepLabels: Record<string, string> = {
  start: 'Start',
  kijk: 'Kijken',
  kies: 'Kiezen',
  klank: 'Klank',
  bouw: 'Bouwen',
  doe: 'Doen',
  meer: 'Meer oefenen',
};

export function PackageLibrary({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (packageId: PackageId) => void;
}) {
  return (
    <div className="learner-page package-library-page cp-library-page">
      <button className="text-back" onClick={onBack}>
        <ArrowLeft />
        Terug naar home
      </button>
      <header className="package-library-heading">
        <div>
          <span className="eyebrow">Klink · Alfabeta+</span>
          <h1>Kies een lessenreeks</h1>
          <p>
            Elke reeks is een verzameling lessen. Open een reeks en kies
            daarna de les waarmee je wilt oefenen.
          </p>
        </div>
        <div className="klink-cycle" aria-label="De vijf stappen van Klink">
          {['Kijken', 'Luisteren', 'Inoefenen', 'Nazeggen', 'Koppelen'].map(
            (step, index) => (
              <span key={step}>
                <b>{'KLINK'[index]}</b>
                <small>{step}</small>
              </span>
            ),
          )}
        </div>
      </header>

      <section className="cp-package-grid" aria-label="Beschikbare lessenreeksen">
        {contentPackages.map((pack, index) => (
          <button key={pack.id} onClick={() => onOpen(pack.id)}>
            <span className="cp-package-cover">
              <PackageOpen />
              <strong>{pack.id}</strong>
              <small>{index === 0 ? 'Eerst bekijken' : 'Tweede pakket'}</small>
            </span>
            <span className="cp-package-copy">
              <strong>{pack.title}</strong>
              <em>{pack.subtitle}</em>
              <span className="cp-package-stats">
                <small>{pack.counts.lessons} lessen</small>
                <small>{pack.counts.coreWords} kernwoorden</small>
                <small>{pack.counts.exercises} oefeningen</small>
                <small>{pack.counts.images} beelden</small>
              </span>
            </span>
            <ArrowRight />
          </button>
        ))}
      </section>

      <section className="cp-roadmap" aria-label="Geplande contentpakketten">
        <div>
          <span className="eyebrow">Reeks</span>
          <h2>De structuur loopt door tot CP016</h2>
          <p>CP001 en CP002 zijn nu zichtbaar. Dezelfde indeling kan daarna per pakket worden gevuld.</p>
        </div>
        <div>
          {Array.from({ length: 14 }, (_, index) => (
            <span key={index}>CP{String(index + 3).padStart(3, '0')}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PackagePlayer({
  packageId,
  onClose,
  savedWordIds,
  onToggleWord,
  onToast,
}: {
  packageId: PackageId;
  onClose: () => void;
  savedWordIds: string[];
  onToggleWord: (wordId: string) => void;
  onToast: (message: string) => void;
}) {
  const pack = getPackage(packageId);
  const [tab, setTab] = useState<PackageTab>('lessons');

  async function playAudio(source?: string) {
    if (!source) {
      onToast(`${pack.id}: dit luisterfragment is nog niet gekoppeld.`);
      return;
    }
    try {
      await playMedia(source);
    } catch {
      onToast('Het geluid kon niet worden afgespeeld. Probeer de knop nog een keer.');
    }
  }

  return (
    <div className="cp-player">
      <header className="cp-player-bar">
        <button onClick={onClose} aria-label="Terug naar lessen"><ArrowLeft /></button>
        <div>
          <span>{pack.id} · {pack.level}</span>
          <strong>{pack.title}</strong>
        </div>
      </header>

      <nav className="cp-tabs" aria-label={`${pack.id} onderdelen`}>
        {tabLabels.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <main className="cp-content">
        {tab === 'overview' && <PackageOverview pack={pack} onTab={setTab} />}
        {tab === 'words' && (
          <PackageWords
            pack={pack}
            savedWordIds={savedWordIds}
            onToggleWord={onToggleWord}
            onAudio={playAudio}
          />
        )}
        {tab === 'lessons' && <PackageLessons pack={pack} onAudio={playAudio} />}
        {tab === 'practice' && <PackagePractice pack={pack} onAudio={playAudio} />}
        {tab === 'texts' && <PackageTexts pack={pack} />}
        {tab === 'dialogues' && <PackageDialogues pack={pack} />}
        {tab === 'media' && <PackageMedia pack={pack} onAudio={playAudio} />}
      </main>
    </div>
  );
}

function PackageOverview({ pack, onTab }: { pack: PackageDefinition; onTab: (tab: PackageTab) => void }) {
  return (
    <div className="cp-overview">
      <section className="cp-hero">
        <div>
          <span className="eyebrow light">{pack.id}</span>
          <h1>{pack.title}</h1>
          <p>{pack.description}</p>
          <div className="cp-hero-actions">
            <button className="accent-button" onClick={() => onTab('lessons')}>Bekijk de lessen<ArrowRight /></button>
            <button className="dark-secondary-button" onClick={() => onTab('words')}>Bekijk alle woorden</button>
          </div>
        </div>
        <div className="cp-count-grid">
          <Count value={pack.counts.lessons} label="lessen" />
          <Count value={pack.counts.coreWords} label="kernwoorden" />
          <Count value={pack.counts.exercises} label="oefeningen" />
          <Count value={pack.counts.texts} label="teksten" />
          <Count value={pack.counts.dialogues} label="gesprekken" />
          <Count value={pack.counts.games} label="spellen" />
        </div>
      </section>

      <section className="cp-status-note">
        <CircleAlert />
        <div>
          <strong>Wat je hier ziet</strong>
          <p>{pack.statusNote}</p>
        </div>
        <button onClick={() => onTab('media')}>Bekijk mediastatus</button>
      </section>

      <section className="cp-section-heading">
        <div><span className="eyebrow">Opbouw</span><h2>Wat zit er in {pack.id}?</h2></div>
      </section>
      <section className="cp-overview-cards">
        <OverviewCard icon={Route} value={pack.counts.lessons} title="Lessen" text="Een vaste route van kijken en kiezen naar bouwen, doen en meer oefenen." onClick={() => onTab('lessons')} />
        <OverviewCard icon={WholeWord} value={pack.words.length} title="Woorden zichtbaar" text={`${pack.counts.coreWords} kernwoorden${pack.id === 'CP001' ? ' plus de startwoorden pen en boek' : ''}.`} onClick={() => onTab('words')} />
        <OverviewCard icon={Shapes} value={pack.counts.exercises} title="Oefenrecords" text={`${pack.counts.exerciseTypes} verschillende componentfamilies in de bron.`} onClick={() => onTab('practice')} />
        <OverviewCard icon={FileText} value={pack.counts.texts} title="Teksten" text="Korte begeleide teksten en contextteksten met groei in taalgebruik." onClick={() => onTab('texts')} />
        <OverviewCard icon={MessageCircle} value={pack.counts.dialogues} title="Gesprekken" text="Dialogen met rollen, doel en beurtwisseling." onClick={() => onTab('dialogues')} />
        <OverviewCard icon={Images} value={pack.counts.images} title="Beelden" text={`${pack.scenes.filter((scene) => scene.image).length} scènebeelden zijn direct zichtbaar in deze proef.`} onClick={() => onTab('media')} />
      </section>
    </div>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return <span><strong>{value}</strong><small>{label}</small></span>;
}

function OverviewCard({ icon: Icon, value, title, text, onClick }: { icon: typeof Route; value: number; title: string; text: string; onClick: () => void }) {
  return <button onClick={onClick}><span><Icon /></span><div><small>{value}</small><strong>{title}</strong><p>{text}</p></div><ArrowRight /></button>;
}

function PackageWords({ pack, savedWordIds, onToggleWord, onAudio }: { pack: PackageDefinition; savedWordIds: string[]; onToggleWord: (wordId: string) => void; onAudio: (source?: string) => void }) {
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">{pack.id} · woorden</span><h1>Alle woorden uit dit pakket</h1><p>Tik op de luidspreker om het woord te horen. Je kunt woorden bewaren om ze later opnieuw te oefenen.</p></div>
        <span className="cp-panel-count"><strong>{pack.words.length}</strong><small>zichtbare woorden</small></span>
      </header>
      <div className="cp-word-grid">
        {pack.words.map((word) => {
          const saved = savedWordIds.includes(`${pack.id}:${word.id}`);
          return (
            <article key={word.id}>
              <div className="cp-word-image">
                {word.image ? <Image src={word.image} alt={word.meaning ?? word.word} width={760} height={760} /> : <span>{word.word.slice(0, 1)}</span>}
              </div>
              <div className="cp-word-copy">
                <small>{word.group.replace('-', ' ')}</small>
                <strong>{word.word}</strong>
                <span>{word.segmentation.replaceAll('|', ' · ')}</span>
                {word.audioStatus === 'rejected' && <em>Opname wordt vervangen</em>}
              </div>
              <button className="cp-audio-button" onClick={() => onAudio(word.audio)} disabled={!word.audio} aria-label={word.audio ? `Luister naar ${word.word}` : `Audio van ${word.word} is nog niet gekoppeld`}><Volume2 /></button>
              <button className={`cp-save-button ${saved ? 'saved' : ''}`} onClick={() => onToggleWord(`${pack.id}:${word.id}`)} aria-label={`${word.word} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function textValues(value: unknown, result: string[] = []) {
  if (Array.isArray(value)) value.forEach((item) => textValues(item, result));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => textValues(item, result));
  else if (typeof value === 'string') result.push(value);
  return result;
}

function belongsToLesson(exercise: PackageExercise, lesson: PackageLesson) {
  if (exercise.lessonId === lesson.id) return true;
  const words = new Set(lesson.words.map((word) => word.toLocaleLowerCase('nl-NL')));
  return textValues(exercise).some((value) => value
    .toLocaleLowerCase('nl-NL')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .some((token) => words.has(token)));
}

const lessonComponentOrder = [
  'ALF-CMP-001',
  'ALF-CMP-002',
  'ALF-CMP-003',
  'ALF-CMP-004',
  'ALF-CMP-005',
  'ALF-CMP-006',
  'ALF-CMP-012',
  'ALF-CMP-009',
  'ALF-CMP-007',
  'ALF-CMP-008',
  'ALF-CMP-011',
  'ALF-CMP-013',
  'ALF-CMP-014',
  'ALF-CMP-015',
  'ALF-CMP-016',
];

function lessonMatchScore(exercise: PackageExercise, lesson: PackageLesson) {
  const words = lesson.words.map((word) => word.toLocaleLowerCase('nl-NL'));
  const containsWord = (value: string) => words.some((word) => value
    .toLocaleLowerCase('nl-NL')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .includes(word));
  const values = textValues(exercise);
  return (exercise.lessonId === lesson.id ? 100 : 0)
    + (containsWord(exercise.title ?? '') ? 20 : 0)
    + (containsWord(exercise.prompt?.text ?? '') ? 10 : 0)
    + (values.some((value) => value.startsWith('/package-audio/')) ? 30 : 0)
    + (values.some((value) => value.startsWith('/package-media/')) ? 1 : 0);
}

function addLessonWordAudio(exercise: PackageExercise, pack: PackageDefinition, lesson: PackageLesson) {
  const values = textValues(exercise);
  if (values.some((value) => value.startsWith('/package-audio/'))) return exercise;
  const tokens = new Set(values.flatMap((value) => value
    .toLocaleLowerCase('nl-NL')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)));
  const word = lesson.words.find((item) => tokens.has(item.toLocaleLowerCase('nl-NL')));
  const audio = pack.words.find((item) => item.word === word)?.audio;
  if (!word || !audio) return exercise;
  return {
    ...exercise,
    prompt: {
      ...exercise.prompt,
      audio: { audioId: `${pack.id}-${word}`, src: audio },
    },
  };
}

function lessonExercises(pack: PackageDefinition, lesson: PackageLesson) {
  const candidates = pack.exercises.filter((exercise) => belongsToLesson(exercise, lesson));
  return lessonComponentOrder.flatMap((componentId) => candidates
    .filter((exercise) => exercise.componentId === componentId)
    .sort((left, right) => lessonMatchScore(right, lesson) - lessonMatchScore(left, lesson))
    .slice(0, 1))
    .map((exercise) => addLessonWordAudio(exercise, pack, lesson));
}

function PackageLessons({ pack, onAudio }: { pack: PackageDefinition; onAudio: (source?: string) => void }) {
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const selectedLesson = pack.lessons.find((lesson) => lesson.id === selectedLessonId);

  if (selectedLesson) {
    const exercises = lessonExercises(pack, selectedLesson);
    const lessonNumber = pack.lessons.findIndex((lesson) => lesson.id === selectedLesson.id) + 1;
    return (
      <section className="cp-panel cp-lesson-player">
        <button className="text-back" aria-label="Terug naar alle lessen" onClick={() => setSelectedLessonId('')}><ArrowLeft />Alle lessen</button>
        <div className="cp-lesson-launch">
          <span className="cp-lesson-number">{String(lessonNumber).padStart(2, '0')}</span>
          <div><small>{pack.id} · les {lessonNumber}</small><h1>{selectedLesson.title}</h1><p>{selectedLesson.words.join(' · ')}</p></div>
        </div>
        <PackageExerciseBrowser
          key={selectedLesson.id}
          pack={pack}
          exercises={exercises}
          guided
          onAudio={onAudio}
          eyebrow={`Les ${lessonNumber}`}
          title={`Oefen met ${selectedLesson.title}`}
          description="Volg de stappen van kijken en luisteren naar bouwen, nazeggen en toepassen."
        />
      </section>
    );
  }

  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">{pack.id} · lessen</span><h1>Kies een les en begin</h1><p>Tik op Start les. Daarna kun je de opdrachten echt uitvoeren, beluisteren en controleren.</p></div>
        <span className="cp-panel-count"><strong>{pack.lessons.length}</strong><small>lessen</small></span>
      </header>
      <div className="cp-lesson-list">
        {pack.lessons.map((lesson, index) => (
          <article key={lesson.id}>
            <span className="cp-lesson-number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <small>{lesson.id}</small>
              <h2>{lesson.title}</h2>
              <p>{lesson.scope}</p>
              <div className="cp-word-chips">{lesson.words.map((word) => <span key={word}>{word}</span>)}</div>
              <button className="primary-button cp-start-lesson" onClick={() => setSelectedLessonId(lesson.id)}>Start les<ArrowRight /></button>
            </div>
            <ol aria-label={`Stappen van ${lesson.title}`}>
              {lesson.steps.map((step, stepIndex) => <li key={step}><span>{stepIndex + 1}</span>{stepLabels[step] ?? step}</li>)}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

function PackagePractice({ pack, onAudio }: { pack: PackageDefinition; onAudio: (source?: string) => void }) {
  const cycle = [
    ['K', 'Kijken', 'beeld en woord herkennen'],
    ['L', 'Luisteren', 'klanken en woorden onderscheiden'],
    ['I', 'Inoefenen', 'bouwen, typen, schrijven en herhalen'],
    ['N', 'Nazeggen', 'model beluisteren, spreken en terugluisteren'],
    ['K', 'Koppelen', 'woord, zin, tekst en gesprek verbinden'],
  ];
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">{pack.id} · oefenbank</span><h1>{pack.counts.exercises} oefeningen in {pack.counts.exerciseTypes} vormen</h1><p>Hier kun je vrij door alle opdrachtsoorten bladeren. De lessen hierboven geven een eenvoudigere, afgebakende start.</p></div>
        <span className="cp-panel-count"><strong>{pack.counts.exerciseTypes}</strong><small>componentfamilies</small></span>
      </header>
      <div className="cp-cycle-list">
        {cycle.map(([letter, title, text]) => <article key={`${letter}-${title}`}><span>{letter}</span><div><strong>{title}</strong><p>{text}</p></div><Check /></article>)}
      </div>
      <section className="cp-activity-atlas">
        <header>
          <div><span className="eyebrow">Activiteitenkaart</span><h2>Alle {pack.exerciseTypes.length} kleine activiteitsoorten</h2></div>
          <p>Het getal rechts is het aantal concrete oefeningen van dat type in {pack.id}.</p>
        </header>
        <div>
          {pack.exerciseTypes.map((exercise, index) => (
            <article key={exercise.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <small>{exercise.id}</small>
                <strong>{exercise.label}</strong>
                <em>{exercise.examples.join(' · ')}</em>
              </div>
              <b>{exercise.count}</b>
            </article>
          ))}
        </div>
      </section>
      <PackageExerciseBrowser pack={pack} onAudio={onAudio} />
      <section className="cp-games">
        <header><Gamepad2 /><div><span className="eyebrow">Spellen</span><h2>{pack.games.length} spelvormen</h2></div></header>
        <div>{pack.games.map((game) => <span key={game.id}>{game.title}</span>)}</div>
      </section>
      <p className="cp-honesty-line"><CircleAlert />Alle {pack.counts.exercises} opdrachten zijn te proberen. Beschikbare audio speelt direct af; ontbrekende media blijven herkenbaar gemarkeerd.</p>
    </section>
  );
}

function PackageTexts({ pack }: { pack: PackageDefinition }) {
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">{pack.id} · teksten</span><h1>{pack.texts.length} teksten om te bekijken</h1><p>Open een tekst om de volledige inhoud en, waar aanwezig, de begripsvraag te zien.</p></div>
        <span className="cp-panel-count"><strong>{pack.texts.length}</strong><small>teksten</small></span>
      </header>
      <div className="cp-reading-list">
        {pack.texts.map((text, index) => (
          <details key={text.id} open={index === 0}>
            <summary><span>{String(index + 1).padStart(2, '0')}</span><div><small>{text.level.replaceAll('_', ' ')}</small><strong>{text.title}</strong></div><ArrowRight /></summary>
            <div className="cp-reading-copy"><p>{text.text}</p>{text.question && <aside><strong>{text.question}</strong><span>Antwoord: {text.answer}</span></aside>}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function PackageDialogues({ pack }: { pack: PackageDefinition }) {
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">{pack.id} · gesprekken</span><h1>{pack.dialogues.length} dialogen met rollen</h1><p>De rollen en beurten blijven samen zichtbaar, zodat duidelijk is wie tegen wie praat.</p></div>
        <span className="cp-panel-count"><strong>{pack.dialogues.length}</strong><small>gesprekken</small></span>
      </header>
      <div className="cp-dialogue-grid">
        {pack.dialogues.map((dialogue) => (
          <article key={dialogue.id}>
            <header><MessageCircle /><div><small>{dialogue.level}</small><h2>{dialogue.title}</h2></div></header>
            <div>{dialogue.turns.map((turn, index) => <p key={`${turn.speaker}-${index}`}><strong>{turn.speaker}</strong><span>{turn.text}</span></p>)}</div>
            <footer><ListChecks /><span>{dialogue.goal}</span></footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function PackageMedia({ pack, onAudio }: { pack: PackageDefinition; onAudio: (source?: string) => void }) {
  const [selectedWordId, setSelectedWordId] = useState(pack.words[0]?.id ?? '');
  const selectedWord = pack.words.find((word) => word.id === selectedWordId) ?? pack.words[0];
  const relatedScenes = selectedWord
    ? pack.scenes.filter((scene) => scene.words?.some((word) => word.toLocaleLowerCase('nl-NL') === selectedWord.word.toLocaleLowerCase('nl-NL')))
    : [];
  const imageGrowth = [
    { label: 'Los woordbeeld', note: 'Eén betekenis, rustig in beeld', image: selectedWord?.image },
    { label: 'Eenvoudige context', note: 'Het woord in een herkenbare plek', image: relatedScenes[0]?.image },
    { label: 'Handeling', note: 'Het woord doet mee in een situatie', image: undefined },
    { label: 'Het geheel', note: 'Begrijpen en toepassen in een groter verhaal', image: undefined },
  ];

  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">{pack.id} · beeld en audio</span><h1>Wat is aanwezig en wat staat nog open?</h1><p>De app maakt hier geen “klaar”-claim van zolang menselijke controles niet zijn afgerond.</p></div>
        <span className="cp-panel-count"><strong>{pack.media.imageAvailable}</strong><small>beelden aanwezig</small></span>
      </header>
      <div className="cp-media-status">
        <article><Images /><div><small>Beeld</small><strong>{pack.media.imageAvailable} van {pack.media.imageExpected} bindingen aanwezig</strong><p>{pack.media.imageReview}</p></div></article>
        <button onClick={() => onAudio(pack.words.find((word) => word.audio)?.audio)}><Headphones /><div><small>Audio</small><strong>{pack.media.audioAvailable} van {pack.media.audioExpected} gekoppeld</strong><p>{pack.media.audioReview}</p></div><ArrowRight /></button>
        <article><LibraryBig /><div><small>Vrijgave</small><strong>{pack.status}</strong><p>{pack.media.publication === 'INTERNAL_ONLY' ? 'Alleen als interne voorvertoning behandelen.' : pack.media.publication}</p></div></article>
      </div>
      <section className="cp-image-growth">
        <header>
          <div><span className="eyebrow">Beeldgroei</span><h2>Van los woord naar een echte situatie</h2><p>Elk woord groeit in vier vaste stappen. Alleen aantoonbaar aanwezige beelden worden hier als gereed getoond.</p></div>
          <label><span>Kies een woord</span><select value={selectedWord?.id ?? ''} onChange={(event) => setSelectedWordId(event.target.value)}>{pack.words.map((word) => <option key={word.id} value={word.id}>{word.word}</option>)}</select></label>
        </header>
        <div>
          {imageGrowth.map((stage, index) => <article key={stage.label} className={stage.image ? 'available' : 'open'}><span className="cp-growth-number">{index + 1}</span>{stage.image ? <Image src={stage.image} alt={`${selectedWord?.word ?? 'Woord'}: ${stage.label.toLocaleLowerCase('nl-NL')}`} width={760} height={760} /> : <span className="cp-growth-placeholder"><Images /><small>Nog te maken</small></span>}<div><strong>{stage.label}</strong><p>{stage.note}</p></div></article>)}
        </div>
      </section>
      {pack.media.missing.length > 0 && <p className="cp-honesty-line"><CircleAlert />Ontbrekende scènebindingen: {pack.media.missing.join(', ')}.</p>}
      <section className="cp-scene-gallery">
        <header><div><span className="eyebrow">Scènes</span><h2>{pack.scenes.filter((scene) => scene.image).length} beelden zichtbaar</h2></div></header>
        <div>
          {pack.scenes.map((scene) => (
            <article key={scene.id} className={!scene.image ? 'missing' : ''}>
              {scene.image ? <Image src={scene.image} alt={scene.description ?? scene.title} width={760} height={760} /> : <span><Images /><small>Beeld nog niet aanwezig</small></span>}
              <div><small>{scene.id}</small><strong>{scene.title}</strong>{scene.words && <em>{scene.words.join(' · ')}</em>}</div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
