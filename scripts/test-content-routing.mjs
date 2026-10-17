import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { contentRouting, connectedContent, contentForStep, contentPlacementForStep } from '../lib/connected-content.ts';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };

test('Every Klink route takes its exact content placement from the same Lexicon edition', () => {
  assert.equal(contentRouting.release.authority, 'Lexicon');
  assert.equal(contentRouting.release.curriculumEdition, curriculum.release.id);
  assert.equal(contentRouting.release.curriculumInputHash, curriculum.release.inputHash);
  assert.equal(contentRouting.words.length, 338);
  assert.deepEqual(packs.flatMap(pack => pack.lessons.map(lesson => lesson.id)).sort(), contentRouting.steps.map(step => step.id).sort());
  for (const step of contentRouting.steps) assert.deepEqual(contentForStep(step).map(item => item.id), step.contents.map(item => item.contentId));
  assert.deepEqual(contentForStep({id:'unknown',newWords:['klink-woord-tas']}), [], 'No implicit word-overlap fallback');
});
test('Recorded texts remain exact and every repeat remains an optional supported-listening proposal', () => {
  for (const item of connectedContent) {
    assert.equal(contentRouting.items.find(row => row.id === item.id).textHash, createHash('sha256').update(item.text).digest('hex'));
    assert.deepEqual(item.wordIds, contentRouting.items.find(row => row.id === item.id).wordIds);
  }
  const tas = contentRouting.words.find(word => word.wordId === 'klink-woord-tas');
  assert.equal(tas.firstStepId, 'klink-leesstap-02'); assert(tas.repeatStepIds.length);
  for (const id of tas.repeatStepIds) assert(contentRouting.steps.find(step => step.id === id).contents.some(row => row.returningWordIds.includes(tas.wordId)));
  const late = contentRouting.words.find(word => word.wordId === 'klink-woord-aardappel');
  assert.equal(late.repeatStepIds.length, 0);
  for (const pack of packs) for (const exercise of pack.exercises.filter(exercise => exercise.mode.startsWith('connected-'))) {
    const placement = contentPlacementForStep(exercise.lessonId, exercise.contextId);
    assert.deepEqual(exercise.wordIds, [...new Set([...placement.firstWordIds, ...placement.returningWordIds])]);
    assert.equal(exercise.assessment, 'participation'); assert.equal(exercise.independentReading, false);
    assert(!pack.lessons.find(lesson => lesson.id === exercise.lessonId).guidedExerciseIds.includes(exercise.exerciseId));
  }
});
