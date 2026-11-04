import data from '../data/klink10-writing-dictation-aa-20261102.json' with { type: 'json' };
import { contentPackages, type PackageExercise } from './package-content.ts';
import { groupExercises } from './group-practice.ts';

const originals = new Map(contentPackages.flatMap(pack => groupExercises(pack, 'dictation').map(exercise => [exercise.exerciseId, exercise] as const)));
export const alfaADictationRound = { ...data, exercises: data.positions.map(position => {
  const original = originals.get(position.canonicalId);
  const answers = (original?.fields as { acceptedAnswers?: string[] }[] | undefined)?.flatMap(field => field.acceptedAnswers ?? []);
  if (!original || original.mode !== 'word-dictation' || answers?.length !== 1 || answers[0] !== position.word) throw new Error('Alfa A dictation source mismatch');
  const exercise: PackageExercise = {
    ...structuredClone(original), writingSourceId: position.sourceId,
    contentLevel: 'alfa-a', vocabularyLevels: ['alfa-a'],
    title: 'Luister en typ het woord.', objective: 'Schrijf het woord dat je hoort.',
    instructionAudio: { src: position.instructionAudio }, prompt: { audio: { src: position.audio } },
    audioOnly: true, requiresAudio: true, independentReading: false, reviewEligible: false,
    feedback: position.feedback, correctFeedback: position.correctFeedback,
  };
  // This source requires recall without a written model; standard dictations retain their Help.
  delete exercise.helpWord;
  return exercise;
}) };
