import { taalroutePackages, primaryWordCards } from './taalroute-packages';

export type PackageId = string;
export type LessonPhase = 'meet' | 'recognize' | 'make' | 'use' | 'recall';
export type AudioOptions = { signal?: AbortSignal; waitUntilEnd?: boolean; onStarted?: () => void };
export type AudioPlayer = (source?: string, options?: AudioOptions) => Promise<boolean> | boolean | void;
export type LessonPosition = { packageId: string; lessonId: string; exerciseId: string };
export type PracticeAttempt = { exerciseId: string; mode: string; answer: string; correct: boolean; attempts: number; helpUsed: boolean; support: 'model' | 'requested-help' | 'none' | 'listening'; elapsedMs: number; objective: string; assessment: 'answer' | 'participation'; contextId?: string; access?: string; independentReading?: boolean };

export type PackageWord = {
  id: string;
  word: string;
  segmentation: string;
  focus: string;
  group: string;
  meaning?: string;
  image?: string;
  audio?: string;
  audioStatus?: 'review-open' | 'rejected' | 'missing' | 'approved';
  examples?: string[];
};

export type PackageLesson = {
  id: string;
  title: string;
  scope: string;
  words: string[];
  steps: string[];
  kind?: string;
  known?: string[];
  newWords?: string[];
  returning?: string[];
  guidedExerciseIds?: string[];
  unitIds?: string[];
};

export type PackageText = {
  id: string;
  title: string;
  level: string;
  text: string;
  question?: string;
  answer?: string;
  audio?: string;
  kind?: 'sentence' | 'text';
  exerciseId?: string;
  lessonIds?: string[];
};

export type PackageDialogue = {
  id: string;
  title: string;
  level: string;
  goal: string;
  turns: { speaker: string; text: string; audio?: string }[];
  exerciseId?: string;
  lessonIds?: string[];
};

export type ExerciseImage = {
  assetId?: string;
  src?: string;
  altText?: string;
  rendition?: string;
};

export type ExerciseAudio = {
  audioId?: string;
  src?: string;
  autoplay?: boolean;
};

export type PackageExercise = {
  exerciseId: string;
  componentId: string;
  contractVersion: string;
  mode: string;
  title?: string;
  lessonId?: string;
  stepKey?: string;
  sourceStatus?: string;
  activityTypeId?: string;
  phase?: LessonPhase;
  feedback?: string;
  requiresAudio?: boolean;
  instructionAudio?: ExerciseAudio;
  assessment?: 'answer' | 'participation';
  prompt?: {
    text?: string;
    image?: ExerciseImage;
    audio?: ExerciseAudio;
  };
  [key: string]: unknown;
};

export type PackageDefinition = {
  id: PackageId;
  kind?: 'group' | 'route' | 'preparation';
  title: string;
  subtitle: string;
  description: string;
  level: string;
  status: string;
  statusNote: string;
  counts: {
    lessons: number;
    coreWords: number;
    exercises: number;
    exerciseTypes: number;
    texts: number;
    sentences?: number;
    dialogues: number;
    games: number;
    images: number;
    audio: number;
  };
  lessons: PackageLesson[];
  words: PackageWord[];
  texts: PackageText[];
  dialogues: PackageDialogue[];
  games: { id: string; title: string; mode: string }[];
  exercises: PackageExercise[];
  exerciseTypes: {
    id: string;
    label: string;
    count: number;
    modes: string[];
    examples: string[];
  }[];
  scenes: {
    id: string;
    title: string;
    description?: string;
    words?: string[];
    image?: string;
  }[];
  media: {
    imageAvailable: number;
    imageExpected: number;
    audioAvailable: number;
    audioExpected: number;
    missing: string[];
    imageReview: string;
    audioReview: string;
    publication: string;
  };
};

export const contentPackages: PackageDefinition[] = taalroutePackages;

export function getPackage(packageId: PackageId) {
  return contentPackages.find((item) => item.id === packageId) ?? contentPackages[0];
}

export const allPackageWords = primaryWordCards;

export function wordLabel(word: { id: string; word: string }) {
  if (word.id === 'klink-woord-pak') return 'pak (kleding)';
  if (word.id === 'klink-woord-pak-verpakking') return 'pak (verpakking)';
  return word.word;
}
