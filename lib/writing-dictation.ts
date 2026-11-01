import data from '../data/klink-writing-dictation-20261101.json' with { type: 'json' };
import { contentPackages, type PackageExercise } from './package-content.ts';
import { groupExercises } from './group-practice.ts';

const sources = new Map(contentPackages.flatMap(pack => groupExercises(pack, 'dictation').map(exercise => [exercise.exerciseId, exercise] as const)));
const instruction = '/package-audio/productie-instructies-20261029/KLINK-INS-f1e80ab41f43.mp3';

export const writingDictationRounds = data.rounds.map(round => ({ ...round, exercises: round.positions.map(position => {
  const original = sources.get(position.sourceId);
  if (position.sourceId !== position.id && !original) throw new Error('Missing writing source');
  const accepted = (original?.fields as { acceptedAnswers?: string[] }[] | undefined)?.flatMap(field => field.acceptedAnswers ?? []);
  if (original && (original.mode !== 'word-dictation' || accepted?.length !== 1 || accepted[0] !== position.target)) throw new Error('Different writing answer contract');
  return {
    ...structuredClone(original ?? { exerciseId: position.id, componentId: 'ALF-CMP-006', contractVersion: '1.0', mode: 'word-dictation', fields: [{ id: 'word', acceptedAnswers: [position.target] }] }),
    writingSourceId: position.id, groupActivity: 'dictation', contentLevel: 'alfa-c', vocabularyLevels: ['alfa-c'],
    ...('wordId' in position ? { wordId: position.wordId, targetWordIds: [position.wordId] } : {}),
    title: 'Luister en typ het woord.', objective: 'Je oefent om een woord dat je hoort goed te schrijven.',
    instructionAudio: { src: position.instructionAudio || instruction },
    prompt: { audio: { src: position.audio } }, requiresAudio: true, audioOnly: true,
    assessment: 'answer', independentReading: false, reviewEligible: false,
    helpWord: position.target, feedback: position.feedback, correctFeedback: position.correctFeedback,
    meaningCue: position.meaningCue || undefined,
  } satisfies PackageExercise;
}) }));

if (writingDictationRounds.length !== 15 || writingDictationRounds.some(round => round.positions.length < 6 || round.positions.length > 7) || new Set(writingDictationRounds.flatMap(round => round.positions.map(p => p.id))).size !== 100) throw new Error('Invalid writing positions');
