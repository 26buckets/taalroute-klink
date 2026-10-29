import { importedActivities, importedExercisesForPack, type ImportedActivity } from './imported-practice.ts';
import type { PackageDefinition, PackageExercise, PackageWord } from './package-content';
import { learningActivities, learningExercises, type LearningActivity } from './learning-paths.ts';
import { createMixedRound } from './mixed-practice.ts';
import { contentById, contentReadingConditions } from './connected-content.ts';
import instructions from '../data/klink-instructions.json' with { type: 'json' };
import { resolveRegisteredAudio } from './audio-register.ts';
import { extendedActivities, extendedExercises, type ExtendedActivity } from './extended-practice.ts';

import { standardActivities, standardExercises, type StandardActivity } from './standard-practice.ts';

// These are activities on the existing word groups, not a second curriculum.
export const groupActivities = [
  { id: 'meet', label: 'Kijk en luister', category: 'Ontdekken', icon: 'eye', mode: 'model' },
  { id: 'same-word', label: 'Zoek hetzelfde woord', category: 'Kiezen', icon: 'search' },
  { id: 'listen', label: 'Hoor en kies', category: 'Kiezen', icon: 'ear' },
  { id: 'hear-word', label: 'Zoek het woord', category: 'Kiezen', icon: 'ear' },
  { id: 'read', label: 'Kies de foto', category: 'Kiezen', icon: 'image' },
  { id: 'match', label: 'Woord en foto', category: 'Kiezen', icon: 'link' },
  { id: 'hear-match', label: 'Geluid en woord', category: 'Kiezen', icon: 'link' },
  { id: 'build-model', label: 'Leg het woord na', category: 'Maken', icon: 'puzzle', mode: 'word-build' },
  { id: 'build', label: 'Hoor en leg', category: 'Maken', icon: 'puzzle' },
  { id: 'worksheet', label: 'Meer woorden maken', category: 'Maken', icon: 'grid', mode: 'word-build' },
  { id: 'worksheet-heard', label: 'Hoor en maak meer woorden', category: 'Maken', icon: 'grid' },
  { id: 'missing', label: 'Vul aan', category: 'Maken', icon: 'puzzle', mode: 'missing-grapheme' },
  { id: 'copy', label: 'Typ na', category: 'Schrijven en spreken', icon: 'keyboard', mode: 'copy-word' },
  { id: 'dictation', label: 'Hoor en typ', category: 'Schrijven en spreken', icon: 'keyboard', mode: 'word-dictation' },
  { id: 'write', label: 'Schrijf het woord', category: 'Schrijven en spreken', icon: 'pen', mode: 'write-word' },
  { id: 'write-letter', label: 'Schrijf de letter', category: 'Schrijven en spreken', icon: 'pen' },
  { id: 'paper-dictation', label: 'Hoor en schrijf', category: 'Schrijven en spreken', icon: 'pen' },
  { id: 'read-series', label: 'Lees de woorden', category: 'Samen herhalen', icon: 'book' },
  { id: 'speak', label: 'Zeg het woord', category: 'Schrijven en spreken', icon: 'mic', mode: 'repeat-word' },
  { id: 'word-bingo', label: 'Woordbingo', category: 'Samen herhalen', icon: 'grid' },
  { id: 'image-bingo', label: 'Fotobingo', category: 'Samen herhalen', icon: 'image' },
  { id: 'memory', label: 'Zoek de paren', category: 'Samen herhalen', icon: 'link' },
  { id: 'cards', label: 'Draai de kaart', category: 'Samen herhalen', icon: 'image', mode: 'word-card' },
  { id: 'sentences', label: 'Luister en lees mee', category: 'Zinnen en verhalen', icon: 'book', mode: 'connected-sentence' },
  { id: 'word-sentence', label: 'Van woord naar zin', category: 'Zinnen en verhalen', icon: 'book' },
  { id: 'find-sentence', label: 'Zoek de zin', category: 'Zinnen en verhalen', icon: 'search' },
  { id: 'sentence-dictation', label: 'Typ de zin', category: 'Zinnen en verhalen', icon: 'keyboard' },
  { id: 'sentence-speak', label: 'Zeg de zin', category: 'Zinnen en verhalen', icon: 'mic' },
  { id: 'understand', label: 'Luister en kies', category: 'Zinnen en verhalen', icon: 'ear', mode: 'sentence-question' },
  { id: 'texts', label: 'Luister naar een verhaal', category: 'Zinnen en verhalen', icon: 'book', mode: 'connected-text' },
  { id: 'dialogues', label: 'Luister naar een gesprek', category: 'Zinnen en verhalen', icon: 'chat', mode: 'connected-dialogue' },
  ...extendedActivities,
  ...standardActivities,
  ...importedActivities,
  ...learningActivities,
  { id: 'learning-review', label: 'Oefen opnieuw', category: 'Samen herhalen', icon: 'book' },
] as const;
export type GroupActivity = typeof groupActivities[number]['id'];

