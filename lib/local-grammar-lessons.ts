import localExercises from '../data/klink-grammar-self-local.json' with { type: 'json' };
import type { PackageDefinition, PackageExercise } from './package-content';

// Local editorial rehearsal, separate from imported content and production manifests.
export const localGrammarExercises = localExercises as PackageExercise[];
const exercises = localGrammarExercises.filter(item => item.packId === 'grammatica-verzoek');
export const grammarLessonProposal: PackageDefinition = {
  id: 'grammatica-verzoek', practiceActivities: ['grammar-path'], title: 'Een duidelijk verzoek',
  subtitle: 'Zinnen oefenen · B1', description: 'Oefen de zinnen voor een verzoek. De docent kan helpen als je dat wilt.',
  level: 'B1', status: 'local-proposal', statusNote: 'Lesvoorstel; nog niet ingeroosterd.',
  counts: { lessons: 1, coreWords: 0, exercises: exercises.length, exerciseTypes: 1, texts: 0, dialogues: 0, games: 0, images: 0, audio: 0 },
  lessons: [{ id: 'grammatica-verzoek-01', title: 'Een verzoek aan de organisatie', scope: 'Zinsbouw, verwijzing en samenhang. Voorstel bij de bestaande opdracht G62.', words: [], steps: ['use'], guidedExerciseIds: exercises.map(item => item.exerciseId) }],
  words: [], texts: [], dialogues: [], games: [], exercises, exerciseTypes: [], scenes: [],
  media: { imageAvailable: 0, imageExpected: 0, audioAvailable: 0, audioExpected: 0, missing: [], imageReview: 'not-used', audioReview: 'Word audio inventoried separately; sentence audio not produced.', publication: 'local-only' },
};
