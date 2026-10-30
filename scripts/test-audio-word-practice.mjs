import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { productionIndex, validateProductionCollection } from '../lib/production-practice.ts';
import { availableChapterCollections, availableChapterActivities, chapterHash, parseChapterHash } from '../lib/practice-chapters.ts';
import { isInstructionAudioEnabled, isWithdrawnAudio } from '../lib/audio-policy.ts';

const original = productionIndex.filter(row => !row.id.startsWith('audio-words:'));
// Baseline a3826557: preserve the entire existing index without requiring Git history in a source archive.
assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'), 'bfd591ecc1350f6b58c56ca7ddf0673fc185a36772e68c5bf40914b1562d971d', 'Existing routes, titles, files and progress IDs remain unchanged');
const lists = JSON.parse(readFileSync('docs/audio-words-20261030/lists.json')).lists;
const rows = productionIndex.filter(row => row.id.startsWith('audio-words:'));
assert.equal(rows.length, 96);
const ids = new Set(), media = new Set();
for (const [level, count] of Object.entries({ 'alfa-c': 16, a1: 12, a2: 8, b1: 12 })) {
  for (const activity of ['listen', 'hear-match']) {
    const selection = { chapter: 'words', level, help: 'practice', activity };
    const available = availableChapterCollections(activity, selection).filter(row => row.id.startsWith('audio-words:'));
    assert.equal(available.length, count);
    assert(availableChapterActivities('words', selection).includes(activity));
    if (activity === 'listen') assert(availableChapterActivities('listening', selection).includes(activity));
    assert(available.every(row => row.level === level));
  }
}
for (const level of ['alfa-a', 'alfa-b', 'support']) {
  for (const activity of ['listen', 'hear-match']) assert.equal(availableChapterCollections(activity, { level, help: 'all' }).filter(row => row.id.startsWith('audio-words:')).length, 0);
}
for (const row of rows) {
  const list = lists.find(list => row.id.endsWith(list.sourceCollection.split(':').at(-1)) && list.level === row.level);
  assert(list);
  const words = new Map(list.words.map(word => [word.wordId, word]));
  const seenWords = new Set();
  const exercises = validateProductionCollection(JSON.parse(readFileSync(`public${row.url}`)), row.id, row.count);
  assert.equal(parseChapterHash(chapterHash({ chapter: 'words', activity: row.activity, level: row.level, help: 'practice', collection: row.id })).collection, row.id);
  for (const e of exercises) {
    assert(!ids.has(e.exerciseId)); ids.add(e.exerciseId);
    assert.equal(e.contentLevel, row.level); assert.deepEqual(e.vocabularyLevels, [row.level]);
    assert(isInstructionAudioEnabled(e.instructionAudio.src)); assert(!isWithdrawnAudio(e.instructionAudio.src));
    assert(!e.exampleWord && !e.helpWord && !e.displayWord, 'No answer leaked as a visible model');
    media.add(e.instructionAudio.src);
    for (const id of e.targetWordIds) { assert(words.has(id)); seenWords.add(id); }
    assert.deepEqual(new Set(e.sourceContentIds), new Set(e.targetWordIds.map(id => words.get(id).sourceId)));
    if (row.activity === 'listen') {
      assert.equal(e.mode, 'heard-word'); assert.equal(e.options.length, 4); assert(e.requiresAudio);
      assert.equal(new Set(e.options.map(option => option.label)).size, 4);
      for (const option of e.options) { assert.equal(option.label, words.get(option.id)?.word); assert(!option.image); }
      assert.deepEqual(e.answer.correctOptionIds, [e.wordId]);
      assert.equal(e.prompt.audio.src, words.get(e.wordId).audio); media.add(e.prompt.audio.src);
    } else {
      assert.equal(e.mode, 'hear-match'); assert.equal(e.audioOnlySources, true);
      assert.equal(e.sources.length, 3); assert.equal(e.targets.length, 3);
      assert.equal(new Set(e.targets.map(target => target.label)).size, 3);
      for (const source of e.sources) {
        assert(!source.label && !source.image);
        assert.equal(source.audio.src, words.get(source.id).audio); media.add(source.audio.src);
        assert.equal(e.targets.find(target => target.id === e.answer.mapping[source.id])?.label, words.get(source.id).word);
      }
    }
  }
  assert.deepEqual(seenWords, new Set(words.keys()), 'Every source word is practiced once per form');
}
for (const path of media) { assert(existsSync(`public${path}`)); assert(!isWithdrawnAudio(path)); }
assert.equal(ids.size, 768);
console.log(`PASS 96 level-bound collections, 768 answers, ${media.size} existing audio files, source and old-index preservation.`);
