import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import additional from '../data/klink-docent-extra-lessons.json' with {type:'json'};
import {classroomLessons,getClassroomLesson,freshClassroom,placeTile,restoreClassroom,classroomSoundId,isCorrectSequence,sequenceForRoute} from '../lib/teacher-classroom.ts';
import {worksheets,worksheetSelection,worksheetHash} from '../lib/teacher-worksheets.ts';

const groups=['kam kat kan','kip kin ik','in is en kast','mes nek mens','pak bon bot','bus dak bed dit','kop kok op','mus kus munt','mand mond kind post'];
void test('all nine packages retain 30 lesson kernels, 720 phases and 900 matching answers',()=>{
 assert.equal(classroomLessons.length,58);assert.equal(worksheets.length,58);
 assert.deepEqual(additional.map(x=>x.id),groups.flatMap(x=>x.split(' ')));
 assert.deepEqual(worksheets.map(x=>x.id),classroomLessons.map(x=>x.id));
 const ids=new Set();let phases=0,answers=0;
 for(const source of additional){
  const l=getClassroomLesson(source.id);assert.equal(l.word.id,source.wordRef);assert.equal(l.word.word,l.id);
  assert.equal(l.routes.b.example,source.source.sentence);assert.deepEqual(l.routes.c.example.split('\n'),source.source.text);
  assert(l.exercises.length);assert(readFileSync('public'+l.boardImage).length>100);assert(readFileSync('public'+l.word.audio).length>100);
  for(const r of ['a','b','c']){
   assert.equal(l.routes[r].phases.length,8);phases+=8;
   for(const p of l.routes[r].phases){for(const k of ['title','prompt','action','observe','expected','hint','studentAction','visible','materials'])assert(p[k],`${l.id}/${r}/${k}`);assert(p.minutes>0);assert(!/Alfa [ABC]|KPD-|schema|importgarantie/.test(p.prompt+' '+p.studentAction));}
   const seq=sequenceForRoute(r,l.id);assert(isCorrectSequence(r,seq.map((_,i)=>i),l.id));assert(!isCorrectSequence(r,[999],l.id));
   const sheet=source.worksheet.rounds[r];assert.equal(sheet.answers.length,10);assert.deepEqual(sheet.answers.map(x=>x.number),[1,2,3,4,5,6,7,8,9,10]);
   for(const item of sheet.answers){assert(item.title&&item.body&&item.answer&&item.criteria);assert(!ids.has(item.id));ids.add(item.id);answers++;}
   const selection=worksheetSelection(worksheetHash(l.id,r,true));assert.equal(selection.lesson.id,l.id);assert.equal(selection.round,r);assert(selection.fromLesson);
   for(const pdf of [sheet.pdf,sheet.answerPdf]){const info=execFileSync('pdfinfo',['public'+pdf],{encoding:'utf8'});assert.match(info,/Pages:\s+2\b/);assert.match(info,/Page size:.*A4/);}
   for(const image of sheet.previews)assert(readFileSync('public'+image).length>1000);
  }
  assert(readFileSync('public'+source.worksheet.planPdf).length>1000);
 }
 assert.equal(phases,720);assert.equal(answers,900);assert.equal(ids.size,900);
});
void test('repeated letters build, move, clear and restore without admitting excess copies',()=>{
 const state=freshClassroom('basic','a','kok');
 for(const letter of ['k','o','k'])state.tiles=placeTile(state.tiles,letter,undefined,'kok');
 assert.deepEqual(state.tiles,['k','o','k']);assert.deepEqual(restoreClassroom(JSON.stringify(state)).tiles,state.tiles);
 assert.deepEqual(restoreClassroom(JSON.stringify({...state,tiles:['k','k','k']})).tiles,['k','k','']);
 assert.deepEqual(placeTile(['k','o',''],'k',2,'kok'),['k','o','k']);
 assert.deepEqual(placeTile(['k','','k'],'o',1,'kok'),['k','o','k']);
 assert.deepEqual(placeTile(['m','a','t'],'m',2,'mat'),['t','a','m']);
 assert.deepEqual(placeTile(['k','o','k'],'x',1,'kok'),['k','o','k']);
});
void test('final d uses the existing t sound, while initial d and written letters remain intact',()=>{
 for(const word of ['bed','mand','mond','kind']){const units=getClassroomLesson(word).units;assert.equal(units.at(-1),'d');assert.equal(classroomSoundId(units,units.length-1),'t');}
 assert.equal(classroomSoundId(getClassroomLesson('dak').units,0),'d');
 assert.equal(classroomSoundId(getClassroomLesson('post').units,3),'t');
 assert.deepEqual(getClassroomLesson('kok').units.map((_,i)=>classroomSoundId(getClassroomLesson('kok').units,i)),['k','o','k']);
});
void test('review repairs preserve meaning, exact text evidence and matching models',()=>{
 const sheet=(word,r,n)=>additional.find(l=>l.id===word).worksheet.rounds[r].answers[n-1];
 assert.match(sheet('kam','c',9).answer,/in mijn tas/);assert.match(sheet('bed','a',2).answer,/3 t/);
 assert.match(sheet('bon','c',8).title,/zin 3/);assert.match(sheet('bon','c',8).answer,/bewaar/);
 assert.match(sheet('kind','c',5).answer,/kind en de ouder/);assert.match(sheet('kind','c',9).answer,/ouder loopt mee/);
 assert.match(sheet('post','c',7).answer,/op tafel/);assert.equal(sheet('dit','b',3).visual,'pak');
 assert.match(getClassroomLesson('bot').routes.b.phases[2].action,/geen ie/);
 assert.match(getClassroomLesson('bon').boardImage,/bon-kassabon/);assert.match(getClassroomLesson('bot').boardImage,/bot-arm/);
});
