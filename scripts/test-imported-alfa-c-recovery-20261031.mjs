import { functionalAudio } from '../lib/alfa-c-audio.ts';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync as read} from 'node:fs';
import {displayedChapterCollections,chapterCollections,selectedChapterCollection,chapterHash,parseChapterHash,chapterExerciseCount}from'../lib/practice-chapters.ts';
import {readingSupportForExercise}from'../lib/production-practice.ts';
import {collectionProgressId,mergeRoundProgress}from'../lib/round-progress.ts';
import {functionalBlocks} from '../lib/alfa-c-functioneel.ts';
import {teacherTasks}from'../lib/alfa-c-docent.ts';
const support=JSON.parse(read('data/klink-b1-reading-support.json'));
const selection={chapter:'repeat',activity:'read-series',level:'b1',help:'guided'};
void test('B1 partitions retain every original task once, exact old links and shared completion',()=>{
 const all=displayedChapterCollections('read-series',selection);let n=0;
 for(const [id,data]of Object.entries(support.collections)){
  const old=selectedChapterCollection({...selection,collection:id});assert(old&&!old.readingSelection);
  const parts=all.filter(c=>c.readingSelection?.sourceId===id);assert.equal(parts.length,2);
  assert.deepEqual(parts.flatMap(c=>c.readingSelection.exerciseIds).sort((a,b)=>a.localeCompare(b)),[...data.allExerciseIds].sort((a,b)=>a.localeCompare(b)));
  const raw=JSON.parse(read('public'+old.contentUrl)).exercises;
  for(const c of parts){
   const parsed=parseChapterHash(chapterHash({...selection,collection:c.id}));assert.equal(parsed.collection,c.id);assert.equal(selectedChapterCollection(parsed).id,c.id);
   assert.equal(collectionProgressId('read-series',c.readingSelection.sourceId,c.contentUrl),collectionProgressId('read-series',id,old.contentUrl));
   for(const eid of c.readingSelection.exerciseIds){const e=raw.find(e=>e.exerciseId===eid);assert(e);assert.equal(Boolean(readingSupportForExercise(e)) || e.textBlocks?.[0]?.text==='godverdomme',c.id.endsWith('~extension'));}
  }
  const prior=JSON.stringify({version:1,total:raw.length,done:[raw[0].exerciseId]});const next=mergeRoundProgress(prior,data.allExerciseIds,data.supportIds);
  assert(next.done.includes(raw[0].exerciseId));assert(data.supportIds.every(id=>next.done.includes(id)));n+=data.supportIds.length;
 }
 assert.equal(n,110);assert.equal(Object.keys(support.words).length,44);
 const plain=chapterCollections('read-series').filter(c=>c.level==='b1');assert.equal(all.reduce((n,c)=>n+(c.readingSelection?.exerciseIds.length??c.exerciseCount),0),plain.reduce((n,c)=>n+c.exerciseCount,0));
 for(const level of ['alfa-a','alfa-b','alfa-c','a1','a2'])assert(displayedChapterCollections('read-series',{...selection,level}).every(c=>!c.readingSelection));
 assert(chapterExerciseCount('repeat',selection)>0);
});
void test('Five exact replacement recordings cover source, instruction and example; source IDs and models stay meaningful',()=>{
 const clips=JSON.parse(read('docs/imported-alfa-c-release-20261031/audio.json'));assert.equal(clips.length,5);
 for(const c of clips){assert.equal(functionalAudio(c.role,c.text),c.src);assert.equal(c.voiceId==='h6uBOiAjLKklte8hdYio',c.role==='guide');}
 const steps=functionalBlocks.flatMap(b=>b.steps);
 for(const id of ['werk-09','werk-10','werk-11']){const s=steps.find(s=>s.id.endsWith(id));assert(s.presentation[0].text.includes('Leg het papier in de map.'));assert(!s.presentation[0].text.includes('boek'));}
 const s=steps.find(s=>s.id.endsWith('verbinden-09'));assert(s.exampleVisible.includes('Ik doe het papier in de map.'));assert(s.presentation[0].text.includes('fles'));
 const t=teacherTasks.find(t=>t.id==='kg-ga-c-02-001');assert(t.preparation.some(x=>x.includes('vooraf')));assert(t.teacherNote.includes('geen zelfstandige niveautoets'));assert.equal(t.stages.length,13);assert.deepEqual(t.stages.slice(3,6).map(x=>x.model),['wil en pakken','kan en pakken','gaan en lezen']);
});
