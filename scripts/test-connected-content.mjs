import test from 'node:test';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { connectedContent, contentForStep, contentReadingConditions } from '../lib/connected-content.ts';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import originalBank from '../data/klink-connected-content.json' with { type: 'json' };
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
const wordIds = new Set(curriculum.words.map(word => word.id));
const connected = packs.flatMap(pack => pack.exercises.filter(exercise => exercise.mode.startsWith('connected-')));

void test('All original recorded content is deduplicated, word-linked and reachable in existing players', () => {
  assert.equal(connectedContent.length, 1612);
  assert.deepEqual(['sentence', 'text', 'dialogue'].map(kind => connectedContent.filter(item => item.kind === kind).length), [1292, 192, 128]);
  assert.equal(new Set(connectedContent.map(item => item.id)).size, connectedContent.length);
  assert.equal(new Set(connected.map(item => item.contextId)).size, connectedContent.length);
  for (const pack of packs) assert.equal(new Set(pack.texts.map(item => item.text)).size, pack.texts.length, 'The existing models must not create duplicate library entries');
  for (const item of connectedContent) {
    assert(item.wordIds.length, item.id);
    for (const id of [...item.wordIds, ...item.readingWordIds]) assert(wordIds.has(id), id);
    assert.equal(item.text, item.blocks.map(block => block.text).join(' '));
    for (const block of item.blocks) assert(existsSync(`public${block.audio.src}`), block.id);
    if (item.kind === 'dialogue') { assert.equal(item.blocks.length, 4); assert(item.blocks.every(block => block.speaker)); }
    const libraries = packs.flatMap(pack => [...pack.texts, ...pack.dialogues]).filter(record => record.id === item.id);
    assert(libraries.length, `${item.id} has no visible library entry`);
    for (const record of libraries) assert(record.exerciseId && record.lessonIds.length);
  }
});
void test('New listening content never inflates a word lesson or asserts independent reading/mastery', () => {
  assert.equal(packs.flatMap(pack => pack.lessons).length, 302);
  for (const pack of packs) for (const lesson of pack.lessons) {
    const guided = exercisesForLesson(pack, lesson);
    assert(guided.length <= 16);
    assert(!guided.some(item => item.mode.startsWith('connected-')));
    const expected = contentForStep(lesson);
    assert.deepEqual(pack.exercises.filter(item => item.lessonId === lesson.id && item.mode.startsWith('connected-')).map(item => item.contextId), expected.map(item => item.id));
    for (const item of expected) {
      const conditions = contentReadingConditions(item, lesson);
      assert.equal(conditions.independentReading, false);
      assert.equal(conditions.access, 'supported-listening');
      assert.deepEqual(conditions.outsideWordBank, item.reading.outsideWordBank);
      assert.equal(item.reading.syntaxCheck, 'teacher-guided');
      assert.equal(item.humanReview, originalBank.items.find(source => source.id === item.id).humanReview);
    }
  }
  for (const exercise of connected) {
    assert.equal(exercise.assessment, 'participation'); assert.equal(exercise.independentReading, false);
    assert.equal(exercise.requiresAudio, true); assert.equal(exercise.playAllBlocks, true);
    assert(exercise.instructionAudio.src.startsWith('/package-audio/instructions/'));
    assert(exercise.wordIds.includes(exercise.wordId));
    assert(!exercise.options && !exercise.answer, 'No invented comprehension test');
  }
});
void test('Suit, jug and molar are not attached to verb-only occurrences; no public source references', () => {
  const pan = connectedContent.find(item => item.text === 'De pan is vies. Ik pak de pan. Ik maak de pan schoon.');
  assert(pan && !pan.wordIds.includes('klink-woord-pak') && !pan.wordIds.includes('klink-woord-pak-verpakking'));
  assert(connectedContent.some(item => item.wordIds.includes('klink-woord-pak')));
  assert(!/drive\.google|docs\.google|diglin|CP0\d\d|ALFALABS|SERIES-AUD/i.test(JSON.stringify(connectedContent)));
  assert.equal(new Set(originalBank.items.flatMap(item => item.blocks.map(block => block.audio.src))).size, 1979);
  assert.equal(new Set(connectedContent.filter(item => item.kind === 'dialogue').flatMap(item => item.blocks.map(block => block.audio.src))).size, 512);
});
void test('The published source reference preserves every text, speaker, question and recording pointer', () => {
  // The optional 17 October ledger predates approved source corrections; compare the actual integrated release.
  const published=JSON.parse(execFileSync('git',['show','f7fb187b7901b824234d83478313dcafff7d69a4:data/klink-connected-content.json'],{maxBuffer:128e6}));
  assert.equal(published.items.length,1612);
  assert.deepEqual(originalBank,published);
  for(const item of published.items)for(const block of item.blocks)assert(existsSync('public'+block.audio.src),block.id);
});
