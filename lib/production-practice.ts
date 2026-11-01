import support from '../data/klink-b1-reading-support.json' with { type: 'json' };
import guidedSelections from '../data/klink-guided-word-selections.json' with { type: 'json' };
import meaningContexts from '../data/klink-meaning-contexts.json' with { type: 'json' };
import type { ChapterCollection } from './practice-chapters';
import index from '../data/klink-production-index.json' with { type: 'json' };
import type { PackageDefinition, PackageExercise } from './package-content';

export const productionIndex = index;
export function productionPack(row: Pick<typeof index[number], 'id' | 'title' | 'level' | 'activity' | 'count'>, exercises: PackageExercise[] = []): PackageDefinition {
  return { id: row.id, title: row.title, subtitle: '', description: '', level: row.level, status: 'available', statusNote: '',
    practiceActivities: [row.activity], words: [], lessons: [], texts: [], dialogues: [], games: [], scenes: [], exercises, exerciseTypes: [],
    counts: { lessons: 0, coreWords: 0, exercises: row.count, exerciseTypes: 1, texts: 0, dialogues: 0, games: 0, images: 0, audio: 0 },
    media: { imageAvailable: 0, imageExpected: 0, audioAvailable: 0, audioExpected: 0, missing: [], imageReview: 'per-item', audioReview: 'automatic checks; human listening review open', publication: 'source-bound' } };
}

export function validateProductionCollection(value: unknown, id: string, count: number): PackageExercise[] {
  if (!value || typeof value !== 'object') throw new Error('Invalid collection');
  const data = value as { id?: string; exercises?: PackageExercise[] };
  if (data.id !== id || !Array.isArray(data.exercises) || data.exercises.length !== count || !count) throw new Error('Incomplete collection');
  const ids = new Set<string>();
  for (const exercise of data.exercises) {
    if (!exercise || typeof exercise.exerciseId !== 'string' || ids.has(exercise.exerciseId) || typeof exercise.componentId !== 'string' || typeof exercise.mode !== 'string') throw new Error('Invalid exercise');
    if (exercise.answerPolicy === 'exact-copy') {
      const fields = exercise.fields;
      if (exercise.componentId !== 'ALF-CMP-006' || exercise.mode !== 'copy-word' || typeof exercise.exampleWord !== 'string' || !exercise.exampleWord.trim() || !Array.isArray(fields) || fields.length !== 1 || !fields[0] || !Array.isArray(fields[0].acceptedAnswers) || fields[0].acceptedAnswers.length !== 1 || fields[0].acceptedAnswers[0] !== exercise.exampleWord) throw new Error('Invalid copy model');
    }
    ids.add(exercise.exerciseId);
  }
  return data.exercises;
}

// Keep the complete source available to old links and share its completion records.
const recordedSelections = { ...support.collections, ...guidedSelections } as Record<string, { allExerciseIds: string[]; supportIds: string[] }>;
const selectionCache = new WeakMap<ChapterCollection, ChapterCollection[]>();
export function readingSelections(collection: ChapterCollection): ChapterCollection[] {
  const cached = selectionCache.get(collection);
  if (cached) return cached;
  const supportIds = collection.exercises.filter(e => exerciseWord(e) in support.words || exerciseWord(e) === 'godverdomme').map(e => e.exerciseId);
  const selection = recordedSelections[collection.id] ?? (supportIds.length ? { allExerciseIds: collection.exercises.map(e => e.exerciseId), supportIds } : undefined);
  if (!selection) return [collection];
  const supported = new Set(selection.supportIds);
  const result = [false, true].flatMap(extension => {
    const exerciseIds = selection.allExerciseIds.filter(id => supported.has(id) === extension);
    return exerciseIds.length ? [{ ...collection, exercises: collection.exercises.filter(e => exerciseIds.includes(e.exerciseId)), id: `${collection.id}~${extension ? 'extension' : 'core'}`, title: `${extension ? 'Uitbreiding met je docent' : 'Basis'} · ${collection.title}`, readingSelection: { sourceId: collection.id, allExerciseIds: selection.allExerciseIds, exerciseIds } }] : [];
  });
  selectionCache.set(collection, result);
  return result;
}
export function readingSupportForExercise(exercise: PackageExercise) {
  if (exercise.mode !== 'read-series' || exercise.contentLevel !== 'b1' || !Array.isArray(exercise.textBlocks)) return;
  const word = (exercise.textBlocks as { text: string }[])[0]?.text;
  return (support.words as Record<string, { meaning: string; example: string }>)[word];
}

export function exerciseWord(exercise: PackageExercise): string {
  const value = exercise.exampleWord ?? exercise.helpWord ?? exercise.displayWord ?? (exercise.textBlocks as { text: string }[] | undefined)?.[0]?.text;
  return typeof value === 'string' ? value : '';
}

export type MeaningContext = { label: string; choice?: string; meaning: string; example: string; image?: string; audio?: string; optional?: boolean };
export function wordMeaningContexts(exercise: PackageExercise): MeaningContext[] {
  if (exercise.contextId || exercise.learningPathId) return [];
  const word = exerciseWord(exercise);
  if (['pak', 'want'].includes(word) && (typeof exercise.contentLevel !== 'string' || exercise.contentLevel.startsWith('alfa-'))) return [];
  return (meaningContexts as Record<string, MeaningContext[]>)[word] ?? [];
}
