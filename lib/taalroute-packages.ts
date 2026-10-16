import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import bindings from '../data/klink-media.json' with { type: 'json' };
import type { PackageDefinition, PackageExercise, PackageLesson, PackageWord } from './package-content';

type Word = typeof curriculum.words[number];
type Step = { id: string; title: string; kind: string; known: string[]; newWords: string[]; returning: string[]; guidance: string };
const media = bindings as Record<string, { image?: string; audio?: string }>;
const byId = new Map(curriculum.words.map(word => [word.id, word]));
const unique = (ids: string[]) => [...new Set(ids)];
const wordsFor = (ids: string[]) => ids.map(id => byId.get(id)!).filter(Boolean);
const imageFor = (word: Word) => media[word.id]?.image ? { src: media[word.id].image, altText: word.meaning } : undefined;
const audioFor = (word: Word) => media[word.id]?.audio ? { src: media[word.id].audio, audioId: word.id } : undefined;
const tokensFor = (word: Word) => {
  const parts = word.reading.units.map(unit => unit.text);
  return parts.join('') === word.word ? parts : Array.from(new Intl.Segmenter('nl', { granularity: 'grapheme' }).segment(word.word), item => item.segment);
};
const labels: Record<string, string> = {
  '001': 'Kijk- en luisterkaart', '002': 'Kies het woord of beeld', '004': 'Woord en beeld koppelen',
  '005': 'Het woord bouwen', '006': 'Het woord typen', '009': 'Nazeggen', '012': 'Het woord schrijven',
  '015': 'Memory', '016': 'Woordkaarten',
};

export function exercisesForStep(step: Step) {
  const selected = wordsFor(unique([...step.known, ...step.newWords, ...step.returning]));
  const targets = wordsFor(step.newWords.length ? step.newWords : step.returning);
  const exercises: PackageExercise[] = [];
  const guided: string[] = [];
  const make = (word: Word, family: string, mode: string, prompt: string, extra: Record<string, unknown> = {}) => {
    const record: PackageExercise = {
      exerciseId: `${step.id}:${word.id}:${mode}`, componentId: `ALF-CMP-${family}`, contractVersion: '1.0',
      lessonId: step.id, mode, title: prompt, sourceStatus: 'concept', wordId: word.id,
      objective: word.firstReading.firstGoal ?? word.reading.firstMoment,
      prompt: { text: prompt, audio: audioFor(word) }, ...extra,
    };
    exercises.push(record);
    return record.exerciseId;
  };
  for (const word of selected) guided.push(make(word, '001', 'model', audioFor(word) ? 'Kijk en luister.' : 'Lees samen.', {
    text: { primary: word.word }, prompt: { text: audioFor(word) ? 'Kijk en luister.' : 'Lees samen.', image: imageFor(word), audio: audioFor(word) },
  }));
  for (const [index, word] of selected.entries()) {
    // Compare only prepared words from this step; prefer the smallest spelling contrast.
    const other = selected.filter(item => item.word !== word.word).sort((a, b) => {
      const distance = (candidate: Word) => Math.abs(tokensFor(candidate).length - tokensFor(word).length) + tokensFor(word).filter((letter, i) => letter !== tokensFor(candidate)[i]).length;
      return distance(a) - distance(b) || a.id.localeCompare(b.id);
    })[0];
    const isTarget = targets.some(item => item.id === word.id);
    if (other) {
      const pair = index % 2 ? [other, word] : [word, other];
      const options = pair.map(item => ({ id: item.id, label: item.word }));
      const choice = { options, answer: { correctOptionIds: [word.id] }, distractorReason: 'Vergelijk twee al getoonde woordvormen uit dezelfde leesstap.' };
      const match = make(word, '002', 'same-word', 'Kies hetzelfde woord.', { ...choice, exampleWord: word.word });
      if (isTarget) guided.push(match);
      if (audioFor(word)) {
        const listen = make(word, '002', 'heard-word', 'Welk woord hoor je?', choice);
        if (isTarget) guided.push(listen);
      }
      if (pair.every(item => imageFor(item))) {
        const pictureChoice = { options: pair.map(item => ({ id: item.id, image: imageFor(item) })), answer: { correctOptionIds: [word.id] }, distractorReason: 'Koppel de voorbereide woordbetekenis aan één van twee al getoonde beelden.' };
        make(word, '002', 'word-image', 'Welk beeld hoort bij het woord?', { ...pictureChoice, exampleWord: word.word });
        if (audioFor(word)) make(word, '002', 'heard-image', 'Welk beeld hoort bij het woord dat je hoort?', pictureChoice);
      }
    }
    const tokens = tokensFor(word);
    const tiles = tokens.map((token, i) => ({ id: `${word.id}-tile-${i}`, token }));
    const build = make(word, '005', 'word-build', 'Leg het woord.', { exampleWord: word.word, tiles: [...tiles].reverse(), slots: tiles.map(tile => ({ id: `slot-${tile.id}` })), answer: { targetTileIds: tiles.map(tile => tile.id) } });
    if (isTarget) guided.push(build);
    make(word, '006', 'copy-word', 'Typ het woord na.', { exampleWord: word.word, fields: [{ id: 'word', acceptedAnswers: [word.word] }] });
    if (audioFor(word)) make(word, '009', 'repeat-word', 'Luister en zeg na.', { exampleWord: word.word });
    make(word, '012', 'write-word', 'Schrijf het woord.', { target: word.word });
    if (imageFor(word)) make(word, '016', 'word-card', 'Bekijk het woordkaartje.', { cards: [{ cardId: word.id, front: { image: imageFor(word) }, back: { text: word.word }, audio: audioFor(word) }] });
  }
  const pictured = selected.filter(word => imageFor(word)).filter((word, i, all) => all.findIndex(item => item.word === word.word) === i).slice(0, 4);
  if (pictured.length >= 2) {
    make(pictured[0], '004', 'word-image-match', 'Koppel het woord aan het beeld.', {
      sources: pictured.map(word => ({ id: word.id, label: word.word })), targets: [...pictured].reverse().map(word => ({ id: `image-${word.id}`, image: imageFor(word) })),
      answer: { mapping: Object.fromEntries(pictured.map(word => [word.id, `image-${word.id}`])) },
    });
    make(pictured[0], '015', 'memory', 'Zoek het woord en het beeld bij elkaar.', { items: [
      ...pictured.map(word => ({ itemId: `word-${word.id}`, pairKey: word.id, content: { text: word.word } })),
      ...[...pictured].reverse().map(word => ({ itemId: `image-${word.id}`, pairKey: word.id, content: { image: imageFor(word) } })),
    ] });
  }
  return { exercises, guided };
}

