import index from '../data/klink-word-round-index.json' with { type: 'json' };
import { allPackageWords, wordLabel, type PackageExercise, type PackageWord } from './package-content.ts';
import type { ChapterCollection } from './practice-chapters.ts';

export type WordRound = { title: string; image?: string; exerciseIds: string[]; placeholderCount: number; wordIds: string[]; wordLabels: string[]; targets?: string[][] };
export const wordRoundActivities = new Set(['meet', 'same-word', 'listen', 'hear-word', 'read', 'match', 'hear-match', 'cards', 'build-model', 'build', 'worksheet', 'worksheet-heard', 'missing', 'copy', 'dictation', 'write', 'speak', 'read-series', 'paper-dictation', 'memory', 'word-bingo', 'image-bingo', 'word-sort']);
const words = new Map(allPackageWords.map(word => [word.id, word]));
const definitionCache = new WeakMap<ChapterCollection, WordRound[]>();
const cache = new WeakMap<ChapterCollection, ChapterCollection[]>();
const selectionCache = new WeakMap<ChapterCollection, Map<string, ChapterCollection | undefined>>();
const unique = (ids: string[]) => [...new Set(ids)];

export function wordRoundDefinitions(exercises: PackageExercise[], packWords: PackageWord[] = []): WordRound[] {
  if (!exercises.length || exercises.some(item => item.learningPathId || item.contextId || item.synonymPairId || !wordRoundActivities.has(typeof item.groupActivity === 'string' ? item.groupActivity : item.mode === 'model' ? 'meet' : ''))) return [];
  const byId = new Map(packWords.map(word => [word.id, word]));
  const targets = exercises.map(item => unique((Array.isArray(item.targetWordIds) && item.targetWordIds.length ? item.targetWordIds : typeof item.wordId === 'string' ? [item.wordId] : []).filter((id): id is string => typeof id === 'string')));
  if (targets.some(ids => !ids.length)) return [];
  // A bingo turn belongs to its complete board, even though it assesses one word.
  for (const item of exercises) if (item.boardId) {
    const boardWords = unique(exercises.flatMap((other, i) => other.boardId === item.boardId ? targets[i] : []));
    exercises.forEach((other, i) => { if (other.boardId === item.boardId) targets[i] = boardWords; });
  }
  const labels = new Map<string, { label: string; image?: string; placeholder: boolean }>();
  exercises.forEach((item, i) => {
    for (const id of targets[i]) {
      const own = id === item.wordId;
      const source = (item.sources as { id: string; label?: string }[] | undefined)?.find(row => row.id === id);
      const option = (item.options as { id: string; label?: string; image?: { src: string; placeholderWord?: string } }[] | undefined)?.find(row => row.id === id);
      const card = (item.cards as { cardId: string; front?: { image?: { src: string; placeholderWord?: string } }; back?: { text?: string } }[] | undefined)?.find(row => row.cardId === id);
      const text = own ? [(item.text as { primary?: string } | undefined)?.primary, item.exampleWord, item.displayWord, item.target, item.helpWord].find(value => typeof value === 'string' && value) as string | undefined : undefined;
      const label = text ?? source?.label ?? option?.label ?? card?.back?.text ?? (byId.get(id) ?? words.get(id))?.word;
      const image = (own ? item.prompt?.image : undefined) ?? option?.image ?? card?.front?.image ?? (item.targets as { id: string; image?: { src: string; placeholderWord?: string } }[] | undefined)?.find(row => row.id === `image-${id}`)?.image;
      if (label) labels.set(id, { label: wordLabel({ id, word: label }), image: image?.placeholderWord ? undefined : image?.src ?? (byId.get(id) ?? words.get(id))?.image, placeholder: Boolean(image?.placeholderWord) });
    }
  });
  if (targets.flat().some(id => !labels.has(id))) return [];
  const units: number[][] = [];
  exercises.forEach((item, i) => {
    const existing = item.boardId ? units.find(unit => exercises[unit[0]].boardId === item.boardId) : undefined;
    if (existing) existing.push(i); else units.push([i]);
  });
  if (units.some(unit => unique(unit.flatMap(i => targets[i])).length > 8)) return [];
  const groups: number[][] = [];
  if (units.every(unit => unit.length === 1 && targets[unit[0]].length === 1) && new Set(targets.flat()).size === exercises.length) {
    const count = Math.ceil(exercises.length / 8);
    for (let i = 0; i < count; i++) groups.push(Array.from({ length: Math.floor((i + 1) * exercises.length / count) - Math.floor(i * exercises.length / count) }, (_, n) => Math.floor(i * exercises.length / count) + n));
  } else for (const unit of units) {
    const last = groups.at(-1);
    if (last && unique([...last, ...unit].flatMap(i => targets[i])).length <= 8) last.push(...unit); else groups.push([...unit]);
  }
  return groups.map(group => {
    const wordIds = unique(group.flatMap(i => targets[i])), first = labels.get(wordIds[0])!;
    const onePerTask = group.every((i, n) => targets[i].length === 1 && targets[i][0] === wordIds[n]) && group.length === wordIds.length;
    return { title: wordIds.slice(0, 2).map(id => labels.get(id)!.label).join(' · '), ...(first.image ? { image: first.image } : {}), exerciseIds: group.map(i => exercises[i].exerciseId), placeholderCount: wordIds.filter(id => labels.get(id)!.placeholder).length, wordIds, wordLabels: wordIds.map(id => labels.get(id)!.label), ...(!onePerTask ? { targets: group.map(i => targets[i]) } : {}) };
  });
}

