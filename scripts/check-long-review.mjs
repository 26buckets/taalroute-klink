// Test-only historical comparison; publication guards remain unchanged.
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync('docs/long-content-review-20261030/source-amendments.json'));
const baseline=new Map();
function original(file){
 if(!baseline.has(file))baseline.set(file,JSON.parse(execFileSync('git',['show',manifest.baseline+':'+file],{maxBuffer:128e6})));
 return baseline.get(file);
}
export function readBeforeLongReview(file,read=readFileSync){
 const changes=manifest.changes.filter(c=>c.path[0]===file);
 if(!changes.length)return read(file);
 const current=JSON.parse(read(file));
 for(const c of changes){
  let o=current;for(const k of c.path.slice(1,-1))o=o[k];const k=c.path.at(-1);
  if(c.removed)assert(!Object.hasOwn(o,k));else assert.deepEqual(o[k],c.after,c.path.join('/'));
  if(c.added)delete o[k];else o[k]=c.before;
 }
 assert.deepEqual(current,original(file),file);
 return Buffer.from(JSON.stringify(current));
}

export function rowsBeforeLongReview(rows) {
 const proof=JSON.parse(gunzipSync(readFileSync('docs/long-content-review-20261030/runtime-amendments.json.gz')));
 const key=r=>r.activity+'|'+r.exercise.exerciseId;
 const restored=rows.map(row=>structuredClone(row)),byKey=new Map();
 for(const row of restored){const k=key(row);byKey.set(k,[...(byKey.get(k)??[]),row]);}
 assert.equal(restored.length,proof.afterPlacements);assert.equal(byKey.size,proof.afterDistinct);
 for(const change of proof.changes){
  assert(byKey.has(change.key),change.key);
  for(const {exercise}of byKey.get(change.key))for(const f of change.fields){
   if(f.removed)assert.equal(exercise[f.field],undefined);else assert.deepEqual(JSON.parse(JSON.stringify(exercise[f.field])),f.after,change.key+'/'+f.field);
   if(f.added)delete exercise[f.field];else exercise[f.field]=f.before;
  }
 }
 const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
 const distinct=new Map(restored.map(r=>[key(r),r]));
 assert.equal(createHash('sha256').update(JSON.stringify(stable([...distinct.keys()].sort((a,b)=>a<b?-1:a>b?1:0).map(k=>distinct.get(k))))).digest('hex'),proof.beforeDistinctSha256);
 return restored;
}

const packageChanges=new Map(JSON.parse(gunzipSync(readFileSync('docs/long-content-review-20261030/package-amendments.json.gz'))).map(c=>[c.id,c]));
export function beforeLongReviewPackageExercise(exercise){
 const c=packageChanges.get(exercise.exerciseId);if(!c)return exercise;
 assert.equal(createHash('sha256').update(JSON.stringify(exercise)).digest('hex'),c.afterSha256,exercise.exerciseId);
 return c.before;
}
