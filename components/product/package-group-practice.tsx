'use client';
import { LearnerExerciseInfo } from './learner-exercise-info';
import { usePracticeKeyboard } from '@/hooks/use-practice-keyboard';
import { useWordListeningHelp } from '@/hooks/use-word-listening-help';
import { recordRoundSteps } from '@/lib/round-progress';
import { RoundProgressNotice } from './round-progress';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowRightLeft, BookOpen, Check, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, RefreshCw, Search, Shuffle, Volume2 } from 'lucide-react';
import { ExerciseAudioProvider, ExerciseAudioSlot } from './exercise-listen';
import { BuildSurface, ExerciseSurface, findAudioSource, PackageExerciseBrowser } from './package-exercise-browser';
import { stopMedia } from './shared';
import { isInstructionAudioEnabled } from '@/lib/audio-policy';
import { groupActivities, groupExercises, groupSessionKey, restoreGroupSession, type GroupActivity } from '@/lib/group-practice';
import { allPackageWords, type AudioPlayer, type PackageDefinition, type PackageExercise, type PackageLesson, type PracticeAttempt } from '@/lib/package-content';
import { selectExerciseSet, levelLabel, type ContentSelection } from '@/lib/content-levels';
import { practiceStages, scopeWordExercises, selectUsageExercises, type RouteSettings, type ContentReadiness } from '@/lib/learner-route';
import { useRouteSettings } from './route-settings';
import { PracticeLine } from './practice-line';
import { ExerciseMenu, type ExerciseMenuProps } from './exercise-menu';
import { isSynonymPack, parseSynonymSettings, synonymActivities, synonymExercises } from '@/lib/synonyms';
import { isWordUsePack } from '@/lib/word-use';

const icons = { eye: Eye, ear: Ear, image: ImageIcon, link: Link2, puzzle: Puzzle, grid: Grid2X2, keyboard: Keyboard, pen: PencilLine, mic: Mic, book: BookOpen, search: Search, chat: MessageCircle };
const sheetActivities: GroupActivity[] = ['meet', 'same-word', 'listen', 'hear-word', 'read', 'build-model', 'build', 'missing', 'copy', 'dictation'];
function scrollToStart() { document.querySelector('.learner-main')?.scrollTo({ top: 0, behavior: 'instant' }); window.scrollTo({ top: 0, behavior: 'instant' }); }

