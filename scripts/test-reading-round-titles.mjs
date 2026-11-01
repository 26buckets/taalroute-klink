import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { learnerCollectionLabel } from '../lib/learner-copy.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
const review = JSON.parse(readFileSync('docs/reading-round-titles-20261101/title-review.json'));
test('Every reading round has its own short source-bound topic title and separate round number', () => {
  const rounds = chapterCollections('text-question').filter(c => c.title.startsWith('Leesronde'));
  assert.equal(rounds.length, 68);
  assert.deepEqual(review.map(r => r.id), rounds.map(r => r.id));
  for (const level of ['a1', 'a2']) {
    const titles = rounds.filter(r => r.level === level).map(r => learnerCollectionLabel(r.title).title);
    assert.equal(titles.length, 34);
    assert.equal(new Set(titles).size, titles.length);
  }
  for (const [index, source] of rounds.entries()) {
    const expected = review[index], label = learnerCollectionLabel(source.title);
    assert.equal(label.title, expected.title);
    assert(label.title.length <= 32 && label.title !== 'Korte teksten');
    assert.equal(label.round, source.title.match(/^Leesronde (\d+)/)[1]);
    assert.equal(expected.sourceTitle, source.title);
    const bank = JSON.parse(readFileSync('public' + source.contentUrl));
    assert.deepEqual(expected.sourceContentTitles, [...new Set(bank.exercises.map(e => e.contentTitle))]);
    assert.equal(expected.exerciseCount, bank.exercises.length);
    assert.equal(source.exerciseCount, bank.exercises.length);
  }
});
