import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exactCopyAnswer} from '../lib/copy-answer.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {displayedChapterCollections} from '../lib/practice-chapters.ts';
import {exerciseHelp} from '../lib/lesson-plan.ts';
const json=f=>JSON.parse(readFileSync(f));
const source=json('docs/writing-copy-20261101/source.json').rows;
const index=json('data/klink-production-index.json');
const row=index.find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-001-020');
const bytes=readFileSync('public'+row.url),collection=JSON.parse(bytes);

test('20 source-bound tasks use the existing copy player and preserve the old catalogue',()=>{
  const before=JSON.parse(execFileSync('git',['show','4612b27eebe2ef45c6d806ed18df09f7e8f1e934:data/klink-production-index.json']));
  assert.deepEqual(index.slice(0,before.length),before);
  assert(index.length>=before.length+1);
  assert.equal(validateProductionCollection(collection,row.id,20).length,20);
  assert(row.url.includes(createHash('sha256').update(bytes).digest('hex').slice(0,16)));
  assert(displayedChapterCollections('copy',{level:'alfa-c',help:'guided'}).some(r=>r.id===row.id));
  const all=new Set(before.flatMap(r=>JSON.parse(readFileSync('public'+r.url)).exercises.map(e=>e.exerciseId)));
  for(const [i,e] of collection.exercises.entries()){
    const s=source[i].sourceRecord;
    assert.equal(e.exerciseId,`KSW-AC-TN-${String(i+1).padStart(3,'0')}`);
    assert(!all.has(e.exerciseId));
    assert.equal(e.exampleWord,s.visibleModel);
    assert.deepEqual(e.fields[0].acceptedAnswers,s.answerModel.acceptedExact);
    assert.equal(e.title,s.instruction);
    assert.equal(e.componentId,'ALF-CMP-006');
    assert.equal(e.answerPolicy,'exact-copy');
    assert.equal(exerciseHelp(e),'Typ precies na. Tik daarna op Controleer.');
    assert.equal(exerciseHelp({...e,answerPolicy:undefined}),'Typ het woord. Tik daarna op Controleer.');
    assert.equal(e.feedback,s.feedback.incorrectSpecific);
    assert(!e.requiresAudio&&!e.prompt&&!e.instructionAudio&&!e.independentReading&&!e.reviewEligible);
  }
});

for(const {id,sourceRecord:s} of source)test(id+' requires the visible characters, case, inner spaces and punctuation',()=>{
  const target=s.visibleModel;
  assert(exactCopyAnswer(target,target));
  assert(exactCopyAnswer(target,`  ${target}  `));
  assert(!exactCopyAnswer(target,target+'x'));
  assert(!exactCopyAnswer(target,target[0]===target[0].toUpperCase()?target[0].toLowerCase()+target.slice(1):target[0].toUpperCase()+target.slice(1)));
  assert(!exactCopyAnswer(target,target.endsWith('.')?target.slice(0,-1):target+'.'));
  if(target.includes(' '))assert(!exactCopyAnswer(target,target.replace(' ','  ')));
});

test('canonical Unicode is accepted without treating a different letter as equal',()=>{
  assert(exactCopyAnswer('café','cafe\u0301'));
  assert(!exactCopyAnswer('café','cafe'));
});
