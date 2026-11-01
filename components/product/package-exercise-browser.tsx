'use client';
import { useExerciseViewTarget } from './exercise-view';
import { ExerciseAudioProvider, ExerciseAudioSlot, ExerciseListen } from './exercise-listen';
import { WordPlaceholder } from './word-placeholder';
import { readingSupportForExercise, wordMeaningContexts } from '@/lib/production-practice';

import { useId } from 'react';
import { practiceBusy, usePracticeKeyboard } from '@/hooks/use-practice-keyboard';
import { wordWithArticle } from '@/lib/word-articles';

import { DialogueSurface, type DialogueControls } from './dialogue-surface';
import { WordSounds } from './sound-reference';
import { ImportedPracticeSurface } from './imported-practice-surface';
import { ExerciseMenu, type ExerciseMenuProps } from './exercise-menu';

/* oxlint-disable jsx-a11y/media-has-caption -- Eigen oefenopnames hebben geen afzonderlijk ondertitelspoor. */

import type {
  ExerciseImage,
  PackageDefinition,
  PackageExercise,
  AudioPlayer,
  PracticeAttempt,
} from '@/lib/package-content';
import { exerciseHelp, hasFirstLetterGuide, isBeginnerLesson, beginnerExerciseDemo } from '@/lib/lesson-plan';
import { applyDefaultAudioRate } from '@/lib/media-player';
import { isInstructionAudioEnabled, isWithdrawnAudio } from '@/lib/audio-policy';
import { learnerExerciseNames, learnerPhaseNames } from '@/lib/learner-copy';
import {
  ArrowLeft,
  ArrowRight,
  Check,
Eye,
  CircleAlert,
  FileText,
  Pointer as Hand,
  Mic,
  Pause,
 Play,
  PencilLine,
  RefreshCw,
  RotateCcw,
  Shapes,
Search,
  Volume2,
} from 'lucide-react';
import Image from './compact-image';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { stopMedia } from '@/components/product/shared';
import { StandardPracticeSurface } from './standard-practice-surface';
import { orderAccepted } from '@/lib/standard-player-contract';
import { ExtendedPracticeSurface } from './extended-practice-surface';
import { LearningPathSurface } from './learning-path-surface';
import { useRouteSettings } from './route-settings';
import { allPackageWords } from '@/lib/package-content';

type ResultState = 'idle' | 'right' | 'wrong';
type ChoiceOption = { id: string; label?: string; grapheme?: string; image?: ExerciseImage; audio?: unknown };
type Tile = { id: string; token: string };
type TextField = { id: string; acceptedAnswers?: string[] };
type ExerciseItem = { itemId: string; text?: string; content?: CardContent; pairKey?: string };
type CardContent = { text?: string; image?: ExerciseImage };

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('nl-NL').replace(/[.!?]+$/, '');
const asArray = <T,>(value: unknown) => (Array.isArray(value) ? value as T[] : []);
const wordLabels = new Map(allPackageWords.map(word => [word.id, word.word]));
const wordPictures = new Map(allPackageWords.filter(word => word.image).map(word => [word.id, { src: word.image, altText: 'Afbeelding bij het woord' }]));
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

