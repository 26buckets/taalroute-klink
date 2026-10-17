import type { PackageDefinition, PackageExercise, PackageWord } from './package-content';
import bindings from '../data/klink-media.json' with { type: 'json' };
import instructions from '../data/klink-instructions.json' with { type: 'json' };
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };

export const mixedModes = [
  { id: 'listen', label: 'Luister en kies' },
  { id: 'read', label: 'Lees en kies' },
  { id: 'match', label: 'Koppel' },
  { id: 'build', label: 'Maak het woord' },
] as const;
export type MixedMode = typeof mixedModes[number]['id'];
const media = bindings as Record<string, { imageUse?: string }>;
const pictured = (word: PackageWord) => Boolean(word.image && media[word.id]?.imageUse !== 'context');
const image = (word: PackageWord) => ({ src: word.image, altText: word.meaning ?? word.word });
const audio = (word: PackageWord) => ({ src: word.audio, audioId: word.id });
const segmenter = new Intl.Segmenter('nl', { granularity: 'grapheme' });
const readingWords = new Map(curriculum.words.map(word => [word.id, word]));

// A saved seed reproduces a round exactly; retrying never moves the answer choices.
function random(seed: number) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function shuffled<T>(items: T[], next: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function distance(a: string, b: string) {
  const left = Array.from(segmenter.segment(a), item => item.segment);
  const right = Array.from(segmenter.segment(b), item => item.segment);
  return Math.abs(left.length - right.length) + left.filter((letter, i) => letter !== right[i]).length;
}

export function createMixedRound(pack: PackageDefinition, mode: MixedMode, seed: number): PackageExercise[] {
  const next = random(seed);
  const words = [...new Map(pack.words.map(word => [word.id, word])).values()];
  const templates = new Map<string, PackageExercise>();
  for (const exercise of pack.exercises) {
    if (exercise.mode === 'recall-word' && typeof exercise.wordId === 'string' && !templates.has(exercise.wordId)) templates.set(exercise.wordId, exercise);
  }
  const lessonIds = (word: PackageWord) => pack.lessons.filter(lesson => [...(lesson.newWords ?? []), ...(lesson.returning ?? []), ...(lesson.known ?? [])].includes(word.id)).map(lesson => lesson.id);
  const conditions = (items: PackageWord[]) => items.map(word => {
    const source = readingWords.get(word.id);
    return { wordId: word.id, firstReading: source?.firstReading, reading: source?.reading, preparation: source?.preparation };
  });
  function base(word: PackageWord, exerciseMode: string, component: string, title: string, activityTypeId: string): PackageExercise {
    const instruction = instructions.items.find(item => item.modes.includes(exerciseMode));
    return {
      exerciseId: `${pack.id}:mixed:${mode}:${word.id}`, componentId: component, contractVersion: '1.0',
      mode: exerciseMode, title, wordId: word.id, targetWordIds: [word.id], activityTypeId, phase: 'recall',
      sourceStatus: 'concept', assessment: 'answer', objective: `${activityTypeId}:${word.id}`,
      sourceLessonIds: lessonIds(word), readingConditions: conditions([word]),
      instructionAudio: instruction?.src ? { src: instruction.src, audioId: instruction.id } : undefined,
      prompt: { text: title },
    };
  }
  const eligible = shuffled(words.filter(word => mode === 'build' ? templates.has(word.id) && word.audio
    : mode === 'listen' ? word.audio : pictured(word)), next);
  if (mode === 'match') {
    // One spelling/image only per board, so homographs and shared photos cannot create ambiguous pairs.
    const pending = [...eligible];
    const rounds: PackageExercise[] = [];
    while (pending.length) {
      const board: PackageWord[] = [];
      for (let i = 0; i < pending.length && board.length < 3;) {
        const word = pending[i];
        if (board.some(other => other.word === word.word || other.image === word.image)) { i++; continue; }
        board.push(...pending.splice(i, 1));
      }
      if (board.length === 1) {
        const helper = eligible.find(other => other.word !== board[0].word && other.image !== board[0].image);
        if (helper) board.push(helper);
      }
      if (board.length < 2) continue;
      rounds.push({ ...base(board[0], 'word-image-match', 'ALF-CMP-004', 'Kies een woord. Kies de foto.', 'BB-03'),
        targetWordIds: board.map(word => word.id), access: 'supported-listening',
        sourceLessonIds: [...new Set(board.flatMap(lessonIds))], readingConditions: conditions(board),
        sources: board.map(word => ({ id: word.id, label: word.word, audio: audio(word) })),
        targets: shuffled(board, next).map(word => ({ id: `image-${word.id}`, image: image(word) })),
        answer: { mapping: Object.fromEntries(board.map(word => [word.id, `image-${word.id}`])) },
        feedback: 'Kijk naar het gekozen woord. Probeer een andere foto.',
        distractorReason: 'Verschillende voorbereide betekenissen uit dit onderdeel; unieke woordvormen en foto’s per bord.',
      });
    }
    return rounds;
  }
  return eligible.flatMap<PackageExercise>(word => {
    if (mode === 'build') {
      const template = templates.get(word.id)!;
      return [{ ...template, ...base(word, 'recall-word', 'ALF-CMP-005', 'Luister. Leg het woord.', 'WO-03'),
        sourceExerciseId: template.exerciseId, prompt: { text: 'Luister. Leg het woord.', audio: audio(word) },
        tiles: shuffled(template.tiles as { id: string; token: string }[], next), requiresAudio: true,
      }];
    }
    const photoChoices = mode === 'read' || pictured(word);
    const candidates = words.filter(other => other.word !== word.word && (!photoChoices || (pictured(other) && other.image !== word.image)))
      .sort((a, b) => distance(word.word, a.word) - distance(word.word, b.word) || a.id.localeCompare(b.id));
    const choices = [word];
    for (const other of candidates) {
      if (choices.length >= 4) break;
      if (choices.some(chosen => chosen.word === other.word || (photoChoices && chosen.image === other.image))) continue;
      choices.push(other);
    }
    if (choices.length < 2) return [];
    const exerciseMode = mode === 'read' ? 'word-image' : photoChoices ? 'heard-image' : 'heard-word';
    const title = mode === 'read' ? 'Kies de foto.' : photoChoices ? 'Luister. Kies de foto.' : 'Welk woord hoor je?';
    return [{ ...base(word, exerciseMode, 'ALF-CMP-002', title, mode === 'read' ? 'BB-02' : photoChoices ? 'BB-01' : 'KL-03'),
      prompt: { text: title, audio: audio(word) }, requiresAudio: mode === 'listen',
      ...(mode === 'read' ? { displayWord: word.word, readingTask: true } : {}),
      options: shuffled(choices, next).map(option => photoChoices ? { id: option.id, image: image(option) } : { id: option.id, label: option.word }),
      answer: { correctOptionIds: [word.id] },
      sourceLessonIds: [...new Set(choices.flatMap(lessonIds))], readingConditions: conditions(choices),
      distractorReason: 'Voorbereide woorden uit hetzelfde onderdeel, met voorkeur voor een klein verschil in spelling; geen dubbele woordvorm of foto.',
    }];
  });
}

export type MixedSession = { seed: number; exerciseId?: string; retries: string[]; done: boolean };
export const mixedStorageKey = (packId: string, mode: MixedMode) => `klink.mixed.v1:${packId}:${mode}`;
export function restoreMixedSession(raw: string | null, pack: PackageDefinition, mode: MixedMode): MixedSession | undefined {
  try {
    const value = JSON.parse(raw ?? 'null') as MixedSession | null;
    if (!value || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 0xffffffff || !Array.isArray(value.retries)) return;
    const validIds = new Set(createMixedRound(pack, mode, value.seed).map(exercise => exercise.exerciseId));
    const retries = [...new Set(value.retries.filter(id => typeof id === 'string' && validIds.has(id)))];
    const validPosition = typeof value.exerciseId === 'string' && (validIds.has(value.exerciseId) || retries.some(id => `${id}:again` === value.exerciseId));
    if (value.exerciseId && !validPosition) return;
    return { seed: value.seed, retries, exerciseId: validPosition ? value.exerciseId : undefined, done: value.done === true };
  } catch { return; }
}
export function withMixedRetries(exercises: PackageExercise[], retries: string[]) {
  return [...exercises, ...exercises.filter(exercise => retries.includes(exercise.exerciseId)).map(exercise => ({
    ...exercise, exerciseId: `${exercise.exerciseId}:again`, repeatOf: exercise.exerciseId,
  }))];
}

// Cross-part repetition only includes explicitly saved words or words from completed lessons.
export function mixedReviewPack(packs: PackageDefinition[], completed: string[], saved: string[]): PackageDefinition {
  const lessons = packs.flatMap(pack => pack.lessons).filter(lesson => completed.includes(lesson.id));
  const allowed = new Set([...saved, ...lessons.flatMap(lesson => [...(lesson.newWords ?? []), ...(lesson.returning ?? []), ...(lesson.known ?? [])])]);
  return { ...packs[0], id: 'mixed-review', title: 'Nog een keer', lessons,
    words: [...new Map(packs.flatMap(pack => pack.words).filter(word => allowed.has(word.id)).map(word => [word.id, word])).values()],
    exercises: packs.flatMap(pack => pack.exercises).filter(exercise => typeof exercise.wordId === 'string' && allowed.has(exercise.wordId)),
  };
}
