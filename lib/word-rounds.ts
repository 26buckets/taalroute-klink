import index from '../data/klink-word-round-index.json' with { type: 'json' };
import { wordLabel, type PackageExercise } from './package-content.ts';
import type { ChapterCollection } from './practice-chapters.ts';

export type WordRound = { title: string; image?: string; exerciseIds: string[]; placeholderCount: number };
const cache = new WeakMap<ChapterCollection, ChapterCollection[]>();

export function wordRoundDefinitions(exercises: PackageExercise[]): WordRound[] {
  const labels = exercises.map(item => {
    const text = item.text as { primary?: unknown } | undefined;
    return typeof item.wordId === 'string' && typeof text?.primary === 'string' ? wordLabel({ id: item.wordId, word: text.primary }) : undefined;
  });
  if (!exercises.length || labels.some(item => !item) || exercises.some(item => item.mode !== 'model') || new Set(exercises.map(item => item.wordId)).size !== exercises.length) return [];
  const count = Math.ceil(exercises.length / 8);
  return Array.from({ length: count }, (_, i) => {
    const selected = exercises.slice(Math.floor(i * exercises.length / count), Math.floor((i + 1) * exercises.length / count));
    const image = selected[0].prompt?.image;
    return {
      title: labels.slice(Math.floor(i * exercises.length / count), Math.floor(i * exercises.length / count) + Math.min(2, selected.length)).join(' · '),
      ...(image?.src && !image.placeholderWord ? { image: image.src } : {}),
      exerciseIds: selected.map(item => item.exerciseId),
      placeholderCount: selected.filter(item => item.prompt?.image?.placeholderWord).length,
    };
  });
}

export function chapterWordRounds(collection: ChapterCollection): ChapterCollection[] {
  const cached = cache.get(collection);
  if (cached) return cached;
  const rounds: WordRound[] = collection.contentUrl ? (index as Record<string, WordRound[]>)[collection.contentUrl] ?? [] : wordRoundDefinitions(collection.exercises);
  if (!rounds.length) return [collection];
  const allExerciseIds = rounds.flatMap(item => item.exerciseIds);
  const result = rounds.map((item, i) => ({
    ...collection,
    id: rounds.length === 1 ? collection.id : `${collection.id}~words-${i + 1}`,
    title: item.title,
    image: item.image,
    placeholderCount: item.placeholderCount,
    exercises: collection.exercises.filter(exercise => item.exerciseIds.includes(exercise.exerciseId)),
    wordRound: { ...item, sourceId: collection.id, allExerciseIds },
  }));
  cache.set(collection, result);
  return result;
}