export function findAudioSource(value: unknown): string | undefined {
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

export function PackageExerciseBrowser(props: Parameters<typeof PackageExercisePlayer>[0]) {
  return <ExerciseAudioProvider><PackageExercisePlayer {...props} /></ExerciseAudioProvider>;
}

function PackageExercisePlayer({
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
  practiceRound = false,
  exerciseMenu,
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
  practiceRound?: boolean;
  exerciseMenu?: ExerciseMenuProps;
}) {
  const exerciseTypes = pack.exerciseTypes
    .map((type) => ({ ...type, label: learnerExerciseNames[type.id] ?? type.label, count: exercises.filter((exercise) => exercise.componentId === type.id).length }))
    .filter((type) => type.count > 0);
  const initialExercise = exercises.find(item => item.exerciseId === initialExerciseId) ?? exercises[0];
  // Browsing ahead must not move the saved route past unfinished exercises.
  const [nextRequiredIndex, setNextRequiredIndex] = useState(() => Math.max(0, exercises.findIndex(item => item.exerciseId === initialExercise?.exerciseId)));
  const initialFamilyId = (guided || initialExerciseId ? initialExercise?.componentId : exerciseTypes[0]?.id) ?? 'ALF-CMP-001';
  const [familyId, setFamilyId] = useState(initialFamilyId);
  const [recordIndex, setRecordIndex] = useState(() => guided || initialExerciseId ? Math.max(0, exercises.filter(item => item.componentId === initialFamilyId).findIndex(item => item.exerciseId === initialExercise?.exerciseId)) : representativeIndex(exercises, initialFamilyId));
  const [completed, setCompleted] = useState(false);
  const [returnedToUnfinished, setReturnedToUnfinished] = useState(false);
  const [result, setResult] = useState<ResultState>('idle');
  const [exerciseMenuOpen, setExerciseMenuOpen] = useState(false);
  const [message, setMessage] = useState('Neem je tijd.');
  const [heard, setHeard] = useState(false);
  const [activeTurn, setActiveTurn] = useState(0);
  const [completedDialoguePlays, setCompletedDialoguePlays] = useState(0);
  const heardTurns = useRef(new Set<number>());
  const [audioError, setAudioError] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const keyboardUsed = useRef(false);
  const advancing = useRef(false);
  const [recording, setRecording] = useState(false);
  const [holdFeedback, setHoldFeedback] = useState(false);
  const [paceSeconds, setPaceSeconds] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [audioPending, setAudioPending] = useState(false);
  const [instructionFailed, setInstructionFailed] = useState(false);
  const [speakingOptionId, setSpeakingOptionId] = useState('');
  const playback = useRef<AbortController | null>(null);
  const explainedModes = useRef(previousInstructions());
  const metrics = useRef({ started: 0, attempts: 0, helpUsed: false, plays: 0 });
  const { view } = useRouteSettings();
  const reportPosition = useEffectEvent((id: string) => {
    if (practiceRound || exercises.findIndex(item => item.exerciseId === id) <= nextRequiredIndex) onPosition?.(id);
  });
  const currentId = useRef('');
  const taskHeading = useRef<HTMLHeadingElement>(null);
  const exerciseStage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const stage = exerciseStage.current;
    const main = stage?.closest<HTMLElement>('.learner-main');
    if (!stage || !main) return;
    const resize = () => {
      const nav = document.querySelector<HTMLElement>('.learner-nav');
      const bottom = nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().top : window.innerHeight;
      const feedback = stage.parentElement?.querySelector<HTMLElement>('.cp-exercise-feedback');
      const top = stage.getBoundingClientRect().top + main.scrollTop;
      stage.style.setProperty('--practice-stage-height', `${Math.max(180, bottom - top - (feedback?.offsetHeight ?? 112) - 12)}px`);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(main);
    for (const el of main.querySelectorAll('.cp-context-header, .cp-practice-display, .cp-exercise-record-head, .cp-exercise-feedback')) observer.observe(el);
    window.addEventListener('resize', resize);
    resize();
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [guided, practiceRound, completed]);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const records = exercises.filter((exercise) => exercise.componentId === familyId);
  const exercise = records[Math.min(recordIndex, Math.max(0, records.length - 1))] ?? exercises[0];
  const guidedIndex = guided ? exercises.findIndex((item) => item.exerciseId === exercise?.exerciseId) : -1;
  const exerciseId = exercise?.exerciseId ?? '';
  const selfPaced = exercise?.assessment === 'participation' || exercise?.componentId === 'ALF-CMP-001';
  const needsListen = Boolean(exercise?.requiresAudio);
  const sentenceQuestion = exercise?.mode === 'sentence-question';
  const canAnswer = (!needsListen || heard) && (!(sentenceQuestion || exercise?.playAllBlocks) || !audioPending);
  const firstLetterGuide = exercise && hasFirstLetterGuide(exercise, guided);
  const manualAdvance = exercise?.mode === 'connected-dialogue' || exercise?.manualAdvance || (exercise && isBeginnerLesson(exercise, guided && !practiceRound));
  const automatic = guided && !exerciseMenuOpen && result === 'right' && !selfPaced && !firstLetterGuide && !manualAdvance && !exercise?.learningPathId && exercise?.componentId !== 'KLINK-EXTENDED' && !autoPaused && !keyboardMode && !holdFeedback && !audioPending && !recording;
  const stimulus = exercise?.prompt?.audio?.src ?? findAudioSource(exercise?.textBlocks);
  const keyboard = usePracticeKeyboard({ enabled: !exerciseMenuOpen, busy: audioPending || recording,
    onUse: () => { keyboardUsed.current = true; setKeyboardMode(true); },
    onListen: () => { const source = stimulus ?? findAudioSource(exercise); if (source) void listen(source); },
  });
  useEffect(() => { advancing.current = false; }, [exerciseId, completed]);
  useEffect(() => {
    if (keyboardMode && result === 'right' && !audioPending && !recording) keyboard.ref.current?.querySelector<HTMLButtonElement>('[data-practice-next]:not(:disabled)')?.focus({ preventScroll: true });
  }, [keyboardMode, result, audioPending, recording, keyboard.ref]);
  async function listen(source?: string, automaticStart = false, singleTurn?: number) {
    if ((exercise?.readingTask || (exercise?.componentId === 'KLINK-EXTENDED' && !(exercise.synonymPairId && source === stimulus)) || (exercise?.learningPathId && source !== stimulus)) && source) metrics.current.helpUsed = true;
    if (!automaticStart && result === 'right') setHoldFeedback(true);
    const id = exercise?.exerciseId;
    playback.current?.abort();
    const controller = new AbortController();
    playback.current = controller;
    const isCurrent = () => currentId.current === id && !controller.signal.aborted;
    setAudioPending(true);
    setAudioError(false);
    setSpeakingOptionId('');
    if (sentenceQuestion && source === stimulus) setHeard(false);
    try {
      if (isInstructionAudioEnabled(exercise.instructionAudio?.src) && exercise.instructionAudio?.src && !explainedModes.current.has(exercise.instructionAudio.src)) {
        setInstructionFailed(true);
        const explained = await onAudio(exercise.instructionAudio.src, { waitUntilEnd: true, signal: controller.signal });
        if (!isCurrent()) return false;
        if (explained === false) throw new Error('instruction unavailable');
        explainedModes.current.add(exercise.instructionAudio.src);
        try { sessionStorage.setItem(instructionMemoryKey, JSON.stringify([...explainedModes.current].slice(-100))); } catch { /* Listening does not depend on storage. */ }
        setInstructionFailed(false);
      }
      if (!source) return true;
      const sequence: { src: string; optionId?: string; turn?: number }[] = exercise.playAllBlocks && source === stimulus && singleTurn === undefined
        ? asArray<{ audio?: unknown }>(exercise.textBlocks).map((block, turn) => {
          const src = findAudioSource(block.audio);
          if (!src) throw new Error('recorded block unavailable');
          return { src, turn };
        }) : [{ src: source, turn: singleTurn }];
      if (sentenceQuestion && source === stimulus) {
        const questionAudio = findAudioSource(exercise.questionAudio);
        if (!questionAudio) throw new Error('question unavailable');
        sequence.push({ src: questionAudio });
        for (const option of asArray<ChoiceOption>(exercise.options)) {
          const optionAudio = findAudioSource(option.audio);
          if (optionAudio) sequence.push({ src: optionAudio, optionId: option.id });
          else if (!option.image?.src) throw new Error('spoken answer unavailable');
        }
      }
      for (const clip of sequence) {
        setSpeakingOptionId(clip.optionId ?? '');
        if (exercise.mode === 'connected-dialogue' && clip.turn !== undefined) setActiveTurn(clip.turn);
        const played = await onAudio(clip.src, { waitUntilEnd: true, signal: controller.signal });
        if (!isCurrent()) return false;
        if (played === false) throw new Error('audio unavailable');
        if (exercise.mode === 'connected-dialogue' && clip.turn !== undefined) heardTurns.current.add(clip.turn);
      }
      if (exercise.mode === 'connected-dialogue' && exercise.playAllBlocks && source === stimulus && singleTurn === undefined) setCompletedDialoguePlays(count => count + 1);
      if (exercise.mode === 'connected-dialogue') setHeard(heardTurns.current.size === asArray(exercise.textBlocks).length);
      else if (source === stimulus) setHeard(true);
      setAudioError(false);
      metrics.current.plays++;
      if (metrics.current.plays > 1) metrics.current.helpUsed = true;
      return true;
    } catch (error) {
      // A browser asking for a first click has not rejected the recording itself.
      const needsGesture = automaticStart && error instanceof Error && error.name === 'NotAllowedError';
      if (isCurrent()) { setAudioError(!needsGesture); if (source === stimulus) setHeard(false); }
      return false;
    } finally {
      if (isCurrent()) { setAudioPending(false); setSpeakingOptionId(''); }
    }
  }

  const beginAudio = useEffectEvent(() => {
    if (exercise?.mode === 'connected-dialogue') return;
    if (needsListen || exercise?.mode === 'model' || (isInstructionAudioEnabled(exercise?.instructionAudio?.src) && exercise?.instructionAudio)) {
      void listen(needsListen || exercise?.mode === 'model' ? stimulus : undefined, true);
    }
  });
  // Save the visible exercise before a quick navigation can leave this screen.
  useLayoutEffect(() => {
    if (!guided || !exerciseId) return;
    reportPosition(exerciseId);
  }, [exerciseId, guided]);
  useEffect(() => {
    stopMedia();
    currentId.current = exerciseId;
    heardTurns.current.clear();
    metrics.current = { started: Date.now(), attempts: 0, helpUsed: false, plays: 0 };
    taskHeading.current?.focus({ preventScroll: true });
    exerciseStage.current?.scrollTo({ top: 0 });
    if (exercise?.synonymPairId) document.querySelector('.learner-main')?.scrollTo({ top: 0 });
    const tiles = exerciseStage.current?.querySelector<HTMLElement>('.cp-tile-bank');
    if (guided && tiles && exerciseStage.current && tiles.getBoundingClientRect().bottom > exerciseStage.current.getBoundingClientRect().bottom) {
      tiles.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const timer = window.setTimeout(() => { setActiveTurn(0); setCompletedDialoguePlays(0); beginAudio(); }, 0);
    return () => { window.clearTimeout(timer); currentId.current = ''; playback.current?.abort(); stopMedia(); };
  }, [exerciseId, guided, exercise?.synonymPairId]);

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

  function openPhase(phase: string) {
    const index = exercises.findIndex(item => item.phase === phase);
    if (index < 0) return;
    if (index === guidedIndex) {
      if (stimulus) void listen(stimulus);
      return;
    }
    openGuidedAt(index);
  }

  function resetResult() {
    setResult('idle');
    setMessage('Neem je tijd.');
  }

  function resetExercise() {
    setReturnedToUnfinished(false);
    resetResult();
    setHeard(false);
    setAudioError(false);
    setAudioPending(false);
    setInstructionFailed(false);
    setSpeakingOptionId('');
    setHoldFeedback(false);
  }

  function finish(answer: string, correct: boolean, feedback?: string) {
    if (!canAnswer) return;
    if (result === 'right') return;
    metrics.current.attempts++;
    onAttempt?.({ exerciseId: exercise.exerciseId, mode: exercise.mode, answer, correct, attempts: metrics.current.attempts,
      support: exercise.access === 'supported-listening' || sentenceQuestion ? 'listening' : typeof exercise.exampleWord === 'string' || (view.photo && ['ALF-CMP-005', 'ALF-CMP-006'].includes(exercise.componentId) && wordPictures.has(String(exercise.wordId)) && !exercise.contextId) ? 'model' : metrics.current.helpUsed ? 'requested-help' : 'none',
      pictureSupport: view.photo ? 'always' : 'request',
      helpUsed: metrics.current.helpUsed, elapsedMs: Date.now() - metrics.current.started,
      objective: asString(exercise.objective), assessment: exercise.assessment ?? 'answer',
      ...(exercise.readingTask ? { independentReading: correct && !metrics.current.helpUsed } : {}),
      ...(exercise.learningPathId ? { independentReading: false, reviewEligible: exercise.reviewEligible === true } : {}),
      ...(exercise.synonymPairId ? { independentReading: exercise.independentReading === true && correct && !metrics.current.helpUsed, reviewEligible: exercise.reviewEligible === true } : {}),
      ...(exercise.componentId === 'KLINK-CONTENT' ? { independentReading: false, reviewEligible: false, access: exercise.access === 'self-practice' ? 'self-practice' : 'teacher-supported' } : {}),
      ...(sentenceQuestion || exercise.access === 'supported-listening' ? { contextId: asString(exercise.contextId), access: 'supported-listening', independentReading: false } : {}) });
    setResult(correct ? 'right' : 'wrong');
    setMessage(feedback ?? (correct
      ? selfPaced ? 'Je hebt geoefend.' : 'Goed gedaan.'
      : exercise.feedback ?? (exercise.mode.startsWith('heard') ? 'Luister nog een keer. Kies dan opnieuw.' : 'Kijk nog een keer. Probeer opnieuw.')));
    if (!correct && sentenceQuestion) {
      metrics.current.helpUsed = true;
      const feedbackSource = findAudioSource(exercise.feedbackAudio);
      if (feedbackSource && !isWithdrawnAudio(feedbackSource)) void listen(feedbackSource);
    }
  }

  function next() {
    if (advancing.current || audioPending || recording || practiceBusy(keyboard.ref.current)) return;
    if (guided && (!canAnswer || ((!selfPaced || exercise.requiresExplicitCompletion) && result !== 'right'))) return;
    advancing.current = true;
    if (guided) {
      if (selfPaced && result !== 'right') finish('geoefend', true);
      const nextRequired = nextRequiredIndex + (guidedIndex === nextRequiredIndex ? 1 : 0);
      setNextRequiredIndex(nextRequired);
      if (!practiceRound && guidedIndex >= exercises.length - 1 && nextRequired < exercises.length) {
        openGuidedAt(nextRequired);
        setReturnedToUnfinished(true);
      }
      else if (guidedIndex >= exercises.length - 1) { stopMedia(); setCompleted(true); onLessonDone?.(); }
      else openGuidedAt(guidedIndex + 1);
    } else openAt((recordIndex + 1) % records.length);
  }

  const advanceAfterFeedback = useEffectEvent(() => { if (!keyboardUsed.current) next(); });
  const pacedReading = (exercise?.mode === 'read-series' || exercise?.mode === 'paper-dictation') && !readingSupportForExercise(exercise) && !wordMeaningContexts(exercise).length;
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (keyboardMode || autoPaused || exerciseMenuOpen || !guided || !pacedReading || !paceSeconds || !pageVisible || !canAnswer || audioPending || completed || holdFeedback) return;
    const timer = window.setTimeout(() => advanceAfterFeedback(), paceSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [keyboardMode, autoPaused, exerciseMenuOpen, guided, pacedReading, paceSeconds, pageVisible, canAnswer, audioPending, completed, holdFeedback, exerciseId]);
  useEffect(() => {
    if (!automatic || completed) return;
    const timer = window.setTimeout(() => advanceAfterFeedback(), 650);
    return () => window.clearTimeout(timer);
  }, [automatic, exercise?.exerciseId, completed]);
  useEffect(() => { if (completed) completionHeading.current?.focus({ preventScroll: true }); }, [completed]);

  if (!exercise) return null;
  if (completed) return <section {...keyboard} className={`honest-empty${guided && !practiceRound ? ' cp-exercise-browser is-guided cp-lesson-complete' : ''}`}><Check /><h2 ref={completionHeading} tabIndex={-1}>Goed geoefend</h2><p>{practiceRound ? 'Deze ronde is klaar.' : 'Deze les is klaar.'}</p><button data-practice-next aria-keyshortcuts="Enter ArrowRight" className="primary-button" onClick={onComplete}>{completeLabel}<ArrowRight /></button></section>;

  const returningToUnfinished = guided && !practiceRound && guidedIndex === exercises.length - 1 && nextRequiredIndex < guidedIndex;
  const family = pack.exerciseTypes.find((item) => item.id === familyId);
  const isIndividual = (item: PackageExercise) => item.mode === 'sentence-question' || item.mode.startsWith('connected-');
  const modes = records.filter((item, index, all) => isIndividual(item) || all.findIndex(other => other.mode === item.mode) === index);
  const questionModes = modes.filter(item => item.mode === 'sentence-question');
  const phaseIcons = { meet: Eye, recognize: Search, make: PencilLine, use: Shapes, recall: RefreshCw };
  const menu = exerciseMenu ?? (!practiceRound ? {
    value: guided ? exercise.phase ?? '' : familyId,
    options: guided
      ? Object.entries(learnerPhaseNames).filter(([phase]) => exercises.some(item => item.phase === phase)).map(([id, label]) => ({ id, label, icon: phaseIcons[id as keyof typeof phaseIcons] ?? Shapes }))
      : exerciseTypes.map(type => ({ id: type.id, label: type.label, icon: Shapes })),
  } : undefined);
  const exerciseHeading = (<div>
              {!guided && <small>Vrij oefenen</small>}
              <h3 ref={taskHeading} tabIndex={-1}>{isInstructionAudioEnabled(exercise.instructionAudio?.src) && exercise.instructionAudio?.src ? <button className="cp-instruction-listen" aria-label="Luister naar de opdracht" onClick={() => { explainedModes.current.delete(exercise.instructionAudio!.src!); void listen(sentenceQuestion || (needsListen && !heard) ? stimulus : undefined); }}><Volume2 />{exercise.title || family?.label}</button> : exercise.title || family?.label || 'Oefenen'}</h3>
            </div>);
  const exerciseControls = (<nav aria-label="Bladeren door oefeningen">
              <button data-practice-previous aria-keyshortcuts="ArrowLeft" title="Vorige oefening (←)" onClick={() => { if (!audioPending && !recording && !practiceBusy(keyboard.ref.current)) { if (guided) openGuidedAt(guidedIndex - 1); else openAt(recordIndex - 1); } }} disabled={audioPending || recording || (guided ? guidedIndex <= 0 : recordIndex === 0)} aria-label="Vorige oefening"><ArrowLeft /></button>
              {guided && !firstLetterGuide && !manualAdvance && !exercise.learningPathId && exercise.componentId !== 'KLINK-EXTENDED' && <button data-practice-automatic aria-label={autoPaused || keyboardMode ? 'Automatisch verder aanzetten' : 'Automatisch verder pauzeren'} aria-pressed={autoPaused || keyboardMode} onClick={() => { const paused = autoPaused || keyboardMode; keyboardUsed.current = false; setKeyboardMode(false); setAutoPaused(!paused); }}>{autoPaused || keyboardMode ? <Play /> : <Pause />}</button>}
              <b aria-label={`${guided ? 'Stap' : 'Oefening'} ${guided ? guidedIndex + 1 : recordIndex + 1} van ${guided ? exercises.length : records.length}`}>{guided ? guidedIndex + 1 : recordIndex + 1} / {guided ? exercises.length : records.length}</b>
              {!guided && <button onClick={() => openAt(recordIndex + 1)} disabled={recordIndex >= records.length - 1} aria-label="Volgende oefening"><ArrowRight /></button>}
            </nav>);
  return (
    <section {...keyboard} data-practice-ready={result === 'right'} className={`cp-exercise-browser ${guided && !practiceRound ? 'is-guided' : ''} ${practiceRound ? 'is-mixed-round' : ''}`} data-exercise-id={exercise.exerciseId} data-answer-hidden={['word-dictation', 'recall-word', 'missing-grapheme', 'sentence-question'].includes(exercise.mode) ? 'true' : undefined}>
      <header>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>

      <div className="cp-exercise-workspace">
        <div className="cp-exercise-main">
          <header className="cp-exercise-record-head">
            {menu ? <ExerciseMenu scopeLabel={exerciseMenu?.scopeLabel} value={menu.value} options={menu.options} onSelect={id => { if (exerciseMenu) exerciseMenu.onSelect(id); else if (guided) openPhase(id); else chooseFamily(id); }} onOpenChange={setExerciseMenuOpen} heading={exerciseHeading} controls={exerciseControls} /> : <>{exerciseHeading}{exerciseControls}</>}
          </header>

          <div className="cp-exercise-stage" ref={exerciseStage}>
            <ExerciseAudioSlot />
            {pacedReading && <fieldset className="cp-pace-controls" aria-label="Tempo">{[0, 6, 9].map(seconds => <button key={seconds} className="secondary-button" aria-pressed={paceSeconds === seconds} onClick={() => setPaceSeconds(seconds)}>{seconds ? `${seconds} seconden` : 'Eigen tempo'}</button>)}</fieldset>}
            {!guided && modes.length > 1 && <label className="cp-mode-picker">Wat wil je oefenen?<select value={isIndividual(exercise) ? exercise.exerciseId : exercise.mode} onChange={event => openAt(records.findIndex(item => item.exerciseId === event.target.value || item.mode === event.target.value))}>{modes.map(item => {
              const isQuestion = item.mode === 'sentence-question';
              const value = isIndividual(item) ? item.exerciseId : item.mode;
              return <option key={value} value={value}>{isQuestion ? `Luistervraag ${questionModes.indexOf(item) + 1}: ${item.title}` : asString(item.contentTitle) || item.title}</option>;
            })}</select></label>}
            {audioError && <div className="cp-audio-retry"><span>Het geluid kon niet starten.</span><button className="secondary-button" onClick={() => { if (instructionFailed) explainedModes.current.delete(exercise.instructionAudio?.src ?? ''); void listen(stimulus ?? findAudioSource(exercise)); }}><Volume2 />Opnieuw luisteren</button></div>}
            <ExerciseSurface
              key={exercise.exerciseId}
              exercise={exercise}
              pack={pack}
              onRecordingChange={setRecording}
              onAudio={source => listen(source)}
              onFinish={finish}
              onOpenExercise={openExercise}
              guided={guided}
              onReset={resetResult}
              canAnswer={canAnswer && (exercise.componentId !== 'ALF-CMP-002' || result !== 'right')}
              dialogueControls={{ active: activeTurn, playing: audioPending, completedPlays: completedDialoguePlays,
                pause: () => { playback.current?.abort(); stopMedia(); setAudioPending(false); },
                select: turn => { playback.current?.abort(); stopMedia(); setAudioPending(false); setActiveTurn(turn); },
                play: turn => { const blocks = asArray<{ audio?: unknown }>(exercise.textBlocks); void listen(turn === undefined ? stimulus : findAudioSource(blocks[turn]?.audio), false, turn); },
              }}
              speakingOptionId={speakingOptionId}
              answeredCorrectly={result === 'right'}
              onHelp={() => { metrics.current.helpUsed = true; if (result === 'right') setHoldFeedback(true); }}
            />
          </div>

          <footer className={`cp-exercise-feedback ${result}`}>
            {result === 'idle' && <Shapes />}
            {result === 'right' && <Check />}
            {result === 'wrong' && <RefreshCw />}
            <output aria-live="polite" aria-atomic="true"><strong>{audioError ? 'Probeer Luister opnieuw' : result === 'idle' ? returnedToUnfinished ? 'Eerst deze oefening' : !canAnswer ? audioPending ? 'Luister' : 'Tik op Luister' : 'Aan de slag' : result === 'right' ? selfPaced ? 'Geoefend' : 'Goed' : 'Probeer opnieuw'}</strong><small>{audioError ? instructionFailed ? 'Tik op de opdracht om opnieuw te luisteren.' : 'Het geluid lukt niet. Vraag zo nodig hulp.' : result === 'idle' ? returnedToUnfinished ? 'Deze oefening was nog niet af.' : !canAnswer ? exercise.mode === 'connected-dialogue' || !audioPending ? 'Gebruik de luisterknop.' : 'Je hoort het geluid vanzelf.' : exerciseHelp(exercise, guided) : result === 'right' && returningToUnfinished ? 'Er staat nog een oefening open.' : automatic ? 'Je gaat vanzelf verder.' : message}</small></output>
            <button data-practice-next aria-keyshortcuts="Enter ArrowRight" title="Verder (Enter of →)" className="secondary-button" disabled={audioPending || recording || (guided && (!canAnswer || ((!selfPaced || exercise.requiresExplicitCompletion === true) && result !== 'right')))} onClick={next}>{guided && guidedIndex >= exercises.length - 1 && (practiceRound || nextRequiredIndex >= guidedIndex) ? practiceRound ? (exercise.standardTask || exercise.mode === 'context-order' ? 'Klaar' : 'Ronde afronden') : 'Les afronden' : 'Verder'}<small aria-hidden="true">Enter / →</small><ArrowRight /></button>
          </footer>
        </div>
      </div>
    </section>
  );
}

export function ExerciseSurface({
  exercise,
  pack,
  onAudio,
  onFinish,
  onOpenExercise,
  guided,
  onReset,
  canAnswer,
  onHelp,
  speakingOptionId,
  dialogueControls,
  answeredCorrectly = false,
  onRecordingChange,
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
  speakingOptionId: string;
  dialogueControls?: DialogueControls;
  answeredCorrectly?: boolean;
  onRecordingChange?: (busy: boolean) => void;
}) {
  const demo = beginnerExerciseDemo(pack, exercise, guided);
  switch (exercise.componentId) {
    case 'KLINK-CONTENT': return <ImportedPracticeSurface exercise={exercise} onFinish={onFinish} onReset={onReset} onHelp={onHelp} canAnswer={canAnswer} answeredCorrectly={answeredCorrectly} />;
    case 'KLINK-STANDARD': return <StandardPracticeSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} onHelp={onHelp} canAnswer={canAnswer} answeredCorrectly={answeredCorrectly} />;
    case 'KLINK-LEARNING': return <LearningPathSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onHelp={onHelp} canAnswer={canAnswer} />;
    case 'KLINK-EXTENDED': return exercise.mode === 'dialogue-role' ? <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><p>Geef zelf antwoord.</p><WordHint exercise={{ ...exercise, helpWord: asString(asRecord(exercise.roleModel).text) }} onHelp={onHelp} />{canAnswer && <Recorder onFinish={onFinish} onRecordingChange={onRecordingChange} />}</section> : <ExtendedPracticeSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} onHelp={onHelp} canAnswer={canAnswer} answeredCorrectly={answeredCorrectly} />;
    case 'ALF-CMP-001': return <ModelSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} guided={guided} />;
    case 'ALF-CMP-002': return <ChoiceSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} canAnswer={canAnswer} speakingOptionId={speakingOptionId} demoAvailable={Boolean(demo)} showDemoInitially={demo === 'first'} onHelp={onHelp} />;
    case 'ALF-CMP-003': return <ContrastSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-004': return <MatchingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} demoAvailable={Boolean(demo)} showDemoInitially={demo === 'first'} onHelp={onHelp} />;
    case 'ALF-CMP-005': return <BuildSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} canAnswer={canAnswer} onHelp={onHelp} answeredCorrectly={answeredCorrectly} firstLetterGuide={hasFirstLetterGuide(exercise, guided)} />;
    case 'ALF-CMP-006': return <InputSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} canAnswer={canAnswer} onHelp={onHelp} answeredCorrectly={answeredCorrectly} />;
    case 'ALF-CMP-007': return exercise.mode === 'connected-dialogue' && dialogueControls ? <DialogueSurface exercise={exercise} controls={dialogueControls} onFinish={onFinish} guided={guided} canAnswer={canAnswer} /> : <ReadingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} guided={guided} canAnswer={canAnswer} />;
    case 'ALF-CMP-008': return <LinkedQuestionSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-009': return <SpeakSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onRecordingChange={onRecordingChange} />;
    case 'ALF-CMP-010': return <WritingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-011': return <FormSurface exercise={exercise} onFinish={onFinish} onReset={onReset} />;
    case 'ALF-CMP-012': return <TraceSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} canAnswer={canAnswer} />;
    case 'ALF-CMP-013': return <SequenceSurface exercise={exercise} onFinish={onFinish} onReset={onReset} canAnswer={canAnswer} onHelp={onHelp} answeredCorrectly={answeredCorrectly} />;
    case 'ALF-CMP-014': return <BoardSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} canAnswer={canAnswer} />;
    case 'ALF-CMP-015': return <GameSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-016': return <CardsSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-017':
    case 'ALF-CMP-018': return <RouteSurface exercise={exercise} onOpenExercise={onOpenExercise} onFinish={onFinish} />;
    default: return <FallbackSurface exercise={exercise} onFinish={onFinish} />;
  }
}

