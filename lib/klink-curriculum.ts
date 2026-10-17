import release from '../data/klink-curriculum.json' with { type: 'json' };
import media from '../data/klink-media.json' with { type: 'json' };

export const curriculum = release;
export type CurriculumWord = typeof release.words[number];
export type WordMedia = { audio?: string; image?: string; imageUse?: 'meaning' | 'context'; review: 'open' | 'approved' };
export const wordMedia = media as Record<string, WordMedia>;
export const wordById = new Map(curriculum.words.map(word => [word.id, word]));
export type ReadingStep = { id: string; title: string; group: number | null; kind: string; known: string[]; newWords: string[]; returning: string[]; guidance: string; unitIds: string[] };
export const readingSteps: ReadingStep[] = curriculum.steps;
export const extensionSteps: ReadingStep[] = curriculum.extensions.map(item => ({
  id: item.id, title: item.focus, group: item.group, kind: 'uitbreiding',
  known: item.known, newWords: item.newWords, returning: item.returning,
  guidance: item.preparationNote, unitIds: [],
}));
export const wordsFor = (ids: string[]) => ids.map(id => wordById.get(id)).filter((word): word is CurriculumWord => Boolean(word));
export const unique = (ids: string[]) => [...new Set(ids)];

export function groupWords(group: number) {
  return curriculum.words.filter(word => placementGroup(word) === group);
}
export function placementGroup(word: CurriculumWord): number | null {
  const first = word.firstReading;
  if (first.mode === 'core-step') return readingSteps.find(step => step.id === first.stepId)?.group ?? null;
  if (first.mode === 'extension') return extensionSteps.find(step => step.id === first.extensionId)?.group ?? null;
  if (first.mode === 'optional-step') return first.group ?? null;
  // Sound prerequisites are not a placement. Long words and preparation keep their own routes.
  return null;
}
export function wordStep(word: CurriculumWord): ReadingStep {
  return { id: `woord-${word.id}`, title: word.word, group: placementGroup(word), kind: 'woord',
    known: word.preparation.wordIds, newWords: [word.id], returning: [], guidance: word.reading.firstMoment, unitIds: [] };
}
export function resolveStep(id: string): ReadingStep | undefined {
  return [...readingSteps, ...extensionSteps].find(step => step.id === id)
    ?? (id.startsWith('woord-') && wordById.has(id.slice(6)) ? wordStep(wordById.get(id.slice(6))!) : undefined);
}
export function firstStepId(word: CurriculumWord) {
  return word.firstReading.stepId ?? word.firstReading.extensionId ?? wordStep(word).id;
}
export function spellingTiles(word: CurriculumWord) {
  const units = word.reading.units.map(unit => unit.text);
  return units.join('') === word.word ? units : Array.from(new Intl.Segmenter('nl', { granularity: 'grapheme' }).segment(word.word), item => item.segment);
}

export type Activity = { id: string; kind: 'model' | 'match' | 'listen' | 'build'; wordId: string; options: string[]; objective: string };
export function activitiesFor(step: ReadingStep, introduced: string[] = []): Activity[] {
  const seen = new Set(introduced);
  const ids = unique([...step.known, ...step.newWords, ...step.returning.filter(id => seen.has(id))]);
  const activities: Activity[] = [];
  // Options belong to this explicitly selected step; introduce all meanings before comparing them.
  for (const id of ids) activities.push({ id: `${step.id}:model:${id}`, kind: 'model', wordId: id, options: [], objective: 'woord en betekenis verkennen' });
  for (const [index, id] of ids.entries()) {
    const other = ids.find(candidate => candidate !== id && wordById.get(candidate)?.word !== wordById.get(id)?.word);
    if (other) {
      const options = index % 2 ? [other, id] : [id, other];
      activities.push({ id: `${step.id}:match:${id}`, kind: 'match', wordId: id, options, objective: 'hetzelfde woord herkennen met zichtbaar voorbeeld' });
      if (wordMedia[id]?.audio) activities.push({ id: `${step.id}:listen:${id}`, kind: 'listen', wordId: id, options, objective: 'gehoord woord aan geschreven woord koppelen' });
    }
    activities.push({ id: `${step.id}:build:${id}`, kind: 'build', wordId: id, options: [], objective: 'geschreven woord met voorbeeld opbouwen' });
  }
  return activities;
}

export type CurriculumState = { introduced: string[]; completed: string[]; lastStep?: string };
export const storageKey = `klink.taalroute.${curriculum.release.id}`;
export function parseState(raw: string | null): CurriculumState {
  try {
    const value = JSON.parse(raw ?? '{}');
    return { introduced: Array.isArray(value.introduced) ? unique(value.introduced.filter((id: unknown) => typeof id === 'string' && wordById.has(id))) : [],
      completed: Array.isArray(value.completed) ? unique(value.completed.filter((id: unknown) => typeof id === 'string' && resolveStep(id))) : [],
      lastStep: typeof value.lastStep === 'string' && resolveStep(value.lastStep) ? value.lastStep : undefined };
  } catch { return { introduced: [], completed: [] }; }
}
