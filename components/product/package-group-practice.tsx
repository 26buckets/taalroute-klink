'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, RefreshCw, Search } from 'lucide-react';
import { BuildSurface, PackageExerciseBrowser } from './package-exercise-browser';
import { stopMedia } from './shared';
import { groupActivities, groupExercises, groupSessionKey, restoreGroupSession, type GroupActivity } from '@/lib/group-practice';
import type { AudioPlayer, PackageDefinition, PackageExercise, PracticeAttempt } from '@/lib/package-content';

const icons = { eye: Eye, ear: Ear, image: ImageIcon, link: Link2, puzzle: Puzzle, grid: Grid2X2, keyboard: Keyboard, pen: PencilLine, mic: Mic, book: BookOpen, search: Search, chat: MessageCircle };
function scrollToStart() { document.querySelector('.learner-main')?.scrollTo({ top: 0, behavior: 'instant' }); window.scrollTo({ top: 0, behavior: 'instant' }); }

export function PackageGroupPractice({ pack, onAudio, onAttempt }: { pack: PackageDefinition; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void }) {
  const [activity, setActivity] = useState<GroupActivity>();
  const [round, setRound] = useState(0);
  useEffect(scrollToStart, [activity]);
  const available = useMemo(() => groupActivities.flatMap(item => {
    const count = groupExercises(pack, item.id).length;
    return count ? [{ ...item, count }] : [];
  }), [pack]);
  function back() { stopMedia(); setActivity(undefined); }
  if (activity) return <section className="cp-group-practice">
    <button className="text-back" onClick={back}><ArrowLeft />Alle oefeningen</button>
    <GroupRound key={`${pack.id}:${activity}:${round}`} pack={pack} activity={activity} onAudio={onAudio} onAttempt={onAttempt} onBack={back} onAgain={() => setRound(value => value + 1)} />
  </section>;
  return <section className="cp-panel cp-group-practice" data-group-practice>
    <header className="cp-panel-heading"><h1>Samen oefenen</h1></header>
    {[...new Set(available.map(item => item.category))].map(category => <section key={category} className="cp-activity-section">
      <h2>{category}</h2>
      <div className="cp-activity-grid">{available.filter(item => item.category === category).map(item => {
        const Icon = icons[item.icon];
        return <button className="cp-activity-button" key={item.id} data-activity={item.id} onClick={() => { stopMedia(); setActivity(item.id); }}>
          <Icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" />
        </button>;
      })}</div>
    </section>)}
  </section>;
}

export function GroupRound({ pack, activity, onAudio, onAttempt, onBack, onAgain, exerciseSet, sessionId, backLabel = 'Alle oefeningen' }: { pack: PackageDefinition; activity: GroupActivity; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; onBack: () => void; onAgain: () => void; exerciseSet?: PackageExercise[]; sessionId?: string; backLabel?: string }) {
  const exercises = useMemo(() => exerciseSet ?? groupExercises(pack, activity), [pack, activity, exerciseSet]);
  const storageKey = groupSessionKey(sessionId ?? pack.id, activity);
  const [session, setSession] = useState(() => {
    try { return restoreGroupSession(localStorage.getItem(storageKey), exercises); } catch { return { done: false }; }
  });
  const [initialId] = useState(session.exerciseId);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...session })); } catch { /* Optional storage. */ } }, [session, storageKey]);
  const title = groupActivities.find(item => item.id === activity)!.label;
  function restart() { try { localStorage.removeItem(storageKey); } catch { /* Optional storage. */ } stopMedia(); onAgain(); }
  if (session.done) return <section className="honest-empty"><Check /><h2 tabIndex={-1} ref={node => node?.focus()}>Goed geoefend</h2><button className="primary-button" onClick={restart}><RefreshCw />Nog een keer</button><button className="secondary-button" onClick={onBack}>{backLabel}<ArrowRight /></button></section>;
  if (activity === 'worksheet' || activity === 'worksheet-heard') return <BuildWorksheet exercises={exercises} onAudio={onAudio} onAttempt={onAttempt} initialId={initialId} onPosition={exerciseId => setSession(current => ({ ...current, exerciseId }))} onDone={() => setSession(current => ({ ...current, done: true }))} />;
  return <PackageExerciseBrowser pack={pack} exercises={exercises} onAudio={onAudio} guided practiceRound title={title} description="" initialExerciseId={initialId}
    onPosition={exerciseId => setSession(current => current.exerciseId === exerciseId ? current : { ...current, exerciseId })}
    onAttempt={onAttempt} onLessonDone={() => setSession(current => ({ ...current, done: true }))} onComplete={onBack} />;
}

