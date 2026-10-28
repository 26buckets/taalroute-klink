import classroomContent from '../data/klink-docent-mat.json' with { type: 'json' };
export { classroomContent };
import { lessonPackages } from './package-content.ts';
import { exercisesForLesson } from './taalroute-packages.ts';

export const classroomHash = '#teacher/plus';
export const classroomKey = 'klink.docent.les.v1';
export const matPack = lessonPackages.find((pack) =>
  pack.lessons.some((lesson) =>
    lesson.newWords?.includes(classroomContent.wordRef),
  ),
)!;
export const matLesson = matPack.lessons.find((lesson) =>
  lesson.newWords?.includes(classroomContent.wordRef),
)!;
export const matWord = matPack.words.find(
  (word) => word.id === matLesson.newWords?.[0],
)!;
export const matUnits = matWord.segmentation.split('|');
export const matExercises = exercisesForLesson(matPack, matLesson);
export type Variant = 'support' | 'basic' | 'extend';
export const variants: { id: Variant; label: string; description: string }[] = [
  {
    id: 'support',
    label: 'Steun',
    description:
      'Doe voor, houd het beeld beschikbaar en leg de eerste letter klaar.',
  },
  {
    id: 'basic',
    label: 'Basis',
    description:
      'Laat het woord leggen en plan daarna een leesbeurt zonder voorbeeld.',
  },
  {
    id: 'extend',
    label: 'Plus',
    description:
      'Laat zonder voorbeeld bouwen en de betekenis mondeling in een andere situatie gebruiken.',
  },
];
export const phases = [
  {
    title: 'Kijken',
    prompt: 'Wat zie je?',
    action:
      'Toon het beeld of een echte mat. Laat wijzen, gebaren of vertellen. Controleer betekenis los van uitspraak.',
    observe: 'Toont de cursist wat een mat is?',
    minutes: 3,
    framework: '15.3, 15.7',
  },
  {
    title: 'Luisteren',
    prompt: 'Luister. Zeg na.',
    action:
      'Laat het hele woord horen. Geef eerst denktijd en daarna ieder een beurt. Nazeggen is geen zelfstandig lezen.',
    observe: 'Zegt de cursist het woord na? Noteer dat apart van lezen.',
    minutes: 2,
    framework: '5.1–5.5, 5.8',
  },
  {
    title: 'Klanken',
    prompt: 'Luister naar elke klank.',
    action:
      'Bereid m, korte a /ɑ/ en t afzonderlijk voor. Doe ontbrekende opnamen zelf voor. Voeg pas samen als de losse klanken bekend zijn.',
    observe: 'Herkent de cursist de losse klanken en hun volgorde?',
    minutes: 4,
    framework: '5.1–5.5, 15.7',
  },
  {
    title: 'Bouwen',
    prompt: 'Leg het woord.',
    action:
      'Doe één tegel voor. Laat daarna zelf kiezen; tikken en slepen zijn gelijkwaardig. Wacht, geef één aanwijzing en laat opnieuw proberen.',
    observe:
      'Bouwt de cursist na, vanuit een gehoord woord of zonder voorbeeld?',
    minutes: 4,
    framework: '4.8–4.9, 10.5–10.8',
  },
  {
    title: 'Lezen',
    prompt: 'Lees.',
    action:
      'Begin met het woord afgedekt. Onthul voor een nieuwe leesbeurt zonder foto of audio. Probeer later opnieuw als het woord net is voorgezegd.',
    observe:
      'Leest de cursist zonder onmiddellijk voorbeeld? Eén bekend woord bewijst geen algemeen leesniveau.',
    minutes: 3,
    framework: '15.6, 15.7',
  },
  {
    title: 'Gebruiken',
    prompt: 'Zoek de mat. Wijs aan.',
    action:
      'Laat één cursist het woord zeggen of lezen; de ander wijst de echte mat aan. Wissel. Bied “Hier is de mat” alleen mondeling aan. Vraag bij transfer waar een mat thuis of bij een ingang ligt.',
    observe:
      'Reageren beiden op de betekenis? Houd spreken en zelfstandig lezen apart.',
    minutes: 4,
    framework: '6.3, 6.9, 7.2, 7.5, 15.8',
  },
  {
    title: 'Op papier',
    prompt: 'Werk op je blad.',
    action:
      'Doe de papierhandeling voor. Gebruik uitsluitend voorbereide letters. Leg het stoppunt uit. Weinig tijd: laat één keer m, a en t leggen en daarna de echte mat aanwijzen.',
    observe:
      'Welke taak lukt zelfstandig en welke hulp was nodig? Noteer geen niveau-oordeel.',
    minutes: 5,
    framework: '4.8–4.9, 10.5–10.8',
  },
  {
    title: 'Nog een keer',
    prompt: 'Oefen nog een keer.',
    action:
      'Open de bestaande kleine Klink-les mat. Plan een nieuwe leesbeurt in de volgende bijeenkomst. Tas volgt pas na voorbereiding van s en betekenis.',
    observe: 'Kies een vervolgpoging op grond van wat je werkelijk zag.',
    minutes: 2,
    framework: '23.1, 23.3–23.5, 23.7',
  },
];
export const tools = [
  'Klankbord',
  'Leesplank',
  'Woordbord',
  'Spiegelbord',
  'Schrijfbord',
] as const;
export type BoardTool = (typeof tools)[number];
export type ClassroomState = {
  active: boolean;
  variant: Variant;
  phase: number;
  tiles: string[];
  shown: boolean[];
  image: boolean;
  regular: boolean;
  exerciseId?: string;
};
export function freshClassroom(variant: Variant = 'basic'): ClassroomState {
  return {
    active: false,
    variant,
    phase: 0,
    tiles: matUnits.map((unit, i) =>
      variant === 'support' && i === 0 ? unit : '',
    ),
    shown: phases.map(() => false),
    image: true,
    regular: false,
  };
}
export function restoreClassroom(raw: string | null): ClassroomState {
  const fallback = freshClassroom();
  if (!raw) return fallback;
  fallback.active = true; // A damaged saved lesson must fail closed, never show private preparation.
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return fallback;
    const state = freshClassroom(
      variants.some((v) => v.id === value.variant) ? value.variant : 'basic',
    );
    state.active = value.active !== false;
    state.phase =
      Number.isInteger(value.phase) &&
      value.phase >= 0 &&
      value.phase < phases.length
        ? value.phase
        : 0;
    state.tiles = matUnits.map((_, i) => {
      const t = value.tiles?.[i];
      return typeof t === 'string' &&
        matUnits.includes(t) &&
        value.tiles.indexOf(t) === i
        ? t
        : '';
    });
    state.shown = phases.map((_, i) => value.shown?.[i] === true);
    state.image = value.image !== false;
    state.regular = value.regular === true;
    state.exerciseId = matExercises.find(
      (e) => e.exerciseId === value.exerciseId,
    )?.exerciseId;
    return state;
  } catch {
    return fallback;
  }
}
let memory = freshClassroom();
export function readClassroom() {
  if (typeof window === 'undefined') return freshClassroom();
  try {
    const saved = sessionStorage.getItem(classroomKey);
    if (saved !== null) memory = restoreClassroom(saved);
  } catch {
    /* Keep the current lesson if browser storage is unavailable. */
  }
  return memory;
}
export function saveClassroom(state: ClassroomState) {
  memory = state;
  try {
    sessionStorage.setItem(classroomKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function placeTile(
  tiles: string[],
  letter: string,
  position = matUnits.findIndex((_, i) => !tiles[i]),
) {
  if (!matUnits.includes(letter) || position < 0 || position >= matUnits.length)
    return tiles;
  const next = matUnits.map((_, i) =>
    tiles[i] === letter ? '' : (tiles[i] ?? ''),
  );
  const previous = tiles.indexOf(letter);
  next[position] = letter;
  if (previous >= 0 && previous !== position)
    next[previous] = tiles[position] ?? '';
  return next;
}
export function parseSoundRegistry(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    matUnits.flatMap((id) => {
      const src = (value as Record<string, unknown>)[id];
      return typeof src === 'string' &&
        /^\/klank-audio\/docent\/[^/?#]+\.(wav|mp3|m4a)$/.test(src) &&
        !src.includes('..')
        ? [[id, src]]
        : [];
    }),
  );
}
