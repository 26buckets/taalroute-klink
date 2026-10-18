import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { createMixedRound, mixedModes, mixedReviewPack, restoreMixedSession, withMixedRetries } from '../lib/mixed-practice.ts';
import media from '../data/klink-media.json' with { type: 'json' };
import release from '../data/klink-mixed-practice-release.json' with { type: 'json' };
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };

test('All six first-section words are targets, not just distractors, in each applicable mode', () => {
  const pack = packs[0], expected = pack.words.map(word => word.id).sort((a,b)=>a.localeCompare(b));
  const before = JSON.stringify(pack);
  for (const mode of mixedModes) {
    const round = createMixedRound(pack, mode.id, 19);
    assert.deepEqual([...new Set(round.flatMap(exercise => exercise.targetWordIds))].sort((a,b)=>a.localeCompare(b)), expected);
    assert.equal(round.length, mode.id === 'match' ? 2 : 6);
    assert(round.every(exercise => exercise.instructionAudio?.src && exercise.sourceLessonIds.length));
  }
  assert.equal(JSON.stringify(pack), before, 'Never mutate the authoritative package');
});

test('Fifteen sections retain their own words and valid media across varied rounds', () => {
  for (const pack of packs) for (const seed of [1, 2, 42, 0xffffffff]) for (const mode of mixedModes) {
    const round = createMixedRound(pack, mode.id, seed);
    const words = new Map(pack.words.map(word => [word.id, word]));
    assert(round.length, `${pack.id}/${mode.id}`);
    assert.equal(new Set(round.map(exercise => exercise.exerciseId)).size, round.length);
    const expected = pack.words.filter(word => ['read', 'match'].includes(mode.id) ? word.image && media[word.id].imageUse !== 'context' : word.audio).map(word => word.id).sort((a,b)=>a.localeCompare(b));
    assert.deepEqual([...new Set(round.flatMap(exercise => exercise.targetWordIds))].sort((a,b)=>a.localeCompare(b)), expected, `${pack.id}/${mode.id} full target coverage`);
    for (const exercise of round) {
      assert(exercise.targetWordIds.every(id => words.has(id)));
      assert.equal(exercise.sourceStatus, 'concept');
      assert(exercise.sourceLessonIds.every(id => pack.lessons.some(lesson => lesson.id === id)));
      for (const condition of exercise.readingConditions) {
        const original = curriculum.words.find(word => word.id === condition.wordId);
        assert.deepEqual(condition.preparation, original.preparation);
        assert.deepEqual(condition.reading, original.reading);
        assert.deepEqual(condition.firstReading, original.firstReading);
      }
      if (exercise.options) {
        assert(exercise.options.length >= 2 && exercise.options.length <= 4);
        assert.equal(new Set(exercise.options.map(option => words.get(option.id).word)).size, exercise.options.length);
        assert(exercise.options.some(option => exercise.answer.correctOptionIds.includes(option.id)));
        for (const option of exercise.options) if (option.image) {
          assert.equal(option.image.src, words.get(option.id).image);
          assert.notEqual(media[option.id].imageUse, 'context');
        }
      }
      if (mode.id === 'read') {
        assert.equal(exercise.requiresAudio, false);
        assert.equal(exercise.readingTask, true);
        assert.equal(exercise.exampleWord, undefined, 'Reading target is not recorded as a copying model');
      }
      if (mode.id === 'build') {
        assert.equal(exercise.exampleWord, undefined);
        assert.equal(exercise.requiresAudio, true);
        const tokens = new Map(exercise.tiles.map(tile => [tile.id, tile.token]));
        assert.equal(exercise.answer.targetTileIds.map(id => tokens.get(id)).join(''), words.get(exercise.wordId).word);
        assert(pack.exercises.some(source => source.exerciseId === exercise.sourceExerciseId));
      }
      if (mode.id === 'match') {
        assert(exercise.sources.length >= 2 && exercise.sources.length <= 3);
        assert.equal(new Set(exercise.sources.map(item => item.label)).size, exercise.sources.length);
        assert.equal(new Set(exercise.targets.map(item => item.image.src)).size, exercise.sources.length);
        assert.equal(Object.keys(exercise.answer.mapping).length, exercise.sources.length);
      }
    }
  }
});

test('Seeded order and retries are reproducible; invalid saved sessions are rejected', () => {
  const pack = packs[0], round = createMixedRound(pack, 'listen', 42);
  assert.deepEqual(createMixedRound(pack, 'listen', 42), round);
  assert.notDeepEqual(createMixedRound(pack, 'listen', 43).map(item => item.wordId), round.map(item => item.wordId));
  const retries = [round[1].exerciseId], extended = withMixedRetries(round, retries);
  assert.equal(extended.length, 7);
  assert.equal(extended[6].repeatOf, round[1].exerciseId);
  assert.deepEqual(extended[6].options, round[1].options, 'Choices stay put for the later retry');
  const saved = { seed: 42, exerciseId: extended[6].exerciseId, retries, done: false };
  assert.deepEqual(restoreMixedSession(JSON.stringify(saved), pack, 'listen'), saved);
  for (const raw of ['bad json', '[]', '{"seed":-1,"retries":[]}', JSON.stringify({ ...saved, exerciseId: 'foreign-id' })]) assert.equal(restoreMixedSession(raw, pack, 'listen'), undefined);
  assert.equal(restoreMixedSession(JSON.stringify(saved), packs[1], 'listen'), undefined);
});

test('Cross-section review never pulls in an unprepared future section automatically', () => {
  assert.equal(mixedReviewPack(packs, [], []).words.length, 0);
  const complete = [packs[0].lessons[0].id, packs[1].lessons[0].id];
  const sourceLessons = packs.flatMap(pack => pack.lessons).filter(lesson => complete.includes(lesson.id));
  const allowed = new Set(sourceLessons.flatMap(lesson => [...lesson.known, ...lesson.newWords, ...lesson.returning]));
  const review = mixedReviewPack(packs, complete, []);
  assert(review.words.every(word => allowed.has(word.id)));
  assert(review.words.length < packs[0].words.length + packs[1].words.length);
  const saved = packs[2].words[0].id;
  assert(mixedReviewPack(packs, [], [saved, 'unknown']).words.every(word => word.id === saved));
});

test('Owner publication authorization does not pretend independent review happened', () => {
  assert.equal(release.publicationApproved, true);
  assert.equal(release.ownerAuthorization, 'docs/klink-owner-release-round3-20261018.json');
  assert.equal(release.combinationReview, 'open');
  assert.equal(release.existingMediaChanged, false);
});
