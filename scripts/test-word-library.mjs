import test from 'node:test';
import assert from 'node:assert/strict';
import { allPackageWords } from '../lib/package-content.ts';
import { libraryWords, libraryCollections, defaultWordLibraryFilter as defaults } from '../lib/word-library.ts';
import index from '../data/klink-word-library-index.json' with { type: 'json' };
import { buildWordLibraryIndex } from './build-word-library-index.mjs';

await test('All 5127 existing cards keep exact identity, audio, images and meanings', () => {
  const cards = libraryWords(defaults, [], index);
  assert.equal(cards.length, 5127);
  assert.deepEqual(cards.map(w => w.id).sort(), allPackageWords.map(w => w.id).sort());
  for (const word of cards) assert.equal(word, allPackageWords.find(w => w.id === word.id));
  assert.deepEqual(libraryWords(defaults, [], null), cards, 'Cards and saved words work while the optional index loads');
});

await test('Index is reproducible from real exercises and covers every existing card', () => {
  assert.deepEqual(buildWordLibraryIndex(), index);
  assert.equal(new Set(index.collections.flatMap(row => Object.values(row.levels).flat())).size, 5127);
  assert.equal(index.unmappedTargetIds.length, 18, 'Other task IDs must not be guessed into existing word meanings');
});

await test('Search, saved cards and homonyms stay distinct', () => {
  const pak = libraryWords({...defaults, query: 'PAK ('}, [], index);
  assert.deepEqual(pak.map(w => w.id).sort(), ['klink-woord-pak', 'klink-woord-pak-verpakking']);
  const ids = [allPackageWords[0].id, allPackageWords.at(-1).id, 'older-unknown-id'];
  assert.equal(libraryWords({...defaults, source:'saved'}, ids, index).length, 2);
  assert.equal(ids.length, 3, 'Do not rewrite saved storage');
  assert.equal(libraryWords({...defaults, query:' e-MAIL '}, [], index)[0].word, 'e-mail');
  assert.deepEqual(libraryWords({...defaults, query:'geen-bestaand-woord'}, [], index), []);
});

await test('Level, component and exercise must match the SAME membership', () => {
  const fixture = { chapters:[{id:'one',activities:['x']},{id:'two',activities:['y']}], collections:[
    {id:'x/1',activity:'x',levels:{a1:[allPackageWords[0].id],b1:[allPackageWords[1].id]}},
    {id:'y/2',activity:'y',levels:{b1:[allPackageWords[0].id]}}
  ] };
  const selected = {...defaults, level:'b1', chapter:'one', collection:'x/1'};
  assert.deepEqual(libraryWords(selected, [], fixture).map(w => w.id), [allPackageWords[1].id]);
  assert.deepEqual(libraryWords({...selected,collection:'y/2'}, [], fixture), []);
  assert.deepEqual(libraryWords(selected, [], null), []);
  for (const chapter of index.chapters) assert(libraryCollections(index, {...defaults,chapter:chapter.id}).length, chapter.id);
});

await test('An exact search result precedes prefixes and partial matches without losing cards', () => {
  const matches = libraryWords({...defaults, query: ' MAT '}, [], index);
  assert.equal(matches[0].word, 'mat');
  const expected = allPackageWords.filter(word => word.word.toLocaleLowerCase('nl').includes('mat'));
  assert.deepEqual(matches.map(word => word.id).sort(), expected.map(word => word.id).sort());
  const ranks = matches.map(word => word.word === 'mat' ? 0 : word.word.startsWith('mat') ? 1 : 2);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});