export function PackageGroupPractice({ pack, onAudio, onAttempt, selection = { level: 'all' }, wordIds, scopeId = '', onUse, onMixed, usage }: { pack: PackageDefinition; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; selection?: ContentSelection; wordIds?: string[]; scopeId?: string; onUse?: () => void; onMixed?: () => void; usage?: { lesson?: PackageLesson; settings: RouteSettings; readiness: ContentReadiness } }) {
  const [activity, setActivity] = useState<GroupActivity>();
  const [round, setRound] = useState(0);
  const [selectedStage, setSelectedStage] = useState<string>();
  useEffect(scrollToStart, [activity]);
  const available = useMemo(() => groupActivities.filter(item => item.id !== 'learning-review').flatMap(item => {
    const useActivity = practiceStages.find(stage => stage.id === 'use')!.activities.includes(item.id);
    if ((onUse && useActivity) || (usage && !useActivity)) return [];
    const original = groupExercises(pack, item.id);
    const exercises = usage ? selectUsageExercises(original, pack, usage.lesson, usage.settings, usage.readiness) : selectExerciseSet(scopeWordExercises(original, wordIds), selection);
    return exercises.length ? [{ ...item, count: exercises.length, exercises }] : [];
  }), [pack, selection, wordIds, onUse, usage]);
  function back() { stopMedia(); setActivity(undefined); }
  if (activity) return <section className="cp-group-practice">
    <button className="text-back" onClick={back}><ArrowLeft />Alle oefeningen</button>
    <GroupRound exerciseMenu={{ value: activity, options: available.map(item => ({ id: item.id, label: item.label, icon: icons[item.icon] })), onSelect: id => {
      const next = available.find(item => item.id === id);
      if (next) { stopMedia(); setActivity(next.id); }
    } }} key={`${pack.id}:${activity}:${round}`} pack={pack} activity={activity} exerciseSet={available.find(item => item.id === activity)?.exercises ?? []} sessionId={!usage && !scopeId && selection.level === 'all' && (!selection.help || selection.help === 'all') ? undefined : `${pack.id}:${selection.level}:${selection.help ?? 'all'}:${scopeId}${usage ? `:use:${usage.settings.language}:${usage.readiness}` : ''}`} onAudio={onAudio} onAttempt={onAttempt} onBack={back} onAgain={() => setRound(value => value + 1)} />
  </section>;
  return <section className="cp-panel cp-group-practice" data-group-practice>
    <header className="cp-panel-heading"><h1 className="sr-only">{usage ? 'Oefenen met zinnen en situaties' : 'Oefenen met deze woorden'}</h1></header>
    {!usage && <PracticeLine available={practiceStages.filter(stage => available.some(item => stage.activities.includes(item.id)) || (stage.id === 'use' && onUse)).map(stage => stage.id)} selected={selectedStage} onSelect={id => {
      if (id === 'use' && onUse) { onUse(); return; }
      setSelectedStage(id);
      const heading = document.querySelector<HTMLElement>(`[data-practice-stage="${id}"] h2`);
      heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }} />}
    {!available.length && <output>Voor deze keuze ({levelLabel(selection.level)}) zijn hier nog geen oefeningen ingedeeld. Kies samen met je docent ander aanbod.</output>}
    {practiceStages.filter(stage => !usage || available.some(item => stage.activities.includes(item.id))).map(stage => <section key={stage.id} className="cp-activity-section" data-practice-stage={stage.id}>
      <h2 tabIndex={-1}>{stage.label}</h2><p>{stage.description}</p>
      {!available.some(item => stage.activities.includes(item.id)) && !(stage.id === 'use' && onUse) && <p className="cp-stage-unavailable">Nog niet bij deze keuze.</p>}
      {stage.id === 'use' && onUse ? <button className="secondary-button" onClick={onUse}>Bekijk zinnen en situaties<ArrowRight /></button> : <div className="cp-activity-grid">{available.filter(item => stage.activities.includes(item.id)).map(item => {
        const Icon = icons[item.icon];
        return <button className="cp-activity-button" key={item.id} data-activity={item.id} onClick={() => { stopMedia(); setSelectedStage(stage.id); setActivity(item.id); }}>
          <Icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" />
        </button>;
      })}</div>}
      {stage.id === 'recall' && onMixed && !scopeId && selection.level === 'all' && (!selection.help || selection.help === 'all') && <button className="secondary-button" onClick={onMixed}>Woordenmix<RefreshCw /></button>}
    </section>)}
  </section>;
}

type GroupRoundProps = { progressId?: string; progressExerciseIds?: string[]; legacySessionId?: string; pack: PackageDefinition; activity: GroupActivity; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; onBack: () => void; onAgain: () => void; exerciseSet?: PackageExercise[]; sessionId?: string; backLabel?: string; exerciseMenu?: ExerciseMenuProps };

export function GroupRound(props: GroupRoundProps) {
  if (isWordUsePack(props.pack)) return <div className="cp-synonym-round"><GroupRoundPlayer {...props} /></div>;
  return isSynonymPack(props.pack) && synonymActivities.some(id => id === props.activity) ? <SynonymRound {...props} /> : <GroupRoundPlayer {...props} />;
}