function Prompt({ exercise, onAudio, children }: { exercise: PackageExercise; onAudio?: AudioPlayer; children?: ReactNode }) {
  const source = wordMeaningContexts(exercise).some(c => c.audio) && !exercise.requiresAudio ? undefined : exercise.prompt?.audio?.src ?? (exercise.wordId ? undefined : findAudioSource(exercise));
  const visibleWord = typeof exercise.displayWord === 'string' ? exercise.displayWord : exercise.exampleWord;
  const textView = useExerciseViewTarget('text', typeof visibleWord === 'string');
  if (!source && typeof visibleWord !== 'string' && !children) return null;
  return (
    <div className={`cp-task-prompt${source && onAudio && typeof visibleWord !== 'string' ? ' cp-corner-prompt' : ''}`}>
      {typeof visibleWord !== 'string' && (source && onAudio ? <ExerciseListen onClick={() => onAudio(source)} label={exercise.contextId ? 'Luister opnieuw' : exercise.wordId ? 'Luister naar het woord' : 'Luister naar de opdracht'} /> : <span><FileText /></span>)}
      <div>{typeof visibleWord === 'string' && (source && onAudio ? <><ExerciseListen onClick={() => onAudio(source)} label={`Luister naar ${visibleWord}`} /><button {...textView} className="cp-example-listen" onClick={() => onAudio(source)} aria-label={`Luister naar ${visibleWord}`}>{visibleWord}</button></> : <strong {...textView}>{visibleWord}</strong>)}{children}</div>
    </div>
  );
}

