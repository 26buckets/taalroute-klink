import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { verifySynonymReviewRelease } from './check-synonym-review-release-20261031.mjs';
import { synonymBank, synonymCollections, synonymExercises, parseSynonymSettings } from '../lib/synonyms.ts';
import { availableChapterCollections, chapterCollections, chapterExerciseChoices, chapterHash, parseChapterHash, practiceChapters } from '../lib/practice-chapters.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { parseLearningReview, updateLearningReview } from '../lib/learning-review.ts';

test('217 preserved source pairs and 192 active word-only questions have exactly one correct answer and traceable editorial sources', () => {
  assert.equal(synonymBank.entries.length, 217);
  assert.equal(new Set(synonymBank.entries.map(entry => entry.id)).size, 217);
  assert.equal(synonymBank.sourceReview.length, 43);
  assert.equal(synonymBank.entries.filter(entry => entry.source.kind === 'lexicon-pair').length, 32);
  const exercises = synonymCollections.flatMap(collection => collection.exercises);
  assert.equal(exercises.length, 192);
  for (const entry of synonymBank.entries) {
    assert.equal(entry.options.length, 4);
    assert.equal(new Set(entry.options).size, 4);
    assert.equal(entry.options.filter(option => option === entry.synonym).length, 1);
    assert(!entry.options.includes(entry.word));
    assert([entry.word, ...entry.options].every(word => !/\s/.test(word)));
    assert.equal(entry.review.individualCefrValidated, false);
    assert(entry.source.kind === 'editorial-addition' || entry.sourceWords.length || entry.source.id);
  }
  for (const exercise of exercises) {
    assert.equal(exercise.requiresAudio, false);
    assert.equal(exercise.prompt.image, undefined);
    assert.equal(exercise.prompt.audio, undefined);
    assert.equal(exercise.options.length, 4);
    assert.equal(exercise.answer.correctOptionIds.length, 1);
    assert.equal(exercise.manualAdvance, true);
  }
  for (const collection of synonymCollections) {
    assert.equal(collection.image, undefined);
    assert.equal(collection.pack.words.length, 0);
    assert(collection.exercises.length <= 15);
    assert.deepEqual(groupExercises(collection.pack, 'synonyms'), collection.exercises);
  }
});

test('A1/A2/B1 selection is cumulative and preserves the existing category/activity/list routes', () => {
  assert(practiceChapters.find(chapter => chapter.id === 'words').activities.includes('synonyms'));
  for (const [level, expected] of [['a1', 16], ['a2', 59], ['b1', 192]]) {
    const selected = availableChapterCollections('synonyms', { level, help: 'practice' });
    assert.equal(selected.flatMap(collection => collection.exercises).length, expected);
    for (const collection of selected) {
      const location = { chapter: 'words', activity: 'synonyms', collection: collection.id, level, help: 'practice' };
      assert.deepEqual(parseChapterHash(chapterHash(location)), location);
    }
  }
  for (const level of ['alfa-a', 'alfa-b', 'alfa-c']) assert.equal(availableChapterCollections('synonyms', { level }).length, 0);
  assert.equal(availableChapterCollections('synonyms', { level: 'b1', help: 'guided' }).length, 0);
  assert.equal(parseChapterHash('#learner/chapters/words/synonyms/unknown?level=b1&help=practice').collection, undefined);
  const app = readFileSync(new URL('../components/product/learner-app.tsx', import.meta.url), 'utf8');
  assert(!app.includes("activity: 'synonyms'"), 'Word library has no duplicate synonym entrance');
});

test('wrong answers become due for repetition, survive reload and retain the exact question', () => {
  const exercise = synonymCollections[0].exercises[0], now = 1_800_000_000_000;
  const attempt = { exerciseId: exercise.exerciseId, mode: 'synonyms', answer: 'wrong', correct: false, attempts: 1, helpUsed: false, support: 'none', elapsedMs: 1000, objective: exercise.objective, assessment: 'answer', reviewEligible: true };
  const state = parseLearningReview(JSON.stringify(updateLearningReview({}, attempt, now)));
  assert.equal(state[exercise.exerciseId].due, now);
  const due = availableChapterCollections('learning-review', { level: 'a1', help: 'practice' }, state, now).flatMap(collection => collection.exercises);
  assert.equal(due.length, 1);
  assert.equal(due[0].exerciseId, exercise.exerciseId);
  assert(chapterCollections('learning-review').some(collection => collection.exercises.some(item => item.exerciseId === exercise.exerciseId)));
  const later = updateLearningReview(state, { ...attempt, correct: true, attempts: 1 }, now + 86_400_000);
  assert(later[exercise.exerciseId].due > now + 86_400_000);
});

