import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyReadingAudioContent} from './check-reading-audio-release-20261031.mjs';
import {collectionProgressId,roundProgressCount,roundProgressPrefix,recordRoundSteps} from '../lib/round-progress.ts';
import {restoreGroupSession} from '../lib/group-practice.ts';
const {rows}=verifyReadingAudioContent(),before=JSON.parse(execFileSync('git',['show','b4df2107:data/klink-production-index.json']));
const memory=new Map();globalThis.window=new EventTarget();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
for(const row of rows){
 const old=before.find(r=>r.id===row.id),exercises=JSON.parse(readFileSync('public'+row.url)).exercises,ids=exercises.map(e=>e.exerciseId);
 const priorId=collectionProgressId(row.activity,row.id,old.url),currentId=collectionProgressId(row.activity,row.id,row.url);assert.equal(currentId,priorId);
 memory.set(roundProgressPrefix+priorId,JSON.stringify({version:1,total:12,done:ids.slice(0,4)}));assert.equal(roundProgressCount(currentId,12),4);
 assert.equal(restoreGroupSession(JSON.stringify({version:1,exerciseId:ids[4],done:false}),exercises).exerciseId,ids[4]);
 recordRoundSteps(currentId,ids,ids.slice(4));assert.equal(roundProgressCount(priorId,12),12);
 assert.equal(restoreGroupSession(JSON.stringify({version:1,exerciseId:ids[11],done:true}),exercises).done,true);
}
console.log('PASS six exact narrations, embedded metadata, lossless samples, 24 unchanged questions, all prior collections and both old progress keys');