function SynonymRound(props: GroupRoundProps) {
  const settingsKey = `klink.synonym-settings.v1:${props.pack.id}`;
  const [settings, setSettings] = useState(() => {
    try { return parseSynonymSettings(localStorage.getItem(settingsKey)); } catch { return parseSynonymSettings(null); }
  });
  useEffect(() => { try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch { /* Optional storage. */ } }, [settingsKey, settings]);
  const exercises = useMemo(() => synonymExercises(props.pack, props.activity, settings.seed, settings.reverse), [props.pack, props.activity, settings]);
  const sessionId = `${props.sessionId ?? props.pack.id}${settings.reverse ? ':reverse' : ''}`;
  function mix() {
    stopMedia();
    try { localStorage.removeItem(groupSessionKey(sessionId, props.activity)); } catch { /* Optional storage. */ }
    setSettings(current => ({ ...current, seed: current.seed === 0xffffffff ? 2 : current.seed + 1 }));
  }
  return <div className="cp-synonym-round">
    <nav className="cp-synonym-controls" aria-label="Synoniemen wisselen">
      <button className="secondary-button" aria-label="Wissel woord en synoniem" title="Wissel woord en synoniem" aria-pressed={settings.reverse} onClick={() => { stopMedia(); setSettings(current => ({ ...current, reverse: !current.reverse })); }}><ArrowRightLeft aria-hidden="true" /><span className="cp-synonym-label">Wissel woord en synoniem</span></button>
      <button className="secondary-button" aria-label="Mix de kaarten" title="Mix de kaarten" onClick={mix}><Shuffle aria-hidden="true" /><span className="cp-synonym-label">Mix de kaarten</span></button>
    </nav>
    {exercises.length ? <GroupRoundPlayer {...props} key={`${settings.reverse}:${settings.seed}`} exerciseSet={exercises} sessionId={sessionId} progressId={props.progressId ? `${props.progressId}${settings.reverse ? ':reverse' : ''}` : undefined} onAgain={mix} /> : <p>Voor deze richting is nog geen geluid beschikbaar. Wissel woord en synoniem of kies een andere oefening.</p>}
  </div>;
}

