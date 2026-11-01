import test from 'node:test';
import {chapterCollections} from '../lib/practice-chapters.ts';
import {groupActivities} from '../lib/group-practice.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {roundProgressCount,recordRoundSteps,roundProgressPrefix} from '../lib/round-progress.ts';
import {groupSessionKey,restoreGroupSession} from '../lib/group-practice.ts';
import {exactCopyAnswer} from '../lib/copy-answer.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {verifyWritingBanksRelease} from './check-writing-banks-release-20261101.mjs';
const json=f=>JSON.parse(readFileSync(f)),folder='docs/writing-banks-20261101/';
test('the current source register contains 44 versioned documents and 880 unique source records',()=>{
 const register=json(folder+'source-register.json'),records=readFileSync(folder+'source-records.jsonl','utf8').trim().split('\n').map(JSON.parse);
 assert.equal(register.documents.length,44);assert.equal(records.length,880);assert.equal(new Set(records.map(r=>r.id)).size,880);assert(records.every(r=>r.revisionId&&r.recordSha256&&r.url));
});
test('all 4 new identities use their actual visible source model',()=>{
 const batch=json(folder+'batch-01.json');let seen=0;
 for(const row of batch.rows){const bank=json('public'+row.url);validateProductionCollection(bank,row.id,row.count);for(const e of bank.exercises.filter(e=>batch.newUniqueSourceIds.includes(e.exerciseId))){assert(exactCopyAnswer(e.exampleWord,e.fields[0].acceptedAnswers[0]));assert(!exactCopyAnswer(e.exampleWord,e.exampleWord+'x'));seen++;}}
 assert.equal(seen,4);
});
test('new Alfa A models are unique across visible typing activities and every reused model has a real canonical reference',()=>{
 const batch=json(folder+'batch-01.json'),newIds=new Set(batch.newUniqueSourceIds),existing=new Map();
 for(const activity of groupActivities)for(const row of chapterCollections(activity.id))for(const e of row.contentUrl?json('public'+row.contentUrl).exercises:row.exercises){
  const model=e.componentId==='ALF-CMP-006'?e.exampleWord:e.componentId==='ALF-CMP-012'&&!e.hideWritingModel?e.target:null;
  if(typeof model==='string'&&!newIds.has(e.exerciseId))existing.set(e.exerciseId,model.trim().toLowerCase());
 }
 const models=new Set(existing.values()),bank=json('public'+batch.rows[1].url);
 for(const e of bank.exercises)assert(!models.has(e.exampleWord.trim().toLowerCase()),e.exerciseId);
 for(const reused of batch.reusedExisting)assert.equal(existing.get(reused.existingId),reused.model.toLowerCase(),reused.sourceId);
});
test('a revised source inherits unchanged answers without changing the original progress or accepting the withdrawn alias',()=>{
 const [id,previous]=Object.entries(json('data/klink-writing-progress-predecessors-20261101.json'))[0],memory=new Map(),oldWindow=globalThis.window,oldStorage=globalThis.localStorage;
 try{
  globalThis.window={dispatchEvent(){}};globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
  const key=roundProgressPrefix+previous.id,raw=JSON.stringify({version:1,total:20,done:['KSW-AC-TN-081','KSW-AC-TN-020']});memory.set(key,raw);
  assert.equal(roundProgressCount(id,20),1);recordRoundSteps(id,previous.exerciseIds,['KSW-AC-TN-097']);assert.equal(roundProgressCount(id,20),2);assert.equal(memory.get(key),raw);assert(!JSON.parse(memory.get(roundProgressPrefix+id)).done.includes('KSW-AC-TN-020'));
 }finally{globalThis.window=oldWindow;globalThis.localStorage=oldStorage;}
});
test('temporary storage denial retains inherited in-memory progress',()=>{
 const [id,previous]=Object.entries(json('data/klink-writing-progress-predecessors-20261101.json'))[0],oldWindow=globalThis.window,oldStorage=globalThis.localStorage;
 try{
  globalThis.window={dispatchEvent(){}};globalThis.localStorage={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
  recordRoundSteps(previous.id,previous.exerciseIds,['KSW-AC-TN-081']);assert.equal(roundProgressCount(id,20),1);
 }finally{globalThis.window=oldWindow;globalThis.localStorage=oldStorage;}
});
test('revised writing sessions preserve the old store and resume the corrected task after old completion',()=>{
 const [id]=Object.entries(json('data/klink-writing-progress-predecessors-20261101.json'))[0],exercises=json('public'+json(folder+'batch-01.json').rows[0].url).exercises;
 const old=JSON.stringify({version:1,exerciseId:'KSW-AC-TN-100',done:true});
 assert.notEqual(groupSessionKey('chapter','copy',id),groupSessionKey('chapter','copy'));
 assert.deepEqual(restoreGroupSession(null,exercises,id,old),{done:false,exerciseId:'KSW-AC-TN-097'});
 assert.deepEqual(restoreGroupSession(null,exercises,id,JSON.stringify({version:1,exerciseId:'KSW-AC-TN-020',done:false})),{done:false,exerciseId:'KSW-AC-TN-097'});
 assert.deepEqual(restoreGroupSession(null,exercises,id,JSON.stringify({version:1,exerciseId:'KSW-AC-TN-090',done:false})),{done:false,exerciseId:'KSW-AC-TN-090'});
 assert.deepEqual(restoreGroupSession(JSON.stringify({version:1,exerciseId:'KSW-AC-TN-097',done:true}),exercises,id,old),{done:true,exerciseId:'KSW-AC-TN-097'});
 assert.deepEqual(restoreGroupSession(JSON.stringify({version:1,done:false}),exercises,id,old),{done:false});
 for(const bad of ['{','null','[]','{"version":2}'])assert.deepEqual(restoreGroupSession(null,exercises,id,bad),{done:false});
});
test('release requires actual source, browser, preservation and verified recovery proof',()=>assert.equal(verifyWritingBanksRelease().ownerApproval,'standing-owner-approval'));
for(const file of['data/klink-production-index.json','lib/round-progress.ts',folder+'source-records.jsonl',folder+'local/browser.json'])test('release rejects altered '+file,()=>assert.throws(()=>verifyWritingBanksRelease(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from(' ')]):readFileSync(path))));
