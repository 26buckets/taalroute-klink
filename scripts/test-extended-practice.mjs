import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { extendedActivities, extendedExercises, extendedInstructionNeeds } from '../lib/extended-practice.ts';
import { resolveRegisteredAudio } from '../lib/audio-register.ts';
import { contentById } from '../lib/connected-content.ts';
import writing from '../data/klink-functional-writing.json' with { type: 'json' };
const all = activity => packs.flatMap(pack => extendedExercises(pack, activity));
test('Every new activity has stable scoped source references, preparation and honest release status', () => {
  for (const pack of packs) for (const activity of extendedActivities) {
    const items = extendedExercises(pack, activity.id);
    assert.deepEqual(items, extendedExercises(pack, activity.id));
    assert.equal(new Set(items.map(item => item.exerciseId)).size, items.length);
    for (const item of items) {
      assert.equal(item.independentReading, false); assert.equal(item.sourceStatus, 'concept');
      assert.equal(item.combinationReview, 'open'); assert(item.readingConditions);
      assert(item.targetWordIds.every(id => pack.words.some(word => word.id === id)));
      if (item.contextId) { assert(contentById.has(item.contextId)); assert(pack.lessons.some(step => step.id === item.lessonId)); }
      for (const match of JSON.stringify(item).matchAll(/"src":"(\/package-audio\/[^"]+)"/g)) assert(existsSync(`public${match[1]}`));
    }
  }
});
test('All source questions retained with exact answer and source evidence, no random distractors', () => {
  assert.equal(new Set(all('text-question').map(item => item.contextId)).size, 180);
  assert.equal(new Set(all('dialogue-question').map(item => item.contextId)).size, 120);
  for (const item of [...all('text-question'), ...all('dialogue-question')]) {
    const source = contentById.get(item.contextId);
    assert(source.text.includes(item.evidence));
    assert.equal(item.question, source.discussion.question);
    assert.equal(item.options.find(option => option.id === item.answer.correctOptionIds[0]).label, source.discussion.answer);
    assert.equal(new Set(item.options.map(option => option.label)).size, item.options.length);
  }
  for (const item of all('text-evidence')) {
    assert.equal(item.options.filter(option => option.label === item.evidence).length, 1);
    assert.equal(item.options.find(option => item.answer.correctOptionIds.includes(option.id)).label, item.evidence);
    assert(item.options.every(option => contentById.get(item.contextId).text.includes(option.label)));
  }
});
test('Klankvergelijking uses actual wholeword recordings, balanced equal/different trials and no answer leaks', () => {
  const items = all('sound-compare'); assert(items.length > 8);
  assert.equal(items.filter(item => item.answer.correctOptionIds[0] === 'same').length, items.length / 2);
  for (const item of items) {
    assert.equal(item.textBlocks.length, 2); assert.equal(item.playAllBlocks, true); assert.equal(item.requiresAudio, true);
    assert(item.textBlocks.every(block => block.audio.src && !block.text));
    assert(!item.exampleWord && !item.displayWord && !item.sourceText);
    assert(item.textBlocks.every(block => !/klank-t|\/t\//.test(block.audio.src)));
    assert.equal(item.textBlocks[0].audio.src === item.textBlocks[1].audio.src, item.answer.correctOptionIds[0] === 'same');
  }
});
test('Sentence construction preserves exact word boundaries; grammar targets only the stated ik-form', () => {
  for (const item of all('sentence-build')) {
    const sentence = item.answer.targetTileIds.map(id => item.tiles.find(tile => tile.id === id).token).join(' ');
    assert.equal(sentence, contentById.get(item.contextId).text); assert.equal(item.requiresAudio, true);
    assert.equal(item.buildKind, 'sentence');
  }
  assert(new Set(all('verb-choice').map(item => item.contextId)).size >= 8);
  for (const item of all('verb-choice')) {
    assert(item.question.startsWith('Ik … ')); assert(!item.sourceText); assert.deepEqual(item.sourceBlocks, []);
    assert.equal(item.sourceModel, contentById.get(item.contextId).text);
    assert(item.options.every(option => !option.label.includes(' ')));
    assert.equal(item.options.filter(option => item.answer.correctOptionIds.includes(option.id)).length, 1);
  }
});
test('Writing and role work use source tasks and participation, never fabricated mastery', () => {
  assert.equal(writing.items.length, 120);
  for (const mode of ['functional-message', 'functional-form', 'dialogue-role']) for (const item of all(mode)) {
    assert.equal(item.assessment, 'participation'); assert.equal(item.requiresExplicitCompletion, true);
    if (mode === 'dialogue-role') {
      const blocks = contentById.get(item.contextId).blocks;
      const index = blocks.findIndex(block => block.id === item.roleModel.id);
      assert.equal(item.cue.id, blocks[index - 1].id); assert.equal(item.prompt.audio.src, item.cue.audio.src);
    } else {
      assert.deepEqual(item.writingTask, writing.items.find(task => task.contentId === item.contextId));
      assert(item.writingTask.criteria.length >= 2);
    }
  }
});
test('Sixteen branded instructions are connected by owner authorization, without inventing a listening review', () => {
  const candidates = JSON.parse(readFileSync('data/klink-audio-candidates.json')).items;
  assert.equal(candidates.length, 16);
  assert.equal(new Set(candidates.map(item => item.id)).size, 16);
  assert.equal(candidates.filter(item => item.id.startsWith('extra-')).length, 7);
  for (const need of extendedInstructionNeeds) {
    const item = candidates.find(candidate => candidate.id === need.id);
    assert.equal(item.text, need.text);
    assert.equal(item.role, 'instruction');
    assert.equal(resolveRegisteredAudio(need.id, need.text, 'instruction'), item.src);
    const record = JSON.parse(readFileSync(item.recordPath));
    assert.equal(record.text, need.text); assert.equal(record.sha256, item.sha256);
    assert.equal(record.published, false);
  }
  for (const item of candidates) { assert.equal(item.humanReview, 'open'); assert.equal(item.voiceId, 'h6uBOiAjLKklte8hdYio'); assert(item.metadataApproved); assert(existsSync(`public${item.src}`)); }
  const bindings = JSON.parse(readFileSync('data/klink-audio-bindings.json'));
  for (const item of candidates) {
    assert.equal(resolveRegisteredAudio(item.id, item.text, item.role), item.src);
    assert.equal(bindings[item.id].approvalBasis, 'owner-use-authorization');
    assert.equal(bindings[item.id].humanListeningReview, 'not-performed-or-confirmed');
  }
});
