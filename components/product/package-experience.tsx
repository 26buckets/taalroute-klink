'use client';
import { WordPlaceholder } from './word-placeholder';

import { wordWithArticle } from '@/lib/word-articles';

import { PackageExerciseBrowser } from '@/components/product/package-exercise-browser';
import { PackageMixedPractice } from '@/components/product/package-mixed-practice';
import { PackageGroupPractice } from '@/components/product/package-group-practice';
import { levelLabel, type ContentSelection } from '@/lib/content-levels';
import { MyRoute, useRouteSettings } from './route-settings';
import { contextReadiness, lessonContentLevel, lessonWordIds, readinessLabels, type ContentReadiness } from '@/lib/learner-route';
import { playMedia, stopMedia } from '@/components/product/shared';
import { exercisesForLesson, lessonPreviewWords } from '@/lib/taalroute-packages';
import { nextLessonPosition } from '@/lib/learner-progress';
import { learnerListName } from '@/lib/learner-copy';
import sectionPhotos from '@/data/klink-section-photos.json';
import {
  lessonPackages,
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
  MessageCircle,
  Route,
  Shapes,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from './compact-image';
import { useEffect, useState } from 'react';

type PackageTab =
  | 'words'
  | 'lessons'
  | 'practice'
  | 'mixed'
  | 'use';

const tabLabels: { id: PackageTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'words', label: 'Woorden', icon: WholeWord },
  { id: 'lessons', label: 'Stap voor stap', icon: Route },
  { id: 'practice', label: 'Oefenen met deze woorden', icon: Shapes },
  { id: 'use', label: 'Gebruiken', icon: MessageCircle },
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
      <header className="cp-context-header">
        <button onClick={onBack} aria-label="Terug"><ArrowLeft /></button>
        <h1>Oefenen met woorden</h1>
        <small className="cp-context-meta">{lessonPackages.length} onderdelen · {lessonPackages.reduce((sum, pack) => sum + pack.lessons.length, 0)} lessen</small>
      </header>
      <div className="cp-page-workspace"><PackageGrid onOpen={onOpen} /></div>
    </div>
  );
}

export function PackageGrid({ onOpen }: { onOpen: (id: PackageId) => void }) {
  return <section className="cp-package-grid" aria-label="Oefenen met woorden">
        {lessonPackages.map((pack, index) => {
          // Navigation scenes are separate from the meaning images used in exercises.
          const image = (sectionPhotos as Record<string, string>)[pack.id] ?? pack.cover?.image;
          return <button key={pack.id} className="cp-photo-section" onClick={() => onOpen(pack.id)} aria-label={`Onderdeel ${index + 1}: ${learnerListName(pack)}, ${pack.lessons.length} lessen`}>
            <span className="cp-section-photo">
              {image ? <Image src={image} alt="" width={720} height={720} sizes="(max-width: 480px) 50vw, 200px" /> : <BookOpen aria-hidden="true" />}
            </span>
            <span className="cp-package-copy">
              <small aria-hidden="true">{index + 1}</small>
              <strong>{learnerListName(pack)}</strong>
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
  onOpenLesson,
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
  onOpenLesson?: (position: LessonPosition) => void;
  onAttempt?: (attempt: PracticeAttempt) => void;
}) {
  const pack = getPackage(packageId);
  const { settings } = useRouteSettings();
  const [tab, setTab] = useState<PackageTab>(initialPosition ? 'lessons' : 'words');
  const [localSelection, setSelection] = useState<ContentSelection>();
  const selection = localSelection ?? { level: settings.literacy };
  const [lessonId, setLessonId] = useState(initialPosition?.packageId === pack.id ? initialPosition.lessonId : '');
  const lesson = pack.lessons.find(item => item.id === lessonId);
  useEffect(() => { stopMedia(); return stopMedia; }, [tab, packageId, selection.level, selection.help]);

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
      <header className="cp-player-bar cp-context-header">
        <button onClick={onClose} aria-label="Terug naar lessen" title="Terug naar lessen"><ArrowLeft /></button>
        <h1><strong>{learnerListName(pack)}</strong></h1>
        <small className="cp-context-meta">Woorden · {pack.level}</small>
      </header>

      <nav className="cp-tabs" aria-label="Onderdelen">
        {tabLabels.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} aria-current={tab === item.id || (tab === 'mixed' && item.id === 'practice') ? 'page' : undefined} className={tab === item.id || (tab === 'mixed' && item.id === 'practice') ? 'active' : ''} onClick={() => setTab(item.id)}>
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="cp-content">
        <MyRoute axis={tab === 'use' ? undefined : 'literacy'} selection={tab === 'practice' ? selection : undefined} onChange={() => setSelection(undefined)} onSelectionChange={tab === 'practice' ? setSelection : undefined} />
        {['practice', 'use'].includes(tab) && <label className="cp-step-scope">Oefenen met<select value={lessonId} onChange={event => { stopMedia(); setLessonId(event.target.value); }}><option value="">Alle woorden van dit onderdeel</option>{pack.lessons.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {lessonPreviewWords(pack, item).map(wordLabel).join(' · ')}</option>)}</select></label>}
        {tab === 'words' && (
          <PackageWords
            pack={pack}
            savedWordIds={savedWordIds}
            onToggleWord={onToggleWord}
            onAudio={playAudio}
            onPractice={() => setTab('practice')}
          />
        )}
        {tab === 'lessons' && <PackageLessons pack={pack} onAudio={playAudio} initialPosition={initialPosition} onPosition={onPosition} onLessonDone={onLessonDone} onOpenLesson={onOpenLesson} onAttempt={onAttempt} onMixed={() => setTab('practice')} selectedLessonId={lessonId} onSelectLesson={setLessonId} />}
        {tab === 'mixed' && <PackageMixedPractice pack={pack} onAudio={playAudio} onBack={() => setTab('practice')} onAttempt={onAttempt} />}
        {tab === 'practice' && <PackageGroupPractice key={`${selection.level}:${selection.help}:${lessonId}`} pack={pack} onAudio={playAudio} onAttempt={onAttempt} selection={selection} wordIds={lesson ? lessonWordIds(pack, lesson) : undefined} scopeId={lessonId} onUse={() => setTab('use')} onMixed={() => setTab('mixed')} />}
        {tab === 'use' && <PackageUse key={`${lessonId}:${settings.language}`} pack={pack} onAudio={playAudio} onAttempt={onAttempt} lesson={lesson} />}
      </div>
    </div>
  );
}


