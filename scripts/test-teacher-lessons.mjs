import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classroomLessons,getClassroomLesson,phasesForRoute,sequenceForRoute,isCorrectSequence,freshClassroom,restoreClassroom,saveClassroom,readLessonClassroom} from '../lib/teacher-classroom.ts';
test('eight source lessons have 24 complete phases, canonical assets and distinct sentences',()=>{
 assert.deepEqual(classroomLessons.map(l=>l.id),['mat','tas','map','man','pan','jas','pen','pet']);
 for(const l of classroomLessons){
  assert.deepEqual(freshClassroom('basic','a',l.id).shown.slice(0,2),[true,true]);assert.equal(l.word.word,l.id);assert.equal(l.units.join(''),l.id);
  for(const src of [l.word.image,l.word.audio])assert(readFileSync('public'+src).length>500);
  assert(l.exercises.length>0);
  for(const route of ['a','b','c']){
   assert.equal(phasesForRoute(route,l.id).length,8);
   assert(phasesForRoute(route,l.id).every(p=>p.prompt&&p.action&&p.observe&&p.framework&&p.minutes>0));
   const seq=sequenceForRoute(route,l.id);assert(isCorrectSequence(route,seq.map((_,i)=>i),l.id));
   assert(!isCorrectSequence(route,seq.map(()=>0),l.id));assert(!isCorrectSequence(route,[999],l.id));
  }
  assert.equal(l.routes.c.example.split('\n')[0],l.routes.b.example);
  if(l.id!=='mat')assert(!JSON.stringify(l).includes('veeg mijn voeten'));
 }
 assert.equal(sequenceForRoute('c','jas').length,5);assert.equal(sequenceForRoute('c','pen').length,6);
 const man=sequenceForRoute('c','man'),order=man.map((_,i)=>i),duplicates=order.filter(i=>man[i]==='zijn');
 [order[duplicates[0]],order[duplicates[1]]]=[order[duplicates[1]],order[duplicates[0]]];assert(isCorrectSequence('c',order,'man'));
});
test('saved lesson state migrates mat and rejects foreign exercise IDs, unknown letters and excessive input',()=>{
 assert.equal(restoreClassroom('{"active":false}').lessonId,'mat');
 assert.equal(restoreClassroom('{"lessonId":"unknown"}').lessonId,'mat');
 const s=restoreClassroom(JSON.stringify({...freshClassroom('basic','c','tas'),tiles:['m','a','s'],exerciseId:getClassroomLesson('pen').exercises[0].exerciseId,ownSentence:'x'.repeat(200),order:[0,0,100,1]}));
 assert.deepEqual(s.tiles,['','a','s']);assert.equal(s.exerciseId,undefined);assert.equal(s.ownSentence.length,160);assert.deepEqual(s.order,[0,1]);
});
test('per-lesson progress is isolated and corrupted or unavailable storage does not open another lesson',()=>{
 const data=new Map();globalThis.sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 try{
  for(const id of ['mat','tas','pen'])saveClassroom({...freshClassroom('basic','c',id),phase:6,ownSentence:'Mijn '+id});
  for(const id of ['mat','tas','pen'])assert.equal(readLessonClassroom(id).ownSentence,'Mijn '+id);
  data.set('klink.docent.les.v1.tas',JSON.stringify(freshClassroom('basic','c','pen')));assert.equal(readLessonClassroom('tas').lessonId,'tas');assert.equal(readLessonClassroom('tas').ownSentence,'');
  globalThis.sessionStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
  assert.equal(saveClassroom(freshClassroom('basic','a','pet')),false);assert.equal(readLessonClassroom('pet').lessonId,'pet');
 }finally{delete globalThis.sessionStorage;}
});
