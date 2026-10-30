import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {connectedContent,contentReadingConditions} from '../lib/connected-content.ts';
import {importedItems,importedExercise} from '../lib/imported-practice.ts';
import {importedItemIssues} from '../lib/imported-practice-contract.ts';
import {extendedExercises} from '../lib/extended-practice.ts';
import {taalroutePackages as packs} from '../lib/taalroute-packages.ts';
const load=p=>JSON.parse(readFileSync(p));
const manifest=load('docs/content-repair-20261030/source-changes.json');
const get=id=>importedItems.find(x=>x.id===id);
const source=id=>connectedContent.find(x=>x.id===id);

test('The repair changes only recorded fields; source IDs, levels, media and progress keys survive',()=>{
 for(const file of new Set(manifest.changes.map(c=>c.path[0]))){
  const current=JSON.parse(execFileSync('git',['show','05448a6c:'+file],{maxBuffer:20e6}));
  for(const c of manifest.changes.filter(c=>c.path[0]===file)){
   let obj=current;for(const key of c.path.slice(1,-1))obj=obj[key];const key=c.path.at(-1);
   assert.deepEqual(obj[key],c.after,c.path.join('/'));
   if(c.added)delete obj[key];else obj[key]=c.before;
  }
  assert.deepEqual(current,JSON.parse(execFileSync('git',['show',manifest.baseline+':'+file],{maxBuffer:20e6})),file);
 }
});
test('All 64 contextual meanings reach reading preparation even when another sense is already known',()=>{
 const changed=connectedContent.filter(x=>x.reading.meaningOverrides);assert.equal(changed.length,64);
 const counts={};
 for(const item of changed){
  const conditions=contentReadingConditions(item,{id:'test',known:item.readingWordIds});
  assert.equal(conditions.independentReading,false);
  for(const [id,meaning] of Object.entries(item.reading.meaningOverrides)){
   counts[id]=(counts[id]??0)+1;assert(item.readingWordIds.includes(id));
   assert.equal(conditions.otherWords.find(w=>w.id===id).meaning,meaning);
   assert(conditions.wordConditions.some(t=>t.includes(meaning)));
  }
 }
 assert.deepEqual(counts,{'klink-woord-meer':9,'klink-woord-haar':54,'klink-woord-want':1,'klink-woord-groente':1});
 const hair=connectedContent.filter(x=>x.readingWordIds.includes('klink-woord-haar')&&!x.reading.meaningOverrides?.['klink-woord-haar']);assert.equal(hair.length,6);
 for(const item of hair)assert.match(contentReadingConditions(item,{id:'test'}).otherWords.find(w=>w.id==='klink-woord-haar').meaning,/Haren op/);
});
test('Every imported repair is admitted and its full teacher task is passed through',()=>{
 assert.equal(importedItems.length,1393);
 for(const item of importedItems){assert.deepEqual(importedItemIssues(item),[],item.id);assert.equal(importedExercise(item).contentTask.prompt,item.prompt);}
 assert.match(get('kg-a1-f02-001').prompt,/heb, hebt, heeft of hebben/);
 assert.match(get('kg-a2-g12-001').teacherWorkflow.expected,/het brede\/een breed bureau/);
 assert.match(get('kg-a2-g26-001').prompt,/hij, zij, het en ze/);
 const bij=get('klink-wp-final-bij-functional-use');assert(!JSON.stringify(bij).includes('nectar'));assert(!JSON.stringify(bij).includes('Bij als insect'));
 assert.match(bij.teacherWorkflow.expected,/Ik sta bij de deur/);
 const spoon=get('klink-wp-final-text-a2ac929f69bfdd4f-contextual-model-fade');assert.equal(spoon.teacherWorkflow.phases[0].learnerText[0],'We hebben nog één lepel nodig.');assert.match(spoon.teacherWorkflow.phases.at(-1).instruction,/vier mensen/);assert.match(spoon.teacherWorkflow.expected,/drie lepels voor vier/);
});
test('All derived comprehension and writing tasks use the corrected source and preserve answers',()=>{
 let questions=0,writes=0;
 for(const pack of packs){
  for(const activity of ['text-question','text-evidence'])for(const exercise of extendedExercises(pack,activity))if(exercise.contextId==='klink-text-8013db18a19b2c10'){assert.equal(exercise.question,'Op welke vraag heeft Fenna nog geen antwoord?');assert(!exercise.questionAudio);questions++;}
  for(const activity of ['functional-message','functional-form'])for(const exercise of extendedExercises(pack,activity)){
   if(exercise.contextId==='klink-dialogue-575a5b9e5e8c7ecf'){assert.match(exercise.writingTask.example,/muziek staat hard/);writes++;}
   if(exercise.contextId==='klink-dialogue-ed531a759212bc2c')assert.equal(exercise.writingTask.criteria[0],'Noem voor welk huisnummer de brief bestemd is.');
   if(exercise.contextId==='klink-dialogue-7e39d6d38b6f128b')assert.equal(exercise.writingTask.criteria[1],'Je keuze is begrijpelijk.');
  }
 }
 assert(questions>0&&writes>0);
 const answer=get('klink-teksten-b14-01');assert.equal(answer.options.find(x=>x.id.endsWith('-correct')).text,answer.teacherReference.acceptedAnswers[0]);assert.match(answer.teacherReference.acceptedAnswers[0],/U meldt zich/);
});
test('Orthographic fixes retain the exact recordings, aligned dialogue guards and audio inventory',()=>{
 assert.match(source('klink-dialogue-375e6e6e06b7d86d').blocks[3].text,/hiernaast/);
 assert.equal(source('klink-sentence-f24117313d232d59').text,'Mag het licht aanblijven?');
 const register=load('public/content-register/active.json');
 for(const item of connectedContent)for(const block of item.blocks){const row=register.find(r=>r.id===block.audio.audioId);assert.equal(row.text,block.text);assert.equal(row.src,block.audio.src);}
 const files=load('docs/content-repair-20261030/audio-scope.json').files;
 for(const row of files){const path='public'+row.src;assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),createHash('sha256').update(execFileSync('git',['show',manifest.baseline+':'+path],{maxBuffer:10e6})).digest('hex'));}
});
