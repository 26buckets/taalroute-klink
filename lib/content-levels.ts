import { importedItems } from './imported-practice.ts';
import { importedLevels } from './imported-practice-contract.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import supplementary from '../data/klink-lexicon-wordbuild-rest.json' with { type: 'json' };
import { contentById } from './connected-content.ts';
import type { PackageExercise } from './package-content';

export const contentLevels = [
  { id: 'all', label: 'Alles' },
  { id: 'alfa-a', label: 'Alfa A' },
  { id: 'alfa-b', label: 'Alfa B' },
  { id: 'alfa-c', label: 'Alfa C' },
  { id: 'a1', label: 'A1' },
  { id: 'a2', label: 'A2' },
  { id: 'b1', label: 'B1' },
  // Retain the old deep-link value, but no longer present support as a level.
  { id: 'support', label: 'Overige inhoud' },
] as const;
export type ContentLevel = typeof contentLevels[number]['id'];
export const contentHelp = [
  { id: 'all', label: 'Alle opdrachten' },
  { id: 'practice', label: 'Zelf oefenen' },
  { id: 'guided', label: 'Met de docent' },
] as const;
export type ContentHelp = typeof contentHelp[number]['id'];
export type ContentSelection = { level: ContentLevel; help?: ContentHelp };
export const levelLabel = (level: ContentLevel) => contentLevels.find(item => item.id === level)!.label;
const words = new Map(curriculum.words.map(word => [word.id, word]));

export function sourceContentLevel(sourceLevel?: string): ContentLevel {
  const value = sourceLevel?.toLowerCase();
  const match = value?.match(/^(a1|a2|b1)(?:_|$)/);
  return match ? match[1] as ContentLevel : 'support';
}

export function wordContentLevel(ids: string[]): ContentLevel {
  const levels = ids.map(id => words.get(id)?.reading.level);
  if (levels.length && levels.every(level => level === 'A')) return 'alfa-a';
  if (levels.length && levels.every(level => level === 'A' || level === 'B')) return 'alfa-b';
  return 'support';
}

// Presence is not a completed course or a learner's attained level.
export const availableContentLevels = new Set<ContentLevel>([
  ...supplementary.packs.flatMap(pack => pack.exercises.flatMap(exercise => exercise.vocabularyLevels as ContentLevel[])),
  ...importedItems.map(item => importedLevels[item.level]),
  ...curriculum.words.map(word => wordContentLevel([word.id])),
  ...[...contentById.values()].map(source => sourceContentLevel(source.sourceLevel)),
]);

export function exerciseContentLevel(exercise: PackageExercise): ContentLevel {
  if (Array.isArray(exercise.vocabularyLevels)) {
    const levels = exercise.vocabularyLevels;
    return levels.includes('a1') ? 'a1' : levels.includes('a2') ? 'a2' : levels.includes('b1') ? 'b1' : 'support';
  }
  if (exercise.componentId === 'KLINK-CONTENT' && contentLevels.some(level => level.id === exercise.contentLevel)) return exercise.contentLevel as ContentLevel;
  // A known word inside a sentence does not establish the level of that sentence.
  if (exercise.contextId) return sourceContentLevel(typeof exercise.contextId === 'string' ? contentById.get(exercise.contextId)?.sourceLevel : undefined);
  const targets = [...(Array.isArray(exercise.targetWordIds) ? exercise.targetWordIds as string[] : []), ...(typeof exercise.wordId === 'string' ? [exercise.wordId] : [])];
  const conditions = Array.isArray(exercise.readingConditions) ? exercise.readingConditions as { wordId?: string }[] : [];
  const cells = Array.isArray(exercise.cells) ? exercise.cells as { cellId?: string }[] : [];
  const prerequisites = Array.isArray(exercise.prerequisiteWordIds) ? exercise.prerequisiteWordIds as string[] : [];
  return wordContentLevel([...new Set([...targets, ...prerequisites, ...conditions.flatMap(item => item.wordId ? [item.wordId] : []), ...cells.flatMap(item => item.cellId ? [item.cellId] : [])])]);
}

// Shared vocabulary membership is not an independent-reading or mastery claim.
export function exerciseVocabularyLevels(exercise: PackageExercise): ContentLevel[] {
  const levels = exercise.vocabularyLevels;
  return Array.isArray(levels)
    ? contentLevels.filter(level => level.id !== 'all' && levels.includes(level.id)).map(level => level.id)
    : [exerciseContentLevel(exercise)];
}

export function exerciseSetLevel(exercises: PackageExercise[]): ContentLevel {
  const levels = exercises.map(exerciseContentLevel);
  if (!levels.length || levels.includes('support')) return 'support';
  if (levels.every(level => level === levels[0])) return levels[0];
  if (levels.every(level => ['alfa-a', 'alfa-b'].includes(level))) return 'alfa-b';
  if (levels.every(level => ['a1', 'a2', 'b1'].includes(level))) return levels.includes('b1') ? 'b1' : 'a2';
  return 'support';
}

export function exerciseSetHelp(exercises: PackageExercise[]): Exclude<ContentHelp, 'all'> {
  return exercises.some(item => {
    if (item.mode === 'connected-dialogue' && item.access === 'supported-listening' && item.assessment === 'participation' && !item.learningPathId) return false;
    return item.contextId || item.learningPathId || item.access === 'teacher-supported' || exerciseContentLevel(item) === 'support';
  }) ? 'guided' : 'practice';
}

export function matchesContent(level: ContentLevel, help: ContentHelp, selection: ContentSelection) {
  return (selection.level === 'all' || selection.level === level) && (!selection.help || selection.help === 'all' || selection.help === help);
}

export function selectExerciseSet(exercises: PackageExercise[], selection: ContentSelection): PackageExercise[] {
  // Keep boards and example → practice → use → recall paths intact and in source order.
  const groups = new Map<string, PackageExercise[]>();
  for (const item of exercises) {
    const key = typeof item.learningPathId === 'string' ? `path:${item.learningPathId}` : typeof item.boardId === 'string' ? `board:${item.boardId}` : item.exerciseId;
    const group = groups.get(key) ?? [];
    group.push(item); groups.set(key, group);
  }
  const allowed = new Set([...groups.values()].filter(group => (selection.level === 'all' || group.every(item => exerciseVocabularyLevels(item).includes(selection.level)) || exerciseSetLevel(group) === selection.level) && matchesContent(exerciseSetLevel(group), exerciseSetHelp(group), { ...selection, level: 'all' })).flatMap(group => group.map(item => item.exerciseId)));
  return exercises.filter(item => allowed.has(item.exerciseId));
}
