import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {execFileSync as gitExec} from 'node:child_process';
import {productionIndex,validateProductionCollection} from '../lib/production-practice.ts';
import {chapterHash,parseChapterHash,availableChapterCollections} from '../lib/practice-chapters.ts';
const source=JSON.parse(read('docs/leesrondes-a1-a2-20261031/source.json'));
const prior=JSON.parse(gitExec('git',['show','bd246ef9ded72364acb0a4c6d60a9137d1446698:data/klink-production-index.json']));
assert.deepEqual(productionIndex.slice(0,-2),prior,'Every existing collection, URL, level and count stays exact');
const added=productionIndex.slice(-2),ids=new Set();
assert.deepEqual(added.map(r=>r.level),['a1','a2']);
for(const row of added){
 assert.equal(row.help,'practice');assert.equal(row.count,12);
 const exercises=validateProductionCollection(JSON.parse(read('public'+row.url)),row.id,row.count);
 const selected=availableChapterCollections('text-question',{level:row.level,help:'practice'});
 assert(selected.some(c=>c.id===row.id));
 assert(!availableChapterCollections('text-question',{level:row.level,help:'guided'}).some(c=>c.id===row.id));
 const hash=chapterHash({chapter:'texts',activity:'text-question',collection:row.id,level:row.level,help:'practice'});
 assert.equal(parseChapterHash(hash).collection,row.id);
 const texts=source.texts.filter(t=>t.level.toLowerCase()===row.level);
 assert.equal(texts.length,3);
 for(const [index,e]of exercises.entries()){
  assert(!ids.has(e.exerciseId));ids.add(e.exerciseId);
  const text=texts[Math.floor(index/4)],question=text.questions[index%4];
  assert.equal(e.sourceBlocks[0].text,text.text);assert.equal(e.question,question.prompt);
  assert.deepEqual(e.options.map(o=>o.label),question.options);
  assert.deepEqual(e.answer.correctOptionIds,[question.answer]);
  assert.equal(e.correctFeedback,question.correctFeedback);assert.equal(e.feedback,question.retryFeedback);
  assert.equal(e.sourceEvidence,question.evidence);assert(text.text.includes(e.sourceEvidence));
  assert.equal(e.manualAdvance,true);assert.equal(e.requiresAudio,false);assert.equal(e.reviewEligible,false);
  assert(!/"(?:audio|instructionAudio|questionAudio|feedbackAudio|src)"\s*:/.test(JSON.stringify(e)),'No unsupported audio or hidden fallback');
 }
}
assert.equal(ids.size,24);
console.log('PASS both levels: 24 reviewed answers, exact passages and feedback, self-practice routes, stable IDs, absent unverified audio; all prior collections preserved');
