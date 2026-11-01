import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { exerciseSetLevel, exerciseSetHelp } from '../lib/content-levels.ts';
import { learningActivities, learningRules } from '../lib/learning-paths.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { contentById } from '../lib/connected-content.ts';
import {
  parseLearningReview,
  updateLearningReview,
} from '../lib/learning-review.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
const words = new Map(curriculum.words.map((word) => [word.id, word]));

test('Every new rule is reachable; intact short paths retain source references and honest scope', () => {
  const before = JSON.stringify(packs),
    usedRules = new Set();
  for (const activity of learningActivities) {
    // This legacy contract checks the original rule paths; deferred source banks have their own production-content contract.
    const collections = chapterCollections(activity.id).filter(collection => !collection.contentUrl);
    assert(collections.length > 0, activity.id);
    for (const collection of collections) {
      const steps = collection.exercises;
      assert(
        steps.length <= 15,
        'Keep each route short; do not turn the entire word group into one long lesson',
      );
      assert.equal(collection.level, exerciseSetLevel(steps));
      assert.equal(exerciseSetHelp(steps), activity.id === 'grammar-path' ? 'practice' : 'guided');
      assert.equal(steps[0].learningStage, 'example');
      assert.equal(steps.at(-1).learningStage, 'recall');
      assert.equal(
        new Set(steps.map((item) => item.exerciseId)).size,
        steps.length,
      );
      for (const item of steps) {
        assert.equal(item.independentReading, false);
        assert.equal(item.sourceStatus, 'concept');
        assert(item.sourceExerciseId);
        if (item.ruleId) usedRules.add(item.ruleId);
        if (item.contextId) assert(contentById.has(item.contextId));
        if (item.requiresAudio) assert(item.prompt?.audio?.src);
        assert(
          !item.instructionAudio,
          'Withdrawn instruction audio must stay off',
        );
        for (const id of item.prerequisiteWordIds ?? []) assert(words.has(id));
        for (const src of JSON.stringify(item).matchAll(
          /"src":"(\/package-audio\/[^"]+)"/g,
        ))
          assert(existsSync(`public${src[1]}`));
        if (item.learningStage === 'example')
          assert.equal(item.assessment, 'participation');
      }
    }
  }
  assert.deepEqual(
    [...usedRules].sort((a, b) => a.localeCompare(b)),
    learningRules.map((rule) => rule.id).sort((a, b) => a.localeCompare(b)),
  );
  assert.equal(JSON.stringify(packs), before);
});

test('Sound positions use transparent words and no isolated rejected sound; no visible target leak', () => {
  const rules = new Map(learningRules.map((rule) => [rule.id, rule]));
  let count = 0;
  for (const pack of packs)
    for (const item of groupExercises(pack, 'sound-path')) {
      if (item.mode !== 'learning-choice') continue;
      count++;
      const word = words.get(item.wordId),
        rule = rules.get(item.ruleId);
      assert.equal(word.reading.units.length, 3);
      assert(word.reading.units.every((unit) => !unit.value));
      assert.equal(
        item.answer.correctOptionIds[0],
        word.reading.units[rule.position].text,
      );
      assert.equal(item.options.length, 2);
      assert(
        !item.text &&
          !item.displayWord &&
          !item.exampleWord &&
          !item.sourceBlocks,
      );
      assert.equal(
        item.prompt.audio.src,
        pack.words.find((word) => word.id === item.wordId).audio,
      );
      assert(!/klank-t/.test(item.prompt.audio.src));
    }
  assert(count >= 12);
});

test('Spelling gaps rebuild exactly the canonical form; longer forms keep their prerequisites', () => {
  let count = 0;
  for (const pack of packs)
    for (const item of groupExercises(pack, 'spelling-path')) {
      if (item.mode !== 'learning-choice') continue;
      count++;
      assert.equal(
        item.maskedWord.replace('…', item.answer.correctOptionIds[0]),
        words.get(item.wordId).word,
      );
      assert.equal(
        item.options.filter((option) =>
          item.answer.correctOptionIds.includes(option.id),
        ).length,
        1,
      );
      if (['spelling-open', 'spelling-double'].includes(item.ruleId)) {
        assert(item.prerequisiteWordIds.length);
        assert(
          item.readingConditions.some(
            (condition) => condition.wordId === item.prerequisiteWordIds[0],
          ),
        );
      }
    }
  assert(count >= 12);
});

