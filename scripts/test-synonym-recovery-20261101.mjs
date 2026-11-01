import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {synonymBank,synonymCollections,synonymExercises} from '../lib/synonyms.ts';
import {availableChapterCollections,chapterExerciseChoices,chapterHash,parseChapterHash} from '../lib/practice-chapters.ts';
import {verifySynonymRecoveryRelease} from './check-synonym-recovery-release-20261101.mjs';
const independentChanges=JSON.parse(readFileSync('docs/synonym-independent-review-20261101/changes.json'));
const priorEntries=synonymBank.entries.map(e=>{const c=independentChanges.find(c=>c.id===e.id);if(!c)return e;const old={...e};for(const k of c.changedFields){if(k in c.before)old[k]=c.before[k];else delete old[k];}return old;});
const folder='docs/synonym-recovery-20261101';
const review=JSON.parse(readFileSync(folder+'/word-review.json'));
const ids=new Set(review.recovered.map(r=>r.newId));
const baseline=JSON.parse(execFileSync('git',['show','87a3a2ba3854f2fe11e1255f29ebf5d0017d042a:data/klink-synonyms.json']));

test('seven new questions preserve the original 210 records, all IDs and all A1/A2 availability',()=>{
 assert.deepEqual(priorEntries.slice(0,210),baseline.entries);
 assert.deepEqual({...synonymBank,entries:baseline.entries},baseline);
 assert.equal(synonymBank.entries.length,225);assert.equal(synonymBank.entries.filter(e=>e.active).length,200);
 for(const [level,n]of [['a1',16],['a2',59],['b1',200]])assert.equal(availableChapterCollections('synonyms',{level,help:'practice'}).flatMap(c=>c.exercises).length,n);
 assert.equal(review.recovered.length,7);assert.equal(review.retained.length,8);
 assert.equal(new Set([...review.recovered.map(r=>r.recordingWord),...review.retained.map(r=>r.word)]).size,15);
});

test('all seven questions reverse, mix, turn and play their exact word in both directions',()=>{
 let seen=0;
 for(const collection of synonymCollections.filter(c=>c.exercises.some(e=>ids.has(e.exerciseId)))){
  const location={chapter:'words',activity:'synonyms',collection:collection.id,level:'b1',help:'practice'};
  assert.deepEqual(parseChapterHash(chapterHash(location)),location);
  assert.deepEqual(chapterExerciseChoices(location).map(x=>x.id),['synonyms','hear-match','cards']);
  for(const e of collection.exercises){assert(ids.has(e.exerciseId));seen++;}
  for(const reverse of [false,true])for(const mode of ['synonyms','cards','hear-match']){
   const exercises=synonymExercises(collection.pack,mode,2,reverse);assert.equal(exercises.length,collection.exercises.length);
   for(const e of exercises){
    const row=synonymBank.entries.find(r=>r.id===e.synonymPairId);const target=reverse?row.synonym:row.word,answer=reverse?row.word:row.synonym;
    assert.equal(row.minimumLevel,'b1');assert.deepEqual(row.levels,['b1']);for(const w of row.sourceWords)assert([row.word,row.synonym].includes(w.word),'Only relevant Lexicon meanings may be linked');
    if(mode==='cards'){assert.equal(e.cards[0].front.text,target);assert.equal(e.cards[0].back.text,answer);assert.equal(e.reviewEligible,false);}
    else{assert.equal(e.options.length,4);assert.equal(new Set(e.options.map(x=>x.label)).size,4);assert.equal(e.options.find(x=>e.answer.correctOptionIds.includes(x.id)).label,answer);assert(!e.options.some(x=>x.label===target));if(mode==='hear-match')assert(existsSync('public'+e.prompt.audio.src));else assert.equal(e.prompt.text,target);}
   }
  }
 }
 assert.equal(seen,7);
 const active=new Set(synonymBank.entries.slice(0,217).filter(e=>e.active).flatMap(e=>[e.word,e.synonym]));
 for(const r of review.retained)assert(!active.has(r.word),r.word);
});

test('all existing bindings remain and one female ElevenLabs counterpart has actual Taalroute metadata',()=>{
 const old=JSON.parse(execFileSync('git',['show','87a3a2ba3854f2fe11e1255f29ebf5d0017d042a:data/klink-synonym-audio.json']));
 const current=JSON.parse(readFileSync('data/klink-synonym-audio.json'));
 const released=JSON.parse(execFileSync('git',['show','12715486542e6aa766862a8068cd4ce65294ed28:data/klink-synonym-audio.json']));
 const audio=Object.fromEntries(Object.entries(current).filter(([key])=>key in released));
 for(const[k,v]of Object.entries(old))assert.deepEqual(audio[k],v);
 assert.deepEqual(Object.keys(audio).filter(k=>!(k in old)),['synonym-word:bestedingen']);
 const c=JSON.parse(readFileSync(folder+'/audio.json'));assert.equal(c.provider,'ElevenLabs');assert.equal(c.voiceId,'7qdUFMklKPaaAVMsBTBt');assert.equal(c.humanListeningReview,'open');assert(c.audioPacketsUnchanged);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src]));
 for(const k of ['artist','album_artist','publisher'])assert.equal(probe.format.tags[k],'Taalroute');assert.equal(probe.format.tags.title,'bestedingen');assert.equal(probe.format.tags.album,'Klink - Synoniemen');
});

test('publication permits only the approved recovery and rejects missing authorization or backup',()=>{
 assert(verifySynonymRecoveryRelease());
 for(const[file,key,value]of[
  ['docs/klink-owner-release-synonym-recovery-20261101.json','publicationApproved',false],
  [folder+'/backup.json','fullReadback',false],
  [folder+'/verification.json','previousContentPreserved',false],
 ]){
  const changed=JSON.parse(readFileSync(file));changed[key]=value;
  assert.throws(()=>verifySynonymRecoveryRelease(f=>f===file?Buffer.from(JSON.stringify(changed)):readFileSync(f)),file);
 }
});
