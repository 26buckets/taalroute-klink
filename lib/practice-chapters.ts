import { taalroutePackages } from './taalroute-packages.ts';
import { groupActivities, groupExercises, type GroupActivity } from './group-practice.ts';
import { contentById } from './connected-content.ts';
import { learnerListName } from './learner-copy.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import type { PackageDefinition, PackageExercise } from './package-content';

// Separate skill entrances, not new lessons or a second placement of Lexicon words.
export const practiceChapters: { id: string; title: string; icon: typeof groupActivities[number]['icon']; activities: GroupActivity[] }[] = [
  { id: 'words', title: 'Woorden oefenen', icon: 'image', activities: ['meet', 'same-word', 'listen', 'hear-word', 'read', 'match', 'hear-match', 'cards'] },
  { id: 'sounds', title: 'Klanken', icon: 'ear', activities: ['sound-path', 'sound-compare'] },
  { id: 'sentences', title: 'Zinnen', icon: 'book', activities: ['sentences', 'word-sentence', 'find-sentence', 'sentence-build', 'sentence-dictation', 'sentence-speak'] },
  { id: 'texts', title: 'Teksten', icon: 'book', activities: ['reading-path', 'texts', 'text-question', 'text-evidence'] },
  { id: 'listening', title: 'Luisteren', icon: 'ear', activities: ['listen', 'understand', 'text-question', 'dialogue-question'] },
  { id: 'speaking', title: 'Spreken', icon: 'mic', activities: ['speak', 'sentence-speak', 'dialogues', 'dialogue-role'] },
  { id: 'writing', title: 'Schrijven', icon: 'pen', activities: ['write-letter', 'copy', 'write', 'dictation', 'paper-dictation', 'sentence-dictation', 'functional-message', 'functional-form'] },
  { id: 'spelling', title: 'Spelling', icon: 'keyboard', activities: ['spelling-path', 'build-model', 'build', 'worksheet', 'worksheet-heard', 'missing', 'dictation'] },
  { id: 'grammar', title: 'Grammatica', icon: 'puzzle', activities: ['grammar-path', 'sentence-build', 'verb-choice'] },
  { id: 'practical', title: 'In de praktijk', icon: 'chat', activities: ['practical-path', 'dialogues', 'dialogue-role', 'dialogue-question', 'functional-message', 'functional-form'] },
  { id: 'repeat', title: 'Samen herhalen', icon: 'grid', activities: ['learning-review', 'word-bingo', 'image-bingo', 'memory', 'read-series', 'worksheet', 'worksheet-heard'] },
  { id: 'support', title: 'Rustig beginnen', icon: 'eye', activities: ['meet', 'build-model', 'copy'] },
];

export const chapterLevels = [
  { id: 'all', label: 'Alles' },
  { id: 'alfa-a', label: 'Alfa A' },
  { id: 'alfa-b', label: 'Alfa B' },
  { id: 'support', label: 'Met hulp' },
  { id: 'a1', label: 'A1 · met hulp' },
  { id: 'a2', label: 'A2 · met hulp' },
] as const;
export type ChapterLevel = typeof chapterLevels[number]['id'];
export type ChapterCollection = { id: string; title: string; level: ChapterLevel; pack: PackageDefinition; exercises: PackageExercise[]; image?: string };
export type ChapterLocation = { chapter?: string; activity?: GroupActivity; level: ChapterLevel; collection?: string };
const words = new Map(curriculum.words.map(word => [word.id, word]));
const cache = new Map<GroupActivity, ChapterCollection[]>();
const singleSourceActivities = new Set<GroupActivity>(['texts', 'text-question', 'text-evidence', 'dialogues', 'dialogue-question', 'dialogue-role', 'functional-message', 'functional-form']);

export function chapterExerciseLevel(exercise: PackageExercise): ChapterLevel {
  if (exercise.learningPathId) return 'support';
  const source = contentById.get(String(exercise.contextId));
  if (source) {
    if (/^a2(?:_|$)/i.test(source.sourceLevel)) return 'a2';
    if (/^a1(?:_|$)/i.test(source.sourceLevel)) return 'a1';
    return 'support';
  }
  // A mixed board keeps its most demanding existing word condition; never split its choices.
  const targets = Array.isArray(exercise.targetWordIds) ? exercise.targetWordIds as string[] : typeof exercise.wordId === 'string' ? [exercise.wordId] : [];
  const conditions = Array.isArray(exercise.readingConditions) ? exercise.readingConditions as { wordId?: string }[] : [];
  const boardWords = Array.isArray(exercise.cells) ? (exercise.cells as { cellId?: string }[]).map(cell => cell.cellId).filter((id): id is string => Boolean(id)) : [];
  const prepared = [...new Set([...targets, ...conditions.flatMap(condition => condition.wordId ? [condition.wordId] : []), ...boardWords])];
  const levels = prepared.map(id => words.get(id)?.reading.level);
  if (levels.length && levels.every(level => level === 'A')) return 'alfa-a';
  if (levels.length && levels.every(level => level === 'A' || level === 'B')) return 'alfa-b';
  return 'support';
}

export function chapterCollections(activity: GroupActivity): ChapterCollection[] {
  const cached = cache.get(activity);
  if (cached) return cached;
  const seen = new Set<string>();
  const result: ChapterCollection[] = [];
  for (const pack of taalroutePackages) {
    const exercises = groupExercises(pack, activity).filter(exercise => {
      // One source in free practice, even when it recurs in several word lessons.
      // Word-to-sentence chains deliberately retain their model and repetition.
      if (exercise.learningPathId || typeof exercise.contextId !== 'string' || !exercise.contextId || activity === 'word-sentence') return true;
      const key = `${exercise.mode}:${exercise.contextId}`;
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
        result.push({ id: sourceId, title: String(selected[0].learningPathTitle), level: 'support', pack, exercises: selected, image: pack.cover?.image });
      }
    } else if (singleSourceActivities.has(activity)) {
      for (const exercise of exercises) {
        const source = contentById.get(String(exercise.contextId));
        result.push({ id: String(exercise.contextId), title: source?.title ?? exercise.title ?? learnerListName(pack), level: chapterExerciseLevel(exercise), pack, exercises: [exercise] });
      }
    } else if (activity === 'word-sentence') {
      // Keep complete word + sentence chains together, including their harder reading conditions.
      if (exercises.length) result.push({ id: pack.id, title: learnerListName(pack), level: 'support', pack, exercises, image: pack.cover?.image });
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
  return `#learner/chapters${path ? `/${path}` : ''}${location.level !== 'all' ? `?level=${location.level}` : ''}`;
}

export function parseChapterHash(hash: string): ChapterLocation {
  const fallback: ChapterLocation = { level: 'all' };
  try {
    const [path, query] = hash.split('?');
    if (path !== '#learner/chapters' && !path.startsWith('#learner/chapters/')) return fallback;
    const [chapterId, activityId, collection] = path.slice('#learner/chapters'.length).split('/').filter(Boolean).map(decodeURIComponent);
    const chapter = practiceChapters.find(item => item.id === chapterId);
    if (!chapter) return fallback;
    const activity = chapter.activities.find(id => id === activityId);
    const level = chapterLevels.find(item => item.id === new URLSearchParams(query).get('level'))?.id ?? 'all';
    return { chapter: chapter.id, activity, level, collection: activity && chapterCollections(activity).some(item => item.id === collection && (level === 'all' || item.level === level)) ? collection : undefined };
  } catch { return fallback; }
}
