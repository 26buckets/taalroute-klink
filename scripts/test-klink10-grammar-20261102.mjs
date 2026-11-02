import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chapterCollections,chapterHash,parseChapterHash} from '../lib/practice-chapters.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {orderAccepted} from '../lib/standard-player-contract.ts';
const root='docs/klink10-grammar-20261102',json=p=>JSON.parse(readFileSync(p)),manifest=json(root+'/import-manifest.json'),source=new Map(json(root+'/source.json').map(e=>[e.id,e]));
const baseline=p=>JSON.parse(execFileSync('git',['show',manifest.baselineMain+':'+p],{maxBuffer:32e6}));
const index=json('data/klink-production-index.json'),newIds=new Set(manifest.newRows.map(r=>r.row.id));
assert.deepEqual(index.filter(r=>!newIds.has(r.id)),baseline('data/klink-production-index.json'));
for(const file of ['data/klink-word-listening-audio.json','data/klink-word-listening.json']){
 const current=json(file),old=baseline(file);
 for(const[k,v]of Object.entries(old))assert.deepEqual(current[k],v,k);
 assert.equal(Object.keys(current).length,Object.keys(old).length+5);
}
const reviewedFeedback=text=>text.replace(/\b(hoewel|voordat|dat)-zin\b/g,(_,word)=>`zin met ‘${word}’`);
const seen=new Set(),checks=[];
for(const {row,sha256}of manifest.newRows){
 const bytes=readFileSync('public'+row.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),sha256);
 assert(row.url.endsWith(sha256.slice(0,16)+'.json'));
 const exercises=validateProductionCollection(JSON.parse(bytes),row.id,10);
 assert(chapterCollections(row.activity).some(c=>c.id===row.id&&c.contentUrl===row.url));
 assert.equal(parseChapterHash(chapterHash({chapter:'grammar',activity:row.activity,level:row.level,collection:row.id,help:'practice'})).collection,row.id);
 for(const e of exercises){
  assert(!seen.has(e.exerciseId));seen.add(e.exerciseId);
  const s=source.get(e.exerciseId);assert(s&&s.level!=='Alfa A');assert.equal(e.sourceDoc,s.sourceDoc);
  assert.equal(e.contentLevel,row.level);assert(e.manualAdvance&&e.requiresExplicitCompletion);assert.equal(e.reviewEligible,false);
  if(e.componentId==='ALF-CMP-013'){
   const text=e.targetOrderIds.map(id=>e.items.find(i=>i.itemId===id).text).join(' ');
   assert.equal(text.replace(/\.$/,''),s.answer.replace(/\.$/,''));
   assert(orderAccepted(e.targetOrderIds,e.targetOrderIds));assert(!orderAccepted(e.targetOrderIds.slice(1),e.targetOrderIds));
   for(const alternative of e.acceptedOrderIds){assert(orderAccepted(alternative,e.targetOrderIds,e.acceptedOrderIds));assert.equal(new Set(alternative).size,e.items.length);assert.equal(e.items.find(i=>i.itemId===alternative[0]).text,s.startCard);}
  }else{
   assert.deepEqual(e.options.map(o=>o.label),s.choices.map(c=>c.text));
   assert.deepEqual(e.answer.correctOptionIds,s.choices.filter(c=>c.correct).map(c=>e.exerciseId+'-'+c.position));
   for(const choice of s.choices)assert.equal(e.optionFeedback[e.exerciseId+'-'+choice.position],reviewedFeedback(choice.feedback));
  }
  if(s.type==='IDENTIFY_SUBJECT')assert.equal(e.sourceText,source.get(e.sourceModelId).answer);
  checks.push({id:e.exerciseId,sourceAndAnswerVerified:true});
 }
}
assert.equal(seen.size,120);assert.equal(manifest.newRows.length,12);
assert.deepEqual(json(root+'/blocked.json').map(r=>r.id),[...source.values()].filter(s=>s.level==='Alfa A').map(s=>s.id));
writeFileSync(root+'/local/content.json',JSON.stringify({checks,allPriorCollectionsAndWordModelsPreserved:true,newWordModels:5,blockedImages:40},null,2)+'\n');
console.log('Passed 120 source/answer checks, 12 reachable rounds, prior data preservation and order alternatives.');
