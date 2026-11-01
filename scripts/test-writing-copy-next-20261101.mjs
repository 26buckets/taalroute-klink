import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exactCopyAnswer,copyDifferenceFeedback} from '../lib/copy-answer.ts';
import {learningGoalFor} from '../lib/learning-goals.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
const json=f=>JSON.parse(readFileSync(f));
const rows=json('docs/writing-copy-next-20261101/source.json').rows;
const currentIndex=json('data/klink-production-index.json');
const index=JSON.parse(execFileSync('git',['show','995ae4407c6b9c0765cf63f801009846ca30ed11:data/klink-production-index.json']));
const before=JSON.parse(execFileSync('git',['show','86ef96a12e8b90a19dccaa56e1711240a39dc4c5:data/klink-production-index.json']));
const added=index.slice(before.length);

test('all existing and new collection banks still pass the shared loader validation',()=>{
  for(const r of currentIndex)assert.equal(validateProductionCollection(json('public'+r.url),r.id,r.count).length,r.count,r.id);
});

test('four source-bound rounds add 80 positions and preserve the first publication',()=>{
  assert.deepEqual(index.slice(0,before.length),before);assert.equal(added.length,4);
  const original=json('public'+before.find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-001-020').url).exercises.find(e=>e.exerciseId==='KSW-AC-TN-020');
  const seen=new Set();const aliases=[];
  for(const r of added){
    const bytes=readFileSync('public'+r.url),c=JSON.parse(bytes);assert(r.url.includes(createHash('sha256').update(bytes).digest('hex').slice(0,16)));
    validateProductionCollection(c,r.id,20);
    for(const e of c.exercises){seen.add(e.exerciseId);const s=rows.find(x=>x.canonicalId===e.exerciseId);assert(s,e.exerciseId);assert.equal(e.exampleWord,s.model);assert.deepEqual(e.fields[0].acceptedAnswers,[s.model]);assert.equal(e.answerPolicy,'exact-copy');assert.equal(e.componentId,'ALF-CMP-006');assert.equal(learningGoalFor(e).learnerText,'Je oefent om de tekst precies over te nemen.');assert(!e.requiresAudio&&!e.prompt&&!e.instructionAudio&&!e.independentReading&&!e.reviewEligible);if(e.exerciseId===original.exerciseId)assert.deepEqual(e,original);else assert.equal(e.feedback,s.feedback);}
    aliases.push(...Object.entries(c.sourceAliases));
  }
  assert.equal(seen.size,80);assert.deepEqual(aliases,[['KSW-AC-TN-097','KSW-AC-TN-020']]);
});

test('80 candidate records remain identical to the current native source documents',()=>{
  const records=[];for(const file of readdirSync('docs/writing-copy-next-20261101/sources')){
    const d=json('docs/writing-copy-next-20261101/sources/'+file);assert(d.revisionId);
    records.push(...d.paragraphs.flatMap(p=>{try{const r=JSON.parse(p.text);return r.id?.startsWith('KSW-AC-TN-')?[r]:[]}catch{return[]}}));
  }
  assert.equal(records.length,80);assert.equal(new Set(records.map(r=>r.id)).size,80);
  for(const r of records){
    const bound=rows.find(x=>x.id===r.id);assert.deepEqual(r,bound.sourceRecord,r.id);
    const model=r.visibleModel??r.displayedSource??r.sourceText??r.source?.visibleText;
    assert.equal(bound.model,model,r.id);assert.equal(model,r.answerModel?.canonical??r.answer?.canonical??r.answerModel?.acceptedExact?.[0],r.id);
  }
});

const first=json('docs/writing-copy-20261101/source.json').rows.map(r=>({id:r.id,model:r.sourceRecord.visibleModel}));
for(const r of [...first,...rows])test(r.id+' has exact spelling and the first differing character in its feedback',()=>{
  const t=r.model;
  assert(exactCopyAnswer(t,'  '+t+'  '));assert.equal(copyDifferenceFeedback(t,'  '+t+'  ','hint'),undefined);
  assert.equal(copyDifferenceFeedback(t,'#'+t.slice(1),'hint'),'Kijk bij teken 1. hint');
  assert.equal(copyDifferenceFeedback(t,t+'x','hint'),`Kijk bij teken ${Array.from(t).length+1}. hint`);
  assert(!exactCopyAnswer(t,t+'x'));
  if(t.includes(' ')){const value=t.replace(' ','  ');assert(!exactCopyAnswer(t,value));assert.equal(copyDifferenceFeedback(t,value,'hint'),`Kijk bij teken ${t.indexOf(' ')+2}. hint`);}
});

test('feedback handles missing punctuation, canonical accents and Unicode characters',()=>{
  assert.equal(copyDifferenceFeedback('Dag.','Dag','Kijk naar de punt.'),'Kijk bij teken 4. Kijk naar de punt.');
  assert.equal(copyDifferenceFeedback('café','cafe\u0301'),undefined);
  assert.equal(copyDifferenceFeedback('🙂a','🙂b'),'Kijk bij teken 2.');
});

test('malformed exact-copy banks are rejected before the input player opens',()=>{
  const row=added[0],valid=json('public'+row.url);
  for(const change of [
    e=>{delete e.fields;},e=>{e.fields=[];},e=>{e.fields[0].acceptedAnswers=[42];},
    e=>{e.fields[0].acceptedAnswers=['een ander model'];},e=>{e.exampleWord='';},e=>{e.componentId='ALF-CMP-017';},
  ]){const invalid=structuredClone(valid);change(invalid.exercises[0]);assert.throws(()=>validateProductionCollection(invalid,row.id,20),/Invalid copy model/);}
});
