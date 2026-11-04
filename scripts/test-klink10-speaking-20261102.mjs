import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chapterCollections} from '../lib/practice-chapters.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {isInstructionAudioEnabled} from '../lib/audio-policy.ts';
const root='docs/klink10-speaking-20261102',json=p=>JSON.parse(readFileSync(p)),m=json(root+'/manifest.json'),review=json(root+'/content-review.json'),old=p=>JSON.parse(execFileSync('git',['show',m.baselineMain+':'+p],{maxBuffer:32e6}));
assert.deepEqual(json('data/klink-production-index.json').filter(x=>x.id!==m.row.id),old('data/klink-production-index.json'));assert.equal(chapterCollections('sentence-speak').find(x=>x.id===m.row.id).contentUrl,m.row.url);assert.equal(m.row.help,'guided');assert.equal(m.row.level,'alfa-a');
const bytes=readFileSync('public'+m.row.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);const es=validateProductionCollection(JSON.parse(bytes),m.row.id,10),checks=[];
const previous=old('data/klink-production-instructions.json'),instructions=json('data/klink-production-instructions.json');assert.deepEqual(instructions.slice(0,previous.length),previous);assert.equal(instructions.length,previous.length+1);
for(const e of es){const s=review.checks.find(x=>x.id===e.exerciseId);assert(s);assert.equal(e.displayWord,s.target);assert.equal(e.helpWord,s.target);assert.equal(e.mode,'sentence-speak');assert.equal(e.assessment,'participation');assert.equal(e.automaticPronunciationScoring,false);assert.equal(e.sourceRecordId,e.exerciseId);assert.equal(e.sourceDocumentId,'1R_7IroJEEaPh2BMSh30LizCdO53JGLmd2z7ud3go9fI');assert(e.manualAdvance&&e.requiresExplicitCompletion&&!e.independentReading&&!e.reviewEligible);assert(isInstructionAudioEnabled(e.instructionAudio.src));assert.equal(m.media[e.prompt.audio.src].expected,s.target);assert.notEqual(m.media[e.prompt.audio.src].voiceId,m.media[e.instructionAudio.src].voiceId);checks.push({id:e.exerciseId,exactSourceSentence:true,guidedOralImitation:true,participationOnly:true,separateInstructionVoice:true});}
for(const p of ['data/klink-word-listening.json','data/klink-word-listening-audio.json','data/klink-progress-image-aliases-20261030.json'])assert.deepEqual(json(p),old(p));
assert.equal(json(root+'/audio-transcription.json').clips.filter(x=>x.normalizedExact).length,11);
mkdirSync(root+'/local',{recursive:true});writeFileSync(root+'/local/content.json',JSON.stringify({checks,existingCollectionsInstructionsWordAudioAndProgressPreserved:true},null,2)+'\n');console.log('PASS ten exact guided oral tasks; existing data preserved.');
