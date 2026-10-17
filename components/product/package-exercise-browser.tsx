'use client';

/* oxlint-disable jsx-a11y/media-has-caption -- Eigen oefenopnames hebben geen afzonderlijk ondertitelspoor. */

import type {
  ExerciseImage,
  PackageDefinition,
  PackageExercise,
  AudioPlayer,
  PracticeAttempt,
} from '@/lib/package-content';
import { exerciseHelp } from '@/lib/lesson-plan';
import { learnerExerciseNames, learnerPhaseNames } from '@/lib/learner-copy';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  FileText,
  Mic,
  Pause,
 Play,
  PencilLine,
  RefreshCw,
  RotateCcw,
  Shapes,
  Volume2,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { stopMedia } from '@/components/product/shared';

type ResultState = 'idle' | 'right' | 'wrong';
type ChoiceOption = { id: string; label?: string; grapheme?: string; image?: ExerciseImage; audio?: unknown };
type Tile = { id: string; token: string };
type TextField = { id: string; acceptedAnswers?: string[] };
type ExerciseItem = { itemId: string; text?: string; content?: CardContent; pairKey?: string };
type CardContent = { text?: string; image?: ExerciseImage };

const normalize = (value: string) => value.trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/, '');
const asArray = <T,>(value: unknown) => (Array.isArray(value) ? value as T[] : []);
const asRecord = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const asString = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? `${value}` : '';
const instructionMemoryKey = 'klink.instructies.v1';
function previousInstructions(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(instructionMemoryKey) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string' && item.startsWith('/package-audio/instructions/')) : []);
  } catch { return new Set(); }
}

function exerciseImage(exercise: PackageExercise) {
  if (exercise.prompt?.image) return exercise.prompt.image;
  const direct = asRecord(exercise.image);
  if (direct.assetId || direct.src) return direct as ExerciseImage;
  const stimulus = asRecord(exercise.stimulus);
  const image = asRecord(stimulus.image);
  return image.assetId || image.src ? image as ExerciseImage : undefined;
}

function findAudioSource(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const source = findAudioSource(item);
      if (source) return source;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.audioId === 'string' && typeof record.src === 'string') return record.src;
  for (const [key, item] of Object.entries(record)) {
    if (key === 'instructionAudio') continue;
    const source = findAudioSource(item);
    if (source) return source;
  }
  return undefined;
}

function containsPublishedImage(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsPublishedImage);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.src === 'string' || Object.entries(record).some(([key, value]) => key !== 'audio' && key !== 'instructionAudio' && containsPublishedImage(value));
}

function representativeIndex(exercises: PackageExercise[], familyId: string) {
  const records = exercises.filter((exercise) => exercise.componentId === familyId);
  const visualIndex = records.findIndex(containsPublishedImage);
  return visualIndex >= 0 ? visualIndex : 0;
}

