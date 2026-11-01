'use client';
import { useEffect, useState } from 'react';
import { GroupRound } from './package-group-practice';
import { validateProductionCollection } from '@/lib/production-practice';
import type { PackageExercise } from '@/lib/package-content';

type Props = React.ComponentProps<typeof GroupRound> & { contentUrl: string; count: number; exerciseIds?: string[] };
const cache = new Map<string, PackageExercise[]>();

export async function loadProductionExercises(contentUrl: string, id: string, count: number, signal: AbortSignal, requiredIds: string[] = []) {
  const cached = cache.get(contentUrl);
  const hasRequired = (exercises: PackageExercise[]) => requiredIds.every(id => exercises.some(e => e.exerciseId === id));
  if (cached && hasRequired(cached)) return cached;
  if (cached) cache.delete(contentUrl);
  const response = await fetch(contentUrl, { signal });
  if (!response.ok) throw new Error('Unavailable');
  const exercises = validateProductionCollection(await response.json(), id, count);
  if (!hasRequired(exercises)) throw new Error('Missing source exercise');
  signal.throwIfAborted();
  if (cache.size >= 8) cache.delete(cache.keys().next().value!);
  cache.set(contentUrl, exercises);
  return exercises;
}

export function ProductionRound({ contentUrl, count, exerciseIds, ...props }: Props) {
  const [exercises, setExercises] = useState(() => cache.get(contentUrl));
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadProductionExercises(contentUrl, props.pack.id, count, controller.signal).then(loaded => {
      if (controller.signal.aborted) return;
      setExercises(loaded);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [contentUrl, count, props.pack.id, retry]);
  const selected = exerciseIds && exercises ? exercises.filter(item => exerciseIds.includes(item.exerciseId)) : exercises;
  if (error || (selected && exerciseIds && selected.length !== exerciseIds.length)) return <section className="honest-empty" role="alert"><p>Deze oefening kon niet worden geladen.</p><button className="primary-button" onClick={() => { setError(false); setRetry(value => value + 1); }}>Probeer opnieuw</button><button className="secondary-button" onClick={props.onBack}>Andere opdracht</button></section>;
  if (!exercises) return <output className="honest-empty">De oefening wordt geladen…</output>;
  return <GroupRound {...props} pack={{ ...props.pack, exercises }} exerciseSet={selected} />;
}