function BuildWorksheet({ exercises, onAudio, onAttempt, initialId, onPosition, onDone }: { exercises: PackageExercise[]; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; initialId?: string; onPosition: (id: string) => void; onDone: () => void }) {
  const [page, setPage] = useState(() => Math.floor(Math.max(0, exercises.findIndex(item => item.exerciseId === initialId)) / 4));
  const [done, setDone] = useState<string[]>([]);
  useEffect(scrollToStart, [page]);
  const rows = exercises.slice(page * 4, page * 4 + 4);
  const ready = rows.every(item => done.includes(item.exerciseId));
  return <section className="cp-word-worksheet" aria-label="Meer woorden maken">
    <h2>Meer woorden maken</h2>
    <div className="cp-worksheet-grid">{rows.map(exercise => <WorksheetRow key={exercise.exerciseId} exercise={exercise} onAudio={onAudio} onAttempt={onAttempt} onDone={() => setDone(current => current.includes(exercise.exerciseId) ? current : [...current, exercise.exerciseId])} />)}</div>
    <button className="primary-button" disabled={!ready} onClick={() => { stopMedia(); if ((page + 1) * 4 >= exercises.length) onDone(); else { const nextPage = page + 1; setPage(nextPage); onPosition(exercises[nextPage * 4].exerciseId); } }}>Verder<ArrowRight /></button>
  </section>;
}

function WorksheetRow({ exercise, onAudio, onAttempt, onDone }: { exercise: PackageExercise; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void; onDone: () => void }) {
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [audioError, setAudioError] = useState(false);
  const [heard, setHeard] = useState(!exercise.requiresAudio);
  const playback = useRef<AbortController | null>(null);
  const metrics = useRef({ started: 0, attempts: 0, helpUsed: false });
  useEffect(() => { metrics.current.started = Date.now(); return () => playback.current?.abort(); }, []);
  return <article className={`cp-worksheet-row ${result}`}>
    <BuildSurface exercise={exercise} onAudio={async source => {
      playback.current?.abort(); const controller = new AbortController(); playback.current = controller;
      try { const ok = await onAudio(source, { waitUntilEnd: true, signal: controller.signal }); if (controller.signal.aborted) return false; setAudioError(ok === false); if (ok !== false) setHeard(true); return ok !== false; }
      catch { if (!controller.signal.aborted) setAudioError(true); return false; }
    }} canAnswer={result !== 'right' && heard} onHelp={() => { metrics.current.helpUsed = true; }} onReset={() => setResult('idle')} onFinish={(answer, correct) => {
      metrics.current.attempts++;
      onAttempt?.({ exerciseId: exercise.exerciseId, mode: exercise.mode, answer, correct, attempts: metrics.current.attempts, helpUsed: metrics.current.helpUsed,
        support: exercise.exampleWord ? 'model' : metrics.current.helpUsed ? 'requested-help' : 'none', elapsedMs: Date.now() - metrics.current.started, objective: `WO-03:${typeof exercise.wordId === 'string' ? exercise.wordId : exercise.exerciseId}`, assessment: 'answer', independentReading: false });
      setResult(correct ? 'right' : 'wrong'); if (correct) onDone();
    }} />
    <output aria-live="polite">{audioError ? 'Het geluid lukt niet. Probeer opnieuw.' : result === 'right' ? <><Check />Goed</> : result === 'wrong' ? 'Kijk naar het voorbeeld. Verander een letter.' : ''}</output>
  </article>;
}
