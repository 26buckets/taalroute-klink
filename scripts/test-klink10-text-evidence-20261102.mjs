import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {validStandardTask,sameSelection} from '../lib/standard-player-contract.ts';
import {chapterCollections} from '../lib/practice-chapters.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {isInstructionAudioEnabled} from '../lib/audio-policy.ts';
const root='docs/klink10-text-evidence-20261102',json=p=>JSON.parse(readFileSync(p)),m=json(root+'/manifest.json'),review=json(root+'/a1-evidence-review.json'),old=p=>JSON.parse(execFileSync('git',['show',m.baselineMain+':'+p],{maxBuffer:32e6}));
const index=json('data/klink-production-index.json');assert.deepEqual(index.filter(x=>x.id!==m.row.id),old('data/klink-production-index.json'));assert.deepEqual(chapterCollections('text-evidence').find(x=>x.id===m.row.id).contentUrl,m.row.url);
const bytes=readFileSync('public'+m.row.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);const es=validateProductionCollection(JSON.parse(bytes),m.row.id,10),checks=[];
const previous=old('data/klink-production-instructions.json'),instructions=json('data/klink-production-instructions.json');assert.deepEqual(instructions.slice(0,previous.length),previous);assert.equal(instructions.length,previous.length+10);
for(const e of es){const s=review.items.find(x=>x.sourceId===e.exerciseId);assert(s);assert.equal(e.sourceText,s.sourceText);assert.equal(e.question,s.proposedQuestion);assert(validStandardTask(e.standardTask));assert.deepEqual(e.standardTask,s.task);const selected=e.standardTask.acceptedSelections[0];assert.equal(e.standardTask.tokens.filter(t=>selected.includes(t.id)).map(t=>t.text).join(' '),s.evidence);assert(!sameSelection(selected.slice(1),selected));assert(!sameSelection([...selected,selected[0]],selected));assert.equal(e.componentId,'KLINK-EXTENDED');assert.equal(e.mode,'text-evidence');assert(e.manualAdvance&&e.requiresExplicitCompletion&&!e.independentReading&&!e.reviewEligible);assert(isInstructionAudioEnabled(e.instructionAudio.src));assert(instructions.find(x=>x.src===e.instructionAudio.src).text.endsWith(e.question));checks.push({id:e.exerciseId,sourceAndQuestion:true,exactEvidence:true,instructionIncludesQuestion:true});}
for(const p of ['data/klink-word-listening.json','data/klink-word-listening-audio.json']){const current=json(p),previous=old(p);assert(!previous.apotheker);delete current.apotheker;assert.deepEqual(current,previous);}assert.deepEqual(json('data/klink-progress-image-aliases-20261030.json'),old('data/klink-progress-image-aliases-20261030.json'));
mkdirSync(root+'/local',{recursive:true});writeFileSync(root+'/local/content.json',JSON.stringify({checks,existingCollectionsInstructionsWordAudioAndProgressPreserved:true},null,2)+'\n');console.log('PASS ten evidence tasks, exact selections and existing data preservation.');