export const groupInstructionNeeds = [
  { id: 'groep-woordbingo', text: 'Luister. Tik op het woord dat je hoort. Maak de kaart vol.', activities: ['word-bingo'] },
  { id: 'groep-fotobingo', text: 'Luister. Tik op de foto die erbij hoort. Maak de kaart vol.', activities: ['image-bingo'] },
  { id: 'groep-zoek-zin', text: 'Luister naar de zin. Tik op dezelfde zin.', activities: ['find-sentence'] },
  { id: 'groep-zinsdictee', text: 'Luister naar de zin. Typ de zin. Tik daarna op Controleer.', activities: ['sentence-dictation'] },
  { id: 'groep-zin-nazeggen', text: 'Luister en zeg de zin na. Met Neem op kun je jezelf terughoren.', activities: ['sentence-speak'] },
  { id: 'groep-geluid-woord', text: 'Tik op een luidspreker. Luister. Tik op het woord dat erbij hoort.', activities: ['hear-match'] },
  { id: 'groep-papierdictee', text: 'Luister. Typ het woord in het invulvak. Tik daarna op Vergelijk.', activities: ['paper-dictation'] },
  { id: 'groep-leesreeks', text: 'Lees het woord hardop. Neem je tijd. Tik daarna op Verder.', activities: ['read-series'] },
  { id: 'groep-letter-schrijven', text: 'Kijk naar de letter. Typ de letter in het invulvak. Vergelijk met het voorbeeld.', activities: ['write-letter'] },
] as const;

