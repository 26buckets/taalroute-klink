import assert from 'node:assert/strict';
import { chapterHash, parseChapterHash } from '../lib/practice-chapters.ts';
import { alfaCChapters, legacyAlfaCHash } from '../lib/alfa-c-navigation.ts';
for (const chapter of alfaCChapters) for (const help of ['practice', 'guided']) {
  const category = { chapter: chapter.id, sequence: false, level: 'alfa-c', help };
  assert.deepEqual(parseChapterHash(chapterHash(category)), { ...category, collection: undefined });
  for (const block of chapter.blocks) {
    const location = { ...category, sequence: true, collection: block.id };
    assert.deepEqual(parseChapterHash(chapterHash(location)), location);
    assert.equal(legacyAlfaCHash(`#learner/alfa-c/${block.id}?help=${help}`), chapterHash(location));
  }
  assert.equal(legacyAlfaCHash(`#learner/alfa-c/${chapter.legacy}?help=${help}`), chapterHash(category));
  assert.equal(parseChapterHash(chapterHash({ ...category, sequence: true, collection: 'unknown' })).collection, undefined);
  assert.equal(parseChapterHash(chapterHash({ ...category, sequence: true, level: 'a2', collection: chapter.blocks[0].id })).collection, undefined);
}
assert.equal(parseChapterHash('#learner/chapters/%XX').chapter, undefined);
assert.equal(legacyAlfaCHash('#learner/alfa-c?help=invalid'), '#learner/chapters?level=alfa-c&help=practice');
console.log('PASS shared category/sequence/list routes, valid block membership, legacy links, level/help validation.');
