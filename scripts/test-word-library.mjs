import test from 'node:test';
import assert from 'node:assert/strict';
import { allPackageWords, lessonPackages } from '../lib/package-content.ts';
import { libraryWords, wordLengths } from '../lib/word-library.ts';

test('The fifteen lesson packages and extra words together preserve every word ID', () => {
  const lessons = libraryWords('lessons', 'all', []);
  const extra = libraryWords('extra', 'all', []);
  assert.equal(lessonPackages.length, 15);
  assert.equal(lessons.length, 338);
  assert.equal(extra.length, 4789);
  assert.deepEqual([...lessons, ...extra].map(w => w.id).sort(), allPackageWords.map(w => w.id).sort());
  for (const pack of lessonPackages) assert.deepEqual(libraryWords('lessons', pack.id, []), lessons.filter(w => w.packageId === pack.id));
});

test('Length filters cover all extra words once, including former examples and punctuation', () => {
  const groups = wordLengths.map(filter => libraryWords('extra', filter.id, []));
  assert.deepEqual(groups.map(words => words.length), [529, 1154, 2047, 881, 178]);
  assert.deepEqual(groups.flat().map(w => w.id).sort(), libraryWords('extra', 'all', []).map(w => w.id).sort());
  for (const words of groups) assert.deepEqual(words.map(w => w.word), words.map(w => w.word).sort((a, b) => a.localeCompare(b, 'nl')));
  assert(libraryWords('extra', '2-4', []).some(w => w.word === "zo'n"));
  assert(libraryWords('extra', '5-6', []).some(w => w.word === 'e-mail'));
  assert.equal(libraryWords('extra', 'signs', []).length, 8);
  assert.equal(libraryWords('extra', 'unknown', []).length, 0);
});

test('Saved words keep their exact cards, media and meanings across both sources', () => {
  const ids = [allPackageWords[0].id, allPackageWords.at(-1).id];
  assert.deepEqual(libraryWords('saved', '2-4', ids), allPackageWords.filter(w => ids.includes(w.id)));
  assert.deepEqual(libraryWords('saved', 'all', []), []);
});