export function PackageExerciseBrowser({
  pack,
  onAudio,
  exercises = pack.exercises,
  guided = false,
  eyebrow = 'Oefenen',
  title = 'Kies een oefening',
  description = 'Kijk, luister en oefen.',
  onComplete,
  completeLabel = 'Terug naar de lessen',
  initialExerciseId,
  onPosition,
  onLessonDone,
  onAttempt,
}: {
  pack: PackageDefinition;
  onAudio: AudioPlayer;
  exercises?: PackageExercise[];
  guided?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  onComplete?: () => void;
  completeLabel?: string;
  initialExerciseId?: string;
  onPosition?: (exerciseId: string) => void;
  onLessonDone?: () => void;
  onAttempt?: (attempt: PracticeAttempt) => void;
}) {
  const exerciseTypes = pack.exerciseTypes
    .map((type) => ({ ...type, label: learnerExerciseNames[type.id] ?? type.label, count: exercises.filter((exercise) => exercise.componentId === type.id).length }))
    .filter((type) => type.count > 0);
  const initialExercise = exercises.find(item => item.exerciseId === initialExerciseId) ?? exercises[0];
  const initialFamilyId = (guided ? initialExercise?.componentId : exerciseTypes[0]?.id) ?? 'ALF-CMP-001';
  const [familyId, setFamilyId] = useState(initialFamilyId);
  const [recordIndex, setRecordIndex] = useState(() => guided ? Math.max(0, exercises.filter(item => item.componentId === initialFamilyId).findIndex(item => item.exerciseId === initialExercise?.exerciseId)) : representativeIndex(exercises, initialFamilyId));
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<ResultState>('idle');
  const [message, setMessage] = useState('Neem je tijd.');
  const [heard, setHeard] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [holdFeedback, setHoldFeedback] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const [instructionFailed, setInstructionFailed] = useState(false);
  const playback = useRef<AbortController | null>(null);
  const explainedModes = useRef(previousInstructions());
  const metrics = useRef({ started: 0, attempts: 0, helpUsed: false, plays: 0 });
  const reportPosition = useEffectEvent((id: string) => onPosition?.(id));
  const currentId = useRef('');
  const taskHeading = useRef<HTMLHeadingElement>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const records = exercises.filter((exercise) => exercise.componentId === familyId);
  const exercise = records[Math.min(recordIndex, Math.max(0, records.length - 1))] ?? exercises[0];
  const guidedIndex = guided ? exercises.findIndex((item) => item.exerciseId === exercise?.exerciseId) : -1;
  const exerciseId = exercise?.exerciseId ?? '';
  const selfPaced = exercise?.assessment === 'participation' || exercise?.componentId === 'ALF-CMP-001';
  const needsListen = Boolean(exercise?.requiresAudio);
  const canAnswer = !needsListen || heard;
  const automatic = guided && result === 'right' && !selfPaced && !autoPaused && !holdFeedback && !audioPending;
  const stimulus = exercise?.prompt?.audio?.src ?? findAudioSource(exercise?.textBlocks);
  async function listen(source?: string, automaticStart = false) {
    if (!automaticStart && result === 'right') setHoldFeedback(true);
    const id = exercise?.exerciseId;
    playback.current?.abort();
    const controller = new AbortController();
    playback.current = controller;
    const isCurrent = () => currentId.current === id && !controller.signal.aborted;
    setAudioPending(true);
    setAudioError(false);
    try {
      if (exercise.instructionAudio?.src && !explainedModes.current.has(exercise.instructionAudio.src)) {
        setInstructionFailed(true);
        const explained = await onAudio(exercise.instructionAudio.src, { waitUntilEnd: true, signal: controller.signal });
        if (!isCurrent()) return false;
        if (explained === false) throw new Error('instruction unavailable');
        explainedModes.current.add(exercise.instructionAudio.src);
        try { sessionStorage.setItem(instructionMemoryKey, JSON.stringify([...explainedModes.current].slice(-100))); } catch { /* Listening does not depend on storage. */ }
        setInstructionFailed(false);
      }
      if (!source) return true;
      const played = await onAudio(source, { waitUntilEnd: true, signal: controller.signal });
      if (!isCurrent()) return false;
      if (played === false) throw new Error('audio unavailable');
      if (source === stimulus) setHeard(true);
      setAudioError(false);
      metrics.current.plays++;
      if (metrics.current.plays > 1) metrics.current.helpUsed = true;
      return true;
    } catch {
      if (isCurrent()) { setAudioError(true); if (source === stimulus) setHeard(false); }
      return false;
    } finally {
      if (isCurrent()) setAudioPending(false);
    }
  }

  const beginAudio = useEffectEvent(() => {
    if (needsListen || exercise?.mode === 'model' || exercise?.instructionAudio) {
      void listen(needsListen || exercise?.mode === 'model' ? stimulus : undefined, true);
    }
  });
  useEffect(() => {
    stopMedia();
    currentId.current = exerciseId;
    metrics.current = { started: Date.now(), attempts: 0, helpUsed: false, plays: 0 };
    taskHeading.current?.focus({ preventScroll: true });
    if (guided && exerciseId) reportPosition(exerciseId);
    const timer = window.setTimeout(() => beginAudio(), 0);
    return () => { window.clearTimeout(timer); currentId.current = ''; playback.current?.abort(); stopMedia(); };
  }, [exerciseId, guided]);

  function chooseFamily(nextFamilyId: string) {
    if (guided) return;
    setFamilyId(nextFamilyId);
    setRecordIndex(representativeIndex(exercises, nextFamilyId));
    resetExercise();
  }

  function openAt(nextIndex: number) {
    setRecordIndex(Math.max(0, Math.min(records.length - 1, nextIndex)));
    resetExercise();
  }

  function openExercise(exerciseId: string) {
    const target = exercises.find((item) => item.exerciseId === exerciseId);
    if (!target) return;
    const familyRecords = exercises.filter((item) => item.componentId === target.componentId);
    setFamilyId(target.componentId);
    setRecordIndex(Math.max(0, familyRecords.findIndex((item) => item.exerciseId === exerciseId)));
    resetExercise();
  }

  function openGuidedAt(nextIndex: number) {
    const target = exercises[Math.max(0, Math.min(exercises.length - 1, nextIndex))];
    if (target) openExercise(target.exerciseId);
  }

  function resetResult() {
    setResult('idle');
    setMessage('Neem je tijd.');
  }

  function resetExercise() {
    resetResult();
    setHeard(false);
    setAudioError(false);
    setAudioPending(false);
    setInstructionFailed(false);
    setHoldFeedback(false);
  }

  function finish(answer: string, correct: boolean, feedback?: string) {
    if (needsListen && !heard) return;
    if (result === 'right') return;
    metrics.current.attempts++;
    onAttempt?.({ exerciseId: exercise.exerciseId, mode: exercise.mode, answer, correct, attempts: metrics.current.attempts,
      support: typeof exercise.exampleWord === 'string' ? 'model' : metrics.current.helpUsed ? 'requested-help' : 'none',
      helpUsed: metrics.current.helpUsed, elapsedMs: Date.now() - metrics.current.started,
      objective: asString(exercise.objective), assessment: exercise.assessment ?? 'answer' });
    setResult(correct ? 'right' : 'wrong');
    setMessage(feedback ?? (correct
      ? selfPaced ? 'Je hebt geoefend.' : 'Goed gedaan.'
      : exercise.feedback ?? (exercise.mode.startsWith('heard') ? 'Luister nog een keer. Kies dan opnieuw.' : 'Kijk nog een keer. Probeer opnieuw.')));
  }

  function next() {
    if (guided && (!canAnswer || (!selfPaced && result !== 'right'))) return;
    if (guided) {
      if (guidedIndex >= exercises.length - 1) { stopMedia(); setCompleted(true); onLessonDone?.(); }
      else openGuidedAt(guidedIndex + 1);
    } else openAt((recordIndex + 1) % records.length);
  }

  const advanceAfterFeedback = useEffectEvent(() => next());
  useEffect(() => {
    if (!automatic || completed) return;
    const timer = window.setTimeout(() => advanceAfterFeedback(), 650);
    return () => window.clearTimeout(timer);
  }, [automatic, exercise?.exerciseId, completed]);
  useEffect(() => { if (completed) completionHeading.current?.focus({ preventScroll: true }); }, [completed]);

  if (!exercise) return null;
  if (completed) return <section className="honest-empty"><Check /><h2 ref={completionHeading} tabIndex={-1}>Goed geoefend</h2><p>Deze les is klaar.</p><button className="primary-button" onClick={onComplete}>{completeLabel}<ArrowRight /></button></section>;

  const family = pack.exerciseTypes.find((item) => item.id === familyId);
  const modes = records.filter((item, index, all) => all.findIndex(other => other.mode === item.mode) === index);
  return (
    <section className={`cp-exercise-browser ${guided ? 'is-guided' : ''}`} data-exercise-id={exercise.exerciseId} data-answer-hidden={['word-dictation', 'recall-word', 'missing-grapheme'].includes(exercise.mode) ? 'true' : undefined}>
      <header>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>

      <div className="cp-exercise-workspace">
        {!guided && <label className="cp-family-picker">Oefening<select value={familyId} onChange={event => chooseFamily(event.target.value)}>{exerciseTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>}
        <aside aria-label={guided ? 'Stappen van de les' : 'Soort oefening'}>
          {guided ? Object.entries(learnerPhaseNames).filter(([phase]) => exercises.some(item => item.phase === phase)).map(([phase, label]) => <button key={phase} disabled className={exercise.phase === phase ? 'active' : ''} aria-current={exercise.phase === phase ? 'step' : undefined}><span aria-hidden="true">{exercise.phase === phase ? '•' : '–'}</span><span><strong>{label}</strong></span></button>) : exerciseTypes.map((type, index) => (
            <button key={type.id} className={familyId === type.id ? 'active' : ''} disabled={guided} aria-current={familyId === type.id ? 'step' : undefined} onClick={() => chooseFamily(type.id)}>
              <span aria-hidden="true">{guided ? familyId === type.id ? '•' : '–' : String(index + 1).padStart(2, '0')}</span>
                <span><strong>{type.label}</strong>{!guided && <small>{type.count} {type.count === 1 ? 'oefening' : 'oefeningen'}</small>}</span>
            </button>
          ))}
        </aside>

        <div className="cp-exercise-main">
          <header className="cp-exercise-record-head">
            <div>
              {!guided && <small>Vrij oefenen</small>}
              <h3 ref={taskHeading} tabIndex={-1}>{exercise.instructionAudio?.src ? <button className="cp-instruction-listen" aria-label="Luister naar de opdracht" onClick={() => { explainedModes.current.delete(exercise.instructionAudio!.src!); void listen(needsListen && !heard ? stimulus : undefined); }}><Volume2 />{exercise.title || family?.label}</button> : exercise.title || family?.label || 'Oefenen'}</h3>
            </div>
            <nav aria-label="Bladeren door oefeningen">
              <button onClick={() => guided ? openGuidedAt(guidedIndex - 1) : openAt(recordIndex - 1)} disabled={guided ? guidedIndex <= 0 : recordIndex === 0} aria-label="Vorige oefening"><ArrowLeft /></button>
              {guided && <button aria-label={autoPaused ? 'Automatisch verder aanzetten' : 'Automatisch verder pauzeren'} aria-pressed={autoPaused} onClick={() => setAutoPaused(value => !value)}>{autoPaused ? <Play /> : <Pause />}</button>}
              <b aria-label={`${guided ? 'Stap' : 'Oefening'} ${guided ? guidedIndex + 1 : recordIndex + 1} van ${guided ? exercises.length : records.length}`}>{guided ? guidedIndex + 1 : recordIndex + 1} / {guided ? exercises.length : records.length}</b>
              {!guided && <button onClick={() => openAt(recordIndex + 1)} disabled={recordIndex >= records.length - 1} aria-label="Volgende oefening"><ArrowRight /></button>}
            </nav>
          </header>

          <div className="cp-exercise-stage">
            {!guided && modes.length > 1 && <label className="cp-mode-picker">Wat wil je oefenen?<select value={exercise.mode} onChange={event => openAt(records.findIndex(item => item.mode === event.target.value))}>{modes.map(item => <option key={item.mode} value={item.mode}>{item.title}</option>)}</select></label>}
            {audioError && <div className="cp-audio-retry"><span>Het geluid kon niet starten.</span><button className="secondary-button" onClick={() => { if (instructionFailed) explainedModes.current.delete(exercise.instructionAudio?.src ?? ''); void listen(stimulus ?? findAudioSource(exercise)); }}><Volume2 />Opnieuw luisteren</button></div>}
            <ExerciseSurface
              key={exercise.exerciseId}
              exercise={exercise}
              pack={pack}
              onAudio={source => listen(source)}
              onFinish={finish}
              onOpenExercise={openExercise}
              guided={guided}
              onReset={resetResult}
              canAnswer={canAnswer && (exercise.componentId !== 'ALF-CMP-002' || result !== 'right')}
              onHelp={() => { metrics.current.helpUsed = true; if (result === 'right') setHoldFeedback(true); }}
            />
          </div>

          <footer className={`cp-exercise-feedback ${result}`}>
            {result === 'idle' && <Shapes />}
            {result === 'right' && <Check />}
            {result === 'wrong' && <RefreshCw />}
            <output aria-live="polite" aria-atomic="true"><strong>{audioError ? 'Probeer Luister opnieuw' : result === 'idle' ? !canAnswer ? audioPending ? 'Luister' : 'Tik op Luister' : 'Aan de slag' : result === 'right' ? selfPaced ? 'Geoefend' : 'Goed' : 'Probeer opnieuw'}</strong><small>{audioError ? instructionFailed ? 'Tik op de opdracht om opnieuw te luisteren.' : 'Het geluid lukt niet. Vraag zo nodig hulp.' : result === 'idle' ? !canAnswer ? 'Je hoort het geluid vanzelf.' : exerciseHelp(exercise) : automatic ? 'Je gaat vanzelf verder.' : message}</small></output>
            <button className="secondary-button" disabled={guided && (!canAnswer || (!selfPaced && result !== 'right'))} onClick={next}>{guided && guidedIndex >= exercises.length - 1 ? 'Les afronden' : 'Verder'}<ArrowRight /></button>
          </footer>
        </div>
      </div>
    </section>
  );
}

function ExerciseSurface({
  exercise,
  pack,
  onAudio,
  onFinish,
  onOpenExercise,
  guided,
  onReset,
  canAnswer,
  onHelp,
}: {
  exercise: PackageExercise;
  pack: PackageDefinition;
  onAudio: AudioPlayer;
  onFinish: (answer: string, correct: boolean, feedback?: string) => void;
  onOpenExercise: (exerciseId: string) => void;
  guided: boolean;
  onReset: () => void;
  canAnswer: boolean;
  onHelp: () => void;
}) {
  switch (exercise.componentId) {
    case 'ALF-CMP-001': return <ModelSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} guided={guided} />;
    case 'ALF-CMP-002': return <ChoiceSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} canAnswer={canAnswer} />;
    case 'ALF-CMP-003': return <ContrastSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-004': return <MatchingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-005': return <BuildSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} canAnswer={canAnswer} onHelp={onHelp} />;
    case 'ALF-CMP-006': return <InputSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} canAnswer={canAnswer} onHelp={onHelp} />;
    case 'ALF-CMP-007': return <ReadingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} guided={guided} />;
    case 'ALF-CMP-008': return <LinkedQuestionSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-009': return <SpeakSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-010': return <WritingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-011': return <FormSurface exercise={exercise} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-012': return <TraceSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-013': return <SequenceSurface exercise={exercise} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-014': return <BoardSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-015': return <GameSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-016': return <CardsSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-017':
    case 'ALF-CMP-018': return <RouteSurface exercise={exercise} onOpenExercise={onOpenExercise} onFinish={onFinish} />;
    default: return <FallbackSurface exercise={exercise} onFinish={onFinish} />;
  }
}

