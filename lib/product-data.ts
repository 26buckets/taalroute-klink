export type ExerciseKind =
  | 'model'
  | 'sound'
  | 'pair'
  | 'sort'
  | 'build'
  | 'type'
  | 'read'
  | 'transfer'
  | 'speak';

export type LessonItem = {
  id: string;
  word: string;
  answer?: string;
  options?: string[];
  tiles?: string[];
  sentence?: string;
};

export type LessonStep = {
  id: string;
  title: string;
  short: string;
  kind: ExerciseKind;
  instruction: string;
  instructionAudio: string;
  skill: string;
  items: LessonItem[];
};

export type ReviewItem = {
  id: string;
  locale: string;
  word: string;
  status: 'draft' | 'language_review' | 'didactic_review' | 'approved' | 'published';
  updatedAt?: string;
};

export type MasteryRow = {
  skillKey: string;
  score: number;
  correctCount: number;
  attemptCount: number;
};

export const lessonSteps: LessonStep[] = [
  {
    id: 'model', title: 'Luister en kijk', short: 'Uitleg', kind: 'model',
    instruction: 'Luister naar de woorden. Kijk naar de eerste letter.',
    instructionAudio: 'instructie-luister-kijk', skill: 'pb.model',
    items: [{ id: 'pak', word: 'pak' }, { id: 'bak', word: 'bak' }, { id: 'peer', word: 'peer' }, { id: 'beer', word: 'beer' }],
  },
  {
    id: 'sound', title: 'Hoor je p of b?', short: 'Horen', kind: 'sound',
    instruction: 'Luister naar het woord. Kies de eerste letter.',
    instructionAudio: 'instructie-eerste-letter', skill: 'pb.hear.initial',
    items: [
      { id: 'pak', word: 'pak', answer: 'p', options: ['p', 'b'] },
      { id: 'bak', word: 'bak', answer: 'b', options: ['p', 'b'] },
      { id: 'peer', word: 'peer', answer: 'p', options: ['p', 'b'] },
      { id: 'beer', word: 'beer', answer: 'b', options: ['p', 'b'] },
      { id: 'poot', word: 'poot', answer: 'p', options: ['p', 'b'] },
      { id: 'boot', word: 'boot', answer: 'b', options: ['p', 'b'] },
    ],
  },
  {
    id: 'pair', title: 'Kies het woord', short: 'Herkennen', kind: 'pair',
    instruction: 'Luister. Kies het woord dat je hoort.',
    instructionAudio: 'instructie-kies-woord', skill: 'pb.word.recognition',
    items: [
      { id: 'pak', word: 'pak', answer: 'pak', options: ['pak', 'bak'] },
      { id: 'beer', word: 'beer', answer: 'beer', options: ['peer', 'beer'] },
      { id: 'poot', word: 'poot', answer: 'poot', options: ['poot', 'boot'] },
      { id: 'baar', word: 'baar', answer: 'baar', options: ['paar', 'baar'] },
      { id: 'pad', word: 'pad', answer: 'pad', options: ['pad', 'bad'] },
      { id: 'biet', word: 'biet', answer: 'biet', options: ['piet', 'biet'] },
    ],
  },
  {
    id: 'sort', title: 'Leg bij p of b', short: 'Sorteren', kind: 'sort',
    instruction: 'Luister naar het woord. Leg het woord bij p of b.',
    instructionAudio: 'instructie-sorteer', skill: 'pb.categorize',
    items: [
      { id: 'pas', word: 'pas', answer: 'p', options: ['p', 'b'] },
      { id: 'bas', word: 'bas', answer: 'b', options: ['p', 'b'] },
      { id: 'peen', word: 'peen', answer: 'p', options: ['p', 'b'] },
      { id: 'been', word: 'been', answer: 'b', options: ['p', 'b'] },
      { id: 'pijl', word: 'pijl', answer: 'p', options: ['p', 'b'] },
      { id: 'bijl', word: 'bijl', answer: 'b', options: ['p', 'b'] },
    ],
  },
  {
    id: 'build', title: 'Bouw het woord', short: 'Bouwen', kind: 'build',
    instruction: 'Luister naar het woord. Tik de letters in de goede volgorde.',
    instructionAudio: 'instructie-bouw', skill: 'pb.spelling.build',
    items: [
      { id: 'pak', word: 'pak', answer: 'pak', tiles: ['b', 'a', 'k', 'p'] },
      { id: 'bak', word: 'bak', answer: 'bak', tiles: ['p', 'k', 'b', 'a'] },
      { id: 'peer', word: 'peer', answer: 'peer', tiles: ['b', 'e', 'p', 'r', 'e'] },
      { id: 'beer', word: 'beer', answer: 'beer', tiles: ['p', 'e', 'r', 'b', 'e'] },
    ],
  },
  {
    id: 'type', title: 'Typ wat je hoort', short: 'Schrijven', kind: 'type',
    instruction: 'Luister naar het woord. Typ het woord.',
    instructionAudio: 'instructie-typ', skill: 'pb.spelling.type',
    items: [
      { id: 'poot', word: 'poot', answer: 'poot' }, { id: 'boot', word: 'boot', answer: 'boot' },
      { id: 'paar', word: 'paar', answer: 'paar' }, { id: 'baar', word: 'baar', answer: 'baar' },
    ],
  },
  {
    id: 'read', title: 'Lees en kies', short: 'Lezen', kind: 'read',
    instruction: 'Lees de zin. Kies het goede woord.',
    instructionAudio: 'instructie-lees', skill: 'pb.read.context',
    items: [
      { id: 'peer', word: 'peer', sentence: 'Ik eet een …', answer: 'peer', options: ['peer', 'beer'] },
      { id: 'beer', word: 'beer', sentence: 'De … loopt in het bos.', answer: 'beer', options: ['peer', 'beer'] },
      { id: 'boot', word: 'boot', sentence: 'De … vaart op het water.', answer: 'boot', options: ['poot', 'boot'] },
      { id: 'bad', word: 'bad', sentence: 'Het kind zit in het …', answer: 'bad', options: ['pad', 'bad'] },
    ],
  },
  {
    id: 'transfer', title: 'Gebruik het woord', short: 'Toepassen', kind: 'transfer',
    instruction: 'Luister en maak de zin af.',
    instructionAudio: 'instructie-zin', skill: 'pb.transfer',
    items: [
      { id: 'bak', word: 'bak', sentence: 'Ik … het brood.', answer: 'bak', options: ['pak', 'bak'] },
      { id: 'pak', word: 'pak', sentence: 'Ik … de doos.', answer: 'pak', options: ['pak', 'bak'] },
      { id: 'paar', word: 'paar', sentence: 'Ik koop een … schoenen.', answer: 'paar', options: ['paar', 'baar'] },
      { id: 'been', word: 'been', sentence: 'Mijn … doet pijn.', answer: 'been', options: ['peen', 'been'] },
    ],
  },
  {
    id: 'speak', title: 'Luister en spreek', short: 'Spreken', kind: 'speak',
    instruction: 'Luister naar het woord. Neem jezelf op en luister terug.',
    instructionAudio: 'instructie-spreek', skill: 'pb.speak.selfcheck',
    items: [{ id: 'pak', word: 'pak' }, { id: 'bak', word: 'bak' }, { id: 'peer', word: 'peer' }, { id: 'beer', word: 'beer' }],
  },
];

export const totalActivities = lessonSteps.reduce((sum, step) => sum + step.items.length, 0);

export const classRows = [
  { name: 'Fatima A.', initials: 'FA', heard: 78, typed: 63, read: 82, speaking: 'Klaar voor review', action: 'p–b typen' },
  { name: 'Omar K.', initials: 'OK', heard: 42, typed: 38, read: 67, speaking: '2 opnames', action: 'p–b horen' },
  { name: 'Linh T.', initials: 'LT', heard: 91, typed: 86, read: 74, speaking: 'Beoordeeld', action: 'contextzinnen' },
  { name: 'Samira M.', initials: 'SM', heard: 69, typed: 77, read: 80, speaking: 'Nog niet gestart', action: 'p–b herhalen' },
  { name: 'Youssef B.', initials: 'YB', heard: 48, typed: 52, read: 61, speaking: '1 opname', action: 'kleine groep' },
];

export const statusLabel: Record<ReviewItem['status'], string> = {
  draft: 'Concept', language_review: 'Taalcontrole', didactic_review: 'Didactische controle',
  approved: 'Goedgekeurd', published: 'Gepubliceerd',
};
