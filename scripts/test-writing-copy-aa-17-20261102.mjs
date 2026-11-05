import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {productionIndex,validateProductionCollection} from '../lib/production-practice.ts';
import {contentPackages} from '../lib/package-content.ts';
import {groupExercises} from '../lib/group-practice.ts';
import {displayedChapterCollections,chapterExerciseChoices} from '../lib/practice-chapters.ts';
import {learningGoalFor} from '../lib/learning-goals.ts';
import {exactCopyAnswer} from '../lib/copy-answer.ts';
import {wordAudioParts} from '../lib/word-audio.ts';
import {recordingForWord} from '../lib/word-listening.ts';

const folder='docs/writing-copy-aa-17-20261102/';
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json'));
const source=new Map(readFileSync(folder+'source-records.jsonl','utf8').trim().split('\n').map(JSON.parse).map(r=>[r.id,r]));
const models=JSON.parse(readFileSync(folder+'existing-models.json'));
const adaptations=new Map(JSON.parse(readFileSync(folder+'editorial-adaptations.json')).changes.map(c=>[c.sourceId,c]));
const rows=manifest.newRows.map(item=>item.row),ids=new Set(rows.map(row=>row.id));
const banks=rows.map(row=>({row,exercises:validateProductionCollection(JSON.parse(readFileSync('public'+row.url)),row.id,row.count)}));

void test('seventeen exact-copy criteria retain native source text, models and the existing answer policy',()=>{
 const seen=new Set();
 for(const{row,exercises}of banks){
  assert.deepEqual(productionIndex.find(r=>r.id===row.id),row);assert.equal(row.level,'alfa-a');assert.equal(row.help,'guided');assert([5,6].includes(exercises.length));
  assert.equal(createHash('sha256').update(readFileSync('public'+row.url)).digest('hex'),manifest.newRows.find(r=>r.row.id===row.id).sha256);
  for(const e of exercises){
   const r=source.get(e.exerciseId),s=r.sourceRecord;assert(!seen.has(e.exerciseId));seen.add(e.exerciseId);
   const adaptation=adaptations.get(e.exerciseId);if(adaptation)assert.equal(adaptation.before,s.feedbackRetry);
   assert.equal(e.sourceRecordSha256,r.recordSha256);assert.equal(e.sourceRevisionId,r.revisionId);assert.equal(e.title,s.learnerInstruction);assert.equal(e.exampleWord,s.stimulus);assert.equal(e.feedback,adaptation?.after??s.feedbackRetry);assert.equal(e.correctFeedback,s.feedbackCorrect);
   assert.equal(e.answerPolicy,'exact-copy');assert.deepEqual(e.fields,[{id:'copy',acceptedAnswers:s.acceptedAnswers}]);
   assert(exactCopyAnswer(e.exampleWord,e.exampleWord));assert(exactCopyAnswer(e.exampleWord,'  '+e.exampleWord+'  '));
   for(const wrong of[e.exampleWord.toUpperCase(),e.exampleWord+'x',e.exampleWord+'!'])assert(!exactCopyAnswer(e.exampleWord,wrong));
   if(e.exampleWord.length>1)assert(!exactCopyAnswer(e.exampleWord,e.exampleWord[0]+' '+e.exampleWord.slice(1)));
   assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.requiresAudio,false);assert.equal(e.access,'teacher-supported');assert.equal(e.notForPublication,undefined);
   assert.equal(learningGoalFor(e).id,'overschrijven');assert.equal(learningGoalFor(e).learnerText,'Je oefent om de tekst precies over te nemen.');
   for(const field of['title','exampleWord','feedback','correctFeedback'])for(const part of wordAudioParts(e[field]))if(part.word)assert(recordingForWord(part.text),part.text);
  }
 }
 assert.equal(seen.size,17);assert.equal(manifest.newWordModels,0);assert(manifest.noHandwritingClaim);
});

void test('the existing Alfa A rows and seventeen active model exercises retain their original content and grading',()=>{
 // Later approved imports may change unrelated rows; this regression protects the original Alfa A tasks.
 assert.deepEqual(productionIndex.find(row=>row.id===manifest.existingAaThreeRowUnchanged.id),manifest.existingAaThreeRowUnchanged);
 const wanted=new Set(models.map(r=>r.canonicalModelId));
 const active=new Map(contentPackages.flatMap(p=>groupExercises(p,'write-letter').filter(e=>wanted.has(e.exerciseId)).map(e=>[e.exerciseId,e])));
 for(const row of productionIndex.filter(r=>r.activity==='copy'&&!ids.has(r.id)))for(const e of JSON.parse(readFileSync('public'+row.url)).exercises)if(wanted.has(e.exerciseId))active.set(e.exerciseId,e);
 for(const r of models){
  const original=active.get(r.canonicalModelId);assert(original,r.canonicalModelId);assert.deepEqual(JSON.parse(JSON.stringify(original)),r.originalExercise);
  assert.equal(original.target??original.exampleWord,r.target);assert.notEqual(original.answerPolicy,'exact-copy');
  const e=banks.flatMap(bank=>bank.exercises).find(e=>e.exerciseId===r.sourceId);assert.equal(e.existingModelExerciseId,original.exerciseId);
 }
 const existing=manifest.existingAaThreeRowUnchanged;
 assert.deepEqual(readFileSync('public'+existing.url),execFileSync('git',['show','0990f8abd62acd9bd6148c1616d8d5d8866d12c0:public'+existing.url]));
});

void test('the new source rows stay guided Alfa A copy tasks without offering a different word set',()=>{
 const available=displayedChapterCollections('copy',{chapter:'writing',level:'alfa-a',help:'guided'});
 for(const row of rows){assert(available.some(r=>r.id===row.id));for(const choice of chapterExerciseChoices({chapter:'writing',activity:'copy',collection:row.id,level:'alfa-a',help:'guided'})){assert.equal(choice.id,'copy');assert.equal(choice.collection,row.id);}}
 for(const filter of[{level:'alfa-a',help:'practice'},{level:'alfa-c',help:'guided'}])assert(!displayedChapterCollections('copy',{chapter:'writing',...filter}).some(row=>ids.has(row.id)));
});
