import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as read,writeFileSync as write} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import review from '../data/klink-long-content-levels.json' with {type:'json'};
import bank from '../data/klink-connected-content.json' with {type:'json'};
import writing from '../data/klink-functional-writing.json' with {type:'json'};
import {contentById,contentReadingConditions} from '../lib/connected-content.ts';
import {contentPackages} from '../lib/package-content.ts';
import {extendedActivities,extendedExercises} from '../lib/extended-practice.ts';
import {exerciseContentLevel,exerciseSetHelp} from '../lib/content-levels.ts';
import {chapterCollections,availableChapterCollections,parseChapterHash} from '../lib/practice-chapters.ts';
import {readBeforeLongReview} from './check-long-review.mjs';
const dir='docs/long-content-review-20261030';
const before=JSON.parse(read(dir+'/before.json'));
const by=new Map(review.items.map(r=>[r.contentId,r]));
const clips=JSON.parse(read(dir+'/audio.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
void test('All 320 texts and dialogues have exact full-text and question reviews, without reading-level inflation',()=>{
 assert.equal(review.items.length,320);assert.equal(by.size,320);
 for(const x of bank.items.filter(x=>x.kind!=='sentence')){
  const r=by.get(x.id);assert(r);assert.equal(r.text,x.text);assert.deepEqual(r.discussion,x.discussion??null);
  assert(['A1','A2'].includes(r.level));assert(r.reason.length>40);assert(r.preparation.length>30);
  const current=contentById.get(x.id);assert.equal(current.sourceLevel,r.level);assert.equal(current.independentReading,false);assert.equal(current.access,'supported-listening');
  const c=contentReadingConditions(current,{id:'review',known:[]});assert(c.wordConditions.includes(r.preparation));assert.equal(c.independentReading,false);
  if(x.discussion){assert(x.text.includes(x.discussion.evidence));assert.equal(new Set([x.discussion.answer,...x.discussion.distractors]).size,3);}
 }
 assert.deepEqual(['text','dialogue'].map(k=>['A1','A2'].map(l=>review.items.filter(r=>r.kind===k&&r.level===l).length)),[[124,68],[74,54]]);
 assert.deepEqual(review.items.filter(r=>r.status==='provisional').map(r=>r.ref),[]);
 assert.equal(writing.items.length,120);
});
void test('Every linked exercise uses the reviewed source and respects a harder writing task',()=>{
 const counts={};let checked=0;
 for(const p of contentPackages){
  for(const e of p.exercises){if(!by.has(e.contextId))continue;assert.equal(exerciseContentLevel(e),by.get(e.contextId).level.toLowerCase());checked++;}
  for(const a of extendedActivities)for(const e of extendedExercises(p,a.id)){
   if(!by.has(e.contextId))continue;const r=by.get(e.contextId),source=contentById.get(e.contextId);
   const expected=r.level==='A2'||e.writingTask?.level==='A2'?'a2':'a1';assert.equal(exerciseContentLevel(e),expected,e.exerciseId);
   assert.equal(e.sourceText,source.text);assert.deepEqual(e.sourceBlocks,source.blocks);assert.equal(e.contentTitle,source.title);
   assert.equal(e.independentReading,false);assert.equal(exerciseSetHelp([e]),'guided');
   if(e.options && a.id.endsWith('question'))assert.equal(e.options.find(o=>o.id==='0').label,source.discussion.answer);
   counts[a.id]=(counts[a.id]??0)+1;checked++;
  }
 }
 assert(checked>320);const d=review.items.find(r=>r.ref==='D016');
 assert.equal(exerciseContentLevel({contextId:d.contentId,activityLevel:'A2'}),'a2');
 assert.equal(exerciseContentLevel({contextId:d.contentId,activityLevel:'unreviewed'}),'support');
 write(dir+'/linked-checks.json',JSON.stringify({checked,counts},null,2));
});
void test('All original long-content IDs remain reachable in free listening, under the new levels',()=>{
 for(const [kind,activity]of [['text','texts'],['dialogue','dialogues']]){
  const all=chapterCollections(activity).flatMap(c=>c.exercises);
  assert.deepEqual(new Set(all.map(e=>e.contextId)),new Set(before.filter(x=>x.kind===kind).map(x=>x.id)));
  for(const source of before.filter(x=>x.kind===kind)) {
   const oldLevel=source.sourceLevel.toLowerCase().startsWith('a2')?'a2':source.sourceLevel.toLowerCase().startsWith('a1')?'a1':'support';
   const link=parseChapterHash(`#learner/chapters/${kind==='text'?'texts':'speaking'}/${activity}/${source.id}?level=${oldLevel}`);
   assert.equal(link.collection,source.id);assert.equal(link.level,by.get(source.id).level.toLowerCase());
  }
  for(const level of ['a1','a2']){
   const rows=availableChapterCollections(activity,{level,help:kind==='text'?'guided':'practice'}).flatMap(c=>c.exercises);
   assert.equal(rows.length,review.items.filter(r=>r.kind===kind&&r.level.toLowerCase()===level).length);
  }
 }
});
void test('Changing only the question invalidates its language review, instead of inheriting a stale level',async()=>{
 const source=bank.items.find(x=>x.id===review.items.find(r=>r.ref==='T121').contentId);
 const question=source.discussion.question;
 try {
  source.discussion.question+=' Nieuwe, niet beoordeelde vraag.';
  const changed=await import('../lib/connected-content.ts?long-review-stale-question');
  assert.equal(changed.contentById.get(source.id).sourceLevel,source.sourceLevel);
 }finally{source.discussion.question=question;}
});
void test('Five fresh recordings have matching source text, retained originals and verified brand metadata',()=>{
 assert.equal(clips.length,5);
 for(const c of clips){
  const source=contentById.get(c.contentId),block=source.blocks.find(b=>b.id===c.blockId);assert.equal(block.text,c.text);assert.equal(block.audio.src,c.src);
  assert.equal(sha(read('public'+c.src)),c.sha256);assert.equal(c.humanListeningReview,'open');assert(c.metadataVerified&&c.audioPacketsUnchanged);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json','public'+c.src]));
  for(const k of ['artist','album_artist','publisher'])assert.equal(probe.format.tags[k],'Taalroute');
  assert(read('public'+c.originalSrc).length>100);assert.notEqual(c.voiceId,'h6uBOiAjLKklte8hdYio');
 }
});
void test('Every data amendment is bounded and reversible; historical source guards reject extra tampering',()=>{
 const manifest=JSON.parse(read(dir+'/source-amendments.json'));
 for(const f of new Set(manifest.changes.map(c=>c.path[0])))readBeforeLongReview(f);
 assert.throws(()=>readBeforeLongReview('data/klink-connected-content.json',f=>{const b=JSON.parse(read(f));b.items[0].title='tampered';return Buffer.from(JSON.stringify(b));}));
 assert.deepEqual(JSON.parse(read('data/klink-sentence-levels.json')),JSON.parse(execFileSync('git',['show',review.baseline+':data/klink-sentence-levels.json'],{maxBuffer:1e7})));
});