test('Grammar sources, dialogue turns, writing goals and text evidence are reused rather than rewritten', () => {
  for (const collection of chapterCollections('grammar-path'))
    for (const item of collection.exercises) {
      if (item.mode === 'learning-choice') {
        const text = contentById.get(item.contextId).text;
        assert.equal(
          item.question.replace('…', item.answer.correctOptionIds[0]),
          text,
        );
        assert(
          !item.prompt &&
            !item.textBlocks &&
            !item.sourceBlocks &&
            !item.sourceText,
        );
        assert.equal(item.helpWord, text);
      }
    }
  assert.equal(chapterCollections('reading-path').length, 156);
  assert.equal(chapterCollections('practical-path').length, 120);
  for (const id of ['reading-path', 'practical-path'])
    for (const collection of chapterCollections(id)) {
      assert.equal(
        new Set(collection.exercises.map((item) => item.contextId)).size,
        1,
      );
      if (id === 'practical-path') {
        assert(
          collection.exercises.some((item) => item.mode === 'dialogue-role'),
        );
        assert(
          collection.exercises.some(
            (item) => item.mode === 'functional-message',
          ),
        );
      }
    }
});

test('Review plans only encountered retrieval items, resets on help/error, and never inflates in one session', () => {
  const day = 86400000,
    now = 1900000000000;
  const attempt = {
    exerciseId: 'groep-1:sound-path:sound-first-1:recall:9',
    reviewEligible: true,
    assessment: 'answer',
    correct: true,
    attempts: 1,
    helpUsed: false,
    support: 'none',
  };
  assert.deepEqual(
    updateLearningReview({}, { ...attempt, reviewEligible: false }, now),
    {},
  );
  assert.deepEqual(
    updateLearningReview({}, { ...attempt, assessment: 'participation' }, now),
    {},
  );
  let state = updateLearningReview({}, attempt, now);
  assert.equal(state[attempt.exerciseId].due, now + day);
  assert.deepEqual(updateLearningReview(state, attempt, now + 1000), state);
  state = updateLearningReview(state, attempt, now + day);
  assert.equal(state[attempt.exerciseId].due, now + 4 * day);
  state = updateLearningReview(state, attempt, now + 4 * day);
  assert.equal(state[attempt.exerciseId].due, now + 11 * day);
  for (const change of [
    { correct: false },
    { helpUsed: true },
    { attempts: 2 },
  ]) {
    const reset = updateLearningReview(
      state,
      { ...attempt, ...change },
      now + 5 * day,
    );
    assert.equal(reset[attempt.exerciseId].streak, 0);
    assert.equal(reset[attempt.exerciseId].due, now + 5 * day);
  }
  assert.deepEqual(parseLearningReview('{broken'), {});
  assert.deepEqual(
    parseLearningReview(
      '{"invalid:recall:1":{"due":-2,"last":1,"streak":100}}',
    ),
    {},
  );
  assert.deepEqual(parseLearningReview(JSON.stringify(state)), state);
});

test('Current release points to the cumulative instruction; historical approval retains its original published hashes', () => {
  const release = JSON.parse(
    readFileSync('data/klink-learning-paths-release.json'),
  );
  assert.equal(release.publicationApproved, true);
  assert.equal(release.ownerAuthorization, 'docs/klink-owner-release-cumulative-20261018.json');
  const current = JSON.parse(readFileSync(release.ownerAuthorization));
  assert.equal(current.userRequest, JSON.parse(readFileSync('docs/klink-cumulative-release-20261018/owner-instruction.json')).userRequest);
  assert.equal(current.files['lib/learning-paths.ts'], createHash('sha256').update(execFileSync('git', ['show', 'c6e1165d:lib/learning-paths.ts'])).digest('hex'));
  const approval = JSON.parse(readFileSync('docs/klink-owner-release-round3-20261018.json'));
  const published = JSON.parse(readFileSync('docs/klink-publication-didactic-round3-20261018.json'));
  assert.equal(approval.approvedBy, 'Nico');
  assert.equal(approval.userRequest, 'Ja, na de geslaagde eindcontrole publiceren');
  for (const [file, hash] of Object.entries(approval.files))
    assert.equal(createHash('sha256').update(execFileSync('git', ['show', `${published.sourceCommit}:${file}`])).digest('hex'), hash, file);
  assert.equal(release.humanReview, 'open');
  assert.equal(release.studentPilot, 'not-performed');
});