test('all pairs reverse, mix and turn without changing sources or counting a revealed card as mastery', () => {
  const before = JSON.stringify(synonymBank), ids = new Set();
  const alternatives = new Map();
  for (const entry of synonymBank.entries) for (const [a, b] of [[entry.word, entry.synonym], [entry.synonym, entry.word]]) alternatives.set(a, new Set([...(alternatives.get(a) ?? []), b]));
  for (const collection of synonymCollections) {
    const mixed = synonymExercises(collection.pack, 'synonyms', 2);
    if (mixed.length > 1) assert.notDeepEqual(mixed, collection.exercises);
    assert.deepEqual(mixed, synonymExercises(collection.pack, 'synonyms', 2), 'A restored seed preserves the exact order');
    assert.deepEqual(new Set(mixed.map(item => item.exerciseId)), new Set(collection.exercises.map(item => item.exerciseId)));
    for (const reverse of [false, true]) for (const activity of ['synonyms', 'cards', 'hear-match']) {
      for (const exercise of synonymExercises(collection.pack, activity, 2, reverse)) {
        assert(!ids.has(exercise.exerciseId)); ids.add(exercise.exerciseId);
        const entry = synonymBank.entries.find(item => item.id === exercise.synonymPairId);
        const target = reverse ? entry.synonym : entry.word, correct = reverse ? entry.word : entry.synonym;
        assert.equal(exercise.prompt?.image, undefined);
        if (activity === 'cards') {
          assert.equal(exercise.cards[0].front.text, target);
          assert.equal(exercise.cards[0].back.text, correct);
          assert.equal(exercise.cards[0].front.image, undefined);
          assert.equal(exercise.assessment, 'participation');
          assert.equal(exercise.reviewEligible, false);
          assert.equal(exercise.requiresExplicitCompletion, true);
        } else {
          assert.equal(exercise.options.length, 4);
          assert.equal(new Set(exercise.options.map(item => item.label)).size, 4);
          assert.equal(exercise.options.find(item => exercise.answer.correctOptionIds.includes(item.id)).label, correct);
          assert(!exercise.options.some(item => item.label === target));
          assert(!exercise.options.some(item => item.label !== correct && alternatives.get(target)?.has(item.label)), 'No second known synonym among distractors, including in reverse');
          if (activity === 'hear-match') {
            assert.equal(exercise.requiresAudio, true);
            assert.equal(exercise.prompt.text, undefined);
            assert.equal(exercise.independentReading, false);
            assert(existsSync(new URL('../public' + exercise.prompt.audio.src, import.meta.url)));
          } else assert.equal(exercise.prompt.text, target);
        }
      }
    }
    const choices = chapterExerciseChoices({ chapter: 'words', activity: 'synonyms', collection: collection.id, level: collection.level, help: 'practice' });
    assert.deepEqual(new Set(choices.map(item => item.id)), new Set(['synonyms', 'cards', 'hear-match']));
    for (const choice of choices) assert.equal(choice.collection, collection.id, 'Switch mode in the same list');
    for (const activity of ['cards', 'hear-match']) {
      assert.deepEqual(new Set(chapterExerciseChoices({ chapter: 'words', activity, collection: collection.id, level: collection.level, help: 'practice' }).map(item => item.id)), new Set(['synonyms', 'cards', 'hear-match']));
    }
  }
  assert.equal(JSON.stringify(synonymBank), before);
  assert.equal(synonymCollections.flatMap(collection => synonymExercises(collection.pack, 'hear-match')).length, 192);
  assert.equal(synonymCollections.flatMap(collection => synonymExercises(collection.pack, 'hear-match', 1, true)).length, 192);
});

