import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {productionIndex,validateProductionCollection} from '../lib/production-practice.ts';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {updateLearningReview} from '../lib/learning-review.ts';
const root='docs/speaking-a1-repeat-20261105/',json=p=>JSON.parse(readFileSync(root+p));
const m=json('manifest.json'),review=json('review.json'),bank=json('source-bank.json');
test('Ten approved A1 repetitions are reachable with exact source IDs, text and existing audio',()=>{
 assert.deepEqual(productionIndex.find(r=>r.id===m.row.id),m.row);
 assert(availableChapterCollections('speak',{chapter:'speaking',level:'a1',help:'practice'}).some(r=>r.id===m.row.id));
 assert.deepEqual(validateProductionCollection(bank,m.row.id,10),bank.exercises);
 assert.deepEqual(json('current-selected-source.json'),json('original-source.json').records);
 for(const[i,e]of bank.exercises.entries()){
  const r=review.recordings[i],a=m.mapping[i];
  assert.equal(e.exerciseId,r.id);assert.equal(e.title,r.instruction);assert.equal(e.exampleWord,r.word);
  assert.equal(e.selfCheck,r.selfCheck);assert.equal(e.meaning,r.id==='SPK-A1-ZHW-04'?'Iemand met wie je werkt.':r.meaningSupport);assert.equal(e.feedback,r.feedback);
  assert.equal(e.prompt.audio.src,a.src);assert.equal(e.mode,'repeat-word');assert.equal(e.componentId,'ALF-CMP-009');
  assert.equal(e.assessment,'participation');assert.equal(e.reviewEligible,false);assert(e.requiresAudio&&e.requiresExplicitCompletion&&e.manualAdvance);
  assert.equal(e.instructionAudio,undefined);assert.equal(e.options,undefined);
  const match=a.src.match(/^(.*?)#bytes=(\d+),(\d+)$/);let bytes=readFileSync('public'+(match?match[1]:a.src));if(match)bytes=bytes.subarray(+match[2],+match[2]+ +match[3]);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),a.audioSha256);
  const state={'existing:recall':{due:1,last:1,streak:1}};
  assert.deepEqual(updateLearningReview(state,{exerciseId:e.exerciseId,assessment:e.assessment,reviewEligible:e.reviewEligible,correct:true}),state);
 }
});
test('Malformed, incomplete and duplicate banks cannot load',()=>{
 assert.throws(()=>validateProductionCollection({...bank,exercises:bank.exercises.slice(1)},m.row.id,10));
 assert.throws(()=>validateProductionCollection({...bank,exercises:bank.exercises.map(()=>bank.exercises[0])},m.row.id,10));
 assert.throws(()=>validateProductionCollection(bank,'wrong-id',10));
});
