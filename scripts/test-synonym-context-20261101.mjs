import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {synonymBank,synonymCollections,synonymExercises} from '../lib/synonyms.ts';
import {availableChapterCollections,chapterExerciseChoices} from '../lib/practice-chapters.ts';
import {parseLearningReview,updateLearningReview} from '../lib/learning-review.ts';
import {verifySynonymContextRelease} from './check-synonym-context-release-20261101.mjs';
const base='9b4e0937dcad82e14e25ebc97e8a4b08b244042f';
const before=JSON.parse(execFileSync('git',['show',base+':data/klink-synonyms.json']));
const independentChanges=JSON.parse(readFileSync('docs/synonym-independent-review-20261101/changes.json'));
const priorEntries=synonymBank.entries.map(e=>{const c=independentChanges.find(c=>c.id===e.id);if(!c)return e;const old={...e};for(const k of c.changedFields){if(k in c.before)old[k]=c.before[k];else delete old[k];}return old;});
const folder='docs/synonym-context-20261101';
const rows=JSON.parse(readFileSync(folder+'/word-review.json')).rows;
const pack=synonymCollections.find(c=>c.id==='synonyms-b1-context-20261101').pack;

test('eight distinct B1 context tasks preserve all 217 earlier records and A1/A2 availability',()=>{
 assert.deepEqual(priorEntries.slice(0,217),before.entries);assert.deepEqual({...synonymBank,entries:before.entries},before);
 assert.equal(synonymBank.entries.length,225);assert.equal(rows.length,8);assert.equal(new Set(rows.map(r=>r.word)).size,8);
 for(const[level,n]of [['a1',16],['a2',59],['b1',200]])assert.equal(availableChapterCollections('synonyms',{level,help:'practice'}).flatMap(c=>c.exercises).length,n);
 for(const row of rows){
  const entry=synonymBank.entries.find(e=>e.id===row.id);assert(entry.active);assert.equal(entry.minimumLevel,'b1');assert.deepEqual(entry.levels,['b1']);
  assert.equal(entry.context,row.context);assert.equal(entry.reverseContext,row.reverseContext);assert(entry.context.includes(entry.word)&&entry.reverseContext.includes(entry.synonym));
  assert(entry.context.split(' ').length<=12&&entry.reverseContext.split(' ').length<=12);assert(row.allFourOptionsReviewed&&row.bothDirectionsReviewed);
  assert(before.entries.some(e=>e.id===row.archivedId&&!e.active));assert.equal(entry.review.individualCefrValidated,false);
 }
});

test('all eight support reverse, mix, turn and listen without leaking the heard word',()=>{
 for(const reverse of [false,true])for(const mode of ['synonyms','cards','hear-match'])for(const seed of [1,2]){
  const exercises=synonymExercises(pack,mode,seed,reverse);assert.equal(exercises.length,8);
  assert.deepEqual(exercises,synonymExercises(pack,mode,seed,reverse));
  for(const e of exercises){
   const r=rows.find(r=>r.id===e.synonymPairId),word=reverse?r.synonym:r.word,answer=reverse?r.word:r.synonym,context=reverse?r.reverseContext:r.context;
   assert(!e.prompt?.image);assert.equal(e.synonymContext,mode==='hear-match'?context.replace(word,'…'):context);
   if(mode==='cards'){assert.equal(e.cards[0].front.text,word);assert.equal(e.cards[0].back.text,answer);assert.equal(e.reviewEligible,false);}
   else{assert.equal(e.options.length,4);assert.equal(new Set(e.options.map(o=>o.label)).size,4);assert.equal(e.options.find(o=>e.answer.correctOptionIds.includes(o.id)).label,answer);assert(!e.options.some(o=>o.label===word));
    if(mode==='hear-match'){assert(!e.synonymContext.includes(word));assert(existsSync('public'+e.prompt.audio.src));assert(!e.prompt.text);}else assert.equal(e.prompt.text,word);
   }
  }
 }
 assert.deepEqual(chapterExerciseChoices({chapter:'words',activity:'synonyms',collection:pack.id,level:'b1',help:'practice'}).map(x=>x.id),['synonyms','hear-match','cards']);
});

test('context errors survive reload in the same repeat task and direction; turning cards is not mastery',()=>{
 const now=1_800_000_000_000;
 for(const reverse of [false,true])for(const mode of ['synonyms','hear-match','cards']){
  const e=synonymExercises(pack,mode,1,reverse)[0];const state=parseLearningReview(JSON.stringify(updateLearningReview({},{exerciseId:e.exerciseId,assessment:e.assessment,reviewEligible:e.reviewEligible,correct:false},now)));
  const due=availableChapterCollections('learning-review',{level:'b1',help:'practice'},state,now).flatMap(c=>c.exercises);
  assert.equal(due.length,mode==='cards'?0:1);if(due.length)assert.deepEqual(due[0],e);
 }
});

test('all existing media and bindings stay unchanged; three exact ElevenLabs phrases have lossless Taalroute metadata',()=>{
 const old=JSON.parse(execFileSync('git',['show',base+':data/klink-synonym-audio.json'])),bindings=JSON.parse(readFileSync('data/klink-synonym-audio.json'));
 for(const[k,v]of Object.entries(old))assert.deepEqual(bindings[k],v);
 const clips=JSON.parse(readFileSync(folder+'/audio.json')),plan=JSON.parse(readFileSync(folder+'/voice-plan.json'));
 assert.equal(clips.length,3);assert.deepEqual(Object.keys(bindings).filter(k=>!(k in old)),clips.map(c=>'synonym-word:'+c.text));
 assert.deepEqual(clips.map(c=>c.voiceId),['0qLmDzgqulxcvv0yf3kg','7qdUFMklKPaaAVMsBTBt','0qLmDzgqulxcvv0yf3kg']);
 for(const c of clips){assert.equal(c.provider,'ElevenLabs');assert.equal(c.text,plan.newRecordings.find(p=>p.id===c.id).text);assert.notEqual(c.voiceId,plan.instructionVoiceId);assert(c.audioPacketsUnchanged&&c.metadataVerified);assert.equal(c.humanListeningReview,'open');
  assert.equal(createHash('sha256').update(readFileSync('public'+c.src)).digest('hex'),c.sha256);
  const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src])).format.tags;
  for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');assert.equal(tags.title,c.text);assert.equal(tags.album,'Klink - Synoniemen');assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(tags)));
 }
 const used=new Set(synonymBank.entries.filter(e=>e.active).flatMap(e=>[e.word,e.synonym]));
 for(const c of JSON.parse(readFileSync('docs/synonyms-20261030/audio.json'))){assert(used.has(c.word));assert.equal(createHash('sha256').update(readFileSync('public'+c.src)).digest('hex'),c.sha256);}
});

test('publication requires exact context scope, explicit layout approval and verified recovery backup',()=>{
 assert(verifySynonymContextRelease());
 for(const[file,key,value]of [['docs/klink-owner-release-synonym-context-20261101.json','appearanceChangeApproved',false],[folder+'/backup.json','fullReadback',false],[folder+'/verification.json','noScrollMobile',false]]){
  const x=JSON.parse(readFileSync(file));x[key]=value;assert.throws(()=>verifySynonymContextRelease(f=>f===file?Buffer.from(JSON.stringify(x)):readFileSync(f)),file);
 }
 assert.throws(()=>verifySynonymContextRelease(f=>f==='lib/synonyms.ts'?Buffer.from(readFileSync(f).toString()+'\n// unapproved'):readFileSync(f)));
});