function ExerciseImageView({ image, alt = 'Afbeelding bij de opdracht', word, optional = false, onReveal }: { image?: ExerciseImage; alt?: string; word?: string; optional?: boolean; onReveal?: () => void }) {
  const visibility = useExerciseViewTarget('photo', optional && Boolean(image?.src), onReveal);
  const placeholderClassName = visibility['data-view-hidden'] ? 'cp-view-photo-hidden' : undefined;
  if (!image?.src) return null;
  if (image.placeholderWord && image.src.startsWith('/package-media/klink-placeholders-20261030/')) return <WordPlaceholder word={image.placeholderWord} className={placeholderClassName} />;
  return <Image {...visibility} placeholderClassName={placeholderClassName} src={image.src} alt={image.altText || alt} fallbackWord={word} width={760} height={760} unoptimized={image.src.startsWith('/package-media/klink-productie-20261029/') || image.src.startsWith('/package-media/klink-beelden-20261030/')} />;
}

function ModelSurface({ exercise, onAudio, onFinish, guided }: SurfaceProps & { guided: boolean }) {
  const text = asRecord(exercise.text);
  const textView = useExerciseViewTarget('text', Boolean(asString(text.primary)));
  const source = findAudioSource(exercise);
  const modelClass = `cp-model-content${/\s/.test(asString(text.primary).trim()) ? ' cp-model-sentence' : ''}`;
  const articleId = useId();
  const phrase = wordWithArticle({ id: asString(exercise.wordId), word: asString(text.primary) });
  const content = <><ExerciseImageView optional image={exerciseImage(exercise)} word={asString(text.primary)} /><strong {...textView}>{asString(text.primary)}{phrase && <small id={articleId} className="cp-word-article">{phrase}</small>}</strong></>;
  return <section className="cp-task-card">{source && <ExerciseListen label={`Luister naar ${asString(text.primary)}`} onClick={() => onAudio(source)} />}{source ? <button className={modelClass} onClick={() => onAudio(source)} aria-describedby={phrase ? articleId : undefined} aria-label={`Luister naar ${asString(text.primary)}`}>{content}</button> : <div className={modelClass}>{content}<span>Lees samen met je docent.</span></div>}<WordSounds key={exercise.exerciseId} wordId={asString(exercise.wordId)} />{!guided && <button data-practice-check className="primary-button" onClick={() => onFinish('bekeken', true)}>Ik heb gekeken<Check /></button>}</section>;
}