function toWord(word: Word): PackageWord {
  return { id: word.id, word: word.word, meaning: word.meaning, segmentation: tokensFor(word).join('|'), focus: word.reading.requirements.join(' · '), group: word.role, ...media[word.id], audioStatus: media[word.id]?.audio ? 'review-open' : 'missing' };
}
const stepGroup = (step: typeof curriculum.steps[number]) => step.group ?? Math.max(...wordsFor(step.returning).map(word => word.reading.coreStep));
function homeGroup(word: Word) {
  if (word.firstReading.mode === 'core-step') return curriculum.steps.find(step => step.id === word.firstReading.stepId)?.group;
  if (word.firstReading.mode === 'extension') return curriculum.extensions.find(step => step.id === word.firstReading.extensionId)?.group;
  if (word.firstReading.mode === 'optional-step') return word.firstReading.group;
  return null;
}
function buildPack(id: string, title: string, kind: PackageDefinition['kind'], words: Word[], steps: Step[], description: string): PackageDefinition {
  const allWords = wordsFor(unique([...words.map(word => word.id), ...steps.flatMap(step => [...step.known, ...step.newWords, ...step.returning])]));
  const material = steps.map(step => ({ step, ...exercisesForStep(step) }));
  const exercises = material.flatMap(item => item.exercises);
  const lessons: PackageLesson[] = material.map(({ step, guided }) => ({
    id: step.id, title: step.kind === 'herhaalronde' ? `Herhaal: ${wordsFor(step.returning).map(word => word.word).join(' · ')}` : step.title,
    scope: step.guidance, kind: step.kind, words: wordsFor(unique([...step.newWords, ...step.returning])).map(word => word.word), steps: ['kijk', 'kies', 'bouw'],
    known: step.known, newWords: step.newWords, returning: step.returning, guidedExerciseIds: guided,
  }));
  const exerciseTypes = Object.entries(labels).map(([number, label]) => {
    const records = exercises.filter(item => item.componentId === `ALF-CMP-${number}`);
    return { id: `ALF-CMP-${number}`, label, count: records.length, modes: [...new Set(records.map(item => item.mode))], examples: [...new Set(records.map(item => item.title!))].slice(0, 3) };
  }).filter(item => item.count);
  const wordCards = allWords.map(toWord);
  const imageCount = wordCards.filter(word => word.image).length;
  const audioCount = wordCards.filter(word => word.audio).length;
  return { id, title, kind, subtitle: kind === 'group' ? 'Taalroute · klanken en woorden' : 'Taalroute · verder lezen', description, level: 'Alfabeta+',
    status: 'Mediacontrole open', statusNote: 'De nieuwe Taalroute-indeling gebruikt de bestaande oefeningen. Ontbrekende opnamen en beelden zijn nog niet aangevuld.',
    counts: { lessons: lessons.length, coreWords: words.length, exercises: exercises.length, exerciseTypes: exerciseTypes.length, texts: 0, dialogues: 0, games: exercises.filter(item => item.componentId === 'ALF-CMP-015').length, images: imageCount, audio: audioCount },
    lessons, words: wordCards, exercises, exerciseTypes, texts: [], dialogues: [], games: exercises.filter(item => item.componentId === 'ALF-CMP-015').map(item => ({ id: item.exerciseId, title: item.title!, mode: item.mode })), scenes: [],
    media: { imageAvailable: imageCount, imageExpected: wordCards.length, audioAvailable: audioCount, audioExpected: wordCards.length, missing: wordCards.filter(word => !word.image).map(word => word.word), imageReview: 'Herkenbaarheid nog beoordelen.', audioReview: 'Uitspraak nog beoordelen.', publication: 'INTERNAL_ONLY' },
  };
}
const wordStep = (word: Word): Step => ({ id: `woord-${word.id}`, title: word.word, kind: 'woord', known: word.preparation.wordIds, newWords: [word.id], returning: [], guidance: word.reading.firstMoment });
export const taalroutePackages: PackageDefinition[] = [
  ...curriculum.groups.map(group => {
    const words = curriculum.words.filter(word => homeGroup(word) === group.group);
    const basic = curriculum.steps.filter(step => stepGroup(step) === group.group);
    const extensions = curriculum.extensions.filter(step => step.group === group.group).map(step => ({ ...step, title: step.focus, kind: 'uitbreiding', guidance: step.preparationNote }));
    const additional = words.filter(word => word.firstReading.mode === 'optional-step').map(wordStep);
    return buildPack(`groep-${group.group}`, group.title, 'group', words, [...basic, ...extensions, ...additional], group.application);
  }),
  ...curriculum.readingRoutes.routes.map(route => {
    const words = curriculum.words.filter(word => word.firstReading.routeId === route.id);
    return buildPack(`route-${route.id}`, route.title, 'route', words, words.map(wordStep), route.entry);
  }),
  buildPack('voorbereiding', 'Woorden voorbereiden', 'preparation', curriculum.words.filter(word => word.firstReading.mode === 'preparation'), curriculum.words.filter(word => word.firstReading.mode === 'preparation').map(wordStep), 'Bereid deze woorden voor wanneer ze nodig zijn voor een volgende leesstap.'),
];

export function exercisesForLesson(pack: PackageDefinition, lesson: PackageLesson) {
  const ids = new Set(lesson.guidedExerciseIds);
  return pack.exercises.filter(exercise => exercise.lessonId === lesson.id && ids.has(exercise.exerciseId));
}

export const primaryWordCards = curriculum.words.map(word => ({ ...toWord(word), packageId:
  word.firstReading.mode === 'reading-route' ? `route-${word.firstReading.routeId}` :
  word.firstReading.mode === 'preparation' ? 'voorbereiding' : `groep-${homeGroup(word)}`,
}));
