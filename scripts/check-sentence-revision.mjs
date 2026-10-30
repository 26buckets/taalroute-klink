// Test-only historical comparison; publication guards remain unchanged.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync('docs/sentence-second-review-20261030/source-amendments.json'));
const baseline=new Map();
function original(file){
 if(!baseline.has(file))baseline.set(file,JSON.parse(execFileSync('git',['show',manifest.baseline+':'+file],{maxBuffer:128e6})));
 return baseline.get(file);
}
export function readBeforeSentenceRevision(file,read=readFileSync){
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
const clips=JSON.parse(readFileSync('docs/sentence-second-review-20261030/audio.json'));
const changedIds=new Set(clips.map(c=>c.contentId));
const currentBank=JSON.parse(readFileSync('data/klink-connected-content.json'));
export function beforeSentenceRevisionExercise(exercise){
 if(exercise.mode!=='connected-sentence'||!changedIds.has(exercise.contextId))return exercise;
 const current=currentBank.items.find(s=>s.id===exercise.contextId);
 const before=original('data/klink-connected-content.json').items.find(s=>s.id===exercise.contextId);
 assert.deepEqual(exercise.textBlocks,current.blocks);assert.deepEqual(exercise.prompt.audio,current.blocks[0].audio);
 assert.equal(exercise.contentTitle,current.title);assert.equal(exercise.humanReview,'open');assert.equal(exercise.sourceStatus,'concept');
 return {...exercise,contentTitle:before.title,prompt:{...exercise.prompt,audio:before.blocks[0].audio},textBlocks:before.blocks,humanReview:before.humanReview,sourceStatus:'approved'};
}