function GroupRoundPlayer({ progressId, progressExerciseIds, legacySessionId, pack, activity, onAudio, onAttempt, onBack, onAgain, exerciseSet, sessionId, backLabel = 'Alle oefeningen', exerciseMenu }: GroupRoundProps) {
  const exercises = useMemo(() => exerciseSet ?? groupExercises(pack, activity), [pack, activity, exerciseSet]);
  const storageKey = groupSessionKey(sessionId ?? pack.id, activity, progressId);
  const legacyStorageKey = groupSessionKey(legacySessionId ?? sessionId ?? pack.id, activity);
  const [session, setSession] = useState(() => {
    try { return restoreGroupSession(localStorage.getItem(storageKey) ?? (legacySessionId ? localStorage.getItem(legacyStorageKey) : null), exercises, progressId, storageKey === legacyStorageKey ? null : localStorage.getItem(legacyStorageKey)); } catch { return { done: false }; }
  });
  const completionKeys = usePracticeKeyboard();
  const [initialId] = useState(session.exerciseId);
  const [sheet, setSheet] = useState(false);
  const [sheetOpened, setSheetOpened] = useState(false);
  useEffect(scrollToStart, [sheet]);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...session })); } catch { /* Optional storage. */ } }, [session, storageKey]);
  const title = groupActivities.find(item => item.id === activity)!.label;
  function recordAttempt(attempt: PracticeAttempt) {
    if (progressId && attempt.correct) recordRoundSteps(progressId, progressExerciseIds ?? exercises.map(e => e.exerciseId), [attempt.exerciseId]);
    onAttempt?.(attempt);
  }
  function restart() { try { if (legacySessionId || storageKey !== legacyStorageKey) localStorage.setItem(storageKey, JSON.stringify({ version: 1, done: false })); else localStorage.removeItem(storageKey); for (const exercise of exercises) { localStorage.removeItem(`klink.taalroute.content-workflow.v1:${exercise.exerciseId}`); } for (const key of Object.keys(localStorage)) if(key.startsWith(`klink.taalroute.content-initial.v1:${storageKey}:`)) localStorage.removeItem(key); } catch { /* Optional storage. */ } stopMedia(); onAgain(); }
  if (session.done) return <><RoundProgressNotice />{exerciseMenu && <ExerciseMenu {...exerciseMenu} />}<section {...completionKeys} className="honest-empty"><Check /><h2 tabIndex={-1} ref={node => node?.focus()}>Goed geoefend</h2><button className="primary-button" onClick={restart}><RefreshCw />Nog een keer</button><button data-practice-next aria-keyshortcuts="Enter ArrowRight" className="secondary-button" onClick={onBack}>{backLabel}<ArrowRight /></button></section></>;
  if (activity === 'worksheet' || activity === 'worksheet-heard') return <><RoundProgressNotice />{exerciseMenu && <ExerciseMenu {...exerciseMenu} />}<BuildWorksheet showTitle={!exerciseMenu} exercises={exercises} onAudio={onAudio} onAttempt={recordAttempt} initialId={initialId} onPosition={exerciseId => setSession(current => ({ ...current, exerciseId }))} onDone={() => setSession(current => ({ ...current, done: true }))} /></>;
  const canUseSheet = sheetActivities.includes(activity) && exercises.length > 1;
  return <><RoundProgressNotice />
    {canUseSheet && <fieldset className="cp-practice-display" aria-label="Hoe wil je oefenen?">
      <button className="secondary-button" aria-pressed={!sheet} onClick={() => { stopMedia(); setSheet(false); }}><Eye aria-hidden="true" />Eén voor één</button>
      <button className="secondary-button" aria-pressed={sheet} onClick={() => { stopMedia(); setSheetOpened(true); setSheet(true); }}><Grid2X2 aria-hidden="true" />Op één blad</button>
    </fieldset>}
    {sheet && exerciseMenu && <ExerciseMenu {...exerciseMenu} />}
    {sheetOpened && <div hidden={!sheet}><PracticeSheet pack={pack} exercises={exercises} title={title} showTitle={!exerciseMenu} active={sheet} onAudio={onAudio} onAttempt={recordAttempt} onBack={onBack} /></div>}
    {!sheet && <PackageExerciseBrowser exerciseMenu={exerciseMenu} pack={pack} exercises={exercises.map(exercise=>exercise.componentId==='KLINK-CONTENT'?{...exercise,contentSessionId:storageKey}:exercise)} onAudio={onAudio} guided practiceRound title={title} description="" initialExerciseId={session.exerciseId}
    onPosition={exerciseId => setSession(current => current.exerciseId === exerciseId ? current : { ...current, exerciseId })}
    onAttempt={recordAttempt} onLessonDone={() => setSession(current => ({ ...current, done: true }))} onComplete={onBack} />}
  </>;
}

function PracticeSheet({ pack, exercises, title, showTitle, active, onAudio, onAttempt, onBack }: { pack: PackageDefinition; exercises: PackageExercise[]; title: string; showTitle: boolean; active: boolean; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; onBack: () => void }) {
  const playback = useRef<AbortController | null>(null);
  const keyboard = usePracticeKeyboard({ enabled: active });
  useEffect(() => { if (active) keyboard.ref.current?.querySelector<HTMLElement>('[data-practice-item]')?.focus({ preventScroll: true }); }, [active, keyboard.ref]);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { if (!active) playback.current?.abort(); return () => playback.current?.abort(); }, [active]);
  function startPlayback() { playback.current?.abort(); const controller = new AbortController(); playback.current = controller; return controller; }
  return <section {...keyboard} className="cp-practice-sheet cp-page-workspace" aria-label={title}>
    <header>{showTitle && <h2>{title}</h2>}<output aria-label={`${done.length} van ${exercises.length} geoefend`}>{done.length} / {exercises.length}</output></header>
    <div className="cp-practice-sheet-grid">{exercises.map((exercise, index) => <SheetExercise key={`${round}:${exercise.exerciseId}`} pack={pack} exercise={exercise} number={index + 1} onAudio={onAudio} startPlayback={startPlayback} onAttempt={onAttempt} onDone={() => setDone(current => current.includes(exercise.exerciseId) ? current : [...current, exercise.exerciseId])} />)}</div>
    <footer><button className="secondary-button" onClick={() => { playback.current?.abort(); stopMedia(); setDone([]); setRound(value => value + 1); }}><RefreshCw />Nog een keer</button><button data-practice-next aria-keyshortcuts="Enter ArrowRight" className="primary-button" onClick={() => { playback.current?.abort(); stopMedia(); onBack(); }}>Klaar<Check /></button></footer>
  </section>;
}

