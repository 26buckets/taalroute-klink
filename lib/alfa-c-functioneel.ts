import source from '../data/klink-alfa-c-functioneel.json' with { type: 'json' };
import audio from '../data/klink-alfa-c-functioneel-audio.json' with { type: 'json' };

type Clip = { text: string; role: string; src: string; voiceId: string; sha256: string; duration: number; reused: boolean };
const clips = new Map((audio.clips as Clip[]).map(c => [c.role + '|' + c.text, c.src]));
export const functionalAudio = (role: 'guide' | 'target', text: string) => clips.get(role + '|' + text);

export const functionalBlocks = source.blocks;
export type FunctionalBlock = (typeof functionalBlocks)[number];
export type FunctionalStep = FunctionalBlock['steps'][number];
export const functionalStorageKey = 'klink.alfa-c.functioneel.v1';
export type FunctionalRecord = {
  assessment: 'answer' | 'participation';
  correct?: boolean;
  tries: number;
  helpUsed: boolean;
};
export type FunctionalProgress = {
  version: 1;
  positions: Record<string, number>;
  records: Record<string, FunctionalRecord>;
};
export function readFunctionalProgress(raw: string | null): FunctionalProgress {
  const empty: FunctionalProgress = { version: 1, positions: {}, records: {} };
  try {
    const data = JSON.parse(raw ?? 'null');
    if (data?.version !== 1) return empty;
    for (const block of functionalBlocks) {
      const position = data.positions?.[block.id];
      if (Number.isInteger(position) && position >= 0 && position <= block.steps.length)
        empty.positions[block.id] = position;
      for (const step of block.steps) {
        const row = data.records?.[step.id];
        if (step.closed || !row || !Number.isInteger(row.tries) || row.tries < 0 || typeof row.helpUsed !== 'boolean') continue;
        if (step.kind === 'choice' ? row.assessment === 'answer' && typeof row.correct === 'boolean' : row.assessment === 'participation' && row.correct === undefined)
          empty.records[step.id] = { assessment: row.assessment, ...(step.kind === 'choice' ? { correct: row.correct } : {}), tries: row.tries, helpUsed: row.helpUsed };
      }
    }
    return empty;
  } catch {
    return empty;
  }
}

export function functionalOptions(step: FunctionalStep) {
  const options = [...step.options];
  const shift = (step.number - 1) % options.length;
  return options.slice(shift).concat(options.slice(0, shift));
}
