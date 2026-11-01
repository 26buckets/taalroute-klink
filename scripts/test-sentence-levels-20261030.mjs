import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import bank from '../data/klink-connected-content.json' with { type: 'json' };
import review from '../data/klink-sentence-levels.json' with { type: 'json' };
import longReview from '../data/klink-long-content-levels.json' with { type: 'json' };
import { contentById, contentReadingConditions } from '../lib/connected-content.ts';
import { contentPackages } from '../lib/package-content.ts';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
import { exerciseContentLevel, exerciseSetLevel, exerciseSetHelp, selectExerciseSet } from '../lib/content-levels.ts';
import { chapterCollections, availableChapterCollections, parseChapterHash } from '../lib/practice-chapters.ts';
import { contextReadiness, defaultRouteSettings } from '../lib/learner-route.ts';
const sentences=bank.items.filter(x=>x.kind==='sentence');
const reviews=new Map(review.items.map(x=>[x.contentId,x]));

void test('Every one of the 1292 source sentences has an exact-text editorial decision; doubts remain explicit',()=>{
 assert.equal(sentences.length,1292);assert.equal(reviews.size,1292);assert.equal(review.items.length,1292);
 for(const source of sentences){
  const r=reviews.get(source.id);assert(r,source.id);assert.equal(r.text,source.text);assert(['A1','A2','B1'].includes(r.level));assert(r.reason.length>30);
  assert(['reviewed','provisional'].includes(r.status));if(r.status==='provisional')assert(r.alternativeLevel);
  const current=contentById.get(source.id);assert.equal(current.sourceLevel,r.level);
  for(const key of Object.keys(source).filter(k=>!['sourceLevel','wordIds'].includes(k)))assert.deepEqual(current[key],source[key],`${source.id}/${key}`);
  assert.equal(current.independentReading,false);assert.equal(current.access,'supported-listening');
  for(const block of current.blocks)assert(readFileSync('public'+block.audio.src).length>100);
 }
 assert.equal(review.items.filter(x=>x.status==='provisional').length,0);
 assert.equal(review.items.filter(x=>x.level==='A1').length,1225);
 assert.equal(review.items.filter(x=>x.level==='A2').length,67);
 for(const source of bank.items.filter(x=>x.kind!=='sentence'))assert.equal(contentById.get(source.id).sourceLevel,longReview.items.find(r=>r.contentId===source.id).level);
});

void test('All linked sentence activities and distractors use the most demanding reviewed source level',()=>{
 let checked=0;
 for(const pack of contentPackages)for(const activity of groupActivities)for(const e of groupExercises(pack,activity.id)){
  if(!reviews.has(e.contextId))continue;
  const ids=[e.contextId,...(e.sourceContentIds??[])];
  const expected=ids.some(id=>contentById.get(id)?.sourceLevel==='A2')?'a2':'a1';
  assert.equal(exerciseContentLevel(e),expected,e.exerciseId);assert.equal(e.independentReading,false);
  assert.equal(exerciseSetHelp([e]),'guided');checked++;
 }
 assert(checked>1292);const a1=review.items.find(r=>r.level==='A1').contentId; const a2=review.items.find(r=>r.level==='A2').contentId;
 const sample={contextId:a1,sourceContentIds:[a1,a2],mode:'find-sentence'};
 assert.equal(exerciseContentLevel(sample),'a2');
 assert.equal(exerciseContentLevel({...sample,sourceContentIds:[a1,'missing-source']}),'support');
});

void test('All sentence IDs remain reachable once in free listening, at their level, with support',()=>{
 const listening=chapterCollections('sentences').flatMap(c=>c.exercises);
 assert.deepEqual(new Set(listening.map(e=>e.contextId)),new Set(sentences.map(s=>s.id)));
 assert.equal(listening.length,1292);
 for(const level of ['a1','a2']){
  const rows=availableChapterCollections('sentences',{level,help:'guided'}).flatMap(c=>c.exercises);
  assert.equal(rows.length,review.items.filter(r=>r.level.toLowerCase()===level).length);
  const independent=availableChapterCollections('sentences',{level,help:'practice'});
  assert(independent.length>0);
  assert(independent.every(c=>c.contentUrl&&c.exerciseCount>0&&c.help==='practice'));
  assert(!independent.flatMap(c=>c.exercises).some(e=>listening.some(old=>old.exerciseId===e.exerciseId)));
 }
 assert.equal(availableChapterCollections('sentences',{level:'b1',help:'guided'}).length,0);
});

void test('Word-to-sentence chains keep every model, source ID and order at the full chain level',()=>{
 for(const pack of contentPackages){
  const original=groupExercises(pack,'word-sentence');if(!original.length)continue;
  const collection=chapterCollections('word-sentence').find(c=>c.id===pack.id);assert(collection);
  assert.deepEqual(collection.exercises,original);const level=exerciseSetLevel(original);assert(['a1','a2'].includes(level));
  assert.deepEqual(selectExerciseSet(original,{level,help:'guided'}),original);
  assert.deepEqual(selectExerciseSet(original,{level:level==='a1'?'a2':'a1',help:'guided'}),[]);
  const old=parseChapterHash(`#learner/chapters/sentences/word-sentence/${pack.id}?level=support`);
  assert.equal(old.collection,pack.id);assert.equal(old.level,level);
 }
 const old=parseChapterHash('#learner/chapters/sentences/sentences/groep-1.support?level=support');
 assert.equal(old.activity,'sentences');assert.equal(old.level,'all');assert.equal(old.help,'guided');
});

void test('Assigning a language level does not waive unprepared vocabulary or word meanings',()=>{
 let checked=0;
 for(const pack of contentPackages)for(const row of pack.texts??[]){
  const source=contentById.get(row.id);if(source?.kind!=='sentence')continue;
  const conditions=contentReadingConditions(source,{id:pack.id,known:pack.words.map(x=>x.id)});
  const readiness=contextReadiness(source.id,pack,undefined,{...defaultRouteSettings,language:source.sourceLevel.toLowerCase()});
  assert.equal(readiness.status,conditions.otherWords.length||conditions.outsideWordBank.length||conditions.unitsOutsideStep.length?'later':'guided');checked++;
 }
 assert(checked>1292);
});