test('reverse and heard answers retain their exact repetition task; cards never enter the queue', () => {
  const collection = synonymCollections[0], now = 1_800_000_000_000;
  for (const activity of ['synonyms', 'hear-match', 'cards']) {
    const exercise = synonymExercises(collection.pack, activity, 1, true)[0];
    const state = updateLearningReview({}, { exerciseId: exercise.exerciseId, assessment: exercise.assessment, reviewEligible: exercise.reviewEligible, correct: false }, now);
    const parsed = parseLearningReview(JSON.stringify(state));
    const due = availableChapterCollections('learning-review', { level: 'a1', help: 'practice' }, parsed, now).flatMap(item => item.exercises);
    assert.equal(due.length, activity === 'cards' ? 0 : 1);
    if (due.length) assert.deepEqual(due[0], exercise);
  }
});

test('corrupt saved mixing preferences fall back safely', () => {
  for (const raw of [null, '{', 'null', '[]', '{"seed":0,"reverse":false}', '{"seed":1.5,"reverse":true}', '{"seed":1,"reverse":"yes"}', '{"seed":4294967296,"reverse":false}']) assert.deepEqual(parseSynonymSettings(raw), { seed: 1, reverse: false });
  assert.deepEqual(parseSynonymSettings('{"seed":92,"reverse":true}'), { seed: 92, reverse: true });
});

test('meaning audit excludes unsafe pairs, keeps every original record and corrects whole-task levels', () => {
  const review = JSON.parse(readFileSync(new URL('../docs/synonyms-review-20261031/word-review.json', import.meta.url)));
  assert.equal(review.rows.length, 210);
  assert.equal(review.rows.filter(row => row.active).length, 185);
  assert.equal(review.rows.filter(row => !row.active).length, 25);
  assert.equal(review.rows.filter(row => row.originalLevel !== row.minimumLevel).length, 35);
  for (const row of review.rows) {
    const entry = synonymBank.entries.find(entry => entry.id === row.id);
    assert(entry);
    assert.equal(entry.active, row.active);
    assert(row.sharedSense && row.reason && row.bothDirectionsReviewed && row.allFourOptionsReviewed);
    assert.equal(synonymCollections.flatMap(collection => collection.exercises).filter(item => item.exerciseId === row.id).length, row.active ? 1 : 0);
    if (!row.active) assert.deepEqual(synonymExercises({ exercises: [{ exerciseId: row.id }] }, 'synonyms'), []);
  }
  for (const word of ['gereed', 'dikwijls', 'angstig', 'vermoeid', 'geschenk', 'voltooien', 'riskant']) {
    assert(!availableChapterCollections('synonyms', { level: 'a1', help: 'practice' }).flatMap(item => item.exercises).some(item => item.options.some(option => option.label === word)));
  }
  for (const collection of synonymCollections) {
    assert.equal(new Set(collection.exercises.map(item => item.vocabularyLevels.join(','))).size, 1);
    const oldLink = { chapter: 'words', activity: 'synonyms', collection: collection.id, level: 'a1', help: 'practice' };
    assert.equal(parseChapterHash(chapterHash(oldLink)).collection, collection.id);
  }
});

test('publication rejects reactivated unsafe pairs, missing reviews and false listening claims', () => {
  assert(verifySynonymReviewRelease());
  const releaseFile = 'docs/klink-owner-release-synonym-review-20261031.json';
  const cases = [
    ['data/klink-synonyms.json', bank => { bank.entries.find(row => !row.active).active = true; }],
    ['docs/synonyms-review-20261031/word-review.json', review => { review.rows[0].allFourOptionsReviewed = false; }],
    ['docs/synonyms-review-20261031/audio-review.json', audio => { audio.rows[0].technicalPass = false; }],
    ['docs/synonyms-review-20261031/audio-review.json', audio => { audio.directListeningStatus = 'goedgekeurd'; }],
    ['docs/synonyms-review-20261031/audio-review.json', audio => { audio.rows[0].pronunciationApprovedByListening = true; }],
  ];
  for (const [file, mutate] of cases) {
    const release = JSON.parse(readFileSync(releaseFile)), altered = JSON.parse(readFileSync(file));
    mutate(altered); const bytes = Buffer.from(JSON.stringify(altered)), sha = createHash('sha256').update(bytes).digest('hex');
    if (release.files[file]) release.files[file] = sha;
    if (release.evidence[file]) release.evidence[file] = sha;
    const read = path => path === releaseFile ? Buffer.from(JSON.stringify(release)) : path === file ? bytes : readFileSync(path);
    assert.throws(() => verifySynonymReviewRelease(read), file);
  }
});