function definitions(collection: ChapterCollection): WordRound[] {
  const cached = definitionCache.get(collection);
  if (cached) return cached;
  const rounds = collection.contentUrl ? (index as Record<string, WordRound[]>)[collection.contentUrl] ?? [] : wordRoundDefinitions(collection.exercises, collection.pack.words);
  definitionCache.set(collection, rounds);
  return rounds;
}

function selectedCollection(collection: ChapterCollection, item: WordRound, id: string, allExerciseIds: string[]): ChapterCollection {
  return { ...collection, id, title: item.title, image: item.image, placeholderCount: item.placeholderCount, exercises: collection.exercises.filter(exercise => item.exerciseIds.includes(exercise.exerciseId)), wordRound: { ...item, sourceId: collection.id, allExerciseIds } };
}

export function chapterWordRounds(collection: ChapterCollection): ChapterCollection[] {
  const cached = cache.get(collection);
  if (cached) return cached;
  const rounds = definitions(collection);
  const allExerciseIds = rounds.flatMap(item => item.exerciseIds);
  const result = rounds.length ? rounds.map((item, i) => selectedCollection(collection, item, rounds.length === 1 ? collection.id : `${collection.id}~words-${i + 1}`, allExerciseIds)) : [collection];
  cache.set(collection, result);
  return result;
}

export function selectChapterWords(collection: ChapterCollection, wordIds: string[]): ChapterCollection | undefined {
  const key = JSON.stringify(wordIds);
  const selections = selectionCache.get(collection) ?? new Map<string, ChapterCollection | undefined>();
  if (selections.has(key)) return selections.get(key);
  const rounds = definitions(collection), wanted = new Set(wordIds);
  if (!wanted.size || wanted.size > 8 || wanted.size !== wordIds.length || !wordIds.every(id => rounds.some(round => round.wordIds.includes(id)))) return undefined;
  const labels = new Map(rounds.flatMap(round => round.wordIds.map((id, i) => [id, round.wordLabels[i]] as const)));
  const tasks = rounds.flatMap(round => round.exerciseIds.map((id, i) => ({ id, words: round.targets?.[i] ?? [round.wordIds[i]] })));
  const selected = tasks.filter(task => task.words.every(id => wanted.has(id)));
  const covered = new Set(selected.flatMap(task => task.words));
  // Never replace missing words or split authored boards merely to offer another mode.
  const result = wanted.size && wanted.size <= 8 && covered.size === wanted.size ? selectedCollection(collection, { title: wordIds.slice(0, 2).map(id => labels.get(id)).join(' · '), wordIds, wordLabels: wordIds.map(id => labels.get(id)!), exerciseIds: selected.map(task => task.id), placeholderCount: 0 }, collection.id, tasks.map(task => task.id)) : undefined;
  if (result) { selections.set(key, result); selectionCache.set(collection, selections); }
  return result;
}
