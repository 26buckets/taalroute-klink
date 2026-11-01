import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {availableChapterCollections,availableChapterActivities,chapterCollections} from '../lib/practice-chapters.ts';
import {groupExercises} from '../lib/group-practice.ts';
import {selectUsageExercises,defaultRouteSettings} from '../lib/learner-route.ts';
import {exerciseSetHelp,exerciseContentLevel} from '../lib/content-levels.ts';
import {importedItems,importedExercise} from '../lib/imported-practice.ts';
import {wordAudioParts,wordAudioIndex,createWordAudioIndex,isLocalWordAudioHost} from '../lib/word-audio.ts';
import {gradeContentResponse} from '../lib/imported-practice-contract.ts';

void test('Grammar starts independently at its authored levels, with honest reading conditions and existing lesson links',()=>{
 for(const level of ['a1','a2']) {
  assert(availableChapterActivities('grammar',{level,help:'practice'}).length>=3);
  for(const activity of ['grammar-path','sentence-build','verb-choice']) for(const c of availableChapterCollections(activity,{level,help:'practice'})) {
   assert.equal(exerciseSetHelp(c.exercises),'practice');
   for(const e of c.exercises) {
    assert.equal(e.access,'self-practice');assert.equal(e.independentReading,false);
    assert(c.pack.lessons.some(l=>l.id===e.lessonId));
    assert(e.sourceLessonIds.includes(e.lessonId));
    assert(['a1', level].includes(exerciseContentLevel(e)));
   }
  }
 }
 // No invented Alfa/B1 content or relabelling of A1 sentences as early reading.
 for(const level of ['alfa-a','alfa-b','alfa-c','b1'])assert.equal(availableChapterActivities('grammar',{level,help:'practice'}).length,0);
});
void test('All 16 existing grammar choices can be checked without teacher preparation; open work stays optional and unscored',()=>{
 const choices=importedItems.filter(i=>i.domain==='grammatica'&&i.mode==='choice');assert.equal(choices.length,16);
 for(const i of choices){assert.equal(importedExercise(i).access,'self-practice');assert.equal(gradeContentResponse(i,i.correctOptionIds).correct,true);assert.equal(gradeContentResponse(i,[]).correct,false);}
 const open=importedItems.filter(i=>i.domain==='grammatica'&&i.mode==='teacher');assert.equal(open.length,92);
 for(const i of open){const e=importedExercise(i);assert.equal(e.access,'teacher-supported');assert.equal(e.assessment,'participation');assert.equal(e.reviewEligible,false);}
 assert(availableChapterCollections('content-grammatica',{level:'a2',help:'guided'}).length);
});
void test('Lesson route filters the exact lesson and selected language; complete grammar paths remain together',()=>{
 for(const activity of ['grammar-path','sentence-build','verb-choice']) {
  const settings={...defaultRouteSettings,language:'a2'};
  const c=chapterCollections(activity).find(c=>c.level==='a2' && c.pack.lessons.some(l=>selectUsageExercises(groupExercises(c.pack,activity),c.pack,l,settings,'independent').length));assert(c);
  const all=groupExercises(c.pack,activity),lesson=c.pack.lessons.find(l=>selectUsageExercises(all,c.pack,l,settings,'independent').length);
  const chosen=selectUsageExercises(all,c.pack,lesson,settings,'independent');assert(chosen.length);
  assert(activity === 'grammar-path' ? chosen.some(e=>e.sourceLessonIds.includes(lesson.id)) : chosen.every(e=>e.sourceLessonIds.includes(lesson.id)));
  if(activity === 'grammar-path')for(const id of new Set(chosen.map(e=>e.learningPathId)))assert.deepEqual(chosen.filter(e=>e.learningPathId===id),all.filter(e=>e.learningPathId===id));
  assert(chosen.every(e=>['a1','a2'].includes(exerciseContentLevel(e))));
  assert.equal(selectUsageExercises(chosen,c.pack,lesson,settings,'guided').length,0);
  assert.equal(selectUsageExercises(chosen,c.pack,{...lesson,id:'unrelated'},settings,'independent').length,0);
  assert.equal(selectUsageExercises(chosen,c.pack,lesson,{...settings,language:'b1'},'independent').length,0);
 }
});
void test('Word playback preserves exact punctuation and cannot use ambiguous, rejected or remote media',()=>{
 const text='We werken, één dag. Wie’s er?';assert.equal(wordAudioParts(text).map(p=>p.text).join(''),text);
 assert.equal(createWordAudioIndex([{word:'we',audio:'/package-audio/a.mp3',audioStatus:'approved'},{word:'we',audio:'/package-audio/b.mp3',audioStatus:'approved'}]).get('we').status,'ambiguous');
 assert.equal(createWordAudioIndex([{word:'we',audio:'https://example.com/we.mp3'}]).get('we').status,'blocked');
 assert.equal(createWordAudioIndex([{word:'we',audio:'/package-audio/we.mp3',audioStatus:'rejected'}]).get('we').status,'blocked');
 assert.equal(isLocalWordAudioHost('klink.taalroute.nl'),false);assert.equal(isLocalWordAudioHost('127.0.0.1'),true);
 for(const row of JSON.parse(readFileSync('data/klink-inline-word-audio.json'))){assert.equal(row.localOnly,true);assert(existsSync('public'+row.src));}
 assert(wordAudioIndex.get('we')?.src);
});
