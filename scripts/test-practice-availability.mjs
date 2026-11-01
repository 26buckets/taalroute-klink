import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterLevels, chapterCollections, availableChapterCollections, availableChapterActivities, matchesChapterSelection, practiceChapters, chapterHash, parseChapterHash } from '../lib/practice-chapters.ts';

test('Every available entrance has matching tasks; unavailable combinations remain empty without lowering level', () => {
  let checked = 0;
  for (const chapter of practiceChapters) for (const {id:level} of chapterLevels) for (const help of ['practice','guided']) {
    const selection={level,help};
    const available=availableChapterActivities(chapter.id,selection);
    for (const activity of chapter.activities) {
      const expected=chapterCollections(activity).filter(item=>(activity!=='learning-review'||item.sourceRepeat)&&matchesChapterSelection(item,selection)&&(item.exerciseCount||item.exercises.length));
      const actual=availableChapterCollections(activity,selection);
      assert.deepEqual(actual,expected);
      assert.equal(available.includes(activity),actual.length>0);
      for(const item of actual) {
        const route={chapter:chapter.id,activity,collection:item.id,...selection};
        assert.equal(parseChapterHash(chapterHash(route)).collection,item.id);
      }
      checked++;
    }
    assert.deepEqual(selection,{level,help});
  }
  const independent=availableChapterCollections('meet',{level:'alfa-c',help:'practice'});
  assert(independent.length>0);
  assert(independent.every(c=>c.level==='alfa-c'&&c.help==='practice'&&c.exerciseCount>0));
  assert(availableChapterActivities('words',{level:'alfa-c',help:'practice'}).includes('same-word'));
  assert(availableChapterActivities('words',{level:'alfa-c',help:'guided'}).length);
  console.log('Availability combinations:',checked);
});

test('Review entrance requires due saved work and never changes it',()=>{
  const collection=chapterCollections('learning-review')[0];
  const id=collection.exercises[0].exerciseId;
  const review={[id]:{due:100,last:50,streak:1}};
  assert.equal(availableChapterCollections('learning-review',{level:'all'},review,99).filter(c=>!c.sourceRepeat).length,0);
  assert.equal(availableChapterCollections('learning-review',{level:'all'},review,100).filter(c=>!c.sourceRepeat).flatMap(x=>x.exercises).length,1);
  assert.deepEqual(review,{[id]:{due:100,last:50,streak:1}});
});