function SheetExercise({ pack, exercise, number, onAudio, startPlayback, onAttempt, onDone }: { pack: PackageDefinition; exercise: PackageExercise; number: number; onAudio: AudioPlayer; startPlayback: () => AbortController; onAttempt?: (attempt: PracticeAttempt) => void; onDone: () => void }) {
  const { view } = useRouteSettings();
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [audioError, setAudioError] = useState(false);
  const [heard, setHeard] = useState(!exercise.requiresAudio);
  const [playing, setPlaying] = useState(false);
  const row = useRef<HTMLElement>(null);
  useEffect(() => { if (result === 'right' && !playing && row.current?.closest('[data-practice-keyboard="true"]')) row.current.focus({ preventScroll: true }); }, [result, playing]);
  const playback = useRef<AbortController | null>(null);
  const metrics = useRef({ started: 0, attempts: 0, helpUsed: false, plays: 0 });
  useWordListeningHelp(row, phase => { if (phase === 'end' || phase === 'browse') return; if (phase === 'request') metrics.current.helpUsed = true; playback.current?.abort(); setPlaying(false); });
  const model = exercise.componentId === 'ALF-CMP-001';
  useEffect(() => { metrics.current.started = Date.now(); return () => playback.current?.abort(); }, []);
  function finish(answer: string, correct: boolean) {
    if (result === 'right') return;
    metrics.current.attempts++;
    onAttempt?.({ exerciseId: exercise.exerciseId, mode: exercise.mode, answer, correct, attempts: metrics.current.attempts, helpUsed: metrics.current.helpUsed,
      support: model || typeof exercise.exampleWord === 'string' || (!exercise.audioOnly && view.photo && ['ALF-CMP-005', 'ALF-CMP-006'].includes(exercise.componentId) && pack.words.some(word => word.id === exercise.wordId && word.image)) ? 'model' : metrics.current.helpUsed ? 'requested-help' : 'none', ...(!exercise.audioOnly ? { pictureSupport: view.photo ? 'always' as const : 'request' as const } : {}), elapsedMs: Date.now() - metrics.current.started,
      objective: typeof exercise.objective === 'string' ? exercise.objective : `${exercise.mode}:${typeof exercise.wordId === 'string' ? exercise.wordId : exercise.exerciseId}`, assessment: model ? 'participation' : exercise.assessment ?? 'answer', independentReading: false, ...(exercise.writingSourceId ? {reviewEligible:false} : {}) });
    setResult(correct ? 'right' : 'wrong'); if (correct) onDone();
  }
  return <ExerciseAudioProvider><article ref={row} tabIndex={-1} data-practice-item data-practice-ready={result === 'right'} data-practice-busy={playing} className={`cp-sheet-item ${result}`} data-sheet-exercise={exercise.exerciseId} aria-label={`Opdracht ${number}`}>
    <ExerciseAudioSlot info={<LearnerExerciseInfo exercise={exercise} onHelp={() => { metrics.current.helpUsed = true; }} />} />
    <ExerciseSurface pack={pack} exercise={exercise} guided answeredCorrectly={result === 'right'} canAnswer={heard && result !== 'right'} speakingOptionId="" onOpenExercise={() => {}} onReset={() => setResult('idle')} onHelp={() => { metrics.current.helpUsed = true; }} onFinish={finish} onAudio={async source => {
      const controller = startPlayback(); playback.current = controller; setAudioError(false); setPlaying(true);
      if (exercise.readingTask) metrics.current.helpUsed = true;
      if (exercise.writingSourceId && source === exercise.prompt?.audio?.src && ++metrics.current.plays > 1) metrics.current.helpUsed = true;
      try {
        const ok = await onAudio(source, { waitUntilEnd: true, signal: controller.signal });
        if (controller.signal.aborted) return false;
        setAudioError(ok === false);
        if (ok !== false && source === (exercise.prompt?.audio?.src ?? findAudioSource(exercise))) { setHeard(true); if (model) finish('beluisterd', true); }
        return ok !== false;
      } catch { if (!controller.signal.aborted) setAudioError(true); return false; }
      finally { if (playback.current === controller) setPlaying(false); }
    }} />
    <output aria-live="polite">{audioError ? 'Luisteren lukt niet. Tik opnieuw.' : result === 'right' ? <><Check aria-hidden="true" />{model ? 'Beluisterd' : typeof exercise.correctFeedback === 'string' ? 'Goed. ' + exercise.correctFeedback : 'Goed'}</> : result === 'wrong' ? exercise.feedback || 'Probeer nog een keer.' : ''}</output>
  </article></ExerciseAudioProvider>;
}

