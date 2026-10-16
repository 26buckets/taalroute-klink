import { taalroutePackages, primaryWordCards } from './taalroute-packages';

export type PackageId = string;

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
};

export type PackageText = {
  id: string;
  title: string;
  level: string;
  text: string;
  question?: string;
  answer?: string;
};

export type PackageDialogue = {
  id: string;
  title: string;
  level: string;
  goal: string;
  turns: { speaker: string; text: string }[];
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
