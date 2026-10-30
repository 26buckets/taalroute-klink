import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {collectionProgressId,recordRoundSteps,roundProgressCount} from '../lib/round-progress.ts';
const read=p=>JSON.parse(readFileSync(p));
const r=read('docs/image-repairs-20261030/media.json');
const before=JSON.parse(execFileSync('git',['show',`${r.baselineSourceCommit}:data/klink-production-index.json`],{maxBuffer:20*1024*1024}));
const index=read('data/klink-production-index.json').filter(row=>!row.id.startsWith('audio-words:') && !row.id.startsWith('beta-images:'));
const memory=new Map();globalThis.window=new EventTarget();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
let edits=0;
for(const old of before){
 const row=index.find(x=>x.id===old.id);assert(row);assert.equal(row.count,old.count);
 if(row.url===old.url){assert.deepEqual(row,old);continue;}
 const a=read('public'+old.url),b=read('public'+row.url);assert.equal(a.exercises.length,b.exercises.length);
 for(let i=0;i<a.exercises.length;i++){
  const x=structuredClone(a.exercises[i]),y=structuredClone(b.exercises[i]);
  if(JSON.stringify(x.prompt?.image)!==JSON.stringify(y.prompt?.image)){assert(r.assets.some(a=>a.url===y.prompt.image.src));edits++;}
  delete x.prompt?.image;delete y.prompt?.image;assert.deepEqual(y,x,'Preserve audio, text, ids, answers, meanings and instruction roles');
 }
 const c=r.wordCollections.find(c=>c.id===row.id);const oldId=`collection:${old.activity}:${old.id}:${c.progressUrl}`;
 assert.equal(collectionProgressId(row.activity,row.id,row.url),oldId);
 const ids=a.exercises.map(e=>e.exerciseId);recordRoundSteps(oldId,ids,ids);assert.equal(roundProgressCount(collectionProgressId(row.activity,row.id,row.url),row.count),row.count);
}
assert.equal(edits,20);assert.equal(index.length,before.length+1);
const fresh=index.filter(x=>!before.some(b=>b.id===x.id));assert.deepEqual(fresh.map(x=>x.id),['production:meet:a2:KEL_A209_extra']);
const tasks=read('public'+fresh[0].url).exercises;assert.deepEqual(tasks.map(e=>e.exerciseId),['KEL_A209_03','KEL_A209_04']);
for(const e of tasks)assert(readFileSync('public'+e.prompt.audio.src).length>1000);
for(const a of r.assets)assert.equal(createHash('sha256').update(readFileSync('public'+a.url)).digest('hex'),a.sha256);
if(process.argv.includes('--guard')){
 const {verifyImageRepairs}=await import('./check-image-repairs-20261030.mjs');verifyImageRepairs();
 const path='docs/klink-owner-release-image-repairs-20261030.json',manifest=read(path);
 for(const patch of [{approvedBy:'other'},{publicationApproved:false},{changedFiles:[]}])assert.throws(()=>verifyImageRepairs(f=>f===path?Buffer.from(JSON.stringify({...manifest,...patch})):readFileSync(f)));
 for(const path of ['data/klink-production-index.json','docs/image-repairs-20261030/review.json','docs/image-repairs-20261030/backup.json'])assert.throws(()=>verifyImageRepairs(f=>f===path?Buffer.from('{}'):readFileSync(f)));
}
console.log('PASS 8 images, 22 placements, every previous round/audio/answer and completed progress preserved');
