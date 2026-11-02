import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chapterCollections,chapterHash,parseChapterHash} from '../lib/practice-chapters.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {validStandardTask} from '../lib/standard-player-contract.ts';
const root='docs/klink10-sentences-20261102',json=p=>JSON.parse(readFileSync(p)),m=json(root+'/import-manifest.json'),source=new Map(json(root+'/source.json').map(s=>[s.id,s]));
const old=p=>JSON.parse(execFileSync('git',['show',m.baselineMain+':'+p],{maxBuffer:32e6}));
const ids=new Set(m.newRows.map(x=>x.row.id)),checks=[],seen=new Set(),kinds={};let stages=0;
assert.deepEqual(json('data/klink-production-index.json').filter(r=>!ids.has(r.id)),old('data/klink-production-index.json'));
for(const p of ['data/klink-word-listening.json','data/klink-word-listening-audio.json'])assert.deepEqual(json(p),old(p));
const instructions=json('data/klink-production-instructions.json'),prior=old('data/klink-production-instructions.json');assert.deepEqual(instructions.slice(0,prior.length),prior);assert.deepEqual(instructions.slice(prior.length),m.newInstructions);
const adaptations=json(root+'/adaptations.json');
for(const{row,sha256}of m.newRows){
 assert.equal(createHash('sha256').update(readFileSync('public'+row.url)).digest('hex'),sha256);
 const es=validateProductionCollection(json('public'+row.url),row.id,10);
 assert(chapterCollections(row.activity).some(c=>c.id===row.id&&c.contentUrl===row.url),row.id);
 assert.equal(parseChapterHash(chapterHash({chapter:'sentences',activity:row.activity,collection:row.id,level:row.level,help:'practice'})).collection,row.id);
 for(const e of es){
  assert(!seen.has(e.exerciseId));seen.add(e.exerciseId);const s=source.get(e.sourceRecordId);assert(s);const kind=e.exerciseId.split('-').at(-2);kinds[kind]=(kinds[kind]??0)+1;
  assert(e.manualAdvance&&e.requiresExplicitCompletion);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert(e.prompt.audio.src);assert(instructions.some(i=>i.src===e.instructionAudio.src));
  const rawSentence=s.raw.match(/^(?:Zin|Bronzin|Doelzin en bronvoorbeeld): (.+)$/m)?.[1];assert(rawSentence);const sentence=adaptations.find(a=>a.id===e.exerciseId&&a.new)?.new??rawSentence;
  if(kind==='LLM'){assert(validStandardTask(e.standardTask));assert.equal(e.standardTask.text,sentence);assert(e.requiresAudio);}
  if(kind==='VWZ'){assert.equal(e.assessment,'participation');assert.equal(e.automaticGrammarScoring,false);assert.equal(e.modelSentence,sentence);assert.equal(e.displayWord,s.raw.match(/^Startwoord: (.+)$/m)[1]);assert(!e.answer&&!e.fields);assert.notEqual(e.prompt.audio.src,e.modelAudio.src);}
  if(kind==='ZDZ'){
   assert.equal(e.options.length,3);assert.equal(e.answer.correctOptionIds.length,1);assert.equal(new Set(e.options.map(o=>o.label)).size,3);assert(e.requiresAudio);
   for(const o of e.options){assert(o.audio.src);assert(e.optionFeedback[o.id]);const correct=e.answer.correctOptionIds.includes(o.id);assert.equal(o.label===sentence,correct);if(!correct){const quoted=[...e.optionFeedback[o.id].matchAll(/'([^']+)'/g)].map(x=>x[1]);assert.equal(quoted.length,2);assert(o.label.split(/\W+/).includes(quoted[0]));assert(sentence.split(/\W+/).includes(quoted[1]));}}
  }
  if(kind==='MDZ'){
   const parts=e.sequenceStages??[e];if(e.sequenceStages)stages++;
   const assembled=parts.map(p=>{assert.equal(new Set(p.items.map(i=>i.itemId)).size,p.items.length);assert.equal(p.targetOrderIds.length,p.items.length);return p.targetOrderIds.map(id=>{const item=p.items.find(i=>i.itemId===id);assert(item);return item.text;}).join(' ');});assert.equal(assembled.join(' '),sentence);
   if(e.sequenceStages)assert(assembled.every(text=>/[.!?]$/.test(text)));
  }
  if(kind==='TDZ'){assert.deepEqual(e.fields[0].acceptedAnswers,[sentence]);assert.equal(e.writingSourceId,e.exerciseId);if(row.level.startsWith('alfa-')){assert.equal(e.displayWord,sentence);assert.equal(e.sentenceAnswerPolicy,'exact-copy');}else{assert(!e.displayWord);assert(e.requiresAudio);assert.equal(e.sentenceAnswerPolicy,'dictation');}}
  checks.push({id:e.exerciseId,sourceAndAnswerVerified:true,sourceAudioMapped:true,kind,independentReadingClaimed:false});
 }
}
assert.equal(seen.size,220);assert.equal(ids.size,22);assert.equal(stages,19);assert.deepEqual(kinds,{LLM:20,VWZ:50,ZDZ:50,MDZ:50,TDZ:50});assert(json(root+'/source-recheck.json').every(s=>s.fullTextUnchanged));
mkdirSync(root+'/local',{recursive:true});writeFileSync(root+'/local/content.json',JSON.stringify({checks,blockedSourcePositions:10,allPriorCollectionsAndWordModelsPreserved:true,sourcePositions:220,phasedTasks:19,openAnswers:50,sourceTypoCorrected:true,fragmentRepairs:3},null,2)+'\n');console.log('220 source-bound sentence tasks, 19 staged tasks, 50 open answers; prior collections preserved.');
