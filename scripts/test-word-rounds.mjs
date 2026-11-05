import { readProductionBank } from './read-production-bank.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wordRoundDefinitions, chapterWordRounds, wordRoundActivities } from '../lib/word-rounds.ts';
import { availableChapterCollections, displayedChapterCollections, chapterHash, parseChapterHash, chapterExerciseChoices } from '../lib/practice-chapters.ts';
import { productionIndex } from '../lib/production-practice.ts';
import { recordRoundSteps, roundProgressCount, roundProgressPrefix, collectionProgressId } from '../lib/round-progress.ts';

const index = JSON.parse(readFileSync('data/klink-word-round-index.json'));
const expected = {};
for (const row of productionIndex.filter(item => wordRoundActivities.has(item.activity))) {
  const exercises = readProductionBank(row).exercises;
  const rounds = wordRoundDefinitions(exercises);
  if (rounds.length) expected[row.url] = rounds;
}
assert.deepEqual(index, expected, 'Deferred titles, pictures and IDs match the actual published files');
let sources = 0, rounds = 0, words = 0;
for (const level of ['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1']) for (const help of ['practice', 'guided']) {
  const selection = { chapter: 'words', activity: 'meet', level, help };
  const original = availableChapterCollections('meet', selection);
  const displayed = displayedChapterCollections('meet', selection);
  assert.equal(new Set(displayed.map(item => item.id)).size, displayed.length);
  for (const source of original) {
    const before = JSON.stringify(source);
    const children = chapterWordRounds(source);
    assert.equal(JSON.stringify(source), before, 'Original content is never mutated');
    const old = parseChapterHash(chapterHash({ ...selection, collection: source.id }));
    assert.equal(old.collection, source.id, 'Old links retain the full original collection');
    if (!children[0].wordRound) { assert.deepEqual(children, [source]); continue; }
    const sourceExercises = source.contentUrl ? JSON.parse(readFileSync('public' + source.contentUrl)).exercises : source.exercises;
    assert.deepEqual(children.flatMap(child => child.wordRound.exerciseIds), sourceExercises.map(item => item.exerciseId), 'Every original task remains exactly once, in its original order');
    const lengths = children.map(child => child.wordRound.exerciseIds.length);
    assert(Math.max(...lengths) <= 8 && Math.min(...lengths) >= 1);
    assert(Math.max(...lengths) - Math.min(...lengths) <= 1, 'Balanced rounds avoid a large round followed by one leftover word');
    for (const child of children) {
      const location = { ...selection, collection: child.id };
      assert.equal(parseChapterHash(chapterHash(location)).collection, child.id);
      assert(chapterExerciseChoices(location).some(item => item.id === 'meet'));
      const first = sourceExercises.find(item => item.exerciseId === child.wordRound.exerciseIds[0]);
      assert(child.title.startsWith(first.text.primary));
      assert.equal(child.image, first.prompt?.image?.placeholderWord ? undefined : first.prompt?.image?.src);
    }
    sources++; rounds += children.length; words += sourceExercises.length;
  }
}
const memory = new Map(); globalThis.window = new EventTarget(); globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const source = availableChapterCollections('meet', { level: 'alfa-a', help: 'practice' }).find(item => item.exercises.length === 68);
const children = chapterWordRounds(source), ids = source.exercises.map(item => item.exerciseId), key = collectionProgressId('meet', source.id);
const prior = JSON.stringify({ version: 1, total: ids.length, done: [ids[0], ids.at(-1)] }); memory.set(roundProgressPrefix + key, prior);
assert.equal(roundProgressCount(key, ids.length, children[0].wordRound.exerciseIds), 1);
assert.equal(roundProgressCount(key, ids.length, children.at(-1).wordRound.exerciseIds), 1);
assert.equal(memory.get(roundProgressPrefix + key), prior, 'Displaying smaller rounds never rewrites progress');
recordRoundSteps(key, ids, [children[1].wordRound.exerciseIds[0]]);
assert.equal(roundProgressCount(key, ids.length), 3, 'Practising one child retains completion from all other rounds');
assert.equal(roundProgressCount(key, ids.length, children.at(-1).wordRound.exerciseIds), 1);
const small = displayedChapterCollections('meet', { level: 'alfa-a', help: 'practice' }).find(item => item.id === 'route-delen.alfa-a');
assert.equal(small.title, 'sap'); assert.equal(small.wordRound.exerciseIds.length, 1);
console.log(`PASS word rounds: ${sources} source collections, ${rounds} rounds, ${words} unchanged word tasks; matching titles/images, all levels, old/new links and shared progress`);
