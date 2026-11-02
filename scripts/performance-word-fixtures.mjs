import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chapterCollections,chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
import {groupActivities} from '../lib/group-practice.ts';
import {exerciseSetHelp} from '../lib/content-levels.ts';
const cases=[];
for(const kind of ['model','mark']){
 outer:for(const activity of groupActivities)for(const row of chapterCollections(activity.id)){
  const exercises=row.contentUrl?JSON.parse(readFileSync('public'+row.contentUrl)).exercises:row.exercises;
  // Keep the established evidence fixture; new listening-first sentences intentionally lock answer choices.
  const exercise=exercises[0];if(!exercise||!(kind==='model'?exercise.mode==='model':activity.id==='text-evidence'&&exercise.standardTask?.kind==='mark'))continue;
  const chapter=practiceChapters.find(c=>c.activities.includes(activity.id));
  cases.push({exercise,route:'/'+chapterHash({chapter:chapter.id,activity:activity.id,collection:row.id,level:row.level,help:exerciseSetHelp(exercises)})});break outer;
 }
}
assert.equal(cases.length,2);
mkdirSync('outputs/goal-audit-20261101',{recursive:true});
writeFileSync('outputs/goal-audit-20261101/inventory.json',JSON.stringify({purpose:'Only the two source-bound fixtures consumed by test-word-listening-browser.mjs; not a full learning-goal inventory',cases}));