function scrollDemoIntoView(anchor: HTMLElement | null) {
  anchor?.scrollIntoView({ block: 'center' });
  anchor?.closest('.cp-task-card')?.querySelector(':scope > .primary-button')?.scrollIntoView({ block: 'nearest' });
}

function ChoiceSurface({ exercise, onAudio, onFinish, nested = false, canAnswer = true, speakingOptionId = '', demoAvailable = false, showDemoInitially = false, onHelp }: SurfaceProps & { nested?: boolean; canAnswer?: boolean; speakingOptionId?: string; demoAvailable?: boolean; showDemoInitially?: boolean; onHelp?: () => void }) {
  const [selected, setSelected] = useState('');
  const [showDemo, setShowDemo] = useState(showDemoInitially);
  const choices = useRef<HTMLDivElement>(null);
  const options = asArray<ChoiceOption>(exercise.options);
  const answer = asRecord(exercise.answer);
  const correct = asArray<string>(answer.correctOptionIds);
  const maskedWord = typeof exercise.maskedWord === 'string' ? exercise.maskedWord : undefined;
  const gapOption = exercise.mode === 'missing-grapheme' ? options.find(option => correct.includes(option.id)) : undefined;
  const gapLetter = gapOption?.label ?? gapOption?.grapheme;
  const gapParts = maskedWord?.split('…');
  const showGapDemo = showDemo && gapLetter && gapParts?.length === 2;
  useEffect(() => { if (showDemo) scrollDemoIntoView(choices.current); }, [showDemo]);
  useEffect(() => { if (demoAvailable && !showDemo && canAnswer) choices.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }); }, [demoAvailable, showDemo, canAnswer]);
  const content = <>{!nested && <Prompt exercise={exercise} onAudio={onAudio} />}{showDemo && <p className="cp-letter-cue">Kijk eerst</p>}{maskedWord && (showGapDemo ? <figure className="cp-missing-word cp-gap-demo" aria-label={`Voorbeeld: ${gapLetter} vult de lege plek. Het woord is ${gapParts.join(gapLetter)}.`}><span>{maskedWord}</span><ArrowRight aria-hidden="true" /><span>{gapParts[0]}<mark><b className="cp-demo-arrival">{gapLetter}</b></mark>{gapParts[1]}</span></figure> : <p className="cp-missing-word" aria-label={`Woord met een lege plek: ${maskedWord}`}>{maskedWord}</p>)}{exercise.prompt?.image && <ExerciseImageView optional image={exercise.prompt.image} />}<div className="cp-choice-grid" ref={choices}>{options.map((option) => <button key={option.id} disabled={showDemo || !canAnswer} className={(showDemo ? correct.includes(option.id) : selected === option.id) ? 'selected' : ''} data-speaking={speakingOptionId === option.id ? 'true' : undefined} aria-pressed={showDemo ? correct.includes(option.id) : selected === option.id} onClick={() => { setSelected(option.id); onFinish(option.id, correct.includes(option.id)); }}>{option.image ? <ExerciseImageView image={option.image} word={option.label ?? wordLabels.get(option.id)} /> : <strong>{option.label ?? option.grapheme ?? 'Kies'}</strong>}{showDemo && correct.includes(option.id) && <Hand className="cp-demo-hand" aria-hidden="true" />}{Boolean(option.audio) && <Volume2 className="cp-option-audio" aria-hidden="true" />}</button>)}</div>{demoAvailable && (showDemo ? <button data-practice-check className="primary-button" disabled={!canAnswer} onClick={() => { onHelp?.(); setShowDemo(false); }}>Nu jij<ArrowRight aria-hidden="true" /></button> : <button className="secondary-button" disabled={correct.includes(selected)} onClick={() => { onHelp?.(); setShowDemo(true); }}>Kijk nog eens</button>)}</>;
  return nested ? <div className="cp-linked-choice">{content}</div> : <section className={`cp-task-card${demoAvailable ? ' cp-beginner-choice' : ''}${demoAvailable && exercise.mode === 'missing-grapheme' ? ' cp-gap-choice' : ''}${showDemo ? ' cp-exercise-demo' : ''}`} aria-label={showDemo ? 'Voorbeeld' : undefined}>{content}</section>;
}

function ContrastSurface({ exercise, onAudio, onFinish, onReset }: SurfaceProps & { onReset: () => void }) {
  const [selected, setSelected] = useState('');
  const choices = asArray<ChoiceOption>(exercise.choices);
  const answer = asRecord(exercise.answer);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-large-options">{choices.map((choice) => <button key={choice.id} className={selected === choice.id ? 'selected' : ''} aria-pressed={selected === choice.id} onClick={() => { setSelected(choice.id); onReset(); }}>{choice.grapheme ?? choice.label ?? choice.id}</button>)}</div><button data-practice-check className="primary-button" disabled={!selected} onClick={() => onFinish(selected, selected === answer.correctSoundId)}>Controleer<Check /></button></section>;
}

function MatchingSurface({ exercise, onAudio, onFinish, onReset, demoAvailable = false, showDemoInitially = false, onHelp }: SurfaceProps & { onReset: () => void; demoAvailable?: boolean; showDemoInitially?: boolean; onHelp?: () => void }) {
  const sources = asArray<ChoiceOption>(exercise.sources);
  const targets = asArray<ChoiceOption>(exercise.targets);
  const mapping = asRecord(asRecord(exercise.answer).mapping);
  const [showDemo, setShowDemo] = useState(showDemoInitially);
  const [needsSource, setNeedsSource] = useState(false);
  const sourceBank = useRef<HTMLDivElement>(null);
  const demoCard = useRef<HTMLElement>(null);
  const [activeSource, setActiveSource] = useState('');
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [wrongTarget, setWrongTarget] = useState('');
  const [heardSource, setHeardSource] = useState('');
  const audioOnly = exercise.audioOnlySources === true;
  const currentSource = useRef('');
  useEffect(() => () => { currentSource.current = ''; }, []);
  useEffect(() => { if (showDemo) scrollDemoIntoView(demoCard.current); }, [showDemo]);
  useEffect(() => { if (demoAvailable && !showDemo) sourceBank.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true }); }, [demoAvailable, showDemo]);
  async function select(source: ChoiceOption) {
    setNeedsSource(false);
    currentSource.current = source.id; setActiveSource(source.id); setWrongTarget(''); setHeardSource(''); onReset();
    const audio = findAudioSource(source.audio);
    if (audio) { const ok = await onAudio(audio); if (ok !== false && currentSource.current === source.id) setHeardSource(source.id); }
  }
  function pair(targetId: string, sourceId = activeSource) {
    if (demoAvailable && !sourceId) { setNeedsSource(true); sourceBank.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true }); return; }
    if (!sourceId || !sources.some(source => source.id === sourceId) || pairs[sourceId] || Object.values(pairs).includes(targetId) || (audioOnly && heardSource !== sourceId)) return;
    if (mapping[sourceId] !== targetId) {
      setWrongTarget(targetId);
      onFinish(`${sourceId}:${targetId}`, false, exercise.feedback ?? 'Kijk naar het gekozen woord. Kies de andere foto.');
      return;
    }
    const nextPairs = { ...pairs, [sourceId]: targetId };
    setPairs(nextPairs);
    setActiveSource('');
    setWrongTarget('');
    onReset();
    if (sources.every(source => nextPairs[source.id] === mapping[source.id])) onFinish(JSON.stringify(nextPairs), true);
  }
  const exampleSource = sources.find(source => !pairs[source.id]);
  const exampleTarget = targets.find(target => target.id === mapping[exampleSource?.id ?? '']);
  if (showDemo && exampleSource && exampleTarget) return <section ref={demoCard} className="cp-task-card cp-exercise-demo" aria-label="Voorbeeld">
    <p className="cp-letter-cue">Kijk eerst</p>
    <figure className="cp-match-board cp-match-demo" aria-label="Eerst het woord. Daarna de foto die erbij hoort.">
      <div><div className="cp-demo-item"><strong>{exampleSource.label}</strong></div></div>
      <div><div className="cp-demo-item"><ExerciseImageView image={exampleTarget.image} /></div></div>
      <Hand className="cp-match-hand" aria-hidden="true" />
    </figure>
    <button data-practice-check className="primary-button" onClick={() => { onHelp?.(); setNeedsSource(false); setShowDemo(false); }}>Nu jij<ArrowRight aria-hidden="true" /></button>
  </section>;
  return <section className={`cp-task-card${demoAvailable ? ' cp-beginner-match' : ''}`}><Prompt exercise={exercise} onAudio={onAudio} />
    {demoAvailable && <output className="cp-letter-cue">{needsSource ? 'Tik eerst op een woord.' : sources.every(source => pairs[source.id]) ? 'Ze horen bij elkaar.' : activeSource ? 'Tik op de foto die erbij hoort.' : 'Tik op een woord.'}</output>}
    <div className="cp-match-board">
      <div ref={sourceBank}>{sources.map((source, index) => <button key={source.id} disabled={Boolean(pairs[source.id])} draggable={!pairs[source.id] && (!audioOnly || heardSource === source.id)} onDragStart={event => event.dataTransfer.setData('text/plain', source.id)} className={activeSource === source.id ? 'selected' : ''} aria-pressed={activeSource === source.id} onClick={() => void select(source)}>
        {audioOnly ? `Luister ${index + 1}` : source.label ?? source.id}{Boolean(source.audio) && <Volume2 aria-hidden="true" />}{pairs[source.id] && <Check aria-label="Gekoppeld" />}</button>)}</div>
      <div>{targets.map(target => <button key={target.id} disabled={Object.values(pairs).includes(target.id) || (audioOnly && (!activeSource || heardSource !== activeSource))} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); pair(target.id, event.dataTransfer.getData('text/plain')); }} className={wrongTarget === target.id ? 'wrong-pair' : ''} onClick={() => pair(target.id)}>
        {target.image ? <ExerciseImageView image={target.image} word={target.label ?? wordLabels.get(target.id.replace(/^image-/, ''))} /> : <strong>{target.label ?? target.id}</strong>}{Object.values(pairs).includes(target.id) && <Check aria-label="Gekoppeld" />}
      </button>)}</div>
    </div>
    {demoAvailable && <button className="secondary-button" disabled={!exampleSource} onClick={() => { onHelp?.(); setShowDemo(true); }}>Kijk nog eens</button>}
  </section>;
}