function instruction(id: string) {
  const existing = instructions.items.find(item => item.id === id);
  const need = groupInstructionNeeds.find(item => item.id === id);
  const src = existing?.src ?? (need && resolveRegisteredAudio(need.id, need.text, 'instruction'));
  return src ? { audioId: id, src } : undefined;
}

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items]; let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1); [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const unique = <T,>(items: T[], key: (item: T) => string) => [...new Map(items.map(item => [key(item), item])).values()];
const audio = (word: PackageWord) => ({ src: word.audio, audioId: word.id });
const textId = (value: unknown) => typeof value === 'string' ? value : '';

function spokenWordBoards(pack: PackageDefinition, seed: number): PackageExercise[] {
  const templates = createMixedRound(pack, 'listen', seed);
  const pool = shuffle(pack.words.filter(word => word.audio), seed), pending = [...pool];
  const boards: PackageExercise[] = [];
  while (pending.length) {
    const words: PackageWord[] = [];
    for (let i = 0; i < pending.length && words.length < 3;) {
      if (words.some(word => word.word === pending[i].word)) { i++; continue; }
      words.push(...pending.splice(i, 1));
    }
    if (words.length === 1) { const helper = pool.find(word => word.word !== words[0].word); if (helper) words.push(helper); }
    if (words.length < 2) continue;
    const template = templates.find(item => item.wordId === words[0].id);
    if (!template) continue;
    boards.push({ ...template, componentId: 'ALF-CMP-004', requiresAudio: false, prompt: undefined,
      targetWordIds: words.map(word => word.id), access: 'supported-listening',
      sources: words.map(word => ({ id: word.id, audio: audio(word) })),
      targets: shuffle(words, seed + boards.length).map(word => ({ id: `image-${word.id}`, label: word.word })),
      answer: { mapping: Object.fromEntries(words.map(word => [word.id, `image-${word.id}`])) },
      readingConditions: words.flatMap(word => templates.find(item => item.wordId === word.id)?.readingConditions ?? []),
      distractorReason: 'Bestaande gesproken woorden uit dezelfde voorbereide woordgroep; per bord unieke schrijfwijzen.',
    });
  }
  return boards;
}

const learningCache = new WeakMap<PackageDefinition, Map<string, PackageExercise[]>>();
export function groupExercises(pack: PackageDefinition, activity: GroupActivity, seed = 1): PackageExercise[] {
  // Supplemental packs offer only their authored activities; other generators require the core curriculum.
  if (pack.practiceActivities && !pack.practiceActivities.includes(activity)) return [];
  if (activity.startsWith('content-')) return unique([...pack.exercises.filter(item => item.groupActivity === activity), ...importedExercisesForPack(pack, activity as ImportedActivity)], item => item.exerciseId);
  if (standardActivities.some(item => item.id === activity)) return standardExercises(pack, activity as StandardActivity, seed);
  if (activity === 'learning-review') return learningActivities.flatMap(item => groupExercises(pack, item.id, seed).filter(exercise => exercise.reviewEligible));
  if (learningActivities.some(item => item.id === activity)) {
    if (!learningCache.has(pack)) learningCache.set(pack, new Map());
    const cache = learningCache.get(pack)!, key = `${activity}:${seed}`;
    if (!cache.has(key)) cache.set(key, learningExercises(pack, activity as LearningActivity, id => groupExercises(pack, id as GroupActivity, seed)));
    return cache.get(key)!;
  }
  if (extendedActivities.some(item => item.id === activity)) return extendedExercises(pack, activity as ExtendedActivity, seed);
  const definition = groupActivities.find(item => item.id === activity)!;
  const groupWordIds = new Set(pack.words.map(word => word.id));
  function identify(exercise: PackageExercise): PackageExercise {
    return { ...exercise, sourceExerciseId: exercise.sourceExerciseId ?? exercise.exerciseId,
      exerciseId: `${pack.id}:group:${activity}:${exercise.exerciseId}`, groupActivity: activity,
      targetWordIds: (exercise.targetWordIds as string[] | undefined)?.filter(id => groupWordIds.has(id)),
      sourceStatus: 'concept', combinationReview: 'open' };
  }
  if (['listen', 'read', 'match', 'build'].includes(activity)) {
    return createMixedRound(pack, activity as 'listen' | 'read' | 'match' | 'build', seed).map(identify);
  }
  if (activity === 'worksheet-heard') return groupExercises(pack, 'build', seed).map(identify);
  if (activity === 'write-letter') {
    const models = groupExercises(pack, 'build-model', seed);
    const letters = unique(models.flatMap(model => (model.tiles as { token: string }[]).filter(tile => /^\p{L}$/u.test(tile.token)).map(tile => ({ letter: tile.token, model }))), item => item.letter);
    return letters.map(({ letter, model }) => identify({ ...model, exerciseId: `letter-${letter}`, componentId: 'ALF-CMP-012', mode: 'write-letter',
      title: 'Schrijf de letter.', instructionAudio: instruction('groep-letter-schrijven'), instructionNeedId: 'groep-letter-schrijven',
      prompt: undefined, target: letter, exampleWord: undefined, targetWordIds: [], assessment: 'participation',
      letterModelOnly: true, objective: `lettervorm:${letter}:zelf-of-docentcontrole`,
    }));
  }
  if (activity === 'word-sentence') {
    const models = groupExercises(pack, 'meet', seed), sentences = groupExercises(pack, 'sentences', seed);
    return models.flatMap(model => {
      const related = sentences.filter(sentence => (sentence.wordIds as string[]).includes(textId(model.wordId)));
      return related.length ? [model, ...related].map((source, index) => identify({ ...source, exerciseId: `${textId(model.wordId)}:${index}:${source.exerciseId}` })) : [];
    });
  }
  if ('mode' in definition) {
    const templates = unique(pack.exercises.filter(item => item.mode === definition.mode), item => textId(item.questionId) || textId(item.contextId) || textId(item.wordId) || item.exerciseId);
    return shuffle(templates, seed).map(item => identify({ ...item, targetWordIds: item.targetWordIds ?? (item.wordId ? [item.wordId] : []),
      sourceLessonIds: item.sourceLessonIds ?? (item.lessonId ? [item.lessonId] : []),
      ...(activity === 'speak' ? { requiresAudio: Boolean(item.prompt?.audio?.src) } : {}),
    }));
  }
  if (activity === 'paper-dictation' || activity === 'read-series') {
    return groupExercises(pack, activity === 'paper-dictation' ? 'dictation' : 'meet', seed).map(source => {
      const word = pack.words.find(word => word.id === source.wordId)!;
      const need = activity === 'paper-dictation' ? 'groep-papierdictee' : 'groep-leesreeks';
      return identify({ ...source, componentId: activity === 'paper-dictation' ? 'ALF-CMP-012' : 'ALF-CMP-007', mode: activity,
        title: definition.label, assessment: 'participation', requiresAudio: activity === 'paper-dictation',
        instructionAudio: instruction(need), instructionNeedId: need,
        exampleWord: undefined, target: word.word, helpWord: undefined,
        textBlocks: activity === 'read-series' ? [{ id: word.id, text: word.word, audio: audio(word) }] : undefined,
        hideWritingModel: activity === 'paper-dictation', readingTask: false,
        objective: `${activity}:${word.id}:zelf-of-docentcontrole`,
      });
    });
  }
  if (activity === 'hear-match') {
    return spokenWordBoards(pack, seed).map(board => identify({
      ...board, mode: 'hear-match', title: 'Luister. Kies het woord.', audioOnlySources: true,
      instructionAudio: instruction('groep-geluid-woord'), instructionNeedId: 'groep-geluid-woord',
      sources: (board.sources as { id: string; audio: unknown }[]).map(source => ({ id: source.id, audio: source.audio })),
      targets: (board.targets as { id: string }[]).map(target => ({ id: target.id, label: pack.words.find(word => `image-${word.id}` === target.id)!.word })),
      feedback: 'Luister opnieuw naar hetzelfde geluid. Kies een ander woord.',
    }));
  }
  if (activity === 'hear-word' || activity === 'same-word') {
    // Reuse the reviewed spelling-distance distractor selection; change only the response channel.
    return createMixedRound(pack, 'listen', seed).map(item => identify({ ...item, mode: activity === 'same-word' ? 'same-word' : 'heard-word', title: activity === 'same-word' ? 'Zoek hetzelfde woord.' : 'Welk woord hoor je?',
      ...(activity === 'same-word' ? { requiresAudio: false, exampleWord: pack.words.find(word => word.id === item.wordId)!.word } : {}),
      instructionAudio: instruction(activity === 'same-word' ? 'zelfde-woord' : 'hoor-woord'), options: (item.options as { id: string }[]).map(option => ({ id: option.id, label: pack.words.find(w => w.id === option.id)!.word })),
    }));
  }
  if (activity === 'memory') {
    return createMixedRound(pack, 'match', seed).map((item, index) => {
      const sources = item.sources as { id: string; label: string }[];
      const targets = item.targets as { id: string; image: unknown }[];
      return identify({ ...item, componentId: 'ALF-CMP-015', mode: 'memory', title: 'Zoek het woord en de foto.',
        instructionAudio: instruction('paren'), items: shuffle(sources.flatMap(source => [
          { itemId: `word-${source.id}`, pairKey: source.id, content: { text: source.label } },
          { itemId: `image-${source.id}`, pairKey: source.id, content: { image: targets.find(t => t.id === `image-${source.id}`)!.image } },
        ]), seed + index),
      });
    });
  }
  if (activity === 'word-bingo' || activity === 'image-bingo') {
    // Each heard word is an independently measured turn. A full board visits every target, not just one line.
    const boards = activity === 'image-bingo' ? createMixedRound(pack, 'match', seed) : spokenWordBoards(pack, seed);
    return boards.flatMap((board, boardIndex) => {
      const words = (board.targetWordIds as string[]).map(id => pack.words.find(word => word.id === id)!).filter(word => word.audio);
      if (words.length < 2) return [];
      const cells = shuffle(words, seed + boardIndex).map(word => ({ cellId: word.id,
        ...(activity === 'image-bingo' ? { image: { src: word.image, altText: word.meaning } } : { text: word.word }),
      }));
      return shuffle(words, seed + boardIndex + 17).map((word, turn, order) => identify({ ...board,
        exerciseId: `${board.exerciseId}:${word.id}`, componentId: 'ALF-CMP-014', mode: activity,
        title: activity === 'word-bingo' ? 'Luister. Kies het woord.' : 'Luister. Kies de foto.',
        instructionAudio: instruction(activity === 'word-bingo' ? 'groep-woordbingo' : 'groep-fotobingo'),
        instructionNeedId: activity === 'word-bingo' ? 'groep-woordbingo' : 'groep-fotobingo',
        prompt: { audio: audio(word) }, wordId: word.id, targetWordIds: [word.id], requiresAudio: true,
        cells, markedCellIds: order.slice(0, turn).map(item => item.id), answer: { correctCellId: word.id },
        boardId: `${pack.id}:${activity}:${boardIndex}`, objective: `${activity}:${word.id}`,
        feedback: 'Luister nog een keer. De vakken blijven staan.',
      }));
    });
  }
  const sentences = unique(pack.exercises.filter(item => item.mode === 'connected-sentence'), item => String(item.contextId));
  return shuffle(sentences, seed).flatMap<PackageExercise>((source, index) => {
    const item = contentById.get(String(source.contextId));
    if (!item || item.blocks.length !== 1 || !item.blocks[0].audio?.src) return [];
    const text = item.text;
    const step = pack.lessons.find(lesson => lesson.id === source.lessonId)!;
    const base = { ...source, instructionAudio: undefined, textBlocks: undefined, playAllBlocks: false,
      contentTitle: undefined, title: definition.label, targetWordIds: source.wordIds,
      readingConditions: contentReadingConditions(item, step), sourceContentIds: [item.id],
      access: 'supported-listening', independentReading: false, humanReview: 'combination-open',
      requiresAudio: true, assessment: 'answer' as const, helpWord: text,
      objective: `${activity}:${item.id}`, prompt: { audio: item.blocks[0].audio },
    };
    if (activity === 'sentence-dictation') return [identify({ ...base, componentId: 'ALF-CMP-006', mode: activity,
      instructionAudio: instruction('groep-zinsdictee'), instructionNeedId: 'groep-zinsdictee', fields: [{ id: 'sentence', acceptedAnswers: [text] }],
      feedback: 'Luister opnieuw. Controleer je woorden.',
    })];
    if (activity === 'sentence-speak') return [identify({ ...base, componentId: 'ALF-CMP-009', mode: activity,
      instructionAudio: instruction('groep-zin-nazeggen'), instructionNeedId: 'groep-zin-nazeggen', assessment: 'participation',
    })];
    if (activity !== 'find-sentence') return [];
    // Compare existing sentences with an identical frame and one differing word, never invented distractors.
    const tokens = text.toLocaleLowerCase('nl').split(/\s+/);
    const alternatives = sentences.flatMap(other => {
      const candidate = contentById.get(String(other.contextId));
      if (!candidate || candidate.id === item.id) return [];
      const parts = candidate.text.toLocaleLowerCase('nl').split(/\s+/);
      return parts.length === tokens.length && parts.filter((part, i) => part !== tokens[i]).length === 1 ? [candidate] : [];
    });
    const choices = [item, ...unique(alternatives, candidate => candidate.text).slice(0, 2)];
    if (choices.length < 2) return [];
    return [identify({ ...base, componentId: 'ALF-CMP-002', mode: activity, helpWord: undefined,
      instructionAudio: instruction('groep-zoek-zin'), instructionNeedId: 'groep-zoek-zin',
      options: shuffle(choices, seed + index).map(choice => ({ id: choice.id, label: choice.text })),
      sourceContentIds: choices.map(choice => choice.id),
      readingConditions: choices.map(choice => contentReadingConditions(choice, step)),
      answer: { correctOptionIds: [item.id] },
      distractorReason: 'Dezelfde bestaande zinsbouw met één ander woord; herkennen van de gehoorde zin, geen begripsmeting.',
      feedback: 'Luister opnieuw. Let op het woord dat anders is.',
    })];
  });
}

export const groupSessionKey = (packId: string, activity: GroupActivity) => `klink.group.v1:${packId}:${activity}`;
export function restoreGroupSession(raw: string | null, exercises: PackageExercise[]): { exerciseId?: string; done: boolean } {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version === 1 && exercises.some(item => item.exerciseId === value.exerciseId)) return { exerciseId: value.exerciseId, done: value.done === true };
  } catch { /* Corrupt storage must not prevent practice. */ }
  return { done: false };
}
