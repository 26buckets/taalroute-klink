'use client';
import { useEffect, useState } from 'react';
import { GroupRound } from './package-group-practice';
import { validateProductionCollection } from '@/lib/production-practice';
import type { PackageExercise } from '@/lib/package-content';

type Props = React.ComponentProps<typeof GroupRound> & { contentUrl: string; count: number };
const cache = new Map<string, PackageExercise[]>();

export function ProductionRound({ contentUrl, count, ...props }: Props) {
  const [exercises, setExercises] = useState(() => cache.get(contentUrl));
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (!cache.has(contentUrl)) fetch(contentUrl, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Unavailable');
      return response.json();
    }).then(value => {
      const loaded = validateProductionCollection(value, props.pack.id, count);
      if (controller.signal.aborted) return;
      if (cache.size >= 8) cache.delete(cache.keys().next().value!);
      cache.set(contentUrl, loaded); setExercises(loaded);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [contentUrl, count, props.pack.id, retry]);
  if (error) return <section className="honest-empty" role="alert"><p>Deze oefening kon niet worden geladen.</p><button className="primary-button" onClick={() => { setError(false); setRetry(value => value + 1); }}>Probeer opnieuw</button><button className="secondary-button" onClick={props.onBack}>Andere opdracht</button></section>;
  if (!exercises) return <output className="honest-empty">De oefening wordt geladen…</output>;
  return <GroupRound {...props} pack={{ ...props.pack, exercises }} exerciseSet={exercises} />;
}