export function BuildSurface({ exercise, onAudio, onFinish, onReset, canAnswer, onHelp, answeredCorrectly = false, firstLetterGuide = false }: SurfaceProps & { onReset: () => void; canAnswer: boolean; onHelp: () => void; answeredCorrectly?: boolean; firstLetterGuide?: boolean }) {
  const tiles = asArray<Tile>(exercise.tiles);
  const target = asArray<string>(asRecord(exercise.answer).targetTileIds);
  const [chosen, setChosen] = useState<string[]>(() => answeredCorrectly ? [...target] : target.map(() => ''));
  const [destination, setDestination] = useState<number>();
  const [guideStep, setGuideStep] = useState<'demo' | 'word'>(firstLetterGuide ? 'demo' : 'word');
  const [guideRetry, setGuideRetry] = useState(false);
  const guideIndex = firstLetterGuide ? chosen.indexOf('') : -1;
  const guidedTile = useRef<HTMLButtonElement>(null);
  const guidedSlot = useRef<HTMLButtonElement>(null);
  const tileBank = useRef<HTMLDivElement>(null);
  const demoCard = useRef<HTMLElement>(null);
  useEffect(() => { if (guideStep === 'demo') scrollDemoIntoView(demoCard.current); }, [guideStep, guideIndex]);
  useEffect(() => {
    if (!firstLetterGuide || guideStep === 'demo' || guideIndex < 0 || !canAnswer) return;
    guidedTile.current?.focus({ preventScroll: true });
    tileBank.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    guidedSlot.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [firstLetterGuide, guideStep, guideIndex, canAnswer]);
  const token = (id: string) => tiles.find((tile) => tile.id === id)?.token ?? '';
  const guideTileId = chosen.includes(target[guideIndex]) ? tiles.find(tile => !chosen.includes(tile.id) && tile.token === token(target[guideIndex]))?.id : target[guideIndex];
  const guideLetters = token(target[guideIndex]).length > 1;
  function choose(next: string[]) {
    if (!canAnswer) return;
    setChosen(next);
    setGuideRetry(false);
    onReset();
    if (next.length === target.length && next.every(Boolean)) onFinish(next.map(token).join(' '), next.map(token).join('\u0000') === target.map(token).join('\u0000'));
  }
  function place(id: string, index = destination ?? chosen.indexOf('')) {
    if (!canAnswer || !tiles.some(tile => tile.id === id) || index < 0 || index >= target.length) return;
    if (firstLetterGuide && (index !== guideIndex || chosen.includes(id) || token(id) !== token(target[guideIndex]))) { setGuideRetry(true); return; }
    const next = chosen.map(value => value === id ? '' : value);
    next[index] = id; choose(next); setDestination(undefined);
  }
  if (guideStep === 'demo') return <section className="cp-task-card cp-first-letter-guide">
    <Prompt exercise={exercise} onAudio={onAudio} /><WordPicture exercise={exercise} onHelp={onHelp} answeredCorrectly={answeredCorrectly} />
    <p className="cp-letter-cue">Kijk eerst</p>
    <figure ref={demoCard} className="cp-letter-demo" aria-label={`Voorbeeld: tik op ${token(target[guideIndex])}. ${guideLetters ? 'Die letters komen' : 'Die letter komt'} in vak ${guideIndex + 1}.`}>
      <span className="cp-demo-source">{token(target[guideIndex])}<Hand aria-hidden="true" /></span><ArrowRight aria-hidden="true" />
      <div>{target.map((_, index) => <span key={index}>{chosen[index] ? token(chosen[index]) : index === guideIndex ? <b className="cp-demo-arrival">{token(target[guideIndex])}</b> : ''}</span>)}</div>
    </figure>
    <button data-practice-check className="primary-button" onClick={() => { onHelp(); setGuideRetry(false); setGuideStep('word'); }}>Nu jij<ArrowRight aria-hidden="true" /></button>
  </section>;
  return <section className={`cp-task-card${firstLetterGuide ? ' cp-first-letter-guide' : ''}`}><Prompt exercise={exercise} onAudio={onAudio} /><WordPicture exercise={exercise} onHelp={onHelp} answeredCorrectly={answeredCorrectly} />
    {firstLetterGuide && <output className="cp-letter-cue">{guideIndex < 0 ? 'Het woord is klaar.' : `${guideRetry ? 'Kijk naar het voorbeeld. ' : ''}Tik op dezelfde ${guideLetters ? 'letters' : 'letter'}.`}</output>}
    <div className={`cp-build-slots ${exercise.buildKind === 'sentence' ? 'cp-sentence-slots' : ''}`} aria-label={exercise.buildKind === 'sentence' ? 'Jouw zin' : 'Jouw woord'} aria-live="polite">{target.map((_, index) => <button key={index} ref={index === guideIndex ? guidedSlot : undefined} disabled={!canAnswer} aria-pressed={destination === index} aria-label={`Plek ${index + 1}${chosen[index] ? `: ${token(chosen[index])}, weghalen` : index === guideIndex ? `, leeg, voorbeeld: ${token(target[guideIndex])}` : ', leeg'}`}
      onDragOver={event => { if (canAnswer) event.preventDefault(); }} onDrop={event => { event.preventDefault(); place(event.dataTransfer.getData('text/plain'), index); }}
      onClick={() => { if (!firstLetterGuide) setDestination(index); if (chosen[index]) choose(chosen.map((value, at) => at === index ? '' : value)); }}>{chosen[index] ? token(chosen[index]) : index === guideIndex ? <span className="cp-letter-model">{token(target[guideIndex])}</span> : ''}</button>)}</div>
    <div className="cp-tile-bank" ref={tileBank}>{tiles.map(tile => <button key={tile.id} ref={tile.id === guideTileId ? guidedTile : undefined} className={tile.id === guideTileId ? 'cp-first-tile' : undefined} aria-label={tile.id === guideTileId ? `${tile.token}, ${guideIndex === 0 ? 'begin hier' : guideLetters ? 'deze letters nu' : 'deze letter nu'}` : undefined} draggable={canAnswer && !chosen.includes(tile.id)} disabled={!canAnswer || chosen.includes(tile.id)} onDragStart={event => { event.dataTransfer.setData('text/plain', tile.id); event.dataTransfer.effectAllowed = 'move'; }} onClick={() => place(tile.id)}>{tile.token}{tile.id === guideTileId && <Hand aria-hidden="true" />}</button>)}</div>
    <div className="cp-task-actions"><button className="secondary-button" onClick={() => { const at = chosen.findLastIndex(Boolean); choose(chosen.map((value, index) => index === at ? '' : value)); }} disabled={!canAnswer || !chosen.some(Boolean)}><RotateCcw />Eén terug</button>{firstLetterGuide && <button className="secondary-button" disabled={answeredCorrectly} onClick={() => { onHelp(); setGuideStep('demo'); }}>Kijk nog eens</button>}<WordHint exercise={exercise} onHelp={onHelp} /></div><MeaningContexts exercise={exercise} onAudio={onAudio} /></section>;
}

function WordHint({ exercise, onHelp }: { exercise: PackageExercise; onHelp: () => void }) {
  const [shown, setShown] = useState(false);
  const hint = useRef<HTMLDivElement>(null);
  useEffect(() => { if (shown) hint.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [shown]);
  if (typeof exercise.helpWord !== 'string') return null;
  return <div className="cp-word-hint" ref={hint}>{shown && <><strong>{exercise.helpWord}</strong>{typeof exercise.meaning === 'string' && <p>{exercise.meaning}</p>}</>}<button className="secondary-button" aria-expanded={shown} onClick={() => { if (!shown) onHelp(); setShown(!shown); }}>{shown ? 'Verberg voorbeeld' : 'Help'}</button></div>;
}

function InputSurface({ exercise, onAudio, onFinish, onReset, canAnswer, onHelp, answeredCorrectly = false }: SurfaceProps & { onReset: () => void; canAnswer: boolean; onHelp: () => void; answeredCorrectly?: boolean }) {
  const fields = asArray<TextField>(exercise.fields);
  const [value, setValue] = useState('');
  const accepted = fields.flatMap((field) => field.acceptedAnswers ?? []);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><WordPicture exercise={exercise} onHelp={onHelp} answeredCorrectly={answeredCorrectly} /><MeaningContexts exercise={exercise} onAudio={onAudio} /><form className="cp-dictation-form" onSubmit={event => { event.preventDefault(); if (canAnswer && value.trim()) onFinish(value, accepted.some(answer => normalize(answer) === normalize(value))); }}><label className="cp-text-entry"><span>Jouw antwoord</span><input disabled={!canAnswer} value={value} onChange={(event) => { setValue(event.target.value); onReset(); }} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} /></label><button data-practice-check type="submit" className="primary-button" disabled={!canAnswer || !value.trim()}>Controleer<Check /></button></form><WordHint exercise={exercise} onHelp={onHelp} /></section>;
}

function MeaningContexts({ exercise, onAudio }: { exercise: PackageExercise; onAudio: AudioPlayer }) {
  const contexts = wordMeaningContexts(exercise);
  const [selected, setSelected] = useState(0);
  const photoView = useExerciseViewTarget('photo', Boolean(contexts[selected]?.image));
  const textView = useExerciseViewTarget('text', contexts.length > 0);
  if (!contexts.length) return null;
  const context = contexts[selected] ?? contexts[0];
  return <aside className="cp-meaning-contexts" aria-label="Betekenissen in een situatie">
    <div className="cp-task-actions">{contexts.map((item, index) => <button key={item.label} className="secondary-button" aria-label={item.label} aria-pressed={index === selected} onClick={() => setSelected(index)}>{item.choice ?? item.label}</button>)}</div>
    {context.optional && <small>Andere betekenis · uitbreiding met je docent</small>}
    <div className="cp-meaning-example">{context.image && <Image {...photoView} unoptimized src={context.image} alt={context.label} width={80} height={80} />}<div {...textView}><p>{context.meaning}</p><p>{context.example}</p></div></div>
    {context.audio && <button className="secondary-button" onClick={() => onAudio(context.audio)}>Luister naar de voorbeeldzin<Volume2 /></button>}
  </aside>;
}

function WordPicture({ exercise, onHelp }: { exercise: PackageExercise; onHelp: () => void; answeredCorrectly: boolean }) {
  if (wordMeaningContexts(exercise).length) return null;
  const image = exerciseImage(exercise) ?? (!exercise.contextId && exercise.buildKind !== 'sentence' ? wordPictures.get(String(exercise.wordId)) : undefined);
  if (!image) return null;
  return <div className="cp-picture-help"><ExerciseImageView optional image={image} onReveal={onHelp} /></div>;
}

function ReadingSurface({ exercise, onAudio, onFinish, guided, canAnswer }: SurfaceProps & { guided: boolean; canAnswer: boolean }) {
  const readingSupport = readingSupportForExercise(exercise);
  const textView = useExerciseViewTarget('text');
  const blocks = asArray<{ id: string; text: string; speaker?: string; audio?: unknown }>(exercise.textBlocks);
  const image = exerciseImage(exercise);
  const audio = exercise.prompt?.audio?.src;
  return <section className={`cp-task-card cp-context-card${isBeginnerLesson(exercise, guided) && exercise.mode === 'listen-situation' ? ' cp-beginner-listening' : ''}`}><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-context-layout">{image && (audio ? <button className="cp-context-image" aria-label="Luister bij de foto" onClick={() => onAudio(audio)}><ExerciseImageView optional image={image} /></button> : <ExerciseImageView optional image={image} />)}<div {...textView} className={`cp-reading-blocks${readingSupport ? ' cp-reading-support' : ''}`}>{blocks.map(block => {
    const source = wordMeaningContexts(exercise).some(c => c.audio) ? undefined : findAudioSource(block.audio);
    return source ? <button key={block.id} aria-label={`Luister: ${block.speaker ? `${block.speaker}: ` : ''}${block.text}`} onClick={() => onAudio(source)}>{block.speaker && <small>{block.speaker}<br /></small>}{block.text}</button> : <p key={block.id}>{block.text}</p>;
  })}{readingSupport && <aside aria-label="Betekenis en voorbeeld"><p>{readingSupport.meaning}</p><p>{readingSupport.example}</p><small>Lees de voorbeeldzin samen. Leg in je eigen woorden uit wat het woord hier betekent.</small></aside>}<MeaningContexts exercise={exercise} onAudio={onAudio} /></div></div>{!guided && <button data-practice-check className="primary-button" disabled={!canAnswer} onClick={() => onFinish('samen geoefend', true)}>Klaar<Check /></button>}</section>;
}

function LinkedQuestionSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const linkedId = asString(asRecord(exercise.responseComponent).exerciseId);
  const linked = pack.exercises.find((item) => item.exerciseId === linkedId);
  if (!linked || !findAudioSource(exercise)) return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><p className="cp-audio-lock"><CircleAlert />Vraag je docent om hulp.</p></section>;
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><ChoiceSurface exercise={linked} onAudio={onAudio} onFinish={onFinish} nested /></section>;
}

function SpeakSurface({ exercise, onAudio, onFinish, onRecordingChange }: SurfaceProps) {
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView optional image={image} />}<Recorder onFinish={onFinish} onRecordingChange={onRecordingChange} /></section>;
}

function Recorder({ onFinish, onRecordingChange }: { onFinish: SurfaceProps['onFinish']; onRecordingChange?: (busy: boolean) => void }) {
  const [recording, setRecording] = useState(false);
  const [playingRecording, setPlayingRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('Neem je stem op en luister terug.');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const mounted = useRef(true);
  const [requesting, setRequesting] = useState(false);
  useEffect(() => { onRecordingChange?.(recording || requesting || playingRecording); return () => onRecordingChange?.(false); }, [recording, requesting, playingRecording, onRecordingChange]);

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

  return <div className="cp-recorder" data-practice-recording={recording || requesting || playingRecording}><output aria-live="polite">{message}</output><button aria-disabled={requesting} className={recording ? 'recording' : ''} onClick={toggle}>{recording ? <Pause /> : <Mic />}<span>{requesting ? 'Even wachten' : recording ? 'Stop' : 'Neem op'}</span></button>{audioUrl && <audio onPlay={() => setPlayingRecording(true)} onPause={() => setPlayingRecording(false)} onEnded={() => setPlayingRecording(false)} onError={() => setPlayingRecording(false)} ref={applyDefaultAudioRate} controls src={audioUrl} aria-label="Jouw opname" />}<button data-practice-check className="primary-button" disabled={recording || requesting || playingRecording} onClick={() => onFinish(audioUrl ? 'opgenomen' : 'hardop geoefend', true, 'Je hebt geoefend. Luister zelf of samen met je docent.')}>Klaar<Check /></button></div>;
}

function WritingSurface({ exercise, onAudio, onFinish, onReset }: SurfaceProps & { onReset: () => void }) {
  const [value, setValue] = useState('');
  const maxLength = Number(asRecord(exercise.textPolicy).maxLength ?? 1000);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><label className="cp-text-entry"><span>Schrijf hier</span><textarea value={value} onChange={(event) => { setValue(event.target.value); onReset(); }} maxLength={maxLength} rows={6} /></label><button data-practice-check className="primary-button" disabled={!value.trim()} onClick={() => onFinish(value, true, 'Opgeslagen voor zelf- of docentcontrole.')}>Bewaar<Check /></button></section>;
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
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-form-fields">{fields.map((field) => <label key={field.fieldId}><span>{field.label}</span>{field.type === 'select' ? <select value={values[field.fieldId] ?? ''} onChange={(event) => { setValues({ ...values, [field.fieldId]: event.target.value }); onReset(); }}><option value="">Kies</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} value={values[field.fieldId] ?? ''} onChange={(event) => { setValues({ ...values, [field.fieldId]: event.target.value }); onReset(); }} />}</label>)}</div><button data-practice-check className="primary-button" onClick={() => onFinish(JSON.stringify(values), valid())}>Controleer<Check /></button></section>;
}

function TraceSurface({ exercise, onAudio, onFinish, onReset, canAnswer }: SurfaceProps & { onReset: () => void; canAnswer: boolean }) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const target = asString(exercise.target);
  const input = <label className="cp-text-entry"><span>Jouw antwoord</span><input value={value} autoComplete="off" spellCheck={false} onChange={event => { setValue(event.target.value); setRevealed(false); onReset(); }} /></label>;
  if (exercise.hideWritingModel) return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{input}
    {revealed ? <><strong className="cp-paper-model">{target}</strong><p>Vergelijk met jouw woord.</p><button data-practice-check className="primary-button" onClick={() => onFinish(value, normalize(value) === normalize(target), 'Bespreek jouw schrijfwerk met je docent.')}>Klaar<Check /></button></>
      : <button data-practice-check className="primary-button" disabled={!canAnswer || !value.trim()} onClick={() => setRevealed(true)}>Vergelijk<Check /></button>}
  </section>;
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-trace-model"><PencilLine /><strong>{target}</strong><span>{exercise.letterModelOnly ? 'Typ de letter hieronder.' : 'Typ dit woord hieronder.'} Papier is een extra.</span></div>{input}<button data-practice-check className="primary-button" disabled={!value.trim() || !canAnswer} onClick={() => onFinish(value, normalize(value) === normalize(target), 'Vergelijk jouw antwoord met het model.')}>Ik heb geschreven<Check /></button></section>;
}

