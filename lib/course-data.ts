export type ExerciseKind =
  | 'intro'
  | 'sound-choice'
  | 'word-choice'
  | 'minimal-pair'
  | 'sort'
  | 'find-letter'
  | 'sound-slots'
  | 'build'
  | 'missing-letter'
  | 'image-word'
  | 'type'
  | 'paper'
  | 'bingo'
  | 'sentence'
  | 'read'
  | 'speak';

export type Exercise = {
  id: string;
  kind: ExerciseKind;
  short: string;
  title: string;
  instruction: string;
  spokenInstruction: string;
  word: string;
  answer?: string;
  options?: string[];
  letters?: string[];
  image?: '/word-bus.png' | '/word-peer.png' | '/word-boek.png';
  skill: 'kijken' | 'luisteren' | 'bouwen' | 'schrijven' | 'lezen' | 'spreken';
};

export const categories = [
  { id: 'abc', label: 'ABC', count: 30, tone: 'cobalt' },
  { id: 'junior', label: 'Junior', count: 12, tone: 'sky' },
  { id: 'schrijven', label: 'Schrijven', count: 19, tone: 'plum' },
  { id: 'lezen', label: 'Lezen', count: 15, tone: 'leaf' },
  { id: 'klanken', label: 'Klanken', count: 82, tone: 'orange' },
  { id: 'luisteren', label: 'Luisteren', count: 14, tone: 'aqua' },
  { id: 'spreken', label: 'Spreken', count: 19, tone: 'berry' },
  { id: 'themas', label: "Thema's", count: 34, tone: 'gold' },
  { id: 'woorden', label: 'Woorden', count: 16, tone: 'blue' },
  { id: 'regels', label: 'Regels', count: 21, tone: 'rust' },
  { id: 'grammatica', label: 'Grammatica', count: 5, tone: 'violet' },
  { id: 'extra', label: 'Extra', count: 29, tone: 'slate' },
] as const;

export const soundLessons = [
  { id: 'pb', label: 'p – b', words: 'pak · bak · peer · bus', exercises: 16, progress: 3, active: true },
  { id: 'mn', label: 'm – n', words: 'man · naam · maan · net', exercises: 14, progress: 14 },
  { id: 'vf', label: 'v – f', words: 'vis · fiets · vier · fles', exercises: 15, progress: 0 },
  { id: 'dt', label: 'd – t', words: 'dak · tak · deur · tuin', exercises: 16, progress: 0 },
  { id: 'short', label: 'a – e – i', words: 'pan · pen · pin', exercises: 18, progress: 0 },
  { id: 'long', label: 'aa – ee – oo', words: 'maan · been · boom', exercises: 18, progress: 0 },
] as const;