function BuildWorksheet({ showTitle, exercises, onAudio, onAttempt, initialId, onPosition, onDone }: { showTitle: boolean; exercises: PackageExercise[]; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; initialId?: string; onPosition: (id: string) => void; onDone: () => void }) {
  const [page, setPage] = useState(() => Math.floor(Math.max(0, exercises.findIndex(item => item.exerciseId === initialId)) / 4));
  const [done, setDone] = useState<string[]>([]);
  useEffect(scrollToStart, [page]);
  const rows = exercises.slice(page * 4, page * 4 + 4);
  const ready = rows.every(item => done.includes(item.exerciseId));
  const instruction = rows[0]?.instructionAudio?.src;
  const [instructionError, setInstructionError] = useState(false);
  const [instructionPlaying, setInstructionPlaying] = useState(false);
  const keyboard = usePracticeKeyboard({ busy: instructionPlaying });
  const instructionPlayback = useRef<AbortController | null>(null);
  useWordListeningHelp(keyboard.ref, phase => { if (phase === 'end' || phase === 'browse') return; instructionPlayback.current?.abort(); setInstructionPlaying(false); });
  useEffect(() => () => instructionPlayback.current?.abort(), []);
  useEffect(() => { keyboard.ref.current?.querySelector<HTMLElement>('[data-practice-item]')?.focus({ preventScroll: true }); }, [page, keyboard.ref]);
  return <section {...keyboard} className="cp-word-worksheet cp-page-workspace" aria-label="Meer woorden maken">
    {showTitle && <h2>Meer woorden maken</h2>}
    {isInstructionAudioEnabled(instruction) && <button data-practice-listen className="secondary-button" onClick={async () => {
      instructionPlayback.current?.abort(); const controller = new AbortController(); instructionPlayback.current = controller;
      setInstructionPlaying(true);
      try { const played = await onAudio(instruction!, { waitUntilEnd: true, signal: controller.signal }); if (!controller.signal.aborted) setInstructionError(played === false); }
      catch { if (!controller.signal.aborted) setInstructionError(true); }
      finally { if (instructionPlayback.current === controller) setInstructionPlaying(false); }
    }}><Volume2 />Luister naar de opdracht</button>}
    {instructionError && <p role="alert">Het geluid lukt niet. Probeer opnieuw.</p>}
    <div className="cp-worksheet-grid">{rows.map(exercise => <WorksheetRow key={exercise.exerciseId} completed={done.includes(exercise.exerciseId)} exercise={exercise} onAudio={onAudio} onAttempt={onAttempt} onDone={() => setDone(current => current.includes(exercise.exerciseId) ? current : [...current, exercise.exerciseId])} />)}</div>
    <button data-practice-previous aria-keyshortcuts="ArrowLeft" className="secondary-button" disabled={page === 0 || instructionPlaying} onClick={() => { stopMedia(); setPage(page - 1); onPosition(exercises[(page - 1) * 4].exerciseId); }}><ArrowLeft />Vorige</button>
    <button data-practice-next aria-keyshortcuts="Enter ArrowRight" className="primary-button" disabled={!ready || instructionPlaying} onClick={() => { stopMedia(); if ((page + 1) * 4 >= exercises.length) onDone(); else { const nextPage = page + 1; setPage(nextPage); onPosition(exercises[nextPage * 4].exerciseId); } }}>Verder<ArrowRight /></button>
  </section>;
}

