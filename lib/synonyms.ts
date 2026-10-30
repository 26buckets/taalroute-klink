import bank from '../data/klink-synonyms.json' with { type: 'json' };
import { productionPack } from './production-practice.ts';
import { allPackageWords } from './package-content.ts';
import { orderedChoices } from './extended-practice.ts';
import { isWithdrawnAudio } from './audio-policy.ts';
import { resolveRegisteredAudio } from './audio-register.ts';
import synonymAudio from '../data/klink-synonym-audio.json' with { type: 'json' };
import type { PackageExercise } from './package-content';
import type { ContentLevel } from './content-levels';

export const synonymBank = bank;
export const synonymActivities = ['synonyms', 'cards', 'hear-match'] as const;
const activeEntries = bank.entries.filter(entry => entry.active);
const entriesById = new Map(activeEntries.map(entry => [entry.id, entry]));
const wordAudio = new Map(allPackageWords.filter(word => word.audio && word.audioStatus !== 'rejected' && !isWithdrawnAudio(word.audio)).map(word => [word.word.toLocaleLowerCase('nl'), word.audio!]));
for (const entry of bank.entries) for (const word of [entry.word, entry.synonym]) {
  const key = word.toLocaleLowerCase('nl');
  const src = resolveRegisteredAudio(`synonym-word:${word}`, word, 'target', wordAudio.get(key), synonymAudio);
  if (src && !isWithdrawnAudio(src)) wordAudio.set(key, src);
}
export const isSynonymPack = (pack: { id: string }) => pack.id.startsWith('synonyms-');

export function parseSynonymSettings(raw: string | null): { seed: number; reverse: boolean } {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (Number.isSafeInteger(value?.seed) && value.seed >= 1 && value.seed <= 0xffffffff && typeof value.reverse === 'boolean') return { seed: value.seed, reverse: value.reverse };
  } catch { /* Optional storage. */ }
  return { seed: 1, reverse: false };
}

export function synonymExercises(pack: { exercises: PackageExercise[] }, activity: string, seed = 1, reverse = false): PackageExercise[] {
  if (!synonymActivities.some(id => id === activity)) return [];
  const exercises = pack.exercises.flatMap<PackageExercise>(exercise => {
    const entry = entriesById.get(typeof exercise.synonymPairId === 'string' ? exercise.synonymPairId : exercise.exerciseId);
    if (!entry) return [];
    const word = reverse ? entry.synonym : entry.word, synonym = reverse ? entry.word : entry.synonym;
    const base = { ...exercise, synonymPairId: entry.id, exerciseId: `${entry.id}${reverse ? ':reverse' : ''}`, groupActivity: activity,
      prompt: { text: word }, objective: `synonyms:${word}`, correctFeedback: `${word} betekent bijna hetzelfde als ${synonym}.` };
    if (activity === 'cards') return [{ ...base, exerciseId: `${base.exerciseId}:cards`, componentId: 'ALF-CMP-016', mode: 'synonym-card',
      title: 'Bedenk een synoniem. Draai de kaart.', prompt: undefined, options: undefined, answer: undefined,
      cards: [{ cardId: entry.id, front: { text: word }, back: { text: synonym } }],
      assessment: 'participation' as const, independentReading: false, reviewEligible: false,
      requiresExplicitCompletion: true,
    }];
    const src = activity === 'hear-match' ? wordAudio.get(word.toLocaleLowerCase('nl')) : undefined;
    if (activity === 'hear-match' && !src) return [];
    const options = entry.options.map((label, index) => ({ id: String(index), label: label === entry.synonym ? synonym : label }));
    return [{ ...base, componentId: 'KLINK-EXTENDED', mode: 'synonyms',
      exerciseId: `${base.exerciseId}${src ? ':hear-match' : ''}`, title: src ? 'Luister. Welk woord betekent bijna hetzelfde?' : bank.instruction,
      prompt: src ? { audio: { src } } : { text: word },
      options: seed === 1 ? options : orderedChoices(options, seed + bank.entries.indexOf(entry)),
      answer: { correctOptionIds: [String(entry.options.indexOf(entry.synonym))] },
      requiresAudio: Boolean(src), independentReading: !src, access: src ? 'supported-listening' : 'independent-practice',
    }];
  });
  return seed === 1 ? exercises : orderedChoices(exercises, seed);
}
const grouped = new Map<string, typeof bank.entries>();
for (const entry of activeEntries) {
  const key = `${entry.collectionId}:${entry.minimumLevel}`;
  grouped.set(key, [...(grouped.get(key) ?? []), entry]);
}

export const synonymCollections = [...grouped.values()].flatMap(entries => {
  const result = [];
  for (let start = 0; start < entries.length; start += 15) {
    const selected = entries.slice(start, start + 15), first = selected[0];
    // Keep published list IDs; split only the words that now require a higher level.
    const firstLevel = ['a1', 'a2', 'b1'].find(level => activeEntries.some(entry => entry.collectionId === first.collectionId && entry.minimumLevel === level));
    const id = first.collectionId + (first.minimumLevel === firstLevel ? '' : `-${first.minimumLevel}`);
    const title = first.collectionTitle;
    const exercises: PackageExercise[] = selected.map(entry => ({
      exerciseId: entry.id, synonymPairId: entry.id, componentId: 'KLINK-EXTENDED', contractVersion: '1.0',
      mode: 'synonyms', groupActivity: 'synonyms', title: bank.instruction,
      prompt: { text: entry.word }, vocabularyLevels: entry.levels,
      options: entry.options.map((label, index) => ({ id: String(index), label })),
      answer: { correctOptionIds: [String(entry.options.indexOf(entry.synonym))] },
      correctFeedback: `${entry.word} betekent bijna hetzelfde als ${entry.synonym}.`,
      feedback: 'Dat woord betekent iets anders. Probeer opnieuw.',
      objective: `synonyms:${entry.word}`, phase: 'recall', assessment: 'answer',
      requiresAudio: false, manualAdvance: true, reviewEligible: true,
      sourceStatus: 'editorial-reviewed', independentReading: true, access: 'independent-practice',
    }));
    const level = first.minimumLevel as ContentLevel, levels = first.levels as ContentLevel[];
    const pack = productionPack({ id, title, level, activity: 'synonyms', count: exercises.length }, exercises);
    pack.practiceActivities = [...synonymActivities, 'learning-review'];
    result.push({ id, title, level, levels, help: 'practice' as const, pack, exercises });
  }
  return result;
});
