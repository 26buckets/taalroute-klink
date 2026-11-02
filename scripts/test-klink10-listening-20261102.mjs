import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chapterCollections,chapterHash,parseChapterHash} from '../lib/practice-chapters.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
const root='docs/klink10-listening-20261102',json=p=>JSON.parse(readFileSync(p)),m=json(root+'/import-manifest.json'),source=new Map(json(root+'/source.json').map(e=>[e.id,e]));
const baseline=p=>JSON.parse(execFileSync('git',['show',m.baselineMain+':'+p],{maxBuffer:32e6}));
const ids=new Set(m.newRows.map(x=>x.row.id)),checks=[],seen=new Set();
assert.deepEqual(json('data/klink-production-index.json').filter(r=>!ids.has(r.id)),baseline('data/klink-production-index.json'));
for(const f of ['data/klink-word-listening-audio.json','data/klink-word-listening.json']){const old=baseline(f),current=json(f);for(const[k,v]of Object.entries(old))assert.deepEqual(current[k],v);assert.equal(Object.keys(current).length,Object.keys(old).length+22);}
const instructions=json('data/klink-production-instructions.json'),oldInstructions=baseline('data/klink-production-instructions.json');assert.deepEqual(instructions.slice(0,oldInstructions.length),oldInstructions);assert.equal(instructions.length,oldInstructions.length+2);
for(const{row,sha256}of m.newRows){
 assert.equal(createHash('sha256').update(readFileSync('public'+row.url)).digest('hex'),sha256);
 const es=validateProductionCollection(json('public'+row.url),row.id,10);
 assert(chapterCollections(row.activity).some(c=>c.id===row.id&&c.contentUrl===row.url));assert.equal(parseChapterHash(chapterHash({chapter:'listening',activity:row.activity,collection:row.id,level:row.level,help:'practice'})).collection,row.id);
 for(const e of es){
  assert(!seen.has(e.exerciseId));seen.add(e.exerciseId);const s=source.get(e.sourceRecordId);assert(s&&!['Alfa A','Alfa B'].includes(s.level));assert.equal(e.question,s.question);assert(e.manualAdvance&&e.requiresExplicitCompletion&&e.requiresAudio&&e.playAllBlocks&&e.transcriptAfterAnswer);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);
  assert.equal(e.answer.correctOptionIds.length,1);assert.deepEqual(e.answer.correctOptionIds,s.answers.filter(o=>o.correct).map(o=>e.exerciseId+'-'+o.id));assert.equal(new Set(e.options.map(o=>o.label)).size,3);
  for(const o of e.options){const original=s.answers.find(x=>e.exerciseId+'-'+x.id===o.id);assert(original);if(e.exerciseId==='KLINK-LUI-P01-B1-suitable-reply-001'&&original.id==='C')assert.equal(o.label,'Dan kom ik vrijdag. Donderdag is blijkbaar vervallen.');else assert.equal(o.label,original.label);assert(o.audio?.src);assert(e.optionFeedback[o.id]);}
  assert.equal(e.sourceBlocks.length,e.textBlocks.length);assert.deepEqual(e.sourceBlocks,e.textBlocks);assert(e.sourceBlocks.every(b=>b.text&&b.audio?.src));assert.equal(e.prompt.audio.src,e.sourceBlocks[0].audio.src);assert(e.questionAudio?.src);assert(instructions.some(i=>i.src===e.instructionAudio.src));
  const utterances=e.sourceBlocks.map(b=>b.text).join(' ');if(s.promptAudioScript){const spoken=s.promptAudioScript.split('\n').map(line=>{const speaker=e.sourceBlocks.find(b=>b.speaker&&line.startsWith(b.speaker+':'));return speaker?line.slice(speaker.speaker.length+1).trim():line;}).join(' ');assert(utterances.includes(spoken),e.exerciseId);}
  checks.push({id:e.exerciseId,sourceAndAnswerVerified:true,spokenContextAndOptionsPresent:true,transcriptAfterAnswer:true});
 }
}
assert.equal(seen.size,120);assert.equal(ids.size,12);assert.equal(json(root+'/blocked.json').length,80);
mkdirSync(root+'/local',{recursive:true});writeFileSync(root+'/local/content.json',JSON.stringify({checks,allPriorCollectionsAndWordModelsPreserved:true,newWordModels:22,blockedImages:80},null,2)+'\n');console.log('120 listening source/answer contracts and previous content preserved.');
