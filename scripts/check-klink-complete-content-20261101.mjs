import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const folder='docs/klink-complete-release-20261101/';
export function verifyCompleteContent(read=readFileSync){
 const json=file=>JSON.parse(read(file));
 const manifest=json(folder+'import-manifest.json'),baseline=json(folder+'baseline.json');
 const index=json('data/klink-production-index.json'),rows=manifest.rows;
 assert.equal(rows.length,158);assert.equal(new Set(index.map(r=>r.id)).size,index.length);
 const oldIndex=JSON.parse(execFileSync('git',['show',baseline.sourceBase+':data/klink-production-index.json'],{maxBuffer:64e6}));
 const originalIds=new Set(baseline.originalRows.map(r=>r.id));
 for(const old of oldIndex){const current=index.find(r=>r.id===old.id);assert(current,'Missing old collection '+old.id);if(!originalIds.has(old.id))assert.deepEqual(current,old,'Unrelated collection '+old.id);}
 const all=rows.flatMap(row=>{
  assert.deepEqual(index.find(r=>r.id===row.id),row);
  const value=json('public'+row.url);assert.equal(value.id,row.id);assert.equal(value.exercises.length,row.count);
  assert.equal(row.help,'practice');
  return value.exercises.map(exercise=>({row,exercise}));
 });
 assert.equal(all.length,1740);assert.equal(new Set(all.map(x=>x.exercise.exerciseId)).size,1740);
 const questions=all.filter(x=>x.exercise.mode==='text-question');assert.equal(questions.length,1240);
 let explanations=0;
 for(const {exercise:e}of questions){
  assert.equal(e.options.length,3);assert.equal(new Set(e.options.map(o=>o.id)).size,3);assert.equal(new Set(e.options.map(o=>o.label)).size,3);
  assert.equal(e.answer.correctOptionIds.length,1);assert(e.options.some(o=>o.id===e.answer.correctOptionIds[0]));
  assert.equal(e.manualAdvance,true);assert.equal(e.assessment,'answer');assert.equal(e.independentReading,false);
  assert.deepEqual(Object.keys(e.optionFeedback).sort(),e.options.map(o=>o.id).sort());
  for(const o of e.options){assert.equal(typeof e.optionFeedback[o.id],'string');assert(e.optionFeedback[o.id].trim());explanations++;}
  assert(e.sourceBlocks.length);assert.equal(e.sourceText,e.sourceBlocks.map(b=>b.text).join('\n'));
  for(const b of e.sourceBlocks){assert(b.audio?.src);assert(read('public'+b.audio.src).length>1000);}
 }
 assert.equal(explanations,3720);
 for(const level of ['A1','A2']){
  const source=json(folder+'sources/R7-PORTABLE-IMPORTMODEL-'+level+'.json').texts;
  const targets=all.filter(x=>x.row.activity==='text-question'&&x.row.level===level.toLowerCase());assert.equal(targets.length,400);
  assert.equal(new Set(targets.map(x=>x.exercise.sourceContentIds[0])).size,100);
  for(const text of source){
   const actual=targets.filter(x=>x.exercise.sourceContentIds[0]===text.id).map(x=>x.exercise);assert.equal(actual.length,4,text.id);
   for(const q of text.questions){
    const e=actual.find(x=>x.sourceQuestionId===q.id||x.question===q.prompt);assert(e,q.id);
    assert.equal(e.sourceText,text.text);assert.equal(e.contentTitle,text.title);assert.equal(e.question,q.prompt);
    assert.deepEqual(e.options,q.options.map(o=>({id:o.id,label:o.label})));
    assert.deepEqual(e.answer.correctOptionIds,[q.correctOptionId]);assert.equal(q.answerText,q.options.find(o=>o.id===q.correctOptionId).label);
    assert.deepEqual(e.optionFeedback,Object.fromEntries(q.options.map(o=>[o.id,o.explanation])));
    for(const evidence of q.evidenceSegments)assert(text.text.includes(evidence),q.id+' evidence');
    if(e.sourceQuestionId)assert.deepEqual(e.sourceEvidenceSegments,q.evidenceSegments);
   }
  }
 }
 const goals=json(folder+'sources/R7-200-CANONIEKE-DOELKOPPELINGEN.json').textGoalLinks;
 assert.equal(goals.length,200);assert.equal(new Set(goals.map(g=>g.textId)).size,200);
 for(const goal of goals){
  const source=json(folder+'sources/R7-PORTABLE-IMPORTMODEL-'+goal.level+'.json').texts.find(t=>t.id===goal.textId);assert(source);
  assert.equal(goal.title,source.title);assert.deepEqual(goal.questionIds,[...source.questions.map(q=>q.id)]);assert(goal.existingGoalFamily);
 }
 let legacy=0;
 for(const row of baseline.originalRows.filter(r=>r.id.startsWith('klink-teksten-zelf-'))){
  const before=json('public'+row.url).exercises,current=all.filter(x=>x.row.id===row.id).map(x=>x.exercise);
  assert.equal(current.length,before.length);
  for(const e of current){const {optionFeedback,...unchanged}=e;assert(optionFeedback);assert.deepEqual(unchanged,before.find(x=>x.exerciseId===e.exerciseId));legacy++;}
 }
 assert.equal(legacy,24);
 const sentences=json(folder+'sources/KLINK_ZINNEN_200_NATUURLIJKHEID_V23_HOLD_20261101.json').items;
 assert.equal(sentences.length,200);
 for(const source of sentences){
  const e=all.find(x=>x.exercise.exerciseId===source.id)?.exercise;assert(e,source.id);
  assert.equal(e.question,source.question);assert.equal(e.sourceText,source.sourceText);
  assert.deepEqual(e.sourceBlocks,source.sourceSegments.map(s=>({id:s.sourceId,text:s.text,audio:s.audio})));
  assert.deepEqual(e.options,source.options.map(o=>({id:o.id,label:o.text})));
  assert.deepEqual(e.answer.correctOptionIds,[source.correctOptionId]);assert.deepEqual(e.optionFeedback,Object.fromEntries(source.options.map(o=>[o.id,o.why])));
 }
 const b1=json(folder+'sources/b1-source-texts.json'),repairs=json(folder+'b1-question-review.json');
 assert.equal(b1.length,120);assert.equal(repairs.length,114);
 for(const text of b1){
  const actual=all.filter(x=>x.exercise.sourceContentIds[0]===text.id).map(x=>x.exercise);assert.equal(actual.length,2,text.id);
  for(const source of text.questions){
   const e=actual.find(x=>x.exerciseId===source.id);assert(e);assert.equal(e.sourceText,text.text);assert.equal(e.contentTitle,text.title);
   const patched=repairs.find(r=>r.textId===text.id&&r.revisedQuestion.id===source.id),q=patched?.revisedQuestion??source;
   assert.equal(e.question,q.question);assert.deepEqual(e.options,q.options.map(o=>({id:o.id,label:o.label})));
   assert.deepEqual(e.answer.correctOptionIds,[source.correctOptionId]);assert.deepEqual(e.optionFeedback,Object.fromEntries(q.options.map(o=>[o.id,o.feedback])));
  }
 }
 const speaking=json(folder+'sources/opdrachten_500_staging.json').items,bindings=json(folder+'voice-plan.json').bindings;
 assert.equal(speaking.length,500);
 for(const source of speaking){
  const e=all.find(x=>x.exercise.exerciseId===source.id)?.exercise;assert(e,source.id);
  assert.equal(e.displayWord,source.reference);assert.equal(e.helpWord,source.reference);assert.deepEqual(e.prompt.audio,bindings[source.id]);
  assert.equal(e.componentId,'ALF-CMP-009');assert.equal(e.assessment,'participation');assert.equal(e.automaticPronunciationScoring,false);
  assert.equal(e.requiresAudio,true);assert(e.instructionAudio.src);assert.notEqual(e.instructionAudio.src,e.prompt.audio.src);
 }
 return {rows:158,exercises:1740,texts:200,textQuestions:800,sentenceQuestions:200,speakingTasks:500,b1Texts:120,b1Questions:240,optionExplanations:explanations,legacyQuestionsPreserved:legacy,goalMappings:200};
}
