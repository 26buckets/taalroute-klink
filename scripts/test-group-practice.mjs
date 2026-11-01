import {localGrammarExercises} from '../lib/local-grammar-lessons.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { groupActivities, groupExercises, groupInstructionNeeds, restoreGroupSession } from '../lib/group-practice.ts';
import { learningAreas } from '../lib/learning-areas.ts';
import { contentById } from '../lib/connected-content.ts';
import { importedItems, importedExercise, importedMatchesPack } from '../lib/imported-practice.ts';
import groupRelease from '../data/klink-group-practice-release.json' with { type: 'json' };
import { exerciseHelp } from '../lib/lesson-plan.ts';
test('Matching help describes the actual source and target controls', () => {
  for (const mode of ['match', 'hear-match']) {
    const exercises = packs.flatMap(pack => groupExercises(pack, mode));
    assert(exercises.length > 0);
    for (const exercise of exercises) {
      assert.equal(exercise.componentId, 'ALF-CMP-004');
      assert.equal(exerciseHelp(exercise), mode === 'hear-match' ? 'Tik op Luister. Kies daarna het woord.' : 'Kies een woord. Kies daarna de foto.');
      assert(exercise.targets.every(target => mode === 'hear-match' ? target.label && !target.image : target.image));
    }
  }
});

test('Whole word groups feed the exercise library, without changing the curriculum', () => {
  for (const pack of packs) {
    const before = JSON.stringify(pack);
    const all = new Set(pack.words.map(word => word.id));
    for (const activity of groupActivities) {
      const exercises = groupExercises(pack, activity.id);
      assert.equal(new Set(exercises.map(e => e.exerciseId)).size, exercises.length, `${pack.id}/${activity.id}: unique IDs`);
      assert.deepEqual(groupExercises(pack, activity.id), exercises, 'Stable order for retry and resume');
      for (const item of exercises) {
        if (item.localGrammar === true) {
          assert.deepEqual(item, localGrammarExercises.find(row=>row.exerciseId===item.exerciseId));
          assert.equal(item.packId,pack.id);assert.equal(item.localOnly,true);
        } else if (item.componentId === 'KLINK-CONTENT') {
          const source = importedItems.find(source => `content:${source.id}` === item.exerciseId);
          assert(source && importedMatchesPack(source, pack), 'Imported content must be admitted and linked to this list');
          assert.deepEqual(item, importedExercise(source), 'The reviewed task must remain unchanged');
          assert.equal(item.sourceStatus, 'reviewed-concept');
          assert.equal(item.reviewEligible, false);
        } else {
          assert.equal(item.sourceStatus, 'concept');
          assert.equal(item.combinationReview, 'open');
          assert((item.targetWordIds ?? []).every(id => all.has(id)), `${item.exerciseId}: foreign target word`);
        }
        if (item.requiresAudio) assert(item.prompt?.audio?.src, `${item.exerciseId}: missing stimulus`);
        for (const src of JSON.stringify(item).matchAll(/"src":"(\/package-audio\/[^"]+)"/g)) assert(existsSync(`public${src[1]}`), src[1]);
      }
    }
    assert.equal(JSON.stringify(pack), before);
  }
});

test('Every first-group word is a target in all basic word activities', () => {
  const pack = packs[0], expected = pack.words.map(w => w.id).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  for (const mode of ['meet','listen','hear-word','read','match','hear-match','build-model','build','worksheet','worksheet-heard','missing','copy','dictation','write','paper-dictation','read-series','speak','word-bingo','image-bingo','memory']) {
    assert.deepEqual([...new Set(groupExercises(pack, mode).flatMap(e => e.targetWordIds))].sort((a, b) => a < b ? -1 : a > b ? 1 : 0), expected, mode);
  }
  assert.deepEqual(pack.words.map(w => w.word).sort((a, b) => a < b ? -1 : a > b ? 1 : 0), ['mat','tas','map','man','pan','jas'].sort((a, b) => a < b ? -1 : a > b ? 1 : 0));
});

