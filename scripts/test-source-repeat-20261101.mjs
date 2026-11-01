import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceRepeatRounds, sourceRepeatBanks, sourceRepeatExercises} from '../lib/source-repeat.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {availableChapterCollections, chapterHash, parseChapterHash} from '../lib/practice-chapters.ts';
import {learningGoalFor} from '../lib/learning-goals.ts';
const folder='docs/repeat-rounds-20261101/';
const source=JSON.parse(readFileSync(folder+'sources/position-references.json'));
const native=JSON.parse(readFileSync(folder+'sources/native-document.json'));
const banks=new Map();
for(const round of sourceRepeatRounds)for(const bank of sourceRepeatBanks(round))if(!banks.has(bank.id))banks.set(bank.id,validateProductionCollection(JSON.parse(readFileSync('public'+bank.url)),bank.id,bank.count));

test('All 576 stable positions resolve to unchanged canonical source content and media',()=>{
 assert.equal(source.revisionId,native.revisionId);assert.equal(sourceRepeatRounds.length,48);assert.equal(banks.size,121);
 const original=JSON.stringify([...banks]);const positionIds=[],sourceIds=[];const levels={};
 for(const [i,round] of sourceRepeatRounds.entries()){
  assert.equal(round.id,source.rounds[i].roundId);levels[round.level]=(levels[round.level]||0)+1;
  const projected=sourceRepeatExercises(round,banks);assert.equal(projected.length,12);
  for(const [j,e] of projected.entries()){
   const position=round.positions[j],raw=source.rounds[i].positions[j];
   assert.deepEqual(Object.keys(position).sort(),['bankId','id','sourceId']);
   assert.equal(position.id,raw.positionId);assert.equal(position.sourceId,raw.sourceExerciseId);
   const originalExercise=banks.get(position.bankId).find(x=>x.exerciseId===position.sourceId);
   const {repeatSourceId,exerciseId,...content}=e;assert.equal(exerciseId,position.id);assert.equal(repeatSourceId,position.sourceId);
   const {exerciseId:originalId,...originalContent}=originalExercise;assert.deepEqual(content,originalContent);
   assert(learningGoalFor(e)?.learnerText);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);
   positionIds.push(exerciseId);sourceIds.push(originalId);
   if(e.options)e.options[0].label='test mutation';
  }
 }
 assert.equal(new Set(positionIds).size,576);assert.equal(new Set(sourceIds).size,576);assert.equal(JSON.stringify([...banks]),original,'Projected sessions cannot mutate the source cache');
 assert.deepEqual(levels,{'alfa-c':16,a1:12,a2:8,b1:12});
 for(const f of source.sourceFiles)assert.equal(createHash('sha256').update(readFileSync(f.path)).digest('hex'),f.sha256,f.path);
});

test('Repeat rounds remain available independently of original completion or review deadlines',()=>{
 const originalReview=Object.fromEntries(sourceRepeatRounds.flatMap(r=>r.positions.map(p=>[p.sourceId,{due:Date.now()+86400000,last:Date.now(),correct:10}])));
 for(const round of sourceRepeatRounds){
  const selection={chapter:'repeat',activity:'learning-review',collection:round.id,level:round.level,help:'practice'};
  assert.equal(parseChapterHash(chapterHash(selection)).collection,round.id);
  for(const review of[{},originalReview]){
   const collection=availableChapterCollections('learning-review',selection,review).find(c=>c.id===round.id);
   assert(collection);assert.equal(collection.exerciseCount,12);assert.deepEqual(collection.exercises,[]);assert.equal(collection.contentUrl,undefined);
   assert.equal(collection.sourceRepeat.id,round.id);
  }
 }
 assert(!availableChapterCollections('learning-review',{level:'all',help:'guided'}).some(c=>c.sourceRepeat));
});

test('Broken source references and ambiguous position lists fail closed',()=>{
 const r=sourceRepeatRounds[0];
 const edit=change=>{const copy=structuredClone(r);change(copy);return copy;};
 for(const broken of[edit(x=>x.positions.pop()),edit(x=>x.positions[1].id=x.positions[0].id),edit(x=>x.positions[1].sourceId=x.positions[0].sourceId),edit(x=>x.positions[0].bankId='unknown'),edit(x=>x.positions[0].sourceId='missing')])assert.throws(()=>sourceRepeatExercises(broken,banks));
 assert.throws(()=>sourceRepeatExercises(r,new Map()));
});
