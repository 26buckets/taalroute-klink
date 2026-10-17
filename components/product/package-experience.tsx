'use client';

import { PackageExerciseBrowser } from '@/components/product/package-exercise-browser';
import { playMedia, stopMedia } from '@/components/product/shared';
import { exercisesForLesson, lessonPreviewWords } from '@/lib/taalroute-packages';
import { learnerListName } from '@/lib/learner-copy';
import {
  contentPackages,
  getPackage,
  wordLabel,
  type PackageDefinition,
  type PackageExercise,
  type PackageId,
  type PackageLesson,
  type AudioPlayer,
  type LessonPosition,
  type PracticeAttempt,
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
  { id: 'media', label: 'Foto en geluid', icon: Images },
];

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
        Terug
      </button>
      <header className="package-library-heading">
        <div>
          <h1>Alle lijsten</h1>
          <p>{contentPackages.length} lijsten · {contentPackages.reduce((sum, pack) => sum + pack.lessons.length, 0)} lessen</p>
        </div>
      </header>

      <PackageGrid onOpen={onOpen} />
    </div>
  );
}

export function PackageGrid({ onOpen }: { onOpen: (id: PackageId) => void }) {
  return <section className="cp-package-grid" aria-label="Alle lijsten">
        {contentPackages.map((pack, index) => {
          const preview = pack.lessons.flatMap(lesson => lessonPreviewWords(pack, lesson)).filter((word, i, all) => all.findIndex(item => item.id === word.id) === i).slice(0, 3);
          const image = preview.find(word => word.image)?.image;
          return <button key={pack.id} className="cp-photo-section" onClick={() => onOpen(pack.id)} aria-label={`Lijst ${index + 1}: ${learnerListName(pack)}, ${pack.lessons.length} lessen`}>
            <span className="cp-section-photo">
              {image ? <Image src={image} alt="" width={240} height={200} /> : <BookOpen aria-hidden="true" />}
            </span>
            <span className="cp-package-copy">
              <small>Lijst {index + 1}</small>
              <strong>{learnerListName(pack)}</strong>
              <span>{pack.lessons.length} lessen · {pack.counts.coreWords} woorden</span>
              <span className="cp-section-open">Open <ArrowRight aria-hidden="true" /></span>
            </span>
          </button>;
        })}
      </section>;
}