function WorksheetRow({ exercise, onAudio, onAttempt, onDone, completed }: { completed: boolean; exercise: PackageExercise; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; onDone: () => void }) {
  const { view } = useRouteSettings();
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>(completed ? 'right' : 'idle');
  const [audioError, setAudioError] = useState(false);
  const [heard, setHeard] = useState(!exercise.requiresAudio);
  const [playing, setPlaying] = useState(false);
  const row = useRef<HTMLElement>(null);
  useEffect(() => { if (result === 'right' && !playing && row.current?.closest('[data-practice-keyboard="true"]')) row.current.focus({ preventScroll: true }); }, [result, playing]);
  const playback = useRef<AbortController | null>(null);
  const metrics = useRef({ started: 0, attempts: 0, helpUsed: false });
  useWordListeningHelp(row, phase => { if (phase === 'end' || phase === 'browse') return; if (phase === 'request') metrics.current.helpUsed = true; playback.current?.abort(); setPlaying(false); });
  useEffect(() => { metrics.current.started = Date.now(); return () => playback.current?.abort(); }, []);
  return <ExerciseAudioProvider><article ref={row} tabIndex={-1} data-practice-item data-practice-ready={result === 'right'} data-practice-busy={playing} className={`cp-worksheet-row ${result}`} data-worksheet-exercise={exercise.exerciseId}>
    <ExerciseAudioSlot info={<LearnerExerciseInfo exercise={exercise} onHelp={() => { metrics.current.helpUsed = true; }} />} />
    <BuildSurface exercise={exercise} answeredCorrectly={result === 'right'} onAudio={async source => {
      playback.current?.abort(); const controller = new AbortController(); playback.current = controller; setPlaying(true);
      try { const ok = await onAudio(source, { waitUntilEnd: true, signal: controller.signal }); if (controller.signal.aborted) return false; setAudioError(ok === false); if (ok !== false) setHeard(true); return ok !== false; }
      catch { if (!controller.signal.aborted) setAudioError(true); return false; }
      finally { if (playback.current === controller) setPlaying(false); }
    }} canAnswer={result !== 'right' && heard} onHelp={() => { metrics.current.helpUsed = true; }} onReset={() => setResult('idle')} onFinish={(answer, correct) => {
      metrics.current.attempts++;
      onAttempt?.({ exerciseId: exercise.exerciseId, mode: exercise.mode, answer, correct, attempts: metrics.current.attempts, helpUsed: metrics.current.helpUsed,
        support: typeof exercise.exampleWord === 'string' || (view.photo && allPackageWords.some(word => word.id === exercise.wordId && word.image)) ? 'model' : metrics.current.helpUsed ? 'requested-help' : 'none', pictureSupport: view.photo ? 'always' : 'request', elapsedMs: Date.now() - metrics.current.started, objective: `WO-03:${typeof exercise.wordId === 'string' ? exercise.wordId : exercise.exerciseId}`, assessment: 'answer', independentReading: false });
      setResult(correct ? 'right' : 'wrong'); if (correct) onDone();
    }} />
    <output aria-live="polite">{audioError ? 'Het geluid lukt niet. Probeer opnieuw.' : result === 'right' ? <><Check />Goed</> : result === 'wrong' ? 'Kijk naar het voorbeeld. Verander een letter.' : ''}</output>
  </article></ExerciseAudioProvider>;
}
