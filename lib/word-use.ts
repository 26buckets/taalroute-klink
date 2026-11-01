import bank from '../data/klink-word-use.json' with { type: 'json' };
import bindings from '../data/klink-word-use-audio.json' with { type: 'json' };
import { resolveRegisteredAudio, type AudioBinding } from './audio-register.ts';
import { orderedChoices } from './extended-practice.ts';
import { productionPack } from './production-practice.ts';
import type { PackageDefinition, PackageExercise } from './package-content';
import type { ContentLevel } from './content-levels';

export const wordUseBank = bank;
export const wordUseActivities = ['word-combinations', 'suitable-reply'] as const;
export const isWordUsePack = (pack: { id: string }) => wordUseActivities.some(activity => pack.id.startsWith(activity + '-'));
export const wordUseInstruction = (activity: string, context: string) => (activity === 'word-combinations' ? 'Lees of luister. Welk woord maakt de combinatie af? ' : 'Lees of luister. Welke reactie past bij de situatie? ') + context;
const audio = (text: string, role = 'target') => {
  const id = `${role}:${text}`;
  const src = resolveRegisteredAudio(id, text, role, undefined, bindings as Record<string, AudioBinding>);
  return src ? { audioId: id, src } : undefined;
};

const groups = new Map<string, typeof bank.entries>();
for (const entry of bank.entries) groups.set(entry.collectionId, [...(groups.get(entry.collectionId) ?? []), entry]);
export const wordUseCollections = [...groups.values()].map(entries => {
  const first = entries[0], level = first.level as ContentLevel;
  const exercises: PackageExercise[] = entries.map(entry => {
    const options = entry.options.map((label, index) => ({ id: String(index), label, audio: audio(label) }));
    return {
    exerciseId: entry.id, wordUseId: entry.id, componentId: 'KLINK-EXTENDED', contractVersion: '1.0', mode: entry.activity, groupActivity: entry.activity,
    title: entry.activity === 'word-combinations' ? 'Welk woord maakt de combinatie af?' : 'Welke reactie past?',
    wordUseContext: entry.context, prompt: { text: entry.prompt, audio: audio(entry.spokenPrompt) },
    instructionAudio: audio(wordUseInstruction(entry.activity, entry.context), 'instruction'),
    options, playAllBlocks: true,
    textBlocks: [{ id: 'prompt', audio: audio(entry.spokenPrompt) }, ...options.map(option => ({ id: option.id, audio: option.audio }))],
    answer: { correctOptionIds: [String(entry.options.indexOf(entry.answer))] },
    correctFeedback: entry.explanation, feedback: 'Lees of luister nog eens. Welke keuze past bij deze situatie?',
    objective: `${entry.activity}:${entry.id}`, vocabularyLevels: [level], phase: 'recall', assessment: 'answer',
    requiresAudio: false, manualAdvance: true, reviewEligible: true, independentReading: true, access: 'independent-practice', sourceStatus: 'editorial-reviewed',
    };
  });
  const pack = productionPack({ id: first.collectionId, title: first.theme, level, activity: first.activity, count: exercises.length }, exercises);
  pack.practiceActivities = [first.activity, 'learning-review'];
  return { id: first.collectionId, title: first.theme, level, help: 'practice' as const, pack, exercises };
});

export function wordUseExercises(pack: PackageDefinition, activity: string, seed = 1): PackageExercise[] {
  if (!isWordUsePack(pack) || !pack.practiceActivities?.includes(activity)) return [];
  return pack.exercises.map((exercise, index) => {
    const options = orderedChoices(Array.isArray(exercise.options) ? exercise.options as { id: string; audio?: { src?: string } }[] : [], seed + index);
    return { ...exercise, options, textBlocks: [{ id: 'prompt', audio: exercise.prompt?.audio }, ...options.map(option => ({ id: option.id, audio: option.audio }))] };
  });
}
