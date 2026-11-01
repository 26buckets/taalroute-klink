import lessonContent from '../data/klink-docent-lessons.json' with { type: 'json' };
import additionalLessons from '../data/klink-docent-extra-lessons.json' with { type: 'json' };
import nextLessons from '../data/klink-docent-extra-lessons-10-15.json' with { type: 'json' };
import classroomContent from '../data/klink-docent-mat.json' with { type: 'json' };
import routeContent from '../data/klink-docent-routes.json' with { type: 'json' };
import { wordById } from './klink-curriculum.ts';
import { classroomKey, rememberClassroomActive } from './classroom-visibility.ts';
export { classroomHash, classroomMaterialsHash, classroomKey } from './classroom-visibility.ts';
export { classroomContent };
export const classroomRoutes = routeContent.routes;
export type ClassroomRoute = keyof typeof classroomRoutes;
export const routeIds: ClassroomRoute[] = ['a', 'b', 'c'];
export function prerequisitesForRoute(route: ClassroomRoute, lessonId = 'mat') {
  return getClassroomLesson(lessonId).routes[route].tokens.map((token) => {
    const word = [...wordById.values()].find((word) => word.word === token);
    return {
      token,
      wordRef: word?.id ?? null,
      firstReading: word?.firstReading ?? null,
      units: word?.preparation.unitIds ?? [],
    };
  });
}
import { lessonPackages } from './package-content.ts';
import { exercisesForLesson } from './taalroute-packages.ts';

