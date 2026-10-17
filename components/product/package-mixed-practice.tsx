'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Ear, Link2, Puzzle, RefreshCw } from 'lucide-react';
import { PackageExerciseBrowser } from './package-exercise-browser';
import { stopMedia } from './shared';
import type { AudioPlayer, PackageDefinition, PracticeAttempt } from '@/lib/package-content';
import { createMixedRound, mixedModes, mixedStorageKey, restoreMixedSession, withMixedRetries, type MixedMode, type MixedSession } from '@/lib/mixed-practice';

const icons = { listen: Ear, read: BookOpen, match: Link2, build: Puzzle };
const fresh = (): MixedSession => ({ seed: Math.floor(Math.random() * 4294967296), retries: [], done: false });

export function PackageMixedPractice({ pack, onAudio, onBack, onAttempt }: {
  pack: PackageDefinition;
  onAudio: AudioPlayer;
  onBack: () => void;
  onAttempt?: (attempt: PracticeAttempt) => void;
}) {
  const available = useMemo(() => mixedModes.filter(mode => createMixedRound(pack, mode.id, 1).length), [pack]);
  const [mode, setMode] = useState<MixedMode>(available[0]?.id ?? 'listen');
  return <section className="cp-panel cp-mixed-practice" aria-label="Alles oefenen">
    <button className="text-back" onClick={onBack}><ArrowLeft />Terug</button>
    <header className="cp-panel-heading"><h1>Alles oefenen</h1></header>
    <nav className="cp-mixed-modes" aria-label="Kies hoe je oefent">
      {available.map(item => { const Icon = icons[item.id]; return <button key={item.id} className={mode === item.id ? 'active' : ''} aria-pressed={mode === item.id} onClick={() => { stopMedia(); setMode(item.id); }}><Icon aria-hidden="true" />{item.label}</button>; })}
    </nav>
    {available.length ? <MixedRound key={`${pack.id}:${mode}`} pack={pack} mode={mode} onAudio={onAudio} onAttempt={onAttempt} />
      : <p>Er zijn nog niet genoeg woorden om samen te oefenen.</p>}
  </section>;
}

function MixedRound({ pack, mode, onAudio, onAttempt }: { pack: PackageDefinition; mode: MixedMode; onAudio: AudioPlayer; onAttempt?: (attempt: PracticeAttempt) => void }) {
  const storageKey = mixedStorageKey(pack.id, mode);
  const [session, setSession] = useState<MixedSession>(() => {
    try { return restoreMixedSession(localStorage.getItem(storageKey), pack, mode) ?? fresh(); }
    catch { return fresh(); }
  });
  const base = useMemo(() => createMixedRound(pack, mode, session.seed), [pack, mode, session.seed]);
  const exercises = useMemo(() => withMixedRetries(base, session.retries), [base, session.retries]);
  const [startPosition] = useState(session.exerciseId);
  const [restart, setRestart] = useState(0);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(session)); } catch { /* Practice stays available when storage is blocked. */ }
  }, [storageKey, session]);
  function record(attempt: PracticeAttempt) {
    onAttempt?.(attempt);
    // At most one later retry, never an endless loop or a mastery claim.
    if ((!attempt.correct || attempt.helpUsed) && base.some(exercise => exercise.exerciseId === attempt.exerciseId)) {
      setSession(current => current.retries.includes(attempt.exerciseId) ? current : { ...current, retries: [...current.retries, attempt.exerciseId] });
    }
  }
  function again() { stopMedia(); setSession(fresh()); setRestart(value => value + 1); }
  return session.done ? <section className="honest-empty cp-mixed-complete"><Check aria-hidden="true" /><h2 tabIndex={-1} ref={el => { el?.focus({ preventScroll: true }); }}>Goed geoefend</h2><p>Deze ronde is klaar.</p><button className="primary-button" onClick={again}><RefreshCw />Nog een ronde</button></section>
    : <PackageExerciseBrowser key={restart} pack={pack} exercises={exercises} onAudio={onAudio} guided practiceRound
      initialExerciseId={restart ? undefined : startPosition}
      onPosition={exerciseId => setSession(current => current.exerciseId === exerciseId ? current : { ...current, exerciseId })}
      onAttempt={record} onLessonDone={() => setSession(current => ({ ...current, done: true }))}
      onComplete={again} completeLabel="Nog een ronde" title="Alles oefenen" description="" />;
}
