import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {collectionProgressId,recordRoundSteps,roundProgressCount} from '../lib/round-progress.ts';
const report=JSON.parse(readFileSync('docs/images-20261030/media.json'));
const index=JSON.parse(readFileSync('data/klink-production-index.json'));
const baseline=path=>JSON.parse(execFileSync('git',['show',`${report.baselineSourceCommit}:${path}`],{maxBuffer:20*1024*1024}));
const playerPath='components/product/package-exercise-browser.tsx';
const oldPlayer=execFileSync('git',['show',`${report.baselineSourceCommit}:${playerPath}`],{encoding:'utf8'});
assert.equal(readFileSync(playerPath,'utf8'),oldPlayer.replace("unoptimized={image.src.startsWith('/package-media/klink-productie-20261029/')}","unoptimized={image.src.startsWith('/package-media/klink-productie-20261029/') || image.src.startsWith('/package-media/klink-beelden-20261030/')}"),'Only avoid redundant image resizing for already compact images');
const before=baseline('data/klink-production-index.json');
const memory=new Map();globalThis.window=new EventTarget();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
let placements=0;
for(const old of before){
 const row=index.find(r=>r.id===old.id);assert(row,'Keep every existing collection');assert.equal(row.count,old.count);
 if(row.url===old.url){assert.deepEqual(row,old);continue;}
 const a=JSON.parse(readFileSync('public'+old.url)),b=JSON.parse(readFileSync('public'+row.url));
 assert.equal(a.exercises.length,b.exercises.length);
 for(let i=0;i<a.exercises.length;i++){
  const x=structuredClone(a.exercises[i]),y=structuredClone(b.exercises[i]);
  if(JSON.stringify(x.prompt?.image)!==JSON.stringify(y.prompt?.image)){assert.equal(row.activity,'copy');assert(report.assets.some(a=>a.url===y.prompt.image.src));placements++;}
  delete x.prompt?.image;delete y.prompt?.image;assert.deepEqual(y,x,'Only image changes, preserve all answers, meanings, audio and ids');
 }
 const oldId=`collection:${old.activity}:${old.id}:${old.url}`;assert.equal(collectionProgressId(row.activity,row.id,row.url),oldId);
 const ids=a.exercises.map(e=>e.exerciseId);recordRoundSteps(oldId,ids,ids);assert.equal(roundProgressCount(collectionProgressId(row.activity,row.id,row.url),row.count),row.count);
}
assert.equal(placements,100);
for(const a of report.assets){const bytes=readFileSync('public'+a.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(bytes.length,a.bytes);}
const fresh=index.filter(r=>!before.some(o=>o.id===r.id));assert.equal(fresh.length,9);assert.equal(fresh.reduce((n,r)=>n+r.count,0),32);
for(const row of fresh){const d=JSON.parse(readFileSync('public'+row.url));assert.equal(d.exercises.length,row.count);for(const e of d.exercises){assert(!report.excludedScenes[e.exerciseId]);assert.equal(e.mode,'model');assert(readFileSync('public'+e.prompt.audio.src).length>1000);assert(report.assets.some(a=>a.code===e.exerciseId&&a.url===e.prompt.image.src));}}
if(process.argv.includes('--guard')){
 const {verifyImageRelease}=await import('./check-image-release-20261030.mjs');verifyImageRelease();
 const manifestPath='docs/klink-owner-release-images-20261030.json',manifest=JSON.parse(readFileSync(manifestPath));
 for(const patch of [{approvedBy:'other'},{publicationApproved:false},{baselineSourceCommit:'0'.repeat(40)},{changedFiles:[]}])assert.throws(()=>verifyImageRelease(f=>f===manifestPath?Buffer.from(JSON.stringify({...manifest,...patch})):readFileSync(f)));
 for(const target of ['data/klink-production-index.json','lib/round-progress.ts','docs/images-20261030/review.json','docs/images-20261030/backup.json'])assert.throws(()=>verifyImageRelease(f=>f===target?Buffer.from('{}'):readFileSync(f)));
}
console.log('PASS 52 media, 100 word placements, 32 new scenes, all old content/audio/answers and stored completion retained');