export const roundLabels = {
  a: 'Stap 1 · Woord',
  b: 'Stap 2 · Zin',
  c: 'Stap 3 · Tekst',
};
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
    label: 'Voordoen',
    description:
      'Laat eerst een model zien. Benoem wat je doet en laat daarna nadoen.',
  },
  {
    id: 'basic',
    label: 'Samen doen',
    description:
      'Laat eerst proberen. Geef één aanwijzing en laat de cursist verdergaan.',
  },
  {
    id: 'extend',
    label: 'Zelfstandig',
    description:
      'Begin zonder voorbeeld. Laat lezen, handelen en zelf controleren.',
  },
];
export type LessonPhase = {
  title: string;
  prompt: string;
  action: string;
  observe: string;
  minutes: number;
  framework: string;
  expected?: string;
  hint?: string;
  feedback?: string;
  studentAction?: string;
  visible?: string;
};
export const phases: LessonPhase[] = [
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
export const classroomLessons = [
  { id: 'mat', wordRef: classroomContent.wordRef, display: 'de mat', phases, routes: classroomRoutes,
    presentation: { imageAlt: 'Een mat bij een deur', phrases: ['De mat', 'ligt', 'bij de deur.'], entryAction: 'Kom binnen. Veeg je voeten op de mat.', ownPrompt: 'Vertel over de mat bij jou thuis.', ownHint: 'Waar ligt hij? Wat doe jij als je binnenkomt?', wordUse: 'Waar ligt nog een mat? Vertel of laat zien.' } },
  ...lessonContent,
  ...additionalLessons,
  ...nextLessons,
].map(content => {
  const pack = lessonPackages.find(pack => pack.lessons.some(lesson => lesson.newWords?.includes(content.wordRef)))!;
  const lesson = pack.lessons.find(lesson => lesson.newWords?.includes(content.wordRef))!;
  const word = pack.words.find(word => word.id === content.wordRef)!;
  const boardImage = 'boardImage' in content && typeof content.boardImage === 'string' ? content.boardImage : word.image;
  return { ...content, boardImage, pack, lesson, word, units: word.segmentation.split('|'), exercises: exercisesForLesson(pack, lesson) };
});
export function getClassroomLesson(lessonId = 'mat') {
  return classroomLessons.find(lesson => lesson.id === lessonId) ?? classroomLessons[0];
}
export function classroomSoundId(units: string[], index: number) {
  return units[index] === 'd' && index === units.length - 1 ? 't' : units[index];
}
export function phasesForRoute(route: ClassroomRoute, lessonId = 'mat'): LessonPhase[] {
  const lesson = getClassroomLesson(lessonId);
  const selected = route === 'a' ? lesson.phases : lesson.routes[route].phases;
  return selected.map(phase => ({ ...phase, title: phase.title.replace(/^(?:Woord|Zin|Tekst)\s+\d+\.\s*/, '') }));
}
export function sequenceForRoute(route: ClassroomRoute, lessonId = 'mat') {
  const lesson = getClassroomLesson(lessonId);
  return route === 'a' ? lesson.units : lesson.routes[route].cards;
}
export function isCorrectSequence(route: ClassroomRoute, order: number[], lessonId = 'mat') {
  const sequence = sequenceForRoute(route, lessonId);
  return order.length === sequence.length && new Set(order).size === order.length &&
    order.every(i => Number.isInteger(i) && i >= 0 && i < sequence.length) &&
    order.map(i => sequence[i]).join(' ') === sequence.join(' ');
}
export const tools = [
  'Klankbord',
  'Leesplank',
  'Woordbord',
  'Spiegelbord',
  'Schrijfbord',
] as const;
export type BoardTool = (typeof tools)[number];
export type ClassroomState = {
  lessonId: string;
  ownSentence: string;
  active: boolean;
  variant: Variant;
  route: ClassroomRoute;
  order: number[];
  textVersion: 1;
  phase: number;
  tiles: string[];
  shown: boolean[];
  image: boolean;
  regular: boolean;
  exerciseId?: string;
};
export function freshClassroom(
  variant: Variant = 'basic',
  route: ClassroomRoute = 'a',
  lessonId = 'mat',
): ClassroomState {
  const lesson = getClassroomLesson(lessonId);
  return {
    lessonId: lesson.id,
    ownSentence: '',
    active: false,
    variant,
    route,
    order: [],
    textVersion: 1,
    phase: 0,
    tiles: lesson.units.map((unit, i) =>
      variant === 'support' && i === 0 ? unit : '',
    ),
    shown: phases.map(
      (_, i) =>
        i <= 1 || (route !== 'a' && variant === 'support' &&
        [3, route === 'c' ? 6 : 5].includes(i)),
    ),
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
      routeIds.includes(value.route) ? value.route : 'a',
      typeof value.lessonId === 'string' ? value.lessonId : 'mat',
    );
    const lesson = getClassroomLesson(state.lessonId);
    state.order = Array.isArray(value.order)
      ? value.order.filter(
          (i: unknown, index: number) =>
            Number.isInteger(i) &&
            Number(i) >= 0 &&
            Number(i) < sequenceForRoute(state.route, state.lessonId).length &&
            value.order.indexOf(i) === index,
        )
      : [];
    // Old C card indexes belong to the replaced message, not this sentence.
    if (state.route === 'c' && value.textVersion !== 1) state.order = [];
    state.ownSentence = typeof value.ownSentence === 'string' ? value.ownSentence.slice(0, 160) : '';
    state.active = value.active !== false;
    state.phase =
      Number.isInteger(value.phase) &&
      value.phase >= 0 &&
      value.phase < phases.length
        ? value.phase
        : 0;
    state.tiles = lesson.units.map((_, i) => {
      const t = value.tiles?.[i];
      return typeof t === 'string' &&
        lesson.units.includes(t) &&
        value.tiles.slice(0, i + 1).filter((letter: unknown) => letter === t).length <= lesson.units.filter(letter => letter === t).length
        ? t
        : '';
    });
    state.shown = phases.map((_, i) => value.shown?.[i] === true);
    state.image = value.image !== false;
    state.regular = value.regular === true;
    state.exerciseId = lesson.exercises.find(
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
  rememberClassroomActive(memory.active);
  return memory;
}
export function saveClassroom(state: ClassroomState) {
  memory = state;
  rememberClassroomActive(state.active);
  try {
    sessionStorage.setItem(classroomKey, JSON.stringify(state));
    sessionStorage.setItem(`${classroomKey}.${state.lessonId}`, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function readLessonClassroom(lessonId: string) {
  try {
    const raw = sessionStorage.getItem(`${classroomKey}.${lessonId}`) ?? sessionStorage.getItem(classroomKey);
    if (raw) {
      const state = restoreClassroom(raw);
      if (state.lessonId === lessonId) return state;
    }
  } catch { /* Opening another lesson also works without storage. */ }
  return freshClassroom('basic', 'a', lessonId);
}
export function placeTile(tiles: string[], letter: string, position?: number, lessonId = 'mat') {
  const units = getClassroomLesson(lessonId).units;
  const target = position ?? units.findIndex((_, i) => !tiles[i]);
  if (!units.includes(letter) || target < 0 || target >= units.length) return tiles;
  if (tiles[target] === letter) return tiles;
  const next = units.map((_, i) => tiles[i] ?? '');
  const previous = tiles.filter(value => value === letter).length >= units.filter(value => value === letter).length ? tiles.indexOf(letter) : -1;
  next[target] = letter;
  if (previous >= 0 && previous !== target) next[previous] = tiles[target] ?? '';
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
