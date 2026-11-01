import imageAliases from '../data/klink-progress-image-aliases-20261030.json' with { type: 'json' };
import writingPredecessors from '../data/klink-writing-progress-predecessors-20261101.json' with { type: 'json' };
export const roundProgressPrefix = 'klink.round-progress.v1:';
export const roundProgressEvent = 'klink-round-progress';
type RoundProgress = { version: 1; total: number; done: string[] };
const fallback = new Map<string, string>();
let storageFailed = false;
export const roundStorageFailed = () => storageFailed;
export const sequenceProgressId = (kind: string, block: string) => `sequence:${kind}:${block}`;
export const collectionProgressId = (activity: string, collection: string, contentUrl?: string) => `collection:${activity}:${collection}${contentUrl ? ':' + ((imageAliases as Record<string, string>)[contentUrl] ?? contentUrl) : ''}`;

export function parseRoundProgress(raw: string | null, total: number): RoundProgress {
  const empty: RoundProgress = { version: 1, total, done: [] };
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1 || value.total !== total || !Number.isSafeInteger(total) || total < 1 || !Array.isArray(value.done) || value.done.length > total) return empty;
    if (!value.done.every((id: unknown) => typeof id === 'string' && id.length > 0 && id.length < 512)) return empty;
    return { ...empty, done: [...new Set<string>(value.done)] };
  } catch { return empty; }
}

export function mergeRoundProgress(raw: string | null, ids: string[], done: string[]): RoundProgress {
  const allowed = new Set(ids);
  const previous = parseRoundProgress(raw, ids.length);
  return { version: 1, total: ids.length, done: [...new Set([...previous.done, ...done])].filter(id => allowed.has(id)) };
}

function read(id: string) {
  if (typeof window === 'undefined') return null;
  const stored = (key: string) => { try { return localStorage.getItem(roundProgressPrefix + key); } catch { return null; } };
  try {
    const saved = stored(id);
    const current = fallback.get(id) ?? saved;
    if (current !== null) return current;
    const previous = (writingPredecessors as Record<string, { id: string; exerciseIds: string[] }>)[id];
    if (!previous) return null;
    const progress = parseRoundProgress(fallback.get(previous.id) ?? stored(previous.id), previous.exerciseIds.length);
    // A revised task starts fresh; its unchanged neighbours inherit progress without rewriting the old round.
    return JSON.stringify({ ...progress, done: progress.done.filter(exerciseId => previous.exerciseIds.includes(exerciseId)) });
  } catch { return fallback.get(id) ?? null; }
}

export function roundProgressCount(id: string, total: number, exerciseIds?: string[]) {
  const done = parseRoundProgress(read(id), total).done;
  return exerciseIds ? done.filter(item => exerciseIds.includes(item)).length : done.length;
}

// Keep completion separate from the current attempt, so practising again never erases it.
export function recordRoundSteps(id: string, ids: string[], done: string[]) {
  if (typeof window === 'undefined' || !done.length || !ids.length) return;
  const hadFailure = storageFailed;
  const before = read(id);
  const next = mergeRoundProgress(before, ids, done);
  if (!next.done.length) return;
  const raw = JSON.stringify(next);
  if (raw === before && !fallback.has(id)) return;
  try {
    localStorage.setItem(roundProgressPrefix + id, raw);
    fallback.delete(id); storageFailed = fallback.size > 0;
  } catch { fallback.set(id, raw); storageFailed = true; }
  if (raw !== before || storageFailed !== hadFailure) window.dispatchEvent(new Event(roundProgressEvent));
}
