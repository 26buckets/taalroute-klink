import source from '../data/klink-alfa-c-dagelijks.json' with { type: 'json' };

export const dailyBlocks = source.blocks;
export type DailyBlock = typeof dailyBlocks[number];
export type DailyStep = DailyBlock['steps'][number];
export const dailyStorageKey = 'klink.alfa-c.dagelijks.v1';
export type Support = { instruction: number; content: number; example: number; help: number; feedback: number };
type Attempt = { response: string[]; correct: boolean; support: Support };
export type DailyRecord = { support: Support; attempts: number; first?: Attempt; last?: Attempt };
export type DailyProgress = { version: 1; positions: Record<string, number>; records: Record<string, DailyRecord> };
export const emptyDailyRecord = (): DailyRecord => ({ support: { instruction: 0, content: 0, example: 0, help: 0, feedback: 0 }, attempts: 0 });
export function dailyAnswer(step: DailyStep, response: string[]) {
  return step.interaction === 'keuze'
    ? response.length === 1 && step.options.some(o => o.code === response[0] && o.correct)
    : response.length === step.answerOrder.length && response.every((s, i) => s === step.answerOrder[i]);
}
export function recordDailyAnswer(step: DailyStep, previous: DailyRecord, response: string[]): DailyRecord {
  const attempt = { response: [...response], correct: dailyAnswer(step, response), support: { ...previous.support } };
  return { ...previous, attempts: previous.attempts + 1, first: previous.first ?? attempt, last: attempt };
}
export function readDailyProgress(raw: string | null): DailyProgress {
  const result: DailyProgress = { version: 1, positions: {}, records: {} };
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1) return result;
    const supportValid = (s: Support) => s && Object.keys(emptyDailyRecord().support).every(k => Number.isSafeInteger(s[k as keyof Support]) && s[k as keyof Support] >= 0);
    for (const block of dailyBlocks) {
      const p = value.positions?.[block.id];
      if (Number.isInteger(p) && p >= 0 && p <= block.steps.length) result.positions[block.id] = p;
      for (const step of block.steps) {
        const r = value.records?.[step.id];
        if (!r || !supportValid(r.support) || !Number.isSafeInteger(r.attempts) || r.attempts < 0) continue;
        const valid = (a: Attempt) => a && Array.isArray(a.response) && a.response.every(s => typeof s === 'string') && typeof a.correct === 'boolean' && a.correct === dailyAnswer(step, a.response) && supportValid(a.support);
        if (r.attempts ? valid(r.first) && valid(r.last) : !r.first && !r.last) result.records[step.id] = r;
      }
    }
  } catch { /* Damaged local data never affects the other lesson stores. */ }
  return result;
}
