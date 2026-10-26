import {
  allPackageWords,
  contentPackages,
  type PackageExercise,
} from '../package-content.ts';
import { contentById } from '../connected-content.ts';

export type PilotStep = {
  id: string;
  stage: string;
  instruction: string;
  instructionAudio: string;
  exercise: PackageExercise;
  model: string;
  help: string;
  sourceIds: string[];
  recurrenceOf?: string;
};
export type PilotBlock = {
  id: string;
  title: string;
  goal: string;
  words: string[];
  steps: PilotStep[];
};
const word = (text: string) => {
  const found = allPackageWords.find((w) => w.word === text);
  if (!found?.audio || !found.image)
    throw Error(`Missing existing media: ${text}`);
  return found;
};
const sentence = (text: string) => {
  const found = [...contentById.values()].find(
    (s) => s.kind === 'sentence' && s.text === text,
  );
  if (!found?.blocks[0]?.audio?.src)
    throw Error(`Missing existing sentence: ${text}`);
  return found;
};
const instruction = (id: string) => `/package-audio/instructions/${id}.wav`;
export const pilotPack = contentPackages[0];
export const pilotStorageKey = 'klink.preview.alfa-c.v1';
const definitions = [
  {
    id: 'winkel',
    title: 'In de winkel',
    goal: 'Woorden en korte zinnen over boodschappen begrijpen.',
    words: ['winkel', 'brood', 'melk'],
    parts: ['win', 'kel'],
    sentences: [
      'Ik loop de winkel in.',
      'Ik kies een klein brood.',
      'Dit is melk.',
    ],
    practical: 1,
  },
  {
    id: 'bus',
    title: 'Met de bus',
    goal: 'Vervoer herkennen en een korte zin maken.',
    words: ['auto', 'bus', 'fiets'],
    parts: ['au', 'to'],
    sentences: [
      'Dit is mijn auto.',
      'Ik stap in de bus.',
      'Dit is mijn fiets.',
    ],
    practical: 1,
  },
  {
    id: 'thuis',
    title: 'Thuis',
    goal: 'Woorden en korte zinnen over een woning begrijpen.',
    words: ['kamer', 'deur', 'raam'],
    parts: ['ka', 'mer'],
    sentences: [
      'Er is licht in de kamer.',
      'Dit is de deur.',
      'Het raam staat open.',
    ],
    practical: 1,
  },
];
export const pilotBlocks: PilotBlock[] = definitions.map((def) => {
  const ws = def.words.map(word),
    ss = def.sentences.map(sentence),
    steps: PilotStep[] = [];
  const base = (componentId: string, mode: string): PackageExercise => ({
    exerciseId: '',
    componentId,
    mode,
    title: '',
    contractVersion: '1.0',
    assessment: 'answer',
    independentReading: false,
    sourceStatus: 'concept',
    requiresAudio: true,
    reviewEligible: false,
  });
  function add(
    stage: string,
    title: string,
    audio: string,
    exercise: PackageExercise,
    model: string,
    help: string,
    sourceIds: string[],
    recurrenceOf?: string,
  ) {
    const id = `pilot-alfa-c:${def.id}:${steps.length + 1}`;
    if (exercise.prompt?.audio?.src)
      exercise = {
        ...exercise,
        prompt: {
          ...exercise.prompt,
          audio: {
            ...exercise.prompt.audio,
            audioId: exercise.prompt.audio.audioId ?? exercise.prompt.audio.src,
          },
        },
      };
    steps.push({
      id,
      stage,
      instruction: title,
      instructionAudio: instruction(audio),
      exercise: { ...exercise, exerciseId: id, title },
      model,
      help,
      sourceIds,
      recurrenceOf,
    });
  }
  ws.forEach((w) =>
    add(
      'Kijken',
      'Kijk en luister.',
      'kijken',
      {
        ...base('ALF-CMP-001', 'model'),
        assessment: 'participation',
        wordId: w.id,
        prompt: {
          image: { src: w.image, altText: w.word },
          audio: { src: w.audio },
        },
        text: { primary: w.word },
      },
      w.word,
      'Tik op het woord om nog eens te luisteren.',
      [w.id],
    ),
  );
  const pictureChoice = (index: number, contextual = false) => ({
    ...base('ALF-CMP-002', contextual ? 'sentence-question' : 'heard-image'),
    wordId: contextual ? undefined : ws[index].id,
    contextId: contextual ? ss[index].id : undefined,
    prompt: {
      audio: {
        src: contextual ? ss[index].blocks[0].audio!.src : ws[index].audio,
      },
    },
    options: [...ws.slice(index + 1), ...ws.slice(0, index + 1)].map((w) => ({
      id: w.id,
      image: { src: w.image, altText: w.word },
    })),
    answer: { correctOptionIds: [ws[index].id] },
  });
  [0, 1].forEach((i) =>
    add(
      'Kiezen',
      'Luister. Kies de foto.',
      'hoor-foto',
      pictureChoice(i),
      ws[i].word,
      'Luister nog eens. Kijk naar de drie foto’s.',
      [ws[i].id],
    ),
  );
  const tiles = def.parts.map((token, i) => ({ id: `part-${i}`, token }));
  add(
    'Maken',
    'Maak het woord.',
    'bouwen',
    {
      ...base('ALF-CMP-005', 'word-build'),
      wordId: ws[0].id,
      prompt: { audio: { src: ws[0].audio } },
      tiles: [...tiles].reverse(),
      answer: { targetTileIds: tiles.map((t) => t.id) },
    },
    ws[0].word,
    `Zet de delen van links naar rechts: ${def.parts.join(' · ')}.`,
    [ws[0].id],
  );
  [0, 2].forEach((i) =>
    add(
      'Zinnen',
      'Luister. Kies de zin.',
      'groep-zoek-zin',
      {
        ...base('ALF-CMP-002', 'heard-sentence'),
        contextId: ss[i].id,
        prompt: { audio: { src: ss[i].blocks[0].audio!.src } },
        options: [...ss.slice(i + 1), ...ss.slice(0, i + 1)].map((s) => ({
          id: s.id,
          label: s.text,
        })),
        answer: { correctOptionIds: [ss[i].id] },
      },
      ss[i].text,
      'Luister nog eens naar de hele zin. Kijk hoe de zin begint.',
      ss.map((s) => s.id),
    ),
  );
  const tokens = ss[1].text
    .split(' ')
    .map((token, i) => ({ id: `word-${i}`, token }));
  add(
    'Zinnen',
    'Maak de zin.',
    'extra-zinbouwen',
    {
      ...base('ALF-CMP-005', 'sentence-build'),
      buildKind: 'sentence',
      contextId: ss[1].id,
      prompt: { audio: { src: ss[1].blocks[0].audio!.src } },
      tiles: [...tokens.slice(2), ...tokens.slice(0, 2)].reverse(),
      answer: { targetTileIds: tokens.map((t) => t.id) },
    },
    ss[1].text,
    'Luister naar de zin. Tik de woorden in dezelfde volgorde aan.',
    [ss[1].id],
  );
  add(
    'Gebruiken',
    'Luister naar de zin. Kies de foto.',
    'zinnen-begrijpen',
    {
      ...pictureChoice(def.practical, true),
      questionAudio: '/package-audio/comprehension/vraag-zin.wav',
    },
    ss[def.practical].text,
    'Luister naar de zin. Welke foto hoort erbij?',
    [ss[def.practical].id, ws[def.practical].id],
  );
  [1, 0].forEach((i) =>
    add(
      'Herhalen',
      'Luister. Kies de foto.',
      'hoor-foto',
      pictureChoice(i),
      ws[i].word,
      'Luister nog eens. Kijk rustig naar de foto’s.',
      [ws[i].id],
      steps[3 + i].id,
    ),
  );
  return {
    id: def.id,
    title: def.title,
    goal: def.goal,
    words: def.words,
    steps,
  };
});
export type PilotRecord = {
  correct: boolean;
  helpUsed: boolean;
  tries: number;
  assessment: 'answer' | 'participation';
};
export type PilotProgress = {
  version: 1;
  positions: Record<string, number>;
  records: Record<string, PilotRecord>;
};
export function readPilotProgress(raw: string | null): PilotProgress {
  const empty: PilotProgress = { version: 1, positions: {}, records: {} };
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1) return empty;
    for (const block of pilotBlocks) {
      const position = value.positions?.[block.id];
      if (
        Number.isInteger(position) &&
        position >= 0 &&
        position <= block.steps.length
      )
        empty.positions[block.id] = position;
      for (const step of block.steps) {
        const row = value.records?.[step.id];
        if (
          typeof row?.correct === 'boolean' &&
          typeof row?.helpUsed === 'boolean' &&
          Number.isInteger(row?.tries) &&
          row.tries >= 0 &&
          row.assessment ===
            (step.exercise.assessment === 'participation'
              ? 'participation'
              : 'answer')
        )
          empty.records[step.id] = row;
      }
    }
    return empty;
  } catch {
    return empty;
  }
}
export function practiceAgain(
  block: PilotBlock,
  records: PilotProgress['records'],
) {
  return block.steps.filter(
    (s) =>
      s.exercise.assessment !== 'participation' &&
      records[s.id] &&
      (!records[s.id].correct ||
        records[s.id].helpUsed ||
        records[s.id].tries > 1) &&
      !s.recurrenceOf,
  );
}
