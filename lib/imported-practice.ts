import bank from '../data/klink-imported-practice.json' with { type: 'json' };
import wordUseSelf from '../data/klink-word-use-self.json' with { type: 'json' };
import { importedItemIssues, importedLevels, type ImportedItem } from './imported-practice-contract.ts';
import type { PackageDefinition, PackageExercise } from './package-content';
import { learnerListName } from './learner-copy.ts';

export const importedRoutes = [
  { domain: 'klanken', id: 'content-klanken', label: 'Letters en klanken oefenen', chapter: 'sounds', category: 'Klanken', icon: 'ear' },
  { domain: 'spelling', id: 'content-spelling', label: 'Spelling oefenen', chapter: 'spelling', category: 'Spelling', icon: 'keyboard' },
  { domain: 'grammatica', id: 'content-grammatica', label: 'Zinnen oefenen', chapter: 'grammar', category: 'Grammatica', icon: 'puzzle' },
  { domain: 'teksten', id: 'content-teksten', label: 'Teksten begrijpen', chapter: 'texts', category: 'Teksten', icon: 'book' },
  { domain: 'gesprekken', id: 'content-gesprekken', label: 'Gesprekken oefenen', chapter: 'speaking', category: 'Spreken', icon: 'chat' },
  { domain: 'schrijven', id: 'content-schrijven', label: 'Schrijven oefenen', chapter: 'writing', category: 'Schrijven', icon: 'pen' },
  { domain: 'herhaling', id: 'content-herhaling', label: 'Terughalen met je docent', chapter: 'repeat', category: 'Herhalen', icon: 'book' },
  { domain: 'woordpakketten', id: 'content-woordpakketten', label: 'Woorden gebruiken', chapter: 'words', category: 'Woorden', icon: 'book' },
] as const;
const selfPracticeIds = new Set(wordUseSelf.map(item => item.id));
const independentGrammar = (item: ImportedItem) => item.domain === 'grammatica' && item.mode === 'choice' && !item.teacherWorkflow && !item.teacherReference;
export const importedItems = ([...bank.items, ...wordUseSelf] as ImportedItem[]).filter(item => !importedItemIssues(item).length);
export const importedActivities = importedRoutes.filter(route => importedItems.some(item => item.domain === route.domain));
export type ImportedActivity = typeof importedRoutes[number]['id'];

export function importedExercise(item: ImportedItem): PackageExercise {
  const initialQuestions = item.teacherReference ? importedItems.filter(other => other.teacherReference && other.domain === item.domain && other.stimulus === item.stimulus).map(other => ({ id: other.id, prompt: other.prompt })) : undefined;
  return { exerciseId: `content:${item.id}`, componentId: 'KLINK-CONTENT', contractVersion: '1.0', mode: `content-${item.mode}`, groupActivity: importedRoutes.find(route => route.domain === item.domain)!.id,
    title: item.title, objective: item.objective, sourceContentIds: item.sourceIds, sourceStatus: 'reviewed-concept', phase: 'use', requiresAudio: false, manualAdvance: true, requiresExplicitCompletion: true,
    assessment: item.mode === 'teacher' ? 'participation' : 'answer', reviewEligible: false, independentReading: false, access: selfPracticeIds.has(item.id) || independentGrammar(item) ? 'self-practice' : 'teacher-supported',
    contentLevel: importedLevels[item.level], contentAxis: item.axis, contentTask: {...item,...(initialQuestions?.length ? {initialQuestions} : {})}, feedback: item.feedback.retry,
    targetWordIds: item.teacherWorkflow?.targetWordIds.length ? item.teacherWorkflow.targetWordIds : item.sourceIds.filter(id => id.startsWith('klink-woord-')),
    sourceLessonIds: item.teacherWorkflow?.sourceLessonIds ?? [],
    readingConditions: { independentReading: false, preparation: item.prerequisites },
  };
}
function matchPack(pack: PackageDefinition) {
  // Reuse membership within this calculation only; callers may supply changed packs later.
  const lessons = new Set(pack.lessons.map(lesson => lesson.id));
  const words = new Set(pack.words.map(word => word.id));
  const sources = new Set([...pack.texts, ...pack.dialogues].map(source => source.id));
  for (const exercise of pack.exercises) if (typeof exercise.contextId === 'string') sources.add(exercise.contextId);
  return (item: ImportedItem) => {
    if ((item.teacherWorkflow?.sourceLessonIds ?? []).some(id => lessons.has(id))) return true;
    const targets = item.teacherWorkflow?.targetWordIds.length ? item.teacherWorkflow.targetWordIds : item.sourceIds.filter(id => id.startsWith('klink-woord-'));
    if (targets.length && targets.every(id => words.has(id))) return true;
    return item.sourceIds.some(id => sources.has(id));
  };
}
export function importedMatchesPack(item: ImportedItem, pack: PackageDefinition) {
  return matchPack(pack)(item);
}
export function importedExercisesForPack(pack: PackageDefinition, activity: ImportedActivity) {
  const route = importedRoutes.find(item => item.id === activity)!;
  const matches = matchPack(pack);
  return importedItems.filter(item => item.domain === route.domain && matches(item)).map(importedExercise);
}
export function importedCollections(activity: ImportedActivity, items = importedItems, packs: PackageDefinition[] = []) {
  const route = importedRoutes.find(item => item.id === activity)!;
  const matchers = packs.map(pack => ({ pack, matches: matchPack(pack) }));
  const groups = new Map<string, { id: string; title: string; level: typeof importedLevels[keyof typeof importedLevels]; pack: PackageDefinition; exercises: PackageExercise[] }>();
  for (const item of items.filter(item => item.domain === route.domain && !importedItemIssues(item).length)) {
    const exercise = importedExercise(item);
    const sourcePack = selfPracticeIds.has(item.id) ? undefined : matchers.find(({ matches }) => matches(item))?.pack;
    const pack: PackageDefinition = sourcePack ?? { id: `content:${item.domain}`, title: route.label, subtitle: '', description: '', level: item.level, status: 'teacher-supported', statusNote: '',
      counts: { lessons: 0, coreWords: 0, exercises: 1, exerciseTypes: 1, texts: 0, dialogues: 0, games: 0, images: 0, audio: 0 },
      words: [], lessons: [], texts: [], dialogues: [], games: [], scenes: [], exercises: [exercise], exerciseTypes: [],
      media: { imageAvailable: 0, imageExpected: 0, audioAvailable: 0, audioExpected: 0, missing: [], imageReview: 'not-used', audioReview: 'paused', publication: 'local' },
    };
    const groupSource = selfPracticeIds.has(item.id) ? `word-self:${importedLevels[item.level]}` : sourcePack?.id ?? item.sourceIds.find(id => !id.startsWith('klink-woord-')) ?? item.sourceIds[0];
    const id = `content:${item.domain}:${groupSource}:${importedLevels[item.level]}:${item.teacherWorkflow?.kind ?? item.mode}`;
    const group = groups.get(id) ?? { id, title: sourcePack ? `${learnerListName(sourcePack)} · ${item.teacherWorkflow ? item.title : route.label}` : item.title, level: importedLevels[item.level], pack, exercises: [] };
    group.exercises.push(exercise);groups.set(id,group);
    if (!sourcePack) { group.pack.exercises = group.exercises;group.pack.counts.exercises = group.exercises.length; }
  }
  return [...groups.values()];
}
