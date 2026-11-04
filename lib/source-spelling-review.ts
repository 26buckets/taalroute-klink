import data from '../data/klink10-spelling-review-aa-20261102.json' with { type: 'json' };
import type { PackageExercise } from './package-content';

export const sourceSpellingReview = data;
export const sourceSpellingRecallExercises = data.exercises as PackageExercise[];
export const sourceSpellingRecallIds = new Set(sourceSpellingRecallExercises.map(exercise => exercise.exerciseId));
