import assert from 'node:assert/strict';
import {readFileSync as read,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {productionIndex,validateProductionCollection} from '../lib/production-practice.ts';
import {availableChapterCollections,chapterHash,parseChapterHash} from '../lib/practice-chapters.ts';
const sha=b=>createHash('sha256').update(b).digest('hex');
const prior=JSON.parse(execFileSync('git',['show','c5555f21c328a03a1d5db7e9c3b20e830f511ab3:data/klink-production-index.json']));
assert.deepEqual(productionIndex.slice(0,-4).map(row=>row.id.startsWith('klink-teksten-zelf-')?{...row,url:prior.find(p=>p.id===row.id).url}:row),prior);
const source=JSON.parse(read('docs/zinnen-a1-a2-20261031/source.json'));
const sources=new Map(JSON.parse(read('data/klink-connected-content.json')).items.map(x=>[x.id,x]));
const audio=JSON.parse(read('docs/zinnen-a1-a2-20261031/audio-check.json'));
const ids=new Set();
for(const [n,row]of productionIndex.slice(-4).entries()){
 const round=source.rounds[n];assert.equal(row.id,round.id);assert.equal(row.activity,'sentences');assert.equal(row.help,'practice');
 assert.equal(row.level,round.level.toLowerCase());assert.equal(row.count,round.questions.length);
 const raw=read('public'+row.url);assert(row.url.endsWith(sha(raw).slice(0,16)+'.json'));
 const exercises=validateProductionCollection(JSON.parse(raw),row.id,row.count);
 assert(availableChapterCollections('sentences',{level:row.level,help:'practice'}).some(c=>c.id===row.id));
 assert(!availableChapterCollections('sentences',{level:row.level,help:'guided'}).some(c=>c.id===row.id));
 assert.equal(parseChapterHash(chapterHash({chapter:'sentences',activity:'sentences',collection:row.id,level:row.level,help:'practice'})).collection,row.id);
 for(const [i,e]of exercises.entries()){
  const q=round.questions[i],original=sources.get(q.sourceId);
  assert(!ids.has(e.exerciseId));ids.add(e.exerciseId);assert.equal(e.exerciseId,q.id);
  assert.equal(original.text,q.sourceText);assert.equal(original.humanReview,'approved');
  assert.deepEqual(e.sourceBlocks,[{id:q.sourceId,text:q.sourceText,audio:original.blocks[0].audio}]);
  assert.equal(e.question,q.question);assert.equal(e.title,q.instruction);
  assert.deepEqual(e.options,q.options.map(o=>({id:o.id,label:o.text})));assert.equal(e.options.length,3);
  assert.deepEqual(e.answer.correctOptionIds,[q.correctOptionId]);assert.equal(e.options.find(o=>o.id===q.correctOptionId).label,q.correctAnswer);
  assert.equal(e.correctFeedback,q.feedback.correct);assert.equal(e.feedback,q.feedback.incorrect);
  assert.equal(e.manualAdvance,true);assert.equal(e.requiresAudio,false);assert.equal(e.contextId,undefined);
  assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.access,'independent-practice');
  const a=audio.recordings.find(x=>x.sourceId===q.sourceId);assert(a&&existsSync('public'+a.src));assert.equal(a.sha256,sha(read('public'+a.src)));
  assert.equal(a.tags.artist,'Taalroute');assert.equal(a.tags.album_artist,'Taalroute');assert(Number(a.duration)>0);
 }
}
assert.equal(ids.size,44);assert.deepEqual(source.rounds.map(r=>r.questions.length),[12,12,10,10]);
for(const root of ['app','components','lib','hooks','db','drizzle','public/package-audio','public/package-media'])assert.equal(execFileSync('git',['diff','--name-only',...(root==='public/package-audio'?['--diff-filter=MD']:[]),'c5555f21','--',root]).length,0,root+' unchanged');
console.log('PASS 44 reviewed sentence questions: original sources/audio, answers, feedback, metadata, self-practice routes and every existing collection; no UI or storage changes');
