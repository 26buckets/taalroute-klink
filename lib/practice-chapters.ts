import { importedActivities, importedCollections, type ImportedActivity } from './imported-practice.ts';
import { contentPackages } from './package-content.ts';
import { groupActivities, groupExercises, type GroupActivity } from './group-practice.ts';
import { contentById } from './connected-content.ts';
import { learnerListName } from './learner-copy.ts';
import { contentLevels, contentHelp, exerciseContentLevel, exerciseVocabularyLevels, exerciseSetLevel, exerciseSetHelp, matchesContent, type ContentHelp } from './content-levels.ts';
import type { PackageDefinition, PackageExercise } from './package-content';

// Separate skill entrances, not new lessons or a second placement of Lexicon words.
export const practiceChapters: { id: string; title: string; icon: typeof groupActivities[number]['icon']; activities: GroupActivity[] }[] = [
  { id: 'words', title: 'Woorden oefenen', icon: 'image', activities: ['word-sort', 'meet', 'same-word', 'listen', 'hear-word', 'read', 'match', 'hear-match', 'cards'] },
  { id: 'sounds', title: 'Klanken', icon: 'ear', activities: ['sound-path', 'sound-compare'] },
  { id: 'sentences', title: 'Zinnen', icon: 'book', activities: ['sentences', 'word-sentence', 'find-sentence', 'sentence-build', 'sentence-dictation', 'sentence-speak'] },
  { id: 'texts', title: 'Teksten', icon: 'book', activities: ['reading-path', 'texts', 'text-question', 'text-evidence', 'context-order'] },
  { id: 'listening', title: 'Luisteren', icon: 'ear', activities: ['listen', 'understand', 'text-question', 'dialogue-question'] },
  { id: 'speaking', title: 'Spreken', icon: 'mic', activities: ['practice-branch', 'speak', 'sentence-speak', 'dialogues', 'dialogue-role'] },
  { id: 'writing', title: 'Schrijven', icon: 'pen', activities: ['write-letter', 'copy', 'write', 'dictation', 'paper-dictation', 'sentence-dictation', 'functional-message', 'functional-form'] },
  { id: 'spelling', title: 'Spelling', icon: 'keyboard', activities: ['word-sort', 'spelling-path', 'build-model', 'build', 'worksheet', 'worksheet-heard', 'missing', 'dictation'] },
  { id: 'grammar', title: 'Grammatica', icon: 'puzzle', activities: ['grammar-path', 'sentence-build', 'verb-choice'] },
  { id: 'practical', title: 'In de praktijk', icon: 'chat', activities: ['practice-branch', 'situation-point', 'context-order', 'practical-path', 'dialogues', 'dialogue-role', 'dialogue-question', 'functional-message', 'functional-form'] },
  { id: 'repeat', title: 'Samen herhalen', icon: 'grid', activities: ['learning-review', 'word-bingo', 'image-bingo', 'memory', 'read-series', 'worksheet', 'worksheet-heard'] },
  { id: 'support', title: 'Rustig beginnen', icon: 'eye', activities: ['meet', 'build-model', 'copy'] },
];

for (const activity of importedActivities) practiceChapters.find(chapter => chapter.id === activity.chapter)!.activities.push(activity.id);

export const chapterLevels = contentLevels;
export type ChapterLevel = typeof chapterLevels[number]['id'];
export type ChapterCollection = { id: string; title: string; level: ChapterLevel; levels?: ChapterLevel[]; pack: PackageDefinition; exercises: PackageExercise[]; image?: string };
export type ChapterLocation = { chapter?: string; activity?: GroupActivity; level: ChapterLevel; help?: ContentHelp; collection?: string };
const cache = new Map<GroupActivity, ChapterCollection[]>();
const singleSourceActivities = new Set<GroupActivity>(['texts', 'text-question', 'text-evidence', 'dialogues', 'dialogue-question', 'dialogue-role', 'functional-message', 'functional-form']);

export function chapterExerciseLevel(exercise: PackageExercise): ChapterLevel {
  return exerciseContentLevel(exercise);
}

export function chapterHasBothAxes(chapter: string) {
  const levels = practiceChapters.find(item => item.id === chapter)?.activities.flatMap(activity => chapterCollections(activity).flatMap(item => item.levels ?? [item.level])) ?? [];
  return levels.some(level => level.startsWith('alfa-')) && levels.some(level => ['a1','a2','b1'].includes(level));
}
export function chapterForLevel(level: ChapterLevel, preferred: string) {
  const ordered = [...practiceChapters.filter(item => item.id === preferred), ...practiceChapters.filter(item => item.id !== preferred)];
  return ordered.find(chapter => chapter.activities.some(activity => chapterCollections(activity).some(item => level === 'all' || (item.levels ?? [item.level]).includes(level))))?.id ?? preferred;
}

export const matchesChapterSelection = (item: ChapterCollection, selection: ChapterLocation) => (selection.level === 'all' || (item.levels ?? [item.level]).includes(selection.level)) && matchesContent(item.level, exerciseSetHelp(item.exercises), { ...selection, level: 'all' });

