import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import bindings from '../data/klink-media.json' with { type: 'json' };
import instructions from '../data/klink-instructions.json' with { type: 'json' };
import type { LessonPhase, PackageDefinition, PackageExercise, PackageLesson, PackageWord } from './package-content';
import { klinkContexts } from './klink-context.ts';
import { sentenceQuestionFor, questionFields } from './sentence-comprehension.ts';
import { connectedExercisesForStep, contentById } from './connected-content.ts';

type Word = typeof curriculum.words[number];
type Step = { id: string; title: string; kind: string; known: string[]; newWords: string[]; returning: string[]; guidance: string; unitIds?: string[] };
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
  '005': 'Het woord bouwen', '006': 'Het woord typen', '007': 'Zinnen, teksten en gesprekken', '009': 'Nazeggen', '012': 'Het woord schrijven',
  '015': 'Memory', '016': 'Woordkaarten',
};

export function exercisesForStep(step: Step) {
  const selected = wordsFor(unique([...step.known, ...step.newWords, ...step.returning]));
  const targets = wordsFor(step.newWords.length ? step.newWords : step.returning);
  const exercises: PackageExercise[] = [];
  const phases: Record<LessonPhase, string[]> = { meet: [], recognize: [], make: [], use: [], recall: [] };
  const make = (word: Word, family: string, mode: string, prompt: string, activityTypeId: string, phase: LessonPhase, extra: Record<string, unknown> = {}) => {
    const instruction = instructions.items.find(item => item.modes.includes(mode));
    const record: PackageExercise = {
      exerciseId: `${step.id}:${word.id}:${mode}`, componentId: `ALF-CMP-${family}`, contractVersion: '1.0',
      lessonId: step.id, mode, title: prompt, sourceStatus: 'concept', wordId: word.id,
      objective: word.firstReading.firstGoal ?? word.reading.firstMoment,
      activityTypeId, phase, assessment: family === '001' || family === '009' || family === '012' || family === '016' ? 'participation' : 'answer',
      instructionAudio: instruction?.src ? { src: instruction.src, audioId: instruction.id } : undefined,
      prompt: { text: prompt, audio: audioFor(word) }, ...extra,
    };
    exercises.push(record);
    return record.exerciseId;
  };
  for (const word of selected) phases.meet.push(make(word, '001', 'model', audioFor(word) ? 'Kijk en luister.' : 'Lees samen.', 'KL-01', 'meet', {
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
      const match = make(word, '002', 'same-word', 'Kies hetzelfde woord.', 'WO-02', 'recognize', { ...choice, exampleWord: word.word });
      if (isTarget && Number(step.id.match(/leesstap-(\d+)$/)?.[1]) <= 5 && audioFor(word)) phases.recognize.push(match);
      if (audioFor(word)) {
        const listen = make(word, '002', 'heard-word', 'Welk woord hoor je?', 'KL-03', 'recognize', { ...choice, requiresAudio: true });
        if (isTarget) phases.recognize.push(listen);
      } else if (isTarget) phases.recognize.push(match);
    }
    // Image tasks need a distinct prepared meaning AND a distinct actual image.
    const pictureOther = selected.find(item => item.word !== word.word && imageFor(item) && imageFor(item)?.src !== imageFor(word)?.src);
    if (imageFor(word) && pictureOther) {
      const pair = index % 2 ? [pictureOther, word] : [word, pictureOther];
      const pictureChoice = { options: pair.map(item => ({ id: item.id, image: imageFor(item) })), answer: { correctOptionIds: [word.id] }, distractorReason: `Onderscheid de al aangeboden betekenissen van ${word.word} en ${pictureOther.word}; beide beelden blijven op dezelfde plaats.` };
      const readImage = make(word, '002', 'word-image', 'Kies de foto.', 'BB-02', 'use', { ...pictureChoice, exampleWord: word.word });
      if (audioFor(word)) {
        const listenImage = make(word, '002', 'heard-image', 'Luister. Kies de foto.', 'BB-01', 'recognize', { ...pictureChoice, requiresAudio: true });
        if (word.id === targets[0]?.id) phases.recognize.push(listenImage);
      }
      if (isTarget) phases.use.push(readImage);
    }
    const tokens = tokensFor(word);
    const tiles = tokens.map((token, i) => ({ id: `${word.id}-tile-${i}`, token }));
    const building = { tiles: [...tiles].reverse(), slots: tiles.map(tile => ({ id: `slot-${tile.id}` })), answer: { targetTileIds: tiles.map(tile => tile.id) } };
    const build = make(word, '005', 'word-build', 'Leg het woord.', 'WO-03', 'make', { ...building, exampleWord: word.word, feedback: 'Kijk naar het voorbeeld. Met Eén terug kun je een letter veranderen.' });
    if (isTarget) phases.make.push(build);
    make(word, '006', 'copy-word', 'Typ het woord na.', 'SC-01', 'make', { exampleWord: word.word, fields: [{ id: 'word', acceptedAnswers: [word.word] }] });
    if (audioFor(word)) {
      const dictation = make(word, '006', 'word-dictation', 'Typ wat je hoort.', 'WO-06', 'make', { requiresAudio: true, fields: [{ id: 'word', acceptedAnswers: [word.word] }], feedback: 'Luister opnieuw. Verander de letters in je antwoord.', helpWord: word.word });
      // Keyboard use is optional in early literacy; longer-word routes introduce independent typing.
      if (isTarget && word.reading.level === 'B') phases.make.push(dictation);
      make(word, '009', 'repeat-word', 'Luister en zeg na.', 'SP-01', 'make', { exampleWord: word.word });
      const recall = make(word, '005', 'recall-word', 'Luister. Leg het woord.', 'WO-03', 'recall', { ...building, requiresAudio: true, helpWord: word.word, feedback: 'Luister nog een keer. Met Eén terug kun je een letter veranderen.' });
      if (step.returning.length ? step.returning.includes(word.id) : isTarget) phases.recall.push(recall);
      const gap = gapForWord(word, step, selected);
      if (gap) {
        const missing = make(word, '002', 'missing-grapheme', 'Wat ontbreekt?', 'WO-05', 'make', { ...gap, requiresAudio: true, feedback: 'Luister naar het hele woord. Kijk naar de lege plek.' });
        // One gap per core step, after the basic tap/build actions have been introduced.
        if (isTarget && word.reading.level === 'A' && Number(step.id.match(/leesstap-(\d+)$/)?.[1]) >= 6 && !phases.make.some(id => id.endsWith(':missing-grapheme'))) phases.make.push(missing);
      }
    } else if (step.returning.includes(word.id)) {
      phases.recall.push(make(word, '001', 'recall-together', 'Lees samen.', 'KL-01', 'recall', { text: { primary: word.word }, prompt: { text: 'Lees samen.', image: imageFor(word) } }));
    }
    make(word, '012', 'write-word', 'Schrijf het woord.', 'SC-01', 'make', { target: word.word });
    if (imageFor(word)) make(word, '016', 'word-card', 'Bekijk het woordkaartje.', 'BB-05', 'meet', { cards: [{ cardId: word.id, front: { image: imageFor(word) }, back: { text: word.word }, audio: audioFor(word) }] });
  }
  const pictured = [...targets, ...selected].filter(word => imageFor(word)).filter((word, i, all) => all.findIndex(item => item.word === word.word || imageFor(item)?.src === imageFor(word)?.src) === i).slice(0, 2);
  if (pictured.length >= 2) {
    const matching = make(pictured[0], '004', 'word-image-match', 'Kies een woord. Kies de foto.', 'BB-03', 'use', {
      prompt: { text: 'Kies een woord. Kies de foto.' },
      sources: pictured.map(word => ({ id: word.id, label: word.word, audio: audioFor(word) })), targets: [...pictured].reverse().map(word => ({ id: `image-${word.id}`, image: imageFor(word) })),
      answer: { mapping: Object.fromEntries(pictured.map(word => [word.id, `image-${word.id}`])) },
      distractorReason: 'Twee voorbereide, verschillende woordbetekenissen koppelen; elke foto hoort bij één woord.',
    });
    // One meaningful pairing activity replaces repeating the same image choice for every target.
    phases.use = [matching];
    make(pictured[0], '015', 'memory', 'Zoek het woord en het beeld bij elkaar.', 'BB-04', 'recall', { items: [
      ...pictured.map(word => ({ itemId: `word-${word.id}`, pairKey: word.id, content: { text: word.word } })),
      ...[...pictured].reverse().map(word => ({ itemId: `image-${word.id}`, pairKey: word.id, content: { image: imageFor(word) } })),
    ] });
  }
  const contexts = klinkContexts.filter(item => item.wordIds.some(id => targets.some(word => word.id === id)));
  for (const item of contexts) {
    const word = targets.find(word => item.wordIds.includes(word.id))!;
    const contextId = make(word, '007', `listen-${item.kind}`, 'Luister en kijk.', 'ZI-01', 'use', {
      exerciseId: `${step.id}:${item.id}`, contextId: item.id,
      prompt: { text: 'Luister en kijk.', audio: { src: item.audio, audioId: item.id } },
      textBlocks: [{ id: item.id, text: item.text, audio: { src: item.audio, audioId: item.id } }],
      image: item.image ? { src: item.image, altText: item.imageAlt } : imageFor(word),
      requiresAudio: true, assessment: 'participation', access: item.access,
      preparation: item.preparation, independentReading: false, humanReview: item.humanReview,
      objective: 'Een bekend woord horen in een betekenisvolle zin of situatie; luisteren met tekststeun, niet zelfstandig lezen.',
    });
    const question = item.kind === 'sentence' ? sentenceQuestionFor(item.id, selected.map(word => word.id)) : undefined;
    let questionId: string | undefined;
    if (question) questionId = make(word, '002', 'sentence-question', question.question, 'ZI-01', 'use', {
      ...questionFields(question), exerciseId: `${step.id}:${question.id}`, contextId: item.id,
      prompt: { text: question.question, audio: { src: item.audio, audioId: item.id } },
      replacesExerciseId: contextId,
    });
    // Oral contrasts need teacher preparation; they stay optional, never silently become known words.
    if (questionId && !question!.oralPreparation.length) phases.use.push(questionId);
    else if (!phases.use.some(id => exercises.find(record => record.exerciseId === id)?.mode === `listen-${item.kind}`)) phases.use.push(contextId);
  }
  const guided = Object.values(phases).flat();
  // Keep every introduction and recall; optional variation stays in free practice if the route is long.
  for (const mode of ['missing-grapheme', 'heard-image', 'word-image-match', 'word-image', 'listen-situation', 'listen-sentence', 'sentence-question']) {
    while (guided.length > 16) {
      const matches = (id: string) => exercises.find(record => record.exerciseId === id)?.mode === mode;
      const index = mode === 'sentence-question' ? guided.findLastIndex(matches) : guided.findIndex(matches);
      if (index < 0) break;
      guided.splice(index, 1);
    }
  }
  // Extra reading/listening material is reachable at this step without inflating the short word lesson.
  exercises.push(...connectedExercisesForStep(step));
  return { exercises, guided };
}

function gapForWord(word: Word, step: Step, prepared: Word[]) {
  const units = word.reading.units;
  if (units.map(unit => unit.text).join('') !== word.word) return;
  const positions = units.map((unit, index) => ({ unit, index })).filter(({ unit }) => !step.unitIds?.length || step.unitIds.includes(unit.coreUnit));
  const vowel = (text: string) => /^(a|e|i|o|u|aa|ee|oo|uu|ie|oe|eu|ui|ei|ij|au|ou)$/.test(text);
  const homophones = [['ei', 'ij'], ['au', 'ou'], ['g', 'ch']];
  for (const { unit, index } of positions) {
    const alternative = prepared.flatMap(tokensFor).find(token => token !== unit.text && vowel(token) === vowel(unit.text) && !homophones.some(pair => pair.includes(token) && pair.includes(unit.text)));
    if (!alternative) continue;
    const options = [unit.text, alternative].map(token => ({ id: `grapheme-${token}`, label: token }));
    return { maskedWord: units.map((item, i) => i === index ? '…' : item.text).join(''), gapIndex: index, targetGrapheme: unit.text,
      options: word.id.length % 2 ? options.reverse() : options, answer: { correctOptionIds: [`grapheme-${unit.text}`] },
      distractorReason: `Vul ${unit.text} aan tegenover ${alternative}, beide al getoond in deze les. Het hele woord is hoorbaar; de lettercombinatie blijft één geheel.`,
      preparedWordIds: prepared.map(item => item.id) };
  }
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
  const lessons: PackageLesson[] = material.map(({ step, exercises: records, guided }) => ({
    id: step.id, title: step.kind === 'herhaalronde' ? `Herhaal: ${wordsFor(step.returning).map(word => word.word).join(' · ')}` : step.title,
    scope: step.guidance, kind: step.kind, words: wordsFor(unique([...step.newWords, ...step.returning])).map(word => word.word),
    steps: unique(guided.flatMap(id => { const phase = records.find(item => item.exerciseId === id)?.phase; return phase ? [phase] : []; })),
    known: step.known, newWords: step.newWords, returning: step.returning, unitIds: step.unitIds, guidedExerciseIds: guided,
  }));
  const exerciseTypes = Object.entries(labels).map(([number, label]) => {
    const records = exercises.filter(item => item.componentId === `ALF-CMP-${number}`);
    return { id: `ALF-CMP-${number}`, label, count: records.length, modes: [...new Set(records.map(item => item.mode))], examples: [...new Set(records.map(item => item.title!))].slice(0, 3) };
  }).filter(item => item.count);
  const wordCards = allWords.map(toWord);
  const imageCount = wordCards.filter(word => word.image).length;
  const audioCount = wordCards.filter(word => word.audio).length;
  const contexts = klinkContexts.filter(item => exercises.some(exercise => exercise.contextId === item.id));
  const connected = unique(exercises.filter(exercise => exercise.mode.startsWith('connected-')).map(exercise => String(exercise.contextId))).map(id => contentById.get(id)!);
  const placement = (id: string) => ({
    exerciseId: exercises.find(exercise => exercise.contextId === id)!.exerciseId,
    lessonIds: unique(exercises.filter(exercise => exercise.contextId === id).map(exercise => exercise.lessonId!)),
  });
  const texts = [...contexts.filter(item => !connected.some(record => record.kind !== 'dialogue' && record.text === item.text)).map(item => ({ id: item.id, title: item.title, level: 'Samen luisteren', text: item.text, audio: item.audio, kind: item.kind === 'sentence' ? 'sentence' as const : 'text' as const, ...placement(item.id) })),
    ...connected.filter(item => item.kind !== 'dialogue').map(item => ({ id: item.id, title: item.title, level: 'Samen luisteren', text: item.text, audio: item.blocks[0].audio.src, kind: item.kind as 'sentence' | 'text', ...placement(item.id) }))];
  const dialogues = connected.filter(item => item.kind === 'dialogue').map(item => ({ id: item.id, title: item.title, level: 'Samen luisteren', goal: 'Luister en lees mee.', turns: item.blocks.map(block => ({ speaker: 'speaker' in block ? String(block.speaker) : '', text: block.text, audio: block.audio.src })), ...placement(item.id) }));
  return { id, title, kind, subtitle: kind === 'group' ? 'Taalroute · klanken en woorden' : 'Taalroute · verder lezen', description, level: 'Alfabeta+',
    status: 'Mediacontrole open', statusNote: 'De nieuwe Taalroute-indeling gebruikt de bestaande oefeningen. Ontbrekende opnamen en beelden zijn nog niet aangevuld.',
    counts: { lessons: lessons.length, coreWords: words.length, exercises: exercises.length, exerciseTypes: exerciseTypes.length, texts: texts.filter(item => item.kind === 'text').length, sentences: texts.filter(item => item.kind === 'sentence').length, dialogues: dialogues.length, games: exercises.filter(item => item.componentId === 'ALF-CMP-015').length, images: imageCount, audio: audioCount },
    lessons, words: wordCards, exercises, exerciseTypes, texts, dialogues, games: exercises.filter(item => item.componentId === 'ALF-CMP-015').map(item => ({ id: item.exerciseId, title: item.title!, mode: item.mode })), scenes: contexts.filter(item => item.image).map(item => ({ id: item.id, title: item.title, image: item.image, words: wordsFor(item.wordIds).map(word => word.word) })),
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
  const byExerciseId = new Map(pack.exercises.filter(exercise => exercise.lessonId === lesson.id).map(exercise => [exercise.exerciseId, exercise]));
  return (lesson.guidedExerciseIds ?? []).map(id => byExerciseId.get(id)).filter((item): item is PackageExercise => Boolean(item));
}

// A preview is not a shortened lesson: the full lesson and recall stay unchanged.
export function lessonPreviewWords(pack: PackageDefinition, lesson: PackageLesson): PackageWord[] {
  const ids = lesson.newWords?.length ? lesson.newWords : lesson.returning;
  return (ids?.length
    ? ids.map(id => pack.words.find(word => word.id === id))
    : lesson.words.map(text => pack.words.find(word => word.word === text)))
    .filter((word): word is PackageWord => Boolean(word)).slice(0, 2);
}

export const primaryWordCards = curriculum.words.map(word => ({ ...toWord(word), packageId:
  word.firstReading.mode === 'reading-route' ? `route-${word.firstReading.routeId}` :
  word.firstReading.mode === 'preparation' ? 'voorbereiding' : `groep-${homeGroup(word)}`,
}));