function Prompt({ exercise, onAudio, children }: { exercise: PackageExercise; onAudio?: AudioPlayer; children?: ReactNode }) {
  const source = exercise.prompt?.audio?.src ?? (exercise.wordId ? undefined : findAudioSource(exercise));
  if (!source && typeof exercise.exampleWord !== 'string' && !children) return null;
  return (
    <div className="cp-task-prompt">
      {typeof exercise.exampleWord !== 'string' && (source && onAudio ? <button onClick={() => onAudio(source)} aria-label={exercise.contextId ? 'Luister opnieuw' : exercise.wordId ? 'Luister naar het woord' : 'Luister naar de opdracht'}><Volume2 /><span>Luister</span></button> : <span><FileText /></span>)}
      <div>{typeof exercise.exampleWord === 'string' && (source && onAudio ? <button className="cp-example-listen" onClick={() => onAudio(source)} aria-label={`Luister naar ${exercise.exampleWord}`}>{exercise.exampleWord}<Volume2 aria-hidden="true" /></button> : <strong>{exercise.exampleWord}</strong>)}{children}</div>
    </div>
  );
}

function ExerciseImageView({ image, alt = 'Afbeelding bij de opdracht' }: { image?: ExerciseImage; alt?: string }) {
  if (!image?.src) return null;
  return <Image src={image.src} alt={image.altText || alt} width={760} height={760} />;
}

