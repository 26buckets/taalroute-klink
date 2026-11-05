import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {productionIndex,validateProductionCollection} from '../lib/production-practice.ts';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {readProductionBank} from './read-production-bank.mjs';
import {spokenWords} from '../lib/word-listening-text.ts';
import {recordingForWord} from '../lib/word-listening.ts';
const root='docs/reading-comprehension-20261105/',json=p=>JSON.parse(readFileSync(p)),m=json(root+'manifest.json'),source=json(root+'sources/selected.json');
void test('Twenty source-bound reading questions, feedback and existing audio are reachable',()=>{
 const words=new Map();
 for(const row of m.rows){
  assert.deepEqual(productionIndex.find(r=>r.id===row.id),row);
  assert(availableChapterCollections('text-question',{chapter:'texts',level:row.level,help:'practice'}).some(r=>r.id===row.id));
  const bank=readProductionBank(row);assert.equal(bank.exercises.length,10);
  for(const e of bank.exercises){
   const s=source.find(s=>s.id===e.exerciseId);assert(s);assert.equal(e.sourceDocumentId,s.source);assert.equal(e.sourceRevision,s.revision);
   assert.equal(e.sourceText,s.text);assert.equal(e.sourceBlocks[0].text,s.text);assert.equal(e.question,s.question);assert.equal(e.contentTitle,s.title);
   assert.deepEqual(e.optionFeedback,s.feedback);assert.deepEqual(e.answer.correctOptionIds,[s.answer]);
   for(const o of e.options)assert.equal(o.label,e.exerciseId==='A2-TEXT-05-09'&&o.id==='A'?'Om de verkeerde handdoeken terug te sturen.':s.options[o.id]);
   assert.equal(e.requiresAudio,false);assert.equal(e.reviewEligible,false);assert.equal(e.instructionAudio,undefined);assert.equal(e.sourceBlocks[0].audio,undefined);assert(e.manualAdvance&&e.requiresExplicitCompletion);
   for(const text of [e.title,e.contentTitle,e.sourceText,e.question,e.feedback,...e.options.map(o=>o.label),...Object.values(e.optionFeedback)])for(const w of spokenWords(text)){const r=recordingForWord(w.text);assert(r,`${e.exerciseId}: ${w.key}`);words.set(w.key,{word:w.key,source:r});}
  }
  assert.throws(()=>validateProductionCollection({...bank,exercises:bank.exercises.slice(1)},row.id,10));
  assert.throws(()=>validateProductionCollection({...bank,exercises:Array(10).fill(bank.exercises[0])},row.id,10));
 }
 writeFileSync(root+'local/word-coverage.json',JSON.stringify([...words.values()],null,2)+'\n');
});
void test('Previous banks, IDs, word recordings, runtime and public bytes remain unchanged',()=>{
 const old=JSON.parse(execFileSync('git',['show',m.baselineSourceCommit+':data/klink-production-index.json'],{maxBuffer:64e6}));assert.deepEqual(productionIndex,[...old,...m.rows]);
 const assets=json('data/klink-grammar-aa-assets.json'),before=JSON.parse(readFileSync(root+'restore/klink-grammar-aa-assets.json.backup'));
 for(const[k,v]of Object.entries(before))assert.deepEqual(assets[k],v,k);
 assert.equal(Object.keys(assets).length,Object.keys(before).length+2);
 const immutable=['app','components','hooks','lib','public','db','drizzle','.github','vite.config.ts','wrangler.jsonc','package.json','package-lock.json','data/klink-word-listening.json'];
 assert.equal(execFileSync('git',['diff','--name-only',m.baselineSourceCommit,'--',...immutable],{encoding:'utf8'}),'');
 const ids=new Set(m.mapping.map(x=>x.sourceId));for(const r of old)for(const e of readProductionBank(r).exercises)assert(!ids.has(e.exerciseId),e.exerciseId);
 const overlap=json(root+'sources/overlap.json');for(const s of source){const r=overlap.records.find(r=>r.id===s.id);assert.deepEqual(r.idMatches,[]);assert.deepEqual(r.sameQuestion,[]);}
});
