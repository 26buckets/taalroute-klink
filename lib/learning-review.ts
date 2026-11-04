import type { PracticeAttempt } from './package-content';

export const learningReviewKey = 'klink.learning-review.v1';
export type LearningReview = Record<string, { due: number; last: number; streak: number }>;
const day = 86_400_000;

export function parseLearningReview(raw: string | null): LearningReview {
  try {
    const value: unknown = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([id, record]) => {
      if ((!id.includes(':recall:') && !id.endsWith(':recall')) || !record || typeof record !== 'object') return false;
      const r = record as { due: number; last: number; streak: number };
      return [r.due, r.last, r.streak].every(Number.isFinite) && r.due >= 0 && r.last >= 0 && Number.isInteger(r.streak) && r.streak >= 0 && r.streak <= 3;
    }).slice(-3000));
  } catch { return {}; }
}

export function updateLearningReview(state: LearningReview, attempt: PracticeAttempt, now = Date.now()): LearningReview {
  if (!attempt.reviewEligible || attempt.assessment !== 'answer' || !Number.isFinite(now)) return state;
  const old = state[attempt.exerciseId];
  const independentAttempt = attempt.correct && attempt.attempts === 1 && !attempt.helpUsed && attempt.support !== 'model' && attempt.support !== 'requested-help';
  // Repeating a correct answer in one sitting never grows the spaced-review interval.
  if (independentAttempt && old && now - old.last < day) return state;
  const streak = independentAttempt ? Math.min((old?.streak ?? 0) + 1, 3) : 0;
  return { ...state, [attempt.exerciseId]: { last: now, due: now + (streak === 0 ? 0 : [0, 1, 3, 7][streak]) * day, streak } };
}
