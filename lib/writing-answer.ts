import type { PackageExercise } from './package-content';

export type WritingAnswer = { version: 1; draft: string; first?: string; last?: string; firstFromAvailableHistory?: true };
export const writingAnswerSourceId = (exercise: PackageExercise) => typeof exercise.writingSourceId === 'string' ? exercise.writingSourceId : exercise.answerPolicy === 'exact-copy' ? exercise.exerciseId : undefined;
export const writingAnswerKey = (sourceId: string) => `klink.writing-answer.v1:${sourceId}`;
export const emptyWritingAnswer = (): WritingAnswer => ({ version: 1, draft: '' });

export function parseWritingAnswer(raw: string | null): WritingAnswer | undefined {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const row = value as Record<string, unknown>;
    if (row.version !== 1 || typeof row.draft !== 'string' || row.draft.length > 10000 || ['first', 'last'].some(key => row[key] !== undefined && (typeof row[key] !== 'string' || (row[key] as string).length > 10000))) return;
    return { version: 1, draft: row.draft, ...(typeof row.first === 'string' && row.first.trim() ? {first: row.first} : {}), ...(typeof row.last === 'string' && row.last.trim() ? {last: row.last} : {}), ...(row.firstFromAvailableHistory === true && typeof row.first === 'string' && row.first.trim() ? {firstFromAvailableHistory: true as const} : {}) };
  } catch { return; }
}

export function updateWritingAnswer(current: WritingAnswer, draft: string, submitted = false): WritingAnswer {
  return { ...current, draft, ...(submitted && draft.trim() ? { first: current.first ?? draft, last: draft } : {}) };
}

export function preserveAvailableCopyAnswers(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  let history: unknown;
  const raw = storage.getItem('klink.taalroute.attempts.v1') ?? '[]';
  try { history = JSON.parse(raw); } catch { return; }
  if (!Array.isArray(history)) return;
  if (storage.getItem('klink.writing-prior-attempts.v1') === null) storage.setItem('klink.writing-prior-attempts.v1', raw);
  const copies = new Map<string, WritingAnswer>();
  for (const attempt of history.slice(-200)) {
    if (!attempt || typeof attempt !== 'object' || typeof attempt.exerciseId !== 'string' || !/^KSW-(?:AC-TN-(?:00[1-9]|0[1-9]\d|100)|AA-TN-00[678])$/.test(attempt.exerciseId) || attempt.mode !== 'copy-word' || attempt.assessment !== 'answer' || typeof attempt.answer !== 'string' || !attempt.answer.trim() || attempt.answer.length > 10000) continue;
    copies.set(attempt.exerciseId, updateWritingAnswer(copies.get(attempt.exerciseId) ?? emptyWritingAnswer(), attempt.answer, true));
  }
  // Earlier attempts may already have left the old rolling history; preserve the first available one honestly.
  for (const [id, answer] of copies) if (storage.getItem(writingAnswerKey(id)) === null) storage.setItem(writingAnswerKey(id), JSON.stringify({ ...answer, draft: '', firstFromAvailableHistory: true }));
}