test('Bingo has per-word turns, stable boards, no answer model, and audio gating', () => {
  for (const pack of packs) for (const mode of ['word-bingo', 'hear-match']) {
    assert.deepEqual([...new Set(groupExercises(pack, mode).flatMap(item => item.targetWordIds))].sort((a, b) => a < b ? -1 : a > b ? 1 : 0), pack.words.filter(word => word.audio).map(word => word.id).sort((a, b) => a < b ? -1 : a > b ? 1 : 0), `${pack.id}/${mode}: words without an exercise photo must not disappear`);
  }
  for (const pack of packs) for (const mode of ['word-bingo', 'image-bingo']) {
    const records = groupExercises(pack, mode), boards = Map.groupBy(records, e => e.boardId);
    for (const turns of boards.values()) {
      assert.equal(turns.length, turns[0].cells.length);
      turns.forEach((turn, index) => {
        assert.deepEqual(turn.cells, turns[0].cells);
        assert.equal(turn.markedCellIds.length, index);
        assert(!turn.markedCellIds.includes(turn.answer.correctCellId));
        assert(turn.cells.some(cell => cell.cellId === turn.answer.correctCellId));
        assert.equal(turn.exampleWord, undefined); assert.equal(turn.displayWord, undefined);
        assert.equal(turn.requiresAudio, true);
      });
    }
  }
});

test('Sentence recognition reuses real near-contrast sentences and retains reading conditions', () => {
  let count = 0;
  for (const pack of packs) for (const exercise of groupExercises(pack, 'find-sentence')) {
    count++;
    assert.equal(exercise.access, 'supported-listening'); assert.equal(exercise.independentReading, false);
    assert.equal(exercise.assessment, 'answer'); assert.equal(exercise.options.length, exercise.readingConditions.length);
    assert(exercise.options.length >= 2 && exercise.options.length <= 3);
    const target = contentById.get(exercise.contextId), tokens = target.text.toLowerCase().split(/\s+/);
    for (const option of exercise.options) {
      assert.equal(contentById.get(option.id).text, option.label);
      const parts = option.label.toLowerCase().split(/\s+/);
      assert.equal(parts.length, tokens.length);
      assert.equal(parts.filter((part, i) => part !== tokens[i]).length, option.id === target.id ? 0 : 1);
    }
  }
  assert(count > 0);
});

test('Connected instructions do not change participation into proven skill or unpark the short t', () => {
  for (const mode of ['speak','sentence-speak','write','write-letter','paper-dictation','read-series','texts','dialogues']) {
    assert(groupExercises(packs[0], mode).every(e => e.assessment === 'participation'));
  }
  assert(groupInstructionNeeds.every(need => need.id && need.text && need.activities.length));
  for (const mode of ['word-bingo','image-bingo','find-sentence','sentence-dictation','sentence-speak','hear-match','paper-dictation','read-series']) {
    assert(groupExercises(packs[0], mode).every(e => e.instructionNeedId && e.instructionAudio?.audioId === e.instructionNeedId && e.instructionAudio.src));
  }
  assert.equal(learningAreas.length, 14);
  assert(learningAreas.find(a => a.id === 'grammar').activities.includes('verb-choice'));
  assert(learningAreas.find(a => a.id === 'start').remaining.includes('t blijft'));
  assert(groupExercises(packs[0], 'write-letter').every(item => !item.prompt?.audio && item.letterModelOnly), 'Written t is not the rejected spoken sound');
  assert.equal(groupRelease.publicationApproved, true);
  assert.equal(groupRelease.ownerAuthorization, 'docs/klink-owner-release-cumulative-20261018.json');
  assert.equal(groupRelease.instructionAudioUsage, 'withdrawn-by-owner');
  assert.equal(groupRelease.instructionAudioReview, 'open');
  assert.equal(groupRelease.existingMediaChanged, false);
});

test('Group progress rejects unknown IDs and never uses lesson-progress keys', () => {
  const records = groupExercises(packs[0], 'build');
  const raw = JSON.stringify({ version: 1, exerciseId: records[1].exerciseId, done: false });
  assert.equal(restoreGroupSession(raw, records).exerciseId, records[1].exerciseId);
  assert.deepEqual(restoreGroupSession(raw, groupExercises(packs[1], 'build')), { done: false });
  for (const bad of ['{','null','[]','{"version":2}']) assert.deepEqual(restoreGroupSession(bad, records), { done: false });
});