function PackageWords({ pack, savedWordIds, onToggleWord, onAudio, onPractice }: { pack: PackageDefinition; savedWordIds: string[]; onToggleWord: (wordId: string) => void; onAudio: (source?: string) => void; onPractice: () => void }) {
  return (
    <section className="cp-panel">
      <header className="cp-panel-heading">
        <div><h1 className="sr-only">Alle woorden</h1></div>
        <button className="primary-button" onClick={onPractice}>Oefenen met deze woorden<ArrowRight /></button>
      </header>
      <div className="cp-word-grid">
        {pack.words.map((word) => {
          const saved = savedWordIds.includes(word.id);
          return (
            <article key={word.id}>
              <button className="cp-package-word-listen" disabled={!word.audio} onClick={() => onAudio(word.audio)} aria-describedby={wordWithArticle(word) ? `article-package-${word.id}` : undefined} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen.`}>
              <div className="cp-word-image">
                {word.image ? <Image src={word.image} alt="" width={760} height={760} fallbackWord={wordLabel(word)} placeholderClassName="klink-package-placeholder" /> : <WordPlaceholder word={wordLabel(word)} className="klink-package-placeholder" decorative />}
              </div>
              <div className="cp-word-copy">
                <strong>{wordLabel(word)}</strong>{wordWithArticle(word) && <small id={`article-package-${word.id}`} className="cp-word-article">{wordWithArticle(word)}</small>}
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

function PackageLessons({ pack, onAudio, initialPosition, onPosition, onLessonDone, onOpenLesson, onAttempt, onMixed, selectedLessonId, onSelectLesson: setSelectedLessonId }: { pack: PackageDefinition; onAudio: AudioPlayer; initialPosition?: LessonPosition; onPosition?: (position: LessonPosition) => void; onLessonDone?: (lessonId: string) => void; onOpenLesson?: (position: LessonPosition) => void; onAttempt?: (attempt: PracticeAttempt) => void; onMixed: () => void; selectedLessonId: string; onSelectLesson: (id: string) => void }) {
  const { settings } = useRouteSettings();
  const lessons = pack.lessons.filter(item => settings.literacy === 'all' || lessonContentLevel(pack, item) === settings.literacy);
  const [playing, setPlaying] = useState(Boolean(initialPosition && initialPosition.lessonId === selectedLessonId));
  const [resumeId, setResumeId] = useState(initialPosition?.exerciseId);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);

  if (selectedLesson && playing) {
    const exercises = lessonExercises(pack, selectedLesson);
    const lessonNumber = pack.lessons.findIndex((lesson) => lesson.id === selectedLesson.id) + 1;
    const label = lessonPreviewWords(pack, selectedLesson).map(wordLabel).join(' · ') || `Les ${lessonNumber}`;
    const following = lessons[lessons.indexOf(selectedLesson) + 1];
    const nextPosition = !following && onOpenLesson ? nextLessonPosition(lessonPackages, pack.id, selectedLesson.id) : undefined;
    const nextPack = lessonPackages.find(item => item.id === nextPosition?.packageId);
    const nextLesson = nextPack?.lessons.find(item => item.id === nextPosition?.lessonId);
    const continuation = nextPack && nextLesson && (settings.literacy === 'all' || lessonContentLevel(nextPack, nextLesson) === settings.literacy) ? nextPosition : undefined;
    const nextLabel = continuation ? lessonPreviewWords(nextPack!, nextLesson!).map(wordLabel).join(' · ') : '';
    return (
      <section className="cp-panel cp-lesson-player">
        <header className="cp-context-header">
          <button className="text-back" aria-label="Terug naar alle lessen" title="Terug naar alle lessen" onClick={() => { stopMedia(); setPlaying(false); }}><ArrowLeft /></button>
          <div className="cp-lesson-launch"><h1>{label}</h1></div>
          <small className="cp-context-meta">Les {lessonNumber} van {pack.lessons.length}</small>
        </header>
        <PackageExerciseBrowser
          key={selectedLesson.id}
          pack={pack}
          exercises={exercises}
          guided
          initialExerciseId={resumeId}
          onPosition={exerciseId => onPosition?.({ packageId: pack.id, lessonId: selectedLesson.id, exerciseId })}
          onLessonDone={() => onLessonDone?.(selectedLesson.id)}
          onAttempt={onAttempt}
          completeLabel={following ? 'Volgende les' : continuation ? `Verder met ${nextLabel}` : 'Alle lessen'}
          onComplete={() => { setResumeId(undefined); if (following) setSelectedLessonId(following.id); else if (continuation) onOpenLesson?.(continuation); else setPlaying(false); }}
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
        <h1 className="sr-only">Stap voor stap</h1>
        <button className="secondary-button cp-open-mixed" onClick={onMixed}><Shapes aria-hidden="true" />Oefenen met deze woorden<ArrowRight aria-hidden="true" /></button>
      </header>
      <div className="cp-lesson-list">
        {!lessons.length && <output>Bij deze route zijn hier nog geen leesstappen ingedeeld. Kies samen met je docent bij Lezen bovenaan.</output>}
        {lessons.map((lesson) => {
          const index = pack.lessons.indexOf(lesson);
          const words = lessonPreviewWords(pack, lesson);
          const label = words.map(wordLabel).join(' · ') || `Les ${index + 1}`;
          return <article key={lesson.id}>
            <span className="cp-lesson-number" aria-label={`Les ${index + 1}`}>{index + 1}</span>
            <div className="cp-lesson-preview">
              {words[0]?.image && <Image src={words[0].image} alt="" width={80} height={80} />}
              <h2>{label}</h2>
            </div>
            <button className="primary-button cp-start-lesson" aria-label={`Start les ${index + 1}: ${label}`} onClick={() => { setResumeId(undefined); setSelectedLessonId(lesson.id); setPlaying(true); }}>Start<ArrowRight aria-hidden="true" /></button>
          </article>
        })}
      </div>
    </section>
  );
}

function PackageUse({ pack, onAudio, onAttempt, lesson }: { pack: PackageDefinition; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; lesson?: PackageLesson }) {
  const { settings } = useRouteSettings();
  const [kind, setKind] = useState<'sentence' | 'text' | 'dialogue' | 'scene'>('sentence');
  const [readiness, setReadiness] = useState<ContentReadiness>('guided');
  const [selectedId, setSelectedId] = useState('');
  const [practicing, setPracticing] = useState(false);
  const sources = [...pack.texts.map(item => ({ ...item, kind: item.kind ?? 'text' })), ...pack.dialogues.map(item => ({ ...item, kind: 'dialogue' }))];
  const items = sources.filter(item => item.kind === kind && (!lesson || item.lessonIds?.includes(lesson.id))).map(item => ({ ...item, placement: contextReadiness(item.id, pack, lesson, settings), exercise: pack.exercises.find(exercise => exercise.contextId === item.id && (!lesson || exercise.lessonId === lesson.id)) })).filter(item => item.exercise);
  const visible = items.filter(item => item.placement.status === readiness);
  const records = visible.map(item => item.exercise!);
  function changeKind(next: typeof kind) { stopMedia(); setSelectedId(''); setPracticing(false); setKind(next); }
  if (selectedId && records.some(item => item.exerciseId === selectedId)) return <section className="cp-panel cp-use-player">
    <button className="text-back" onClick={() => { stopMedia(); setSelectedId(''); }}><ArrowLeft />Gebruiken</button>
    <p>Met de docent{readiness === 'later' ? ' · eerst samen voorbereiden' : ''}.</p>
    <PackageExerciseBrowser key={selectedId} pack={pack} exercises={records} initialExerciseId={selectedId} onAudio={onAudio} onAttempt={onAttempt} title="Luister en lees mee" description="" />
  </section>;
  return <section className="cp-panel cp-package-use" data-package-use>
    <header className="cp-panel-heading"><h1 className="sr-only">Gebruiken</h1></header>
    <div className="cp-chapter-levels" aria-label="Wat wil je gebruiken?">{([['sentence', 'Zinnen', FileText], ['text', 'Teksten en verhalen', BookOpen], ['dialogue', 'Gesprekken', MessageCircle], ['scene', 'Situaties', Images]] as const).map(([id, label, Icon]) => <button className="secondary-button" key={id} aria-pressed={kind === id} onClick={() => changeKind(id)}><Icon aria-hidden="true" />{label}</button>)}</div>
    {kind === 'scene' ? <PackageScenes pack={pack} /> : <>
      <fieldset className="cp-chapter-levels"><legend className="sr-only">Wanneer oefenen?</legend>{(Object.keys(readinessLabels) as ContentReadiness[]).map(id => <button key={id} className="secondary-button" aria-pressed={readiness === id} onClick={() => { stopMedia(); setReadiness(id); }}>{readinessLabels[id]} <span aria-label="bronnen">({items.filter(item => item.placement.status === id).length})</span></button>)}</fieldset>
      {readiness === 'later' && <p>Eerst met de docent kiezen en voorbereiden. Deze inhoud is nog geen volgende zelfstandige leesopdracht.</p>}
      <button className="secondary-button" aria-pressed={practicing} onClick={() => { stopMedia(); setPracticing(value => !value); }}>{practicing ? 'Bekijk de bronnen' : 'Oefenen met zinnen en situaties'}<Shapes /></button>
      {practicing ? <PackageGroupPractice key={`${readiness}:${settings.language}`} pack={pack} onAudio={onAudio} onAttempt={onAttempt} scopeId={lesson?.id} usage={{ lesson, settings, readiness }} /> : <>
        <div className="cp-reading-list">{visible.map(item => <button className="secondary-button" key={item.id} data-content-id={item.id} onClick={() => setSelectedId(item.exercise!.exerciseId)}><span>{item.title}<small className="cp-content-level-label">{levelLabel(item.placement.level)} · Met de docent</small></span><ArrowRight aria-hidden="true" /></button>)}</div>
        {!visible.length && <output>{readiness === 'independent' ? 'Er is hier nog geen tekst vrijgegeven voor zelfstandig lezen. Kijk samen met je docent bij de andere opdrachten.' : 'Voor deze keuze is hier nog geen inhoud voorbereid. Bekijk met je docent de andere mogelijkheden.'}</output>}
      </>}
    </>}
  </section>;
}

function PackageScenes({ pack }: { pack: PackageDefinition }) {
  return <section className="cp-scene-gallery"><header><h2>Bekijk de situaties</h2><p>Bekijk en bespreek de foto met je docent.</p></header>
    <div>{pack.scenes.filter(scene => scene.image).map(scene => <article key={scene.id}><Image src={scene.image!} alt={scene.description ?? scene.title} width={760} height={760} /><div><strong>{scene.title}</strong>{scene.words && <em>{scene.words.join(' · ')}</em>}</div></article>)}</div>
    {!pack.scenes.some(scene => scene.image) && <p>Bij dit onderdeel is nog geen situatiebeeld beschikbaar.</p>}
  </section>;
}