export function chapterCollections(activity: GroupActivity): ChapterCollection[] {
  if (activity.startsWith('content-')) {
    const existing = cache.get(activity);
    if (existing) return existing;
    const result = importedCollections(activity as ImportedActivity, undefined, contentPackages);
    cache.set(activity, result);return result;
  }
  const cached = cache.get(activity);
  if (cached) return cached;
  const seen = new Set<string>();
  const result: ChapterCollection[] = [];
  for (const pack of contentPackages) {
    const exercises = groupExercises(pack, activity).filter(exercise => {
      // One source in free practice, even when it recurs in several word lessons.
      // Word-to-sentence chains deliberately retain their model and repetition.
      if (exercise.learningPathId || typeof exercise.contextId !== 'string' || !exercise.contextId || activity === 'word-sentence') return true;
      const key = `${exercise.mode}:${exercise.contextId}:${typeof exercise.collectionVariant === "string" ? exercise.collectionVariant : ""}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    if (exercises.some(exercise => exercise.learningPathId)) {
      for (const id of new Set(exercises.map(exercise => String(exercise.learningPathId)))) {
        const selected = exercises.filter(exercise => exercise.learningPathId === id);
        // Keep a complete example → practice → use → recall route; never split it by word level.
        const sourceId = activity !== 'learning-review' && contentById.has(id) ? id : `${pack.id}:${id}`;
        if (seen.has(sourceId)) continue;
        seen.add(sourceId);
        result.push({ id: sourceId, title: String(selected[0].learningPathTitle), level: exerciseSetLevel(selected), pack, exercises: selected, image: pack.cover?.image });
      }
    } else if (singleSourceActivities.has(activity)) {
      for (const exercise of exercises) {
        const source = contentById.get(String(exercise.contextId));
        result.push({ id: String(exercise.contextId), title: source?.title ?? exercise.title ?? learnerListName(pack), level: chapterExerciseLevel(exercise), pack, exercises: [exercise] });
      }
    } else if (activity === 'word-sentence') {
      // Keep complete word + sentence chains together, including their harder reading conditions.
      if (exercises.length) result.push({ id: pack.id, title: learnerListName(pack), level: 'support', pack, exercises, image: pack.cover?.image });
    } else if (exercises.some(exercise => Array.isArray(exercise.vocabularyLevels))) {
      // One collection per shared membership, not one copied task per level.
      const groups = new Map<string, PackageExercise[]>();
      for (const exercise of exercises) {
        const key = exerciseVocabularyLevels(exercise).join('-');
        groups.set(key, [...(groups.get(key) ?? []), exercise]);
      }
      for (const [key, selected] of groups) result.push({ id: `${pack.id}.${key}`, title: learnerListName(pack), level: exerciseContentLevel(selected[0]), levels: exerciseVocabularyLevels(selected[0]), pack, exercises: selected, image: pack.cover?.image });
    } else {
      for (const level of chapterLevels.filter(item => item.id !== 'all')) {
        const selected = exercises.filter(exercise => chapterExerciseLevel(exercise) === level.id);
        if (!selected.length) continue;
        result.push({ id: `${pack.id}.${level.id}`, title: learnerListName(pack), level: level.id, pack, exercises: selected, image: pack.cover?.image });
      }
    }
  }
  cache.set(activity, result);
  return result;
}

export function chapterHash(location: ChapterLocation = { level: 'all' }) {
  const path = [location.chapter, location.activity, location.collection].filter(Boolean).map(value => encodeURIComponent(value!)).join('/');
  const query = new URLSearchParams();
  if (location.level !== 'all') query.set('level', location.level);
  if (location.help && location.help !== 'all') query.set('help', location.help);
  return `#learner/chapters${path ? `/${path}` : ''}${query.size ? `?${query}` : ''}`;
}

export function chapterExerciseChoices(location: ChapterLocation) {
  if (!location.activity || !location.collection || location.activity === 'learning-review') return [];
  // Only switch within the exact existing collection and its selected level/help filters.
  return groupActivities.filter(activity => activity.id !== 'learning-review').flatMap(activity => {
    const collection = chapterCollections(activity.id).find(item => item.id === location.collection && matchesChapterSelection(item, location));
    const chapters = practiceChapters.filter(chapter => chapter.activities.includes(activity.id));
    const chapter = chapters.find(chapter => chapter.id === location.chapter) ?? chapters[0];
    return collection && chapter ? [{ ...activity, chapter: chapter.id, collection: collection.id }] : [];
  });
}

export function parseChapterHash(hash: string): ChapterLocation {
  const fallback: ChapterLocation = { level: 'all' };
  try {
    const [path, query] = hash.split('?');
    if (path !== '#learner/chapters' && !path.startsWith('#learner/chapters/')) return fallback;
    const [chapterId, activityId, collection] = path.slice('#learner/chapters'.length).split('/').filter(Boolean).map(decodeURIComponent);
    const chapter = practiceChapters.find(item => item.id === chapterId);
    const params = new URLSearchParams(query);
    const level = chapterLevels.find(item => item.id === params.get('level'))?.id ?? 'all';
    const help = contentHelp.find(item => item.id !== 'all' && item.id === params.get('help'))?.id;
    const selection = { level, ...(help ? { help } : {}) };
    if (!chapter) return chapterId ? fallback : selection;
    const activity = chapter.activities.find(id => id === activityId);
    const candidate = activity && chapterCollections(activity).find(item => item.id === collection);
    // Historical learning-path links used support as a catch-all level. Keep them playable.
    if (candidate && level === 'support' && candidate.level !== 'support' && candidate.exercises.some(item => item.learningPathId)) selection.level = candidate.level;
    return { chapter: chapter.id, activity, ...selection, collection: candidate && matchesChapterSelection(candidate, selection) ? collection : undefined };
  } catch { return fallback; }
}