function SequenceSurface({ exercise, onFinish, onReset, canAnswer, onHelp, answeredCorrectly }: Pick<SurfaceProps, 'exercise' | 'onFinish'> & { onReset: () => void; canAnswer: boolean; onHelp: () => void; answeredCorrectly: boolean }) {
  const items = asArray<ExerciseItem>(exercise.items);
  const target = asArray<string>(exercise.targetOrderIds);
  const [chosen, setChosen] = useState<string[]>([]);
  const bank = useRef<HTMLDivElement>(null);
  const itemContent = (item: ExerciseItem) => <>{item.content?.image && <ExerciseImageView image={item.content.image} />}{item.text ?? item.content?.text}</>;
  function add(id: string) { if (!canAnswer || answeredCorrectly || chosen.includes(id) || !items.some(item => item.itemId === id)) return; setChosen([...chosen, id]); onReset(); requestAnimationFrame(() => bank.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()); }
  return <section className="cp-task-card cp-standard-task" data-standard-player="order"><Prompt exercise={exercise} />
    {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Dropping supplements the keyboard/tap buttons below. */}
    <ol className="cp-sequence-result" aria-label="Jouw volgorde" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); add(event.dataTransfer.getData('text/plain')); }}>{chosen.map(id => <li key={id}>{itemContent(items.find(item => item.itemId === id)!)}</li>)}</ol>
    <div className="cp-sequence-options" ref={bank}>{items.map(item => <button key={item.itemId} data-order-item={item.itemId} disabled={!canAnswer || answeredCorrectly || chosen.includes(item.itemId)} draggable={!chosen.includes(item.itemId) && canAnswer && !answeredCorrectly} onDragStart={event => event.dataTransfer.setData('text/plain', item.itemId)} onClick={() => add(item.itemId)}>{itemContent(item)}</button>)}</div>
    <div className="cp-task-actions"><button className="secondary-button" disabled={!chosen.length || answeredCorrectly} onClick={() => { const id = chosen.at(-1)!; setChosen(chosen.slice(0, -1)); onReset(); requestAnimationFrame(() => Array.from(bank.current?.querySelectorAll<HTMLButtonElement>('button') ?? []).find(button => button.dataset.orderItem === id)?.focus()); }}><RotateCcw />Eén terug</button><button data-practice-check className="primary-button" disabled={!canAnswer || answeredCorrectly || chosen.length !== items.length} onClick={() => onFinish(chosen.join('|'), orderAccepted(chosen, target, asArray<string[]>(exercise.acceptedOrderIds)))}>Controleer<Check /></button></div>
    <WordHint exercise={exercise} onHelp={onHelp} />
  </section>;
}

function BoardSurface({ exercise, onAudio, onFinish, canAnswer }: SurfaceProps & { canAnswer: boolean }) {
  const cells = asArray<{ cellId: string; text?: string; image?: ExerciseImage }>(exercise.cells);
  const marked = asArray<string>(exercise.markedCellIds);
  const targetId = asString(asRecord(exercise.answer).correctCellId);
  const [selected, setSelected] = useState('');
  const complete = selected === targetId;
  function chooseCell(cellId: string) {
    if (!canAnswer || complete || marked.includes(cellId)) return;
    setSelected(cellId);
    onFinish(cellId, cellId === targetId, cellId === targetId ? marked.length + 1 === cells.length ? 'De kaart is vol!' : 'Goed. Luister naar het volgende woord.' : 'Luister opnieuw. Kies een ander vak.');
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><p className="cp-round-progress">{marked.length + (complete ? 1 : 0)} / {cells.length}</p><div className="cp-board-grid">{cells.map(cell => {
    const done = marked.includes(cell.cellId) || (complete && cell.cellId === selected);
    return <button key={cell.cellId} disabled={!canAnswer || done || complete} className={done ? 'marked' : selected === cell.cellId ? 'selected' : ''} onClick={() => chooseCell(cell.cellId)}>{cell.image ? <ExerciseImageView image={cell.image} word={cell.text} /> : <strong>{cell.text}</strong>}{done && <Check aria-label="Gevonden" />}</button>;
  })}</div></section>;
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
        } else onFinish(next.join('|'), false, 'Onthoud deze plekken. Zoek het woord en de foto die bij elkaar horen.');
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
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-sort-items">{items.map((item) => <button key={item.itemId} className={selected === item.itemId ? 'selected' : ''} aria-pressed={selected === item.itemId} disabled={Boolean(placed[item.itemId])} onClick={() => setSelected(item.itemId)}>{item.content?.text}</button>)}</div><div className="cp-sort-categories">{categories.map((category) => <button key={category.categoryId} onClick={() => { if (!selected) return; setPlaced({ ...placed, [selected]: category.categoryId }); setSelected(''); }}>{category.label}<small>{Object.values(placed).filter((value) => value === category.categoryId).length} woorden</small></button>)}</div><button data-practice-check className="primary-button" disabled={Object.keys(placed).length !== items.length} onClick={() => onFinish(JSON.stringify(placed), items.every((item) => assignments[item.itemId] === placed[item.itemId]))}>Controleer<Check /></button></section>;
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
  const textView = useExerciseViewTarget('text');
  const cards = asArray<{ cardId: string; front?: { image?: ExerciseImage; text?: string }; back?: { text?: string }; audio?: unknown }>(exercise.cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];
  const backText = card?.back?.text ?? wordForImage(pack, card?.front?.image) ?? 'Luister naar het woord';
  const source = findAudioSource(card?.audio);
  const articleId = useId();
  const phrase = wordWithArticle(pack.words.find(word => word.id === card?.cardId && word.word === backText) ?? pack.words.find(word => word.image && word.image === card?.front?.image?.src && word.word === backText));
  return <section className="cp-task-card">
    {source && <ExerciseListen label="Luister naar het woord" onClick={() => onAudio(source)} />}
    {card && <button className={`cp-flash-card ${flipped ? 'flipped' : ''}`} aria-describedby={flipped && phrase ? articleId : undefined} aria-label={card.front?.text ? flipped ? 'Toon het eerste woord' : 'Toon het synoniem' : flipped ? 'Toon de foto' : 'Toon het woord'} aria-pressed={flipped} onClick={() => { setFlipped(!flipped); if (!flipped && cards.length === 1) onFinish('kaart bekeken', true); }}><span key={index} className="cp-card-turn"><span className="cp-card-face cp-card-front" aria-hidden={flipped}>{card.front?.text ? <strong {...textView}>{card.front.text}</strong> : <ExerciseImageView optional image={card.front?.image} word={backText} />}</span><span className="cp-card-face cp-card-back" aria-hidden={!flipped}><strong {...textView}>{backText}{phrase && <small id={articleId} className="cp-word-article">{phrase}</small>}</strong></span></span></button>}
    <span className="cp-card-hint">Tik op de kaart.</span>
    <div className="cp-task-actions">
      {cards.length > 1 && <><button data-practice-step-previous className="secondary-button" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}><ArrowLeft />Vorige</button><button data-practice-step-next data-practice-check className="primary-button" onClick={() => { if (index >= cards.length - 1) onFinish('kaartenset afgerond', true); else { setIndex(index + 1); setFlipped(false); } }}>{index >= cards.length - 1 ? 'Klaar' : 'Verder'}<small aria-hidden="true">Enter / →</small><ArrowRight /></button></>}
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
  onRecordingChange?: (busy: boolean) => void;
  exercise: PackageExercise;
  onAudio: AudioPlayer;
  onFinish: (answer: string, correct: boolean, feedback?: string) => void;
};
