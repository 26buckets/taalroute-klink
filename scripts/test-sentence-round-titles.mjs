import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { learnerCollectionLabel } from '../lib/learner-copy.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
const review = JSON.parse(readFileSync('docs/sentence-round-titles-20261102/title-review.json'));
test('Every listening and reading sentence round has a short title from its own source content', () => {
  const rounds = chapterCollections('sentences').filter(c => c.title.startsWith('Zinnenronde'));
  assert.equal(rounds.length, 20); assert.deepEqual(review.map(r => r.id), rounds.map(r => r.id));
  for (const level of ['a1', 'a2']) {
    const titles = rounds.filter(r => r.level === level).map(r => learnerCollectionLabel(r.title, r.id).title);
    assert.equal(titles.length, 10); assert.equal(new Set(titles).size, 10);
  }
  for (const [index, source] of rounds.entries()) {
    const expected = review[index], label = learnerCollectionLabel(source.title, source.id);
    assert.equal(label.title, expected.title); assert(label.title.length <= 32 && label.title !== 'Zinnen oefenen' && label.title !== 'Werk en dagelijks leven');
    assert.equal(label.round, source.title.match(/^Zinnenronde (\d+)/)[1]);
    assert.equal(expected.sourceTitle, source.title);
    const bank = JSON.parse(readFileSync('public' + source.contentUrl));
    assert.deepEqual(expected.exerciseIds, bank.exercises.map(e => e.exerciseId));
    assert.deepEqual(expected.sourceTexts, bank.exercises.map(e => e.sourceText));
    assert.equal(expected.exerciseCount, bank.exercises.length); assert.equal(source.exerciseCount, bank.exercises.length);
  }
  assert.notEqual(learnerCollectionLabel(rounds[2].title, rounds[2].id).title, learnerCollectionLabel(rounds[12].title, rounds[12].id).title);
  assert.equal(learnerCollectionLabel('Zinnenronde 3').title, 'Zinnen oefenen');
});
