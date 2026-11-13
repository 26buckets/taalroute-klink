import reference from '../data/klink-sounds.json' with { type: 'json' };
import nicoAudio from '../data/klink-nico-audio.json' with { type: 'json' };
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import { allPackageWords, lessonPackages } from './package-content.ts';

export const soundGroups = reference.groups;
const recordedSounds: Record<string, string> = nicoAudio.sounds;
const additionalSounds: Record<string, { label: string; audio: string }[]> = nicoAudio.additionalSounds;
export const soundCards = Object.entries(reference.sounds as Record<string, { label: string; example: string; words: string[]; audio?: string }>).map(([id, sound]) => ({
  id, ...sound, audio: recordedSounds[id] ?? sound.audio,
  additionalAudio: additionalSounds[id] ?? [],
  group: soundGroups.find(group => group.items.includes(id))!,
}));
export const soundById = new Map(soundCards.map(sound => [sound.id, sound]));
export type SoundCard = typeof soundCards[number];
export const soundHash = (id?: string) => id ? `#learner/sounds/${encodeURIComponent(id)}` : '#learner/sounds';
export const klankstudioUrl = (id: string) => `${reference.source.klankstudio}?sound=${encodeURIComponent(id)}`;
export const soundPosterUrl = reference.source.poster;

export function wordsForSound(sound: SoundCard) {
  return sound.words.map(word => (allPackageWords.find(item => item.word === word && item.id.startsWith('klink-woord-')) ?? allPackageWords.find(item => item.word === word))!).filter(Boolean);
}

export function soundsForWord(wordId: string) {
  const units = curriculum.words.find(word => word.id === wordId)?.reading.units ?? [];
  // shortcut: only direct sound spellings inline; add spelling explanations before showing changed sound values.
  if (units.some(unit => unit.value || !soundById.has(unit.coreUnit ?? ''))) return [];
  return [...new Set(units.map(unit => unit.coreUnit!))].map(id => soundById.get(id)!);
}

export function lessonForSoundWord(wordId: string) {
  for (const pack of lessonPackages) {
    const lesson = pack.lessons.find(lesson => lesson.newWords?.includes(wordId));
    if (lesson?.guidedExerciseIds?.[0]) return { packageId: pack.id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds[0] };
  }
}