export function PackagePlayer({
  packageId,
  onClose,
  savedWordIds,
  onToggleWord,
  onToast,
  initialPosition,
  onPosition,
  onLessonDone,
  onAttempt,
}: {
  packageId: PackageId;
  onClose: () => void;
  savedWordIds: string[];
  onToggleWord: (wordId: string) => void;
  onToast: (message: string) => void;
  initialPosition?: LessonPosition;
  onPosition?: (position: LessonPosition) => void;
  onLessonDone?: (lessonId: string) => void;
  onAttempt?: (attempt: PracticeAttempt) => void;
}) {
  const pack = getPackage(packageId);
  const [tab, setTab] = useState<PackageTab>('lessons');
  useEffect(() => { stopMedia(); return stopMedia; }, [tab, packageId]);

  async function playAudio(source?: string, options?: Parameters<AudioPlayer>[1]) {
    if (!source) {
      onToast('Bij dit woord is nog geen geluid beschikbaar. Vraag je docent om hulp.');
      return false;
    }
    try {
      return await playMedia(source, options);
    } catch {
      if (!options) onToast('Het geluid kon niet worden afgespeeld. Probeer de knop nog een keer.');
      return false;
    }
  }

  return (
    <div className="cp-player">
      <header className="cp-player-bar">
        <button onClick={onClose} aria-label="Terug naar lessen"><ArrowLeft /></button>
        <div>
          <span>{pack.level}</span>
          <strong>{learnerListName(pack)}</strong>
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
        {tab === 'lessons' && <PackageLessons pack={pack} onAudio={playAudio} initialPosition={initialPosition} onPosition={onPosition} onLessonDone={onLessonDone} onAttempt={onAttempt} />}
        {tab === 'practice' && <PackagePractice pack={pack} onAudio={playAudio} />}
        {tab === 'texts' && <PackageTexts pack={pack} onAudio={playAudio} />}
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
          <h1>{learnerListName(pack)}</h1>
          <p>Kijk. Luister. Doe mee.</p>
          <div className="cp-hero-actions">
            <button className="accent-button" onClick={() => onTab('lessons')}>Bekijk de lessen<ArrowRight /></button>
            <button className="dark-secondary-button" onClick={() => onTab('words')}>Bekijk alle woorden</button>
          </div>
        </div>
        <div className="cp-count-grid">
          <Count value={pack.counts.lessons} label="lessen" />
          <Count value={pack.counts.coreWords} label="woorden" />
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

function PackageLessons({ pack, onAudio, initialPosition, onPosition, onLessonDone, onAttempt }: { pack: PackageDefinition; onAudio: AudioPlayer; initialPosition?: LessonPosition; onPosition?: (position: LessonPosition) => void; onLessonDone?: (lessonId: string) => void; onAttempt?: (attempt: PracticeAttempt) => void }) {
  const [selectedLessonId, setSelectedLessonId] = useState(initialPosition?.packageId === pack.id ? initialPosition.lessonId : '');
  const [resumeId, setResumeId] = useState(initialPosition?.exerciseId);
  const selectedLesson = pack.lessons.find((lesson) => lesson.id === selectedLessonId);

  if (selectedLesson) {
    const exercises = lessonExercises(pack, selectedLesson);
    const lessonNumber = pack.lessons.findIndex((lesson) => lesson.id === selectedLesson.id) + 1;
    const label = lessonPreviewWords(pack, selectedLesson).map(wordLabel).join(' · ') || `Les ${lessonNumber}`;
    const following = pack.lessons[lessonNumber];
    return (
      <section className="cp-panel cp-lesson-player">
        <button className="text-back" aria-label="Terug naar alle lessen" onClick={() => setSelectedLessonId('')}><ArrowLeft />Alle lessen</button>
        <div className="cp-lesson-launch">
          <span className="cp-lesson-number">{String(lessonNumber).padStart(2, '0')}</span>
          <div><small>Les {lessonNumber} van {pack.lessons.length}</small><h1>{label}</h1></div>
        </div>
        <PackageExerciseBrowser
          key={selectedLesson.id}
          pack={pack}
          exercises={exercises}
          guided
          initialExerciseId={resumeId}
          onPosition={exerciseId => onPosition?.({ packageId: pack.id, lessonId: selectedLesson.id, exerciseId })}
          onLessonDone={() => onLessonDone?.(selectedLesson.id)}
          onAttempt={onAttempt}
          completeLabel={following ? 'Volgende les' : 'Alle lessen'}
          onComplete={() => { setResumeId(undefined); setSelectedLessonId(following?.id ?? ''); }}
          onAudio={onAudio}
          eyebrow={`Les ${lessonNumber}`}
          title={`Oefen met ${label}`}
          description="Kijk, luister, kies en bouw het woord."
        />
      </section>
    );
  }

  return (
    <section className="cp-panel cp-lesson-picker">
      <header className="cp-panel-heading">
        <h1>Lessen</h1>
      </header>
      <div className="cp-lesson-list">
        {pack.lessons.map((lesson, index) => {
          const words = lessonPreviewWords(pack, lesson);
          const label = words.map(wordLabel).join(' · ') || `Les ${index + 1}`;
          return <article key={lesson.id}>
            <span className="cp-lesson-number" aria-label={`Les ${index + 1}`}>{index + 1}</span>
            <div className="cp-lesson-preview">
              {words[0]?.image && <Image src={words[0].image} alt="" width={80} height={80} />}
              <h2>{label}</h2>
            </div>
            <button className="primary-button cp-start-lesson" aria-label={`Start les ${index + 1}: ${label}`} onClick={() => { setResumeId(undefined); setSelectedLessonId(lesson.id); }}>Start<ArrowRight aria-hidden="true" /></button>
          </article>
        })}
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

function PackageTexts({ pack, onAudio }: { pack: PackageDefinition; onAudio: AudioPlayer }) {
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><h1>Luister en lees mee</h1></div>
        <span className="cp-panel-count"><strong>{pack.texts.length}</strong><small>teksten</small></span>
      </header>
      <div className="cp-reading-list">
        {pack.texts.map((text, index) => (
          <details key={text.id} open={index === 0}>
            <summary><span>{String(index + 1).padStart(2, '0')}</span><div><small>{text.level.replaceAll('_', ' ')}</small><strong>{text.title}</strong></div><ArrowRight /></summary>
            <div className="cp-reading-copy">{text.audio && <button className="secondary-button" onClick={() => onAudio(text.audio)}><Volume2 />Luister</button>}<p>{text.text}</p>{text.question && <aside><strong>{text.question}</strong><span>Antwoord: {text.answer}</span></aside>}</div>
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