function ModelSurface({ exercise, onAudio, onFinish, guided }: SurfaceProps & { guided: boolean }) {
  const text = asRecord(exercise.text);
  const source = findAudioSource(exercise);
  const content = <><ExerciseImageView image={exerciseImage(exercise)} /><strong>{asString(text.primary)}{source && <Volume2 aria-hidden="true" />}</strong></>;
  return <section className="cp-task-card">{source ? <button className="cp-model-content" onClick={() => onAudio(source)} aria-label={`Luister naar ${asString(text.primary)}`}>{content}</button> : <div className="cp-model-content">{content}<span>Lees samen met je docent.</span></div>}{!guided && <button className="primary-button" onClick={() => onFinish('bekeken', true)}>Ik heb gekeken<Check /></button>}</section>;
}

function ChoiceSurface({ exercise, onAudio, onFinish, nested = false, canAnswer = true }: SurfaceProps & { nested?: boolean; canAnswer?: boolean }) {
  const [selected, setSelected] = useState('');
  const options = asArray<ChoiceOption>(exercise.options);
  const answer = asRecord(exercise.answer);
  const correct = asArray<string>(answer.correctOptionIds);
  const content = <>{!nested && <Prompt exercise={exercise} onAudio={onAudio} />}{typeof exercise.maskedWord === 'string' && <p className="cp-missing-word" aria-label={`Woord met een lege plek: ${exercise.maskedWord}`}>{exercise.maskedWord}</p>}{exercise.prompt?.image && <ExerciseImageView image={exercise.prompt.image} />}<div className="cp-choice-grid">{options.map((option) => <button key={option.id} disabled={!canAnswer} className={selected === option.id ? 'selected' : ''} aria-pressed={selected === option.id} onClick={() => { setSelected(option.id); onFinish(option.id, correct.includes(option.id)); }}>{option.image ? <ExerciseImageView image={option.image} /> : <strong>{option.label ?? option.grapheme ?? 'Kies'}</strong>}</button>)}</div></>;
  return nested ? <div className="cp-linked-choice">{content}</div> : <section className="cp-task-card">{content}</section>;
}

function ContrastSurface({ exercise, onAudio, onFinish, onReset }: SurfaceProps & { onReset: () => void }) {
  const [selected, setSelected] = useState('');
  const choices = asArray<ChoiceOption>(exercise.choices);
  const answer = asRecord(exercise.answer);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-large-options">{choices.map((choice) => <button key={choice.id} className={selected === choice.id ? 'selected' : ''} aria-pressed={selected === choice.id} onClick={() => { setSelected(choice.id); onReset(); }}>{choice.grapheme ?? choice.label ?? choice.id}</button>)}</div><button className="primary-button" disabled={!selected} onClick={() => onFinish(selected, selected === answer.correctSoundId)}>Controleer<Check /></button></section>;
}

