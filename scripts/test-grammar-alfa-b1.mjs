import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {localGrammarExercises as rows,grammarLessonProposal} from '../lib/local-grammar-lessons.ts';
import {contentPackages} from '../lib/package-content.ts';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {groupExercises} from '../lib/group-practice.ts';
import {selectUsageExercises,defaultRouteSettings,lessonContentLevel} from '../lib/learner-route.ts';
import {exerciseContentLevel,exerciseSetHelp} from '../lib/content-levels.ts';
import {contentTaskIssues,gradeContentResponse} from '../lib/imported-practice-contract.ts';
import {validStandardTask,normalizeAnswer} from '../lib/standard-player-contract.ts';
import {contentById} from '../lib/connected-content.ts';
import {wordAudioIndex,wordAudioParts} from '../lib/word-audio.ts';

void test('All four authored levels are reachable independently, without changing source levels or making mastery claims',()=>{
 assert.equal(new Set(rows.map(e=>e.exerciseId)).size,18);
 for(const [level,count]of Object.entries({'alfa-a':4,'alfa-b':4,'alfa-c':4,b1:6})){
  const collections=availableChapterCollections('grammar-path',{level,help:'practice'}).filter(c=>c.exercises[0].localGrammar);
  assert.equal(collections.flatMap(c=>c.exercises).length,count);
  for(const c of collections){assert.equal(exerciseSetHelp(c.exercises),'practice');for(const e of c.exercises){assert.equal(exerciseContentLevel(e),level);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.localOnly,true);assert.equal(e.assessment,'answer');assert.equal(e.access,'self-practice');}}
 }
});
void test('Every exercise reaches its exact real lesson, or the explicitly separate B1 lesson proposal; filters do not leak other lessons',()=>{
 for(const e of rows){
  const pack=contentPackages.find(p=>p.id===e.packId),lesson=pack?.lessons.find(l=>l.id===e.lessonId);assert(lesson);
  const settings={...defaultRouteSettings,[e.contentAxis]:e.contentLevel};
  const exercises=groupExercises(pack,'grammar-path');
  assert(selectUsageExercises(exercises,pack,lesson,settings,'independent').some(i=>i.exerciseId===e.exerciseId));
  assert(!selectUsageExercises(exercises,pack,lesson,settings,'guided').some(i=>i.exerciseId===e.exerciseId));
  assert(!selectUsageExercises(exercises,pack,{...lesson,id:'unrelated'},settings,'independent').some(i=>i.exerciseId===e.exerciseId));
  assert(!selectUsageExercises(exercises,pack,lesson,{...settings,[e.contentAxis]:e.contentAxis==='language'?'a1':'alfa-b'===e.contentLevel?'alfa-c':'alfa-b'},'independent').some(i=>i.exerciseId===e.exerciseId));
 }
 assert.equal(lessonContentLevel(grammarLessonProposal,grammarLessonProposal.lessons[0]),'b1');assert.equal(grammarLessonProposal.status,'local-proposal');assert.equal(grammarLessonProposal.lessons.length,1);
});
void test('Alfa A requires a whole recording and image choices, without a reading/typing requirement; source transcripts match exactly',()=>{
 for(const e of rows.filter(e=>e.contentLevel==='alfa-a')){assert.equal(e.requiresAudio,true);assert(!e.standardTask);assert.equal(e.options.length,2);for(const o of e.options)assert(existsSync('public'+o.image.src));}
 for(const e of rows.filter(e=>e.requiresAudio)){const s=contentById.get(e.sourceContentIds[0]);assert.equal(s.text,e.sourceTranscript);assert.deepEqual(s.blocks[0].audio,e.prompt.audio);assert(existsSync('public'+e.prompt.audio.src));assert.equal(s.sourceLevel,'A1');assert.equal(e.placementStatus,'preparation');}
});
void test('Alfa gap choices accept their authored answer and reject each distractor; every option has an exact local word recording',()=>{
 for(const e of rows.filter(e=>e.standardTask)){const t=e.standardTask;assert(validStandardTask(t));assert.equal(e.preferChoice,true);assert(t.options.some(o=>!t.acceptedAnswers.includes(o.label)));
  assert.equal(t.before+t.acceptedAnswers[0]+t.after,t.model);
  for(const option of t.options)for(const p of wordAudioParts(option.label).filter(p=>p.word))assert(wordAudioIndex.get(p.word)?.src,p.word);
  assert(t.acceptedAnswers.every(a=>t.options.some(o=>normalizeAnswer(o.label)===normalizeAnswer(a))));
 }
});
void test('B1 has specific feedback, no teacher gate, no exact-text grading of free writing, and exactly one defensible choice',()=>{
 for(const e of rows.filter(e=>e.contentLevel==='b1')){const t=e.contentTask;assert.deepEqual(contentTaskIssues(t),[]);assert.equal(t.correctOptionIds.length,1);assert.equal(gradeContentResponse(t,t.correctOptionIds).correct,true);for(const o of t.options.filter(o=>!t.correctOptionIds.includes(o.id)))assert.equal(gradeContentResponse(t,[o.id]).correct,false);assert(!t.teacherWorkflow);assert(t.feedback.correct.length>30);}
});
