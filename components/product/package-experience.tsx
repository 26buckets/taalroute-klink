'use client';

import { PackageExerciseBrowser } from '@/components/product/package-exercise-browser';
import { playMedia, stopMedia } from '@/components/product/shared';
import { exercisesForLesson } from '@/lib/taalroute-packages';
import {
  contentPackages,
  getPackage,
  wordLabel,
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
  FileText,
  Images,
  Layers3,
  ListChecks,
  MessageCircle,
  PackageOpen,
  Route,
  Shapes,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

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
          <h1>Kies een bouwgroep</h1>
          <p>
            Open een bouwgroep en kies een leesstap. De routes voor langere woorden
            en de voorbereiding staan daaronder.
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
              <strong>{pack.kind === 'group' ? `Groep ${index + 1}` : 'Verder lezen'}</strong>
              <small>{pack.kind === 'group' ? 'Bouwgroep' : pack.kind === 'route' ? 'Leesroute' : 'Voorbereiden'}</small>
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

      <section className="cp-roadmap" aria-label="De Taalroute-opbouw">
        <div>
          <span className="eyebrow">Reeks</span>
          <h2>Van bekende woorden naar een nieuwe leesstap</h2>
          <p>37 leesstappen en 3 herhaalmomenten vormen de basis. Uitbreidingswoorden en langere woorden blijven afzonderlijk te kiezen.</p>
        </div>
        <div>
          {['Bekende woorden', 'Nieuwe woorden', 'Woorden die terugkomen'].map(label => <span key={label}>{label}</span>)}
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
  useEffect(() => { stopMedia(); return stopMedia; }, [tab, packageId]);

  async function playAudio(source?: string) {
    if (!source) {
      onToast('Bij dit woord is nog geen geluid beschikbaar. Vraag je docent om hulp.');
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
          <span>{pack.level}</span>
          <strong>{pack.title}</strong>
        </div>
      </header>

      <nav className="cp-tabs" aria-label="Onderdelen">
        {tabLabels.filter(item => item.id !== 'texts' || pack.texts.length > 0).filter(item => item.id !== 'dialogues' || pack.dialogues.length > 0).filter(item => item.id !== 'media' || pack.words.some(word => word.image || word.audio) || pack.scenes.some(scene => scene.image)).map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} aria-current={tab === item.id ? 'page' : undefined} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="cp-content">
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
      </div>
    </div>
  );
}

function PackageOverview({ pack, onTab }: { pack: PackageDefinition; onTab: (tab: PackageTab) => void }) {
  return (
    <div className="cp-overview">
      <section className="cp-hero">
        <div>
          <span className="eyebrow light">Klink</span>
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
          {pack.counts.texts > 0 && <Count value={pack.counts.texts} label="teksten" />}
          {pack.counts.dialogues > 0 && <Count value={pack.counts.dialogues} label="gesprekken" />}
          {pack.counts.games > 0 && <Count value={pack.counts.games} label={pack.counts.games === 1 ? 'spel' : 'spellen'} />}
        </div>
      </section>

      <section className="cp-section-heading">
        <div><span className="eyebrow">Oefenen</span><h2>Wat wil je doen?</h2></div>
      </section>
      <section className="cp-overview-cards">
        <OverviewCard icon={Route} value={pack.counts.lessons} title="Lessen" text="Kijk, luister, kies en bouw het woord." onClick={() => onTab('lessons')} />
        <OverviewCard icon={WholeWord} value={pack.words.length} title="Woorden" text="Bekijk en beluister de woorden." onClick={() => onTab('words')} />
        <OverviewCard icon={Shapes} value={pack.counts.exercises} title="Oefeningen" text="Kies wat je wilt oefenen." onClick={() => onTab('practice')} />
        {pack.texts.length > 0 && <OverviewCard icon={FileText} value={pack.counts.texts} title="Teksten" text="Lees een korte tekst." onClick={() => onTab('texts')} />}
        {pack.dialogues.length > 0 && <OverviewCard icon={MessageCircle} value={pack.counts.dialogues} title="Gesprekken" text="Lees een gesprek." onClick={() => onTab('dialogues')} />}
        {pack.counts.images > 0 && <OverviewCard icon={Images} value={pack.counts.images} title="Beelden" text="Bekijk de beelden bij de woorden." onClick={() => onTab('media')} />}
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
        <div><span className="eyebrow">Woorden</span><h1>De woorden bij deze lessen</h1><p>Tik op het woord of de foto om te luisteren. Bewaar woorden om ze later te oefenen.</p></div>
        <span className="cp-panel-count"><strong>{pack.words.length}</strong><small>woorden</small></span>
      </header>
      <div className="cp-word-grid">
        {pack.words.map((word) => {
          const saved = savedWordIds.includes(word.id);
          return (
            <article key={word.id}>
              <button className="cp-package-word-listen" disabled={!word.audio} onClick={() => onAudio(word.audio)} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen.`}>
              <div className="cp-word-image">
                {word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span>{word.word.slice(0, 1)}</span>}
              </div>
              <div className="cp-word-copy">
                <strong>{wordLabel(word)}</strong>
                <span>{word.segmentation.replaceAll('|', ' · ')}</span>
                {!word.audio && <span>Lees samen</span>}
              </div>
              <span className="cp-listen-label">{word.audio && <><Volume2 /> Luister</>}</span>
              </button>
              <button className={`cp-save-button ${saved ? 'saved' : ''}`} onClick={() => onToggleWord(word.id)} aria-pressed={saved} aria-label={`${wordLabel(word)} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}<span>{saved ? 'Bewaard' : 'Bewaar'}</span></button>
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
  if (lesson.guidedExerciseIds) return exercisesForLesson(pack, lesson);
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
          <div><small>Les {lessonNumber}</small><h1>{selectedLesson.title}</h1><p>{selectedLesson.words.join(' · ')}</p></div>
        </div>
        <PackageExerciseBrowser
          key={selectedLesson.id}
          pack={pack}
          exercises={exercises}
          guided
          onComplete={() => setSelectedLessonId('')}
          onAudio={onAudio}
          eyebrow={`Les ${lessonNumber}`}
          title={`Oefen met ${selectedLesson.title}`}
          description="Kijk, luister, kies en bouw het woord."
        />
      </section>
    );
  }

  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">Lessen</span><h1>Kies een les en begin</h1><p>Tik op Start les.</p></div>
        <span className="cp-panel-count"><strong>{pack.lessons.length}</strong><small>lessen</small></span>
      </header>
      <div className="cp-lesson-list">
        {pack.lessons.map((lesson, index) => (
          <article key={lesson.id}>
            <span className="cp-lesson-number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <small>{lesson.kind === 'uitbreiding' ? 'Uitbreiding' : lesson.kind === 'woord' ? 'Verder oefenen' : lesson.kind === 'herhaalronde' ? 'Herhalen' : 'Leesstap'}</small>
              <h2>{lesson.title}</h2>
              {lesson.newWords ? <div className="cp-word-chips">{[['Bekend', lesson.known ?? []], ['Nieuw', lesson.newWords], ['Komt terug', lesson.returning ?? []]].map(([label, ids]) => <span key={label as string}><b>{label as string}: </b>{(ids as string[]).map(id => pack.words.find(word => word.id === id)?.word).join(' · ') || '—'}</span>)}</div> : <div className="cp-word-chips">{lesson.words.map(word => <span key={word}>{word}</span>)}</div>}
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
  return (
    <section className="cp-panel">
      <PackageExerciseBrowser pack={pack} onAudio={onAudio} title="Vrij oefenen" description="Kies wat je wilt oefenen." />
    </section>
  );
}

function PackageTexts({ pack }: { pack: PackageDefinition }) {
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">Teksten</span><h1>Lees een tekst</h1><p>Kies een tekst.</p></div>
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
        <div><span className="eyebrow">Gesprekken</span><h1>Lees een gesprek</h1><p>Kies een gesprek.</p></div>
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
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><span className="eyebrow">Beeld en audio</span><h1>Kijk en luister</h1><p>Tik op het woord of de foto om te luisteren.</p></div>
      </header>
      <div className="cp-word-grid">
        {pack.words.filter(word => word.image || word.audio).map(word => <article key={word.id}>
          <button className="cp-package-word-listen" disabled={!word.audio} onClick={() => onAudio(word.audio)} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen.`}>
            {word.image && <div className="cp-word-image"><Image src={word.image} alt={word.meaning ?? word.word} width={760} height={760} /></div>}
            <div className="cp-word-copy"><strong>{wordLabel(word)}</strong></div>
            <span className="cp-listen-label">{word.audio ? <><Volume2 /> Luister</> : 'Lees samen'}</span>
          </button>
        </article>)}
      </div>
      {pack.scenes.some(scene => scene.image) && <section className="cp-scene-gallery">
        <header><h2>Bekijk de situaties</h2></header>
        <div>
          {pack.scenes.filter(scene => scene.image).map((scene) => (
            <article key={scene.id}>
              <Image src={scene.image!} alt={scene.description ?? scene.title} width={760} height={760} />
              <div><strong>{scene.title}</strong>{scene.words && <em>{scene.words.join(' · ')}</em>}</div>
            </article>
          ))}
        </div>
      </section>}
    </section>
  );
}
