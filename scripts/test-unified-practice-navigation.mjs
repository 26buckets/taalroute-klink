import assert from 'node:assert/strict';
import { chapterHash, parseChapterHash, practiceChapters, availableChapterSequences, availableChapterTeacherGroups, chapterExerciseCount, availableChapterCollections } from '../lib/practice-chapters.ts';
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

assert.deepEqual(practiceChapters.map(c => c.id), ['words','sounds','sentences','texts','listening','speaking','writing','spelling','grammar','practical','repeat','support']);
for (const level of ['alfa-a','alfa-b','alfa-c','a1','a2','b1']) for (const help of ['practice','guided']) {
  let sequenceCount = 0, teacherCount = 0;
  for (const chapter of practiceChapters) {
    const selection = {level,help};
    const sequences = availableChapterSequences(chapter.id, selection);
    const teachers = availableChapterTeacherGroups(chapter.id, selection);
    sequenceCount += sequences.length; teacherCount += teachers.length;
    const ordinary = chapter.activities.reduce((total,a) => total + availableChapterCollections(a,selection).reduce((n,c)=>n+(c.exerciseCount??c.exercises.length),0),0);
    assert(chapterExerciseCount(chapter.id, selection) >= ordinary);
    if (level !== 'alfa-c') assert.equal(chapterExerciseCount(chapter.id, selection), ordinary);
  }
  assert.equal(sequenceCount, level === 'alfa-c' ? 3 : 0);
  assert.equal(teacherCount, level === 'alfa-c' && help === 'guided' ? 5 : 0);
}
assert.deepEqual(alfaCChapters.map(c=>[c.parent,c.blocks.length]), [['sentences',3],['writing',6],['texts',6]]);
console.log('PASS exactly twelve shared categories, all 15 sequence blocks and five guided groups placed once; no level expansion.');
