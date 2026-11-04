import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import data from '../data/klink10-writing-dictation-aa-20261102.json' with { type: 'json' };
import { contentPackages } from '../lib/package-content.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { alfaADictationRound } from '../lib/klink10-writing-dictation-aa.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { writingDictationRounds } from '../lib/writing-dictation.ts';

const originals = new Map(contentPackages.flatMap(pack => groupExercises(pack, 'dictation').map(e => [e.exerciseId, e])));
assert.equal(data.publicationReady, true, 'Bounded source and audio review completed');
assert.equal(alfaADictationRound.exercises.length, 10);
assert.equal(new Set(alfaADictationRound.exercises.map(e => e.writingSourceId)).size, 10);
for (const [index, exercise] of alfaADictationRound.exercises.entries()) {
  const position = data.positions[index], original = originals.get(position.canonicalId);
  assert(original);
  assert.equal(original.helpWord, position.word, 'Existing standard support must stay intact');
  assert.deepEqual(exercise.fields, original.fields, 'Reuse the existing answer contract');
  assert.equal(exercise.helpWord, undefined, 'The new source forbids a written model');
  assert.equal(exercise.prompt.text, undefined);
  assert(exercise.audioOnly && !exercise.reviewEligible && !exercise.independentReading);
  assert(existsSync('public' + position.audio));
  assert(existsSync('public' + position.instructionAudio));
}
assert.equal(chapterCollections('dictation').filter(c => c.id === data.id).length, 1);
assert.equal(writingDictationRounds.length, 15);
assert.equal(writingDictationRounds.reduce((n, r) => n + r.exercises.length, 0), 100);
console.log('Ten isolated source variants; original answers, Help and 100 Alfa C positions preserved. Source and audio evidence are recorded.');
