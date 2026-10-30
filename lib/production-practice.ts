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
    ids.add(exercise.exerciseId);
  }
  return data.exercises;
}
