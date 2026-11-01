import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { teacherPracticePlan } from '../lib/teacher-practice-plan.ts';
import { learningActivities, learningRules } from '../lib/learning-paths.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { learningAreas } from '../lib/learning-areas.ts';

void test('Editorial coverage separates published sequences from remaining curriculum work', () => {
  for (const id of ['reading', 'sounds', 'daily-life', 'spelling', 'grammar']) {
    const area = learningAreas.find(area => area.id === id);
    assert(!/wachten op vrijgave|vrijgave.*blijven open/i.test(area.remaining));
    assert(/gepubliceerd|publicatie/i.test(area.remaining));
    assert(/ontbreken|open/i.test(area.remaining));
  }
});

void test('All 302 teaching plans retain canonical words and small lesson identity', () => {
  let count = 0;
  for (const pack of packs) for (const lesson of pack.lessons) {
    const plan = teacherPracticePlan(pack, lesson);
    assert(plan.wordIds.length > 0);
    assert(plan.focusIds.length > 0);
    assert(plan.focusIds.every(id => [...(lesson.newWords ?? []), ...(lesson.returning ?? []), ...pack.words.filter(word => lesson.words.includes(word.word)).map(word => word.id)].includes(id)));
    assert.deepEqual(plan.guidedExerciseIds, lesson.guidedExerciseIds ?? []);
    assert.equal(pack.lessons[plan.lessonNumber - 1].id, lesson.id);
    assert.equal(plan.blocks.reduce((sum, block) => sum + block.minutes, 0), 15);
    assert(plan.blocks.every(block => block.action && block.observe && block.framework));
    count++;
  }
  assert.equal(count, 302);
  const first = teacherPracticePlan(packs[0], packs[0].lessons[0]);
  assert.equal(first.focus, 'mat');
  assert.equal(first.wordIds.length, 1);
});

void test('Recall varies answer positions without changing choices, answers or retry stability', () => {
  let checked = 0, changed = 0;
  for (const activity of learningActivities) for (const collection of chapterCollections(activity.id)) {
    for (const item of collection.exercises.filter(item => item.learningStage === 'recall' && item.options)) {
      const prior = collection.exercises.find(source => source.learningStage !== 'recall' && source.options && source.mode === item.mode && source.sourceExerciseId === item.sourceExerciseId);
      assert(prior, item.exerciseId);
      const ids = value => value.options.map(option => option.id);
      assert.deepEqual(ids(item).toSorted(), ids(prior).toSorted());
      assert.deepEqual(item.answer, prior.answer);
      const again = chapterCollections(activity.id).find(other => other.id === collection.id).exercises.find(other => other.exerciseId === item.exerciseId);
      assert.deepEqual(again.options, item.options);
      if (JSON.stringify(ids(item)) !== JSON.stringify(ids(prior))) changed++;
      checked++;
    }
  }
  assert(checked > 100);
  assert(changed > checked / 4, `${changed} varied out of ${checked}`);
});

void test('Sound models underline the target unit only in models; grammar feedback matches available help', () => {
  let models = 0, grammar = 0;
  for (const collection of chapterCollections('sound-path')) for (const item of collection.exercises) {
    if (item.mode === 'learning-example') {
      const rule = learningRules.find(rule => rule.id === item.ruleId);
      assert.equal(item.modelFocus, rule.position);
      assert.equal(item.modelUnits.length, 3);
      assert.equal(item.modelUnits.join(' · '), item.displayWord);
      models++;
    } else assert.equal(item.modelUnits, undefined);
  }
  for (const collection of chapterCollections('grammar-path')) for (const item of collection.exercises) {
    if (item.mode !== 'learning-choice') continue;
    assert(!/luister/i.test(item.feedback));
    assert(/voorbeeld/i.test(item.feedback));
    assert(item.helpWord);
    grammar++;
  }
  assert(models > 10 && grammar > 10);
});
