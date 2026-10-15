export type WordId = 'tas' | 'mat';
export const firstBlock = {
  id: 'klink-tas-instap-v1',
  status: 'concept',
  objective: 'Betekenis herkennen bij het gehoorde woord; geen bewijs van zelfstandig lezen.',
  words: {
    tas: { text: 'tas', meaning: 'een draagtas voor spullen', image: '/start-tas/tas.webp', audio: '/start-tas/tas.wav' },
    mat: { text: 'mat', meaning: 'een vloermat bij een deur', image: '/start-tas/mat.webp', audio: '/start-tas/mat.wav' },
  },
  trials: [
    { target: 'tas', options: ['tas', 'mat'] },
    { target: 'mat', options: ['tas', 'mat'] },
    { target: 'tas', options: ['mat', 'tas'] },
  ] as { target: WordId; options: WordId[] }[],
} as const;
export const checkpointKey = firstBlock.id;
export type Step = 'tas' | 'mat' | 'model' | 'choose' | 'done';
export type Event = { step: Step; trial: number; kind: 'answer' | 'replay'; word?: WordId; correct?: boolean; elapsedMs: number; at: string };
export type Checkpoint = { version: 1; step: Step; trial: number; events: Event[] };
export const freshCheckpoint = (): Checkpoint => ({ version: 1, step: 'tas', trial: 0, events: [] });
export function parseCheckpoint(raw: string | null): Checkpoint | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || !['tas', 'mat', 'model', 'choose', 'done'].includes(p.step)
      || !Number.isInteger(p.trial) || p.trial < 0 || p.trial >= firstBlock.trials.length || !Array.isArray(p.events)) return null;
    const events = p.events.slice(-120).filter((e: Event) => e && ['tas', 'mat', 'model', 'choose', 'done'].includes(e.step)
      && ['answer', 'replay'].includes(e.kind) && Number.isInteger(e.trial) && e.trial >= 0 && e.trial < 3
      && Number.isFinite(e.elapsedMs) && e.elapsedMs >= 0 && typeof e.at === 'string'
      && (e.word === undefined || ['tas', 'mat'].includes(e.word)) && (e.correct === undefined || typeof e.correct === 'boolean'));
    return { version: 1, step: p.step, trial: p.trial, events };
  } catch { return null; }
}
export function advance(p: Checkpoint): Checkpoint {
  if (p.step === 'tas') return { ...p, step: 'mat' };
  if (p.step === 'mat') return { ...p, step: 'model' };
  if (p.step === 'model') return { ...p, step: 'choose', trial: 0 };
  if (p.step === 'choose') return p.trial + 1 < firstBlock.trials.length ? { ...p, trial: p.trial + 1 } : { ...p, step: 'done' };
  return p;
}

export const wordMatch = {
  id: 'klink-tas-mat-woordbeeld-v1',
  objective: 'Hetzelfde geschreven woord zoeken met zichtbaar voorbeeld en woordaudio; geen bewijs van zelfstandig lezen.',
  trials: [
    { target: 'mat', options: ['tas', 'mat'] },
    { target: 'tas', options: ['mat', 'tas'] },
    { target: 'mat', options: ['mat', 'tas'] },
  ] as { target: WordId; options: WordId[] }[],
} as const;

export const freshWordMatch = (): Checkpoint => ({ ...freshCheckpoint(), step: 'model' });
export function parseWordMatch(raw: string | null): Checkpoint | null {
  const saved = parseCheckpoint(raw);
  return saved && ['model', 'choose', 'done'].includes(saved.step) ? saved : null;
}
