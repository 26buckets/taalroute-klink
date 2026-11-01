'use client';
import { useEffect, useState } from 'react';
import { sourceRepeatBanks, sourceRepeatExercises, type SourceRepeat } from '@/lib/source-repeat';
import type { PackageExercise } from '@/lib/package-content';
import { loadProductionExercises } from './production-round';
import { GroupRound } from './package-group-practice';

export function SourceRepeatRound({ sourceRepeat, ...props }: React.ComponentProps<typeof GroupRound> & { sourceRepeat?: SourceRepeat }) {
  const [exercises, setExercises] = useState<PackageExercise[]>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (!sourceRepeat) throw new Error('Missing repeat round');
      const banks = await Promise.all(sourceRepeatBanks(sourceRepeat).map(async bank => [bank.id, await loadProductionExercises(bank.url, bank.id, bank.count, controller.signal, sourceRepeat.positions.filter(p => p.bankId === bank.id).map(p => p.sourceId))] as const));
      if (!controller.signal.aborted) setExercises(sourceRepeatExercises(sourceRepeat, new Map(banks)));
    }
    load().catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [sourceRepeat, retry]);
  if (error) return <section className="honest-empty" role="alert"><p>Deze oefening kon niet worden geladen.</p><button className="primary-button" onClick={() => { setError(false); setRetry(value => value + 1); }}>Probeer opnieuw</button><button className="secondary-button" onClick={props.onBack}>Andere opdracht</button></section>;
  if (!exercises) return <output className="honest-empty">De oefening wordt geladen…</output>;
  // Repetition saves its own round completion and never rotates or updates original attempt/review records.
  return <GroupRound {...props} pack={{ ...props.pack, exercises }} exerciseSet={exercises} onAttempt={undefined} />;
}