function MatchingSurface({ exercise, onAudio, onFinish, onReset }: SurfaceProps & { onReset: () => void }) {
  const sources = asArray<ChoiceOption>(exercise.sources);
  const targets = asArray<ChoiceOption>(exercise.targets);
  const mapping = asRecord(asRecord(exercise.answer).mapping);
  const [activeSource, setActiveSource] = useState('');
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [wrongTarget, setWrongTarget] = useState('');
  function pair(targetId: string) {
    if (!activeSource) return;
    if (mapping[activeSource] !== targetId) {
      setWrongTarget(targetId);
      onFinish(`${activeSource}:${targetId}`, false, 'Kijk naar het gekozen woord. Kies de andere foto.');
      return;
    }
    const nextPairs = { ...pairs, [activeSource]: targetId };
    setPairs(nextPairs);
    setActiveSource('');
    setWrongTarget('');
    onReset();
    if (sources.every(source => nextPairs[source.id] === mapping[source.id])) onFinish(JSON.stringify(nextPairs), true);
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />
    <div className="cp-match-board">
      <div>{sources.map(source => <button key={source.id} disabled={Boolean(pairs[source.id])} className={activeSource === source.id ? 'selected' : ''} aria-pressed={activeSource === source.id} onClick={() => {
        setActiveSource(source.id); setWrongTarget(''); onReset();
        const audio = findAudioSource(source.audio); if (audio) void onAudio(audio);
      }}>{source.label ?? source.id}{Boolean(source.audio) && <Volume2 aria-hidden="true" />}{pairs[source.id] && <Check aria-label="Gekoppeld" />}</button>)}</div>
      <div>{targets.map(target => <button key={target.id} disabled={!activeSource || Object.values(pairs).includes(target.id)} className={wrongTarget === target.id ? 'wrong-pair' : ''} onClick={() => pair(target.id)}>
        {target.image ? <ExerciseImageView image={target.image} /> : <strong>{target.label ?? target.id}</strong>}{Object.values(pairs).includes(target.id) && <Check aria-label="Gekoppeld" />}
      </button>)}</div>
    </div>
  </section>;
}

function BuildSurface({ exercise, onAudio, onFinish, onReset, canAnswer, onHelp }: SurfaceProps & { onReset: () => void; canAnswer: boolean; onHelp: () => void }) {
  const tiles = asArray<Tile>(exercise.tiles);
  const target = asArray<string>(asRecord(exercise.answer).targetTileIds);
  const slots = asArray<unknown>(exercise.slots);
  const [chosen, setChosen] = useState<string[]>([]);
  const token = (id: string) => tiles.find((tile) => tile.id === id)?.token ?? '';
  const image = exerciseImage(exercise);
  function choose(next: string[]) {
    setChosen(next);
    onReset();
    if (next.length === target.length) onFinish(next.map(token).join(' '), next.map(token).join('') === target.map(token).join(''));
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<div className="cp-build-slots" aria-label="Jouw woord" aria-live="polite">{Array.from({ length: slots.length }).map((_, index) => <span key={index}>{chosen[index] ? token(chosen[index]) : ''}</span>)}</div><div className="cp-tile-bank">{tiles.map((tile) => <button key={tile.id} disabled={!canAnswer || chosen.includes(tile.id)} onClick={() => choose([...chosen, tile.id])}>{tile.token}</button>)}</div><div className="cp-task-actions"><button className="secondary-button" onClick={() => choose(chosen.slice(0, -1))} disabled={!chosen.length}><RotateCcw />Eén terug</button><WordHint exercise={exercise} onHelp={onHelp} /></div></section>;
}

function WordHint({ exercise, onHelp }: { exercise: PackageExercise; onHelp: () => void }) {
  const [shown, setShown] = useState(false);
  if (typeof exercise.helpWord !== 'string') return null;
  return <div className="cp-word-hint">{shown && <strong>{exercise.helpWord}</strong>}<button className="secondary-button" onClick={() => { if (!shown) onHelp(); setShown(!shown); }}>{shown ? 'Verberg voorbeeld' : 'Help'}</button></div>;
}

function InputSurface({ exercise, onAudio, onFinish, onReset, canAnswer, onHelp }: SurfaceProps & { onReset: () => void; canAnswer: boolean; onHelp: () => void }) {
  const fields = asArray<TextField>(exercise.fields);
  const [value, setValue] = useState('');
  const accepted = fields.flatMap((field) => field.acceptedAnswers ?? []);
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<form className="cp-dictation-form" onSubmit={event => { event.preventDefault(); if (canAnswer && value.trim()) onFinish(value, accepted.some(answer => normalize(answer) === normalize(value))); }}><label className="cp-text-entry"><span>Jouw antwoord</span><input disabled={!canAnswer} value={value} onChange={(event) => { setValue(event.target.value); onReset(); }} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} /></label><button type="submit" className="primary-button" disabled={!canAnswer || !value.trim()}>Controleer<Check /></button></form><WordHint exercise={exercise} onHelp={onHelp} /></section>;
}

function ReadingSurface({ exercise, onAudio, onFinish, guided }: SurfaceProps & { guided: boolean }) {
  const blocks = asArray<{ id: string; text: string; audio?: unknown }>(exercise.textBlocks);
  const image = exerciseImage(exercise);
  const audio = exercise.prompt?.audio?.src;
  return <section className="cp-task-card cp-context-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-context-layout">{image && (audio ? <button className="cp-context-image" aria-label="Luister bij de foto" onClick={() => onAudio(audio)}><ExerciseImageView image={image} /></button> : <ExerciseImageView image={image} />)}<div className="cp-reading-blocks">{blocks.map(block => {
    const source = findAudioSource(block.audio);
    return source ? <button key={block.id} aria-label={`Luister: ${block.text}`} onClick={() => onAudio(source)}>{block.text}</button> : <p key={block.id}>{block.text}</p>;
  })}</div></div>{!guided && <button className="primary-button" onClick={() => onFinish('samen geoefend', true)}>Klaar<Check /></button>}</section>;
}

function LinkedQuestionSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const linkedId = asString(asRecord(exercise.responseComponent).exerciseId);
  const linked = pack.exercises.find((item) => item.exerciseId === linkedId);
  if (!linked || !findAudioSource(exercise)) return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><p className="cp-audio-lock"><CircleAlert />Vraag je docent om hulp.</p></section>;
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><ChoiceSurface exercise={linked} onAudio={onAudio} onFinish={onFinish} nested /></section>;
}

function SpeakSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<Recorder onFinish={onFinish} /></section>;
}

function Recorder({ onFinish }: { onFinish: SurfaceProps['onFinish'] }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('Neem je stem op en luister terug.');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const mounted = useRef(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  async function toggle() {
    if (recording) { recorder.current?.stop(); setRecording(false); return; }
    if (requesting) return;
    setRequesting(true);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { nextStream.getTracks().forEach(track => track.stop()); return; }
      stream.current = nextStream;
      const nextRecorder = new MediaRecorder(nextStream);
      chunks.current = [];
      nextRecorder.ondataavailable = (event) => chunks.current.push(event.data);
      nextRecorder.onstop = () => {
        if (mounted.current) {
          setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: nextRecorder.mimeType })));
          setMessage('Luister terug. Neem opnieuw op als je dat wilt.');
        }
        nextStream.getTracks().forEach((track) => track.stop());
        stream.current = null;
      };
      recorder.current = nextRecorder;
      nextRecorder.start();
      setRecording(true);
      setMessage('Spreek nu.');
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      if (mounted.current) setMessage('De microfoon werkt niet. Zeg het woord hardop. Tik daarna op Klaar.');
    } finally {
      if (mounted.current) setRequesting(false);
    }
  }

  return <div className="cp-recorder"><output aria-live="polite">{message}</output><button disabled={requesting} className={recording ? 'recording' : ''} onClick={toggle}>{recording ? <Pause /> : <Mic />}<span>{requesting ? 'Even wachten' : recording ? 'Stop' : 'Neem op'}</span></button>{audioUrl && <audio controls src={audioUrl} aria-label="Jouw opname" />}<button className="primary-button" disabled={recording || requesting} onClick={() => onFinish(audioUrl ? 'opgenomen' : 'hardop geoefend', true, 'Je hebt geoefend. Luister zelf of samen met je docent.')}>Klaar<Check /></button></div>;
}

function WritingSurface({ exercise, onAudio, onFinish, onReset }: SurfaceProps & { onReset: () => void }) {
  const [value, setValue] = useState('');
  const maxLength = Number(asRecord(exercise.textPolicy).maxLength ?? 1000);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><label className="cp-text-entry"><span>Schrijf hier</span><textarea value={value} onChange={(event) => { setValue(event.target.value); onReset(); }} maxLength={maxLength} rows={6} /></label><button className="primary-button" disabled={!value.trim()} onClick={() => onFinish(value, true, 'Opgeslagen voor zelf- of docentcontrole.')}>Bewaar<Check /></button></section>;
}

function FormSurface({ exercise, onFinish, onReset }: Pick<SurfaceProps, 'exercise' | 'onFinish'> & { onReset: () => void }) {
  const fields = asArray<{ fieldId: string; label: string; type: string; required?: boolean; validation?: { pattern?: string; min?: number; max?: number }; options?: { value: string; label: string }[] }>(exercise.fields);
  const [values, setValues] = useState<Record<string, string>>({});
  function valid() {
    return fields.every((field) => {
      const value = values[field.fieldId] ?? '';
      if (field.required && !value) return false;
      if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) return false;
      if (field.validation?.min !== undefined && Number(value) < field.validation.min) return false;
      if (field.validation?.max !== undefined && Number(value) > field.validation.max) return false;
      return true;
    });
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-form-fields">{fields.map((field) => <label key={field.fieldId}><span>{field.label}</span>{field.type === 'select' ? <select value={values[field.fieldId] ?? ''} onChange={(event) => { setValues({ ...values, [field.fieldId]: event.target.value }); onReset(); }}><option value="">Kies</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} value={values[field.fieldId] ?? ''} onChange={(event) => { setValues({ ...values, [field.fieldId]: event.target.value }); onReset(); }} />}</label>)}</div><button className="primary-button" onClick={() => onFinish(JSON.stringify(values), valid())}>Controleer<Check /></button></section>;
}

function TraceSurface({ exercise, onAudio, onFinish, onReset }: SurfaceProps & { onReset: () => void }) {
  const [value, setValue] = useState('');
  const target = asString(exercise.target);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-trace-model"><PencilLine /><strong>{target}</strong><span>Schrijf dit woord op papier of typ het hieronder.</span></div><label className="cp-text-entry"><span>Typen is ook mogelijk</span><input value={value} onChange={(event) => { setValue(event.target.value); onReset(); }} /></label><button className="primary-button" onClick={() => onFinish(value || 'op papier', !value || normalize(value) === normalize(target), 'Vergelijk jouw woord rustig met het model.')}>Ik heb geschreven<Check /></button></section>;
}

function SequenceSurface({ exercise, onFinish, onReset }: Pick<SurfaceProps, 'exercise' | 'onFinish'> & { onReset: () => void }) {
  const items = asArray<ExerciseItem>(exercise.items);
  const target = asArray<string>(exercise.targetOrderIds);
  const [chosen, setChosen] = useState<string[]>([]);
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-sequence-result">{chosen.map((id, index) => <span key={id}><b>{index + 1}</b>{items.find((item) => item.itemId === id)?.text}</span>)}</div><div className="cp-sequence-options">{items.map((item) => <button key={item.itemId} disabled={chosen.includes(item.itemId)} onClick={() => { setChosen([...chosen, item.itemId]); onReset(); }}>{item.text}</button>)}</div><div className="cp-task-actions"><button className="secondary-button" disabled={!chosen.length} onClick={() => { setChosen(chosen.slice(0, -1)); onReset(); }}><RotateCcw />Eén terug</button><button className="primary-button" disabled={chosen.length !== items.length} onClick={() => onFinish(chosen.join('|'), chosen.join('|') === target.join('|'))}>Controleer<Check /></button></div></section>;
}

function BoardSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const cells = asArray<{ cellId: string; text?: string; image?: ExerciseImage }>(exercise.cells);
  const stimuli = asArray<{ targetCellIds?: string[]; audio?: unknown }>(exercise.stimuli);
  const [round, setRound] = useState(0);
  const [marked, setMarked] = useState<string[]>([]);
  const current = stimuli[round];
  const targetId = current?.targetCellIds?.[0] ?? '';
  const targetCell = cells.find((cell) => cell.cellId === targetId);
  const targetWord = targetCell?.text ?? wordForImage(pack, targetCell?.image) ?? 'het goede vak';
  const grid = asRecord(exercise.grid);
  const rows = Number(grid.rows ?? 3);
  const columns = Number(grid.columns ?? 3);

  function hasLine(ids: string[]) {
    const selected = new Set(ids);
    const lines = [
      ...Array.from({ length: rows }, (_, row) => cells.slice(row * columns, row * columns + columns).map((cell) => cell.cellId)),
      ...Array.from({ length: columns }, (_, column) => cells.filter((_, index) => index % columns === column).map((cell) => cell.cellId)),
    ];
    if (rows === columns) {
      lines.push(
        cells.filter((_, index) => index % (columns + 1) === 0).map((cell) => cell.cellId),
        cells.filter((_, index) => index > 0 && index % (columns - 1) === 0 && index < cells.length - 1).map((cell) => cell.cellId),
      );
    }
    return lines.some((line) => line.length > 0 && line.every((id) => selected.has(id)));
  }

  function chooseCell(cellId: string) {
    if (cellId !== targetId) {
      onFinish(cellId, false, 'Luister of kijk nog een keer en kies een ander vak.');
      return;
    }
    const nextMarked = marked.includes(cellId) ? marked : [...marked, cellId];
    setMarked(nextMarked);
    if (hasLine(nextMarked) || round >= stimuli.length - 1) {
      onFinish(nextMarked.join('|'), true, 'Bingo. Je hebt een volledige lijn gemaakt.');
      return;
    }
    setRound(round + 1);
  }

  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio}><p className="cp-preview-support">Woordsteun: <strong>{targetWord}</strong></p></Prompt><p className="cp-round-progress">Ronde {Math.min(round + 1, stimuli.length)} van {stimuli.length} · {marked.length} vakken gemarkeerd</p><div className="cp-board-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{cells.map((cell) => <button key={cell.cellId} className={marked.includes(cell.cellId) ? 'marked' : ''} onClick={() => chooseCell(cell.cellId)}>{cell.image ? <ExerciseImageView image={cell.image} /> : <strong>{cell.text}</strong>}{marked.includes(cell.cellId) && <Check />}</button>)}</div></section>;
}

function GameSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  if (exercise.mode === 'memory') return <MemorySurface exercise={exercise} onFinish={onFinish} />;
  if (exercise.mode === 'sort') return <SortSurface exercise={exercise} onFinish={onFinish} />;
  if (exercise.mode === 'find_word') return <FindWordSurface exercise={exercise} onFinish={onFinish} />;
  if (exercise.mode === 'listen') return <ListenGameSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
  return <DominoSurface exercise={exercise} onFinish={onFinish} />;
}

type DominoItem = { itemId: string; left?: { matchKey?: string; content?: CardContent }; right?: { matchKey?: string; content?: CardContent } };

function DominoSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<DominoItem>(exercise.items);
  const rules = asRecord(exercise.rules);
  const startId = asString(rules.startItemId) || items[0]?.itemId || '';
  const [chain, setChain] = useState<string[]>(startId ? [startId] : []);
  const last = items.find((item) => item.itemId === chain.at(-1));
  const remaining = items.filter((item) => !chain.includes(item.itemId));

  function add(item: DominoItem) {
    if (last?.right?.matchKey !== item.left?.matchKey) {
      onFinish(item.itemId, false, 'Deze helften zijn niet hetzelfde. Kies een andere steen.');
      return;
    }
    const next = [...chain, item.itemId];
    setChain(next);
    if (next.length === items.length) onFinish(next.join('|'), true, 'De dominoketen is compleet.');
  }

  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-domino-chain">{chain.map((id) => { const item = items.find((candidate) => candidate.itemId === id); return <article key={id}><ContentView content={item?.left?.content} /><span /><ContentView content={item?.right?.content} /></article>; })}</div>{remaining.length > 0 && <><p className="cp-round-progress">Kies de volgende steen. Dezelfde woorden moeten elkaar raken.</p><div className="cp-domino-options">{remaining.map((item) => <button key={item.itemId} onClick={() => add(item)}><ContentView content={item.left?.content} /><span /><ContentView content={item.right?.content} /></button>)}</div></>}</section>;
}

function MemorySurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  function choose(item: ExerciseItem) {
    if (open.length >= 2 || open.includes(item.itemId) || matched.includes(item.itemId)) return;
    const next = [...open, item.itemId];
    setOpen(next);
    if (next.length === 2) {
      const first = items.find((candidate) => candidate.itemId === next[0]);
      const correct = first?.pairKey === item.pairKey;
      timer.current = setTimeout(() => {
        if (correct) {
          const nextMatched = [...matched, ...next];
          setMatched(nextMatched);
          if (nextMatched.length === items.length) onFinish('memory afgerond', true);
        }
        setOpen([]);
      }, 550);
    }
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-memory-grid">{items.map((item) => { const visible = open.includes(item.itemId) || matched.includes(item.itemId); return <button key={item.itemId} className={visible ? 'open' : ''} onClick={() => choose(item)}>{visible ? <ContentView content={item.content} /> : <span>?</span>}</button>; })}</div></section>;
}

function SortSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const categories = asArray<{ categoryId: string; label: string }>(exercise.categories);
  const assignments = asRecord(asRecord(exercise.rules).assignments);
  const [selected, setSelected] = useState('');
  const [placed, setPlaced] = useState<Record<string, string>>({});
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-sort-items">{items.map((item) => <button key={item.itemId} className={selected === item.itemId ? 'selected' : ''} aria-pressed={selected === item.itemId} disabled={Boolean(placed[item.itemId])} onClick={() => setSelected(item.itemId)}>{item.content?.text}</button>)}</div><div className="cp-sort-categories">{categories.map((category) => <button key={category.categoryId} onClick={() => { if (!selected) return; setPlaced({ ...placed, [selected]: category.categoryId }); setSelected(''); }}>{category.label}<small>{Object.values(placed).filter((value) => value === category.categoryId).length} woorden</small></button>)}</div><button className="primary-button" disabled={Object.keys(placed).length !== items.length} onClick={() => onFinish(JSON.stringify(placed), items.every((item) => assignments[item.itemId] === placed[item.itemId]))}>Controleer<Check /></button></section>;
}

function FindWordSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const rounds = asArray<{ targetWord: string; correctItemId: string; candidateItemIds: string[] }>(exercise.rounds);
  const [round, setRound] = useState(0);
  const current = rounds[round] ?? rounds[0];
  function choose(id: string) {
    if (id !== current?.correctItemId) {
      onFinish(id, false, 'Dat is een ander woord. Kijk nog een keer.');
      return;
    }
    if (round >= rounds.length - 1) onFinish(id, true, 'Alle zoekrondes zijn afgerond.');
    else setRound(round + 1);
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} /><p className="cp-round-progress">Ronde {round + 1} van {rounds.length}</p><div className="cp-find-target">Zoek: <strong>{current?.targetWord}</strong></div><div className="cp-large-options">{current?.candidateItemIds.map((id) => <button key={id} onClick={() => choose(id)}>{items.find((item) => item.itemId === id)?.content?.text}</button>)}</div></section>;
}

function ListenGameSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const items = asArray<ExerciseItem>(exercise.items);
  const rounds = asArray<{ correctItemId: string; candidateItemIds: string[] }>(exercise.listenRounds);
  const [round, setRound] = useState(0);
  const current = rounds[round] ?? rounds[0];
  const support = items.find((item) => item.itemId === current?.correctItemId)?.content?.text;
  function choose(id: string) {
    if (id !== current?.correctItemId) {
      onFinish(id, false, 'Luister nog een keer en kies een ander woord.');
      return;
    }
    if (round >= rounds.length - 1) onFinish(id, true, 'Alle luisterrondes zijn afgerond.');
    else setRound(round + 1);
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio}><p className="cp-preview-support">Woordsteun: <strong>{support}</strong></p></Prompt><p className="cp-round-progress">Ronde {round + 1} van {rounds.length}</p><div className="cp-large-options">{current?.candidateItemIds.map((id) => <button key={id} onClick={() => choose(id)}>{items.find((item) => item.itemId === id)?.content?.text}</button>)}</div></section>;
}

function CardsSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const cards = asArray<{ cardId: string; front?: { image?: ExerciseImage }; back?: { text?: string }; audio?: unknown }>(exercise.cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];
  const backText = card?.back?.text ?? wordForImage(pack, card?.front?.image) ?? 'Luister naar het woord';
  const source = findAudioSource(card?.audio);
  return <section className="cp-task-card">
    {card && <button className={`cp-flash-card ${flipped ? 'flipped' : ''}`} aria-label={flipped ? 'Toon de foto' : 'Toon het woord'} aria-pressed={flipped} onClick={() => { setFlipped(!flipped); if (!flipped && cards.length === 1) onFinish('kaart bekeken', true); }}>{flipped ? <strong>{backText}</strong> : <ExerciseImageView image={card.front?.image} />}</button>}
    <span className="cp-card-hint">Tik op de kaart.</span>
    <div className="cp-task-actions">
      {source && <button className="secondary-button" aria-label="Luister naar het woord" onClick={() => onAudio(source)}><Volume2 />Luister</button>}
      {cards.length > 1 && <><button className="secondary-button" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}><ArrowLeft />Vorige</button><button className="primary-button" onClick={() => { if (index >= cards.length - 1) onFinish('kaartenset afgerond', true); else { setIndex(index + 1); setFlipped(false); } }}>{index >= cards.length - 1 ? 'Klaar' : 'Verder'}<ArrowRight /></button></>}
    </div>
  </section>;
}

function RouteSurface({ exercise, onOpenExercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'> & { onOpenExercise: (exerciseId: string) => void }) {
  const tasks = asArray<{ exerciseId: string; componentId: string }>(exercise.tasks);
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-route-tasks">{tasks.map((task, index) => <button key={`${task.exerciseId}-${index}`} onClick={() => onOpenExercise(task.exerciseId)}><strong>Oefening {index + 1}</strong><ArrowRight /></button>)}</div><button className="secondary-button" onClick={() => onFinish('route bekeken', true)}>Route bekeken<Check /></button></section>;
}

function FallbackSurface({ exercise }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  return <section className="cp-task-card"><Prompt exercise={exercise} /><p>Deze oefening werkt nu niet. Kies een andere oefening.</p></section>;
}

function ContentView({ content }: { content?: CardContent }) {
  if (!content) return null;
  if (content.image) return <ExerciseImageView image={content.image} />;
  return <strong>{content.text}</strong>;
}

function wordForImage(pack: PackageDefinition, image?: ExerciseImage) {
  if (!image?.src) return undefined;
  return pack.words.find((word) => word.image === image.src)?.word;
}

type SurfaceProps = {
  exercise: PackageExercise;
  onAudio: AudioPlayer;
  onFinish: (answer: string, correct: boolean, feedback?: string) => void;
};
