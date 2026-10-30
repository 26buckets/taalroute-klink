import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readBeforeSentenceRevision} from './check-sentence-revision.mjs';
import {contentById,contentReadingConditions} from '../lib/connected-content.ts';
import {contentPackages} from '../lib/package-content.ts';
import {groupActivities,groupExercises} from '../lib/group-practice.ts';
const dir='docs/sentence-second-review-20261030/';
const read=p=>JSON.parse(readFileSync(p));
const decisions=read(dir+'decisions.json').decisions,clips=read(dir+'audio.json');
const previous=JSON.parse(execFileSync('git',['show','152acc92:data/klink-connected-content.json'],{maxBuffer:128e6}));
const bank=read('data/klink-connected-content.json');
const sha=x=>createHash('sha256').update(x).digest('hex');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>sha(JSON.stringify(stable(x)));
const rows=contentPackages.flatMap(pack=>groupActivities.flatMap(a=>groupExercises(pack,a.id).map(exercise=>({activity:a.id,exercise}))));
const key=r=>r.activity+'|'+r.exercise.exerciseId;
void test('All 62 prior doubts have explicit decisions; only 14 sentences and their recordings change',()=>{
 assert.equal(decisions.length,62);assert.equal(new Set(decisions.map(d=>d.contentId)).size,62);assert.equal(clips.length,14);
 assert.deepEqual(decisions.filter(d=>d.ownerDecisionRequired),[]);
 const review=read('data/klink-sentence-levels.json');
 for(const d of decisions){
  assert.equal(d.before.status,'provisional');assert.equal(d.after.status,'reviewed');
  assert.deepEqual(review.items.find(r=>r.contentId===d.contentId),{contentId:d.contentId,...d.after});
  const source=contentById.get(d.contentId);const old=previous.items.find(s=>s.id===d.contentId);
  const c=clips.find(c=>c.contentId===d.contentId);
  if(c){assert.notEqual(source.text,old.text);assert.equal(source.text,c.text);assert.equal(source.humanReview,'open');}
  else {assert.equal(source.text,old.text);assert.deepEqual(source.blocks,old.blocks);}
  if(d.after.preparation){assert(contentReadingConditions(source,{id:'test'}).wordConditions.includes(d.after.preparation));assert(!contentReadingConditions({...source,text:source.text+' gewijzigd'},{id:'test'}).wordConditions.includes(d.after.preparation));}
 }
 for(const source of bank.items)if(!clips.some(c=>c.contentId===source.id))assert.deepEqual(source,previous.items.find(s=>s.id===source.id));
 assert.match(contentById.get('klink-sentence-ec10c5d495e373fa').reading.meaningOverrides['klink-woord-haar'],/Fatima/);
});
void test('All fourteen final audio files match sources, transcript evidence, metadata and unchanged audio packets',()=>{
 const transcript=read(dir+'final-transcript-check.json'),register=read('public/content-register/active.json');
 assert.equal(transcript.clips.length,14);assert.equal(transcript.humanListeningReview,'open');
 for(const c of clips){
  assert.equal(c.voiceId,'0qLmDzgqulxcvv0yf3kg');assert.equal(c.humanListeningReview,'open');
  const source=contentById.get(c.contentId);assert.equal(source.blocks[0].audio.src,c.src);
  const row=register.find(r=>r.id===c.audioId);assert.equal(row.text,c.text);assert.equal(row.src,c.src);assert.equal(row.voiceId,c.voiceId);
  assert.equal(sha(readFileSync('public'+c.src)),c.sha256);
  const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src])).format.tags;
  for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');assert.equal(tags.album,'Klink - Taalroute');assert.equal(tags.title,c.text);
  const packets=file=>execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:a','-c','copy','-f','hash','-hash','sha256','-']).toString().trim();
  assert.equal(packets('public'+c.src),packets(dir+'originals/'+c.id+'.mp3'));
  const t=transcript.clips.find(t=>t.id===c.id);assert(t.passed);assert.equal(t.expected,c.text);
 }
});
void test('All linked answer models and audio use the revised source; no previous text or recording survives in active exercises',()=>{
 const serialized=JSON.stringify(rows);let checked=0;
 for(const c of clips){
  const old=previous.items.find(s=>s.id===c.contentId);
  assert(!serialized.includes(JSON.stringify(old.text).slice(1,-1)),old.text);assert(!serialized.includes(c.originalSrc),c.originalSrc);
  const linked=rows.filter(r=>r.exercise.contextId===c.contentId);assert(linked.length>0,c.contentId);
  for(const {exercise:e} of linked){
   if(e.textBlocks)assert.deepEqual(e.textBlocks.map(b=>b.text),[c.text]);
   if(e.sourceBlocks?.length)assert.deepEqual(e.sourceBlocks.map(b=>b.text),[c.text]);
   if(e.mode==='sentence-build')assert.equal(e.answer.targetTileIds.map(id=>e.tiles.find(t=>t.id===id).token).join(' '),c.text);
   if(e.mode==='sentence-dictation')assert.deepEqual(e.fields[0].acceptedAnswers,[c.text]);
   if(e.mode==='sentence-speak')assert.equal(e.helpWord,c.text);
   if(e.sourceModel)assert.equal(e.sourceModel,c.text);
   if(e.modelAudio)assert.equal(e.modelAudio.src,c.src);
   if(e.prompt?.audio)assert.equal(e.prompt.audio.src,c.src);
   checked++;
  }
 }
 assert(checked>80);
});
void test('Every previous exercise key survives; only the recorded linked fields and two new rich-person order tasks differ',()=>{
 const proof=read(dir+'runtime-amendments.json'),map=new Map(rows.map(r=>[key(r),structuredClone(r)]));
 assert.equal(rows.length,proof.afterPlacements);assert.equal(map.size,proof.afterDistinct);assert.deepEqual(proof.removed,[]);assert.equal(proof.added.length,2);
 for(const a of proof.added){assert(a.key.includes('sentence-build:klink-sentence-ad0f734e2f5137d1'));assert.equal(digest(map.get(a.key)),a.sha256);map.delete(a.key);}
 for(const change of proof.changes){const e=map.get(change.key).exercise;for(const f of change.fields){if(!f.removed)assert.deepEqual(e[f.field],f.after,change.key+'/'+f.field);if(f.added)delete e[f.field];else e[f.field]=f.before;}}
 assert.equal(map.size,proof.beforeDistinct);assert.equal(digest([...map.keys()].sort().map(k=>map.get(k))),proof.beforeDistinctSha256);
});
void test('Historical comparison accepts only the exact scoped amendments and rejects unrelated or altered repairs',()=>{
 for(const file of ['data/klink-connected-content.json','data/klink-content-routing.json','public/content-register/active.json'])readBeforeSentenceRevision(file);
 for(const id of [clips[0].contentId,bank.items.find(s=>!clips.some(c=>c.contentId===s.id)).id]){
  assert.throws(()=>readBeforeSentenceRevision('data/klink-connected-content.json',()=>{const value=structuredClone(bank);value.items.find(s=>s.id===id).text+=' ongevraagd';return Buffer.from(JSON.stringify(value));}));
 }
});