export const exercises: Exercise[] = [
  {
    id: 'pb-01', kind: 'intro', short: 'Kijk en luister', title: 'Het woord bus',
    instruction: 'Tik op het geluid.', spokenInstruction: 'Kijk naar het plaatje. Tik op het geluid en luister naar het woord bus.',
    word: 'bus', answer: 'bus', image: '/word-bus.png', skill: 'kijken',
  },
  {
    id: 'pb-02', kind: 'sound-choice', short: 'Begin-klank', title: 'Hoor je p of b?',
    instruction: 'Luister. Kies de eerste klank.', spokenInstruction: 'Luister naar het woord bus. Welke klank hoor je vooraan?',
    word: 'bus', answer: 'b', options: ['p', 'b'], image: '/word-bus.png', skill: 'luisteren',
  },
  {
    id: 'pb-03', kind: 'word-choice', short: 'Woord horen', title: 'Welk woord hoor je?',
    instruction: 'Luister en kies.', spokenInstruction: 'Luister goed. Welk woord hoor je?',
    word: 'peer', answer: 'peer', options: ['beer', 'peer'], image: '/word-peer.png', skill: 'luisteren',
  },
  {
    id: 'pb-04', kind: 'minimal-pair', short: 'Verschil horen', title: 'Pak of bak?',
    instruction: 'Luister en kies het woord.', spokenInstruction: 'Luister. Hoor je pak of bak?',
    word: 'bak', answer: 'bak', options: ['pak', 'bak'], skill: 'luisteren',
  },
  {
    id: 'pb-05', kind: 'sort', short: 'Klankgroep', title: 'Waar hoort bus?',
    instruction: 'Luister. Kies de goede groep.', spokenInstruction: 'Luister naar bus. Begint het woord met p of met b?',
    word: 'bus', answer: 'b', options: ['p', 'b'], image: '/word-bus.png', skill: 'luisteren',
  },
  {
    id: 'pb-06', kind: 'find-letter', short: 'Letter zoeken', title: 'Zoek de b',
    instruction: 'Tik op de letter b.', spokenInstruction: 'Zoek de letter b. Tik op de letter b.',
    word: 'b', answer: 'b', options: ['d', 'p', 'b', 'q'], skill: 'kijken',
  },
  {
    id: 'pb-07', kind: 'sound-slots', short: 'Klanken tellen', title: 'Hoor de klanken',
    instruction: 'Tik op elke klank.', spokenInstruction: 'Luister naar pak. Tik de drie klanken één voor één aan.',
    word: 'pak', answer: 'pak', letters: ['p', 'a', 'k'], skill: 'luisteren',
  },
  {
    id: 'pb-08', kind: 'build', short: 'Woord bouwen', title: 'Maak het woord bus',
    instruction: 'Tik de letters in de goede volgorde.', spokenInstruction: 'Maak het woord bus. Tik eerst b, dan u, dan s.',
    word: 'bus', answer: 'bus', letters: ['u', 'p', 's', 'b'], image: '/word-bus.png', skill: 'bouwen',
  },
  {
    id: 'pb-09', kind: 'missing-letter', short: 'Letter invullen', title: 'Maak het woord af',
    instruction: 'Kies p of b.', spokenInstruction: 'Maak het woord bus af. Kies de eerste letter.',
    word: 'bus', answer: 'b', options: ['p', 'b'], image: '/word-bus.png', skill: 'bouwen',
  },
  {
    id: 'pb-10', kind: 'image-word', short: 'Beeld en woord', title: 'Welk woord past?',
    instruction: 'Kijk en kies het woord.', spokenInstruction: 'Kijk naar het plaatje. Welk woord past bij het plaatje?',
    word: 'boek', answer: 'boek', options: ['boek', 'poek', 'peer'], image: '/word-boek.png', skill: 'lezen',
  },
  {
    id: 'pb-11', kind: 'type', short: 'Woord typen', title: 'Typ het woord',
    instruction: 'Luister. Typ wat je hoort.', spokenInstruction: 'Luister naar het woord. Typ het woord pak.',
    word: 'pak', answer: 'pak', skill: 'schrijven',
  },
  {
    id: 'pb-12', kind: 'paper', short: 'Op papier', title: 'Schrijf het woord',
    instruction: 'Luister en schrijf op papier.', spokenInstruction: 'Pak een pen en papier. Schrijf het woord boek.',
    word: 'boek', answer: 'boek', image: '/word-boek.png', skill: 'schrijven',
  },
  {
    id: 'pb-13', kind: 'bingo', short: 'Woordbingo', title: 'Tik wat je hoort',
    instruction: 'Luister en tik het goede vak.', spokenInstruction: 'Luister naar het woord peer. Tik op peer.',
    word: 'peer', answer: 'peer', options: ['bus', 'peer', 'pak', 'boek'], skill: 'luisteren',
  },
  {
    id: 'pb-14', kind: 'sentence', short: 'Woord in zin', title: 'Welke zin hoor je?',
    instruction: 'Luister en kies.', spokenInstruction: 'Luister naar de zin. Ik ga met de bus. Kies dezelfde zin.',
    word: 'Ik ga met de bus.', answer: 'Ik ga met de bus.', options: ['Ik ga met de bus.', 'Ik lees een boek.'], image: '/word-bus.png', skill: 'lezen',
  },
  {
    id: 'pb-15', kind: 'read', short: 'Lezen op tempo', title: 'Lees de woorden',
    instruction: 'Lees hardop. Tik daarna op klaar.', spokenInstruction: 'Lees de woorden hardop. Pak, bak, bus, peer, boek. Tik daarna op klaar.',
    word: 'pak · bak · bus · peer · boek', answer: 'klaar', skill: 'lezen',
  },
  {
    id: 'pb-16', kind: 'speak', short: 'Zelf spreken', title: 'Zeg de zin',
    instruction: 'Neem je stem op en luister terug.', spokenInstruction: 'Zeg de zin: Ik pak mijn boek. Neem je stem op en luister terug.',
    word: 'Ik pak mijn boek.', answer: 'opgenomen', image: '/word-boek.png', skill: 'spreken',
  },
];
