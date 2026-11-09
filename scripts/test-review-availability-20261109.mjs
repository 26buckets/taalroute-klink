import assert from 'node:assert/strict';
import { availableChapterCollections, chapterCollections } from '../lib/practice-chapters.ts';

const selection = { level: 'all' }, now = 1000;
const fixture = chapterCollections('learning-review').find(item => item.exercises.some(e => e.exerciseId.includes(':recall:')));
assert(fixture);
const exercise = fixture.exercises.find(e => e.exerciseId.includes(':recall:'));
assert.equal(availableChapterCollections('learning-review', selection, {}, now).length, 0, 'No scheduled work means no empty review cards');
const state = { [exercise.exerciseId]: { due: now, last: 1, streak: 0 } };
const due = availableChapterCollections('learning-review', selection, state, now);
assert.equal(due.length, 1, 'Only the set with scheduled work is offered');
assert.equal(due[0].id, fixture.id);
assert.deepEqual(due[0].exercises, [exercise]);
assert.equal(due[0].exerciseCount, 1, 'The card count matches scheduled work');
assert.equal(availableChapterCollections('learning-review', selection, state, now - 1).length, 0, 'Future review stays scheduled');
assert(availableChapterCollections('meet', selection, {}, now).length > 0, 'Ordinary learning stays available without a review history');
assert.equal(state[exercise.exerciseId].due, now, 'Selection does not alter stored progress');
console.log('PASS empty, due and future review; accurate card counts; ordinary learning and progress retained.');
