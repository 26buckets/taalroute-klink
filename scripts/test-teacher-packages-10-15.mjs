import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import extra from '../data/klink-docent-extra-lessons-10-15.json' with {type:'json'};
import prior from '../data/klink-docent-extra-lessons.json' with {type:'json'};
import {classroomLessons,getClassroomLesson,freshClassroom,placeTile,restoreClassroom,classroomSoundId,sequenceForRoute,isCorrectSequence} from '../lib/teacher-classroom.ts';
import {worksheets,worksheetHash,worksheetSelection} from '../lib/teacher-worksheets.ts';
const groups=['sok stop stad','boom boon boot','tand been bord jurk','kaak kaas naam','kook koop maak','maan maand mee meer'];
const item=(w,r,n)=>extra.find(l=>l.id===w).worksheet.rounds[r].answers[n-1];
test('packages 10–15 append twenty complete lessons and retain the previous 38',()=>{
 assert.deepEqual(extra.map(l=>l.id),groups.flatMap(g=>g.split(' ')));
 assert.equal(classroomLessons.length,58);assert.equal(worksheets.length,58);
 assert.deepEqual(classroomLessons.slice(8,38).map(l=>l.id),prior.map(l=>l.id));
 assert.deepEqual(worksheets.map(l=>l.id),classroomLessons.map(l=>l.id));
 const ids=new Set();let phases=0,answers=0;
 for(const source of extra){
  const l=getClassroomLesson(source.id);assert.equal(l.word.id,source.wordRef);assert.equal(l.routes.b.example,source.source.sentence);assert.deepEqual(l.routes.c.example.split('\n'),source.source.text);
  assert(l.exercises.length);for(const f of [l.boardImage,l.word.audio,source.worksheet.planPdf])assert(readFileSync('public'+f).length>100);
  for(const r of ['a','b','c']){
   assert.equal(l.routes[r].phases.length,8);phases+=8;
   for(const p of l.routes[r].phases){for(const k of ['title','prompt','action','observe','expected','hint','studentAction','visible','materials'])assert(p[k],l.id+'/'+r+'/'+k);assert(p.minutes>0);assert(!/Alfa [ABC]|KPD-|schema|importgarantie/.test(p.prompt+' '+p.studentAction));}
   const seq=sequenceForRoute(r,l.id);assert(isCorrectSequence(r,seq.map((_,i)=>i),l.id));assert(!isCorrectSequence(r,[999],l.id));
   const s=source.worksheet.rounds[r];assert.equal(s.answers.length,10);
   for(const x of s.answers){assert(x.title&&x.body&&x.answer&&x.criteria);assert(!ids.has(x.id));ids.add(x.id);answers++;}
   const pick=worksheetSelection(worksheetHash(l.id,r,true));assert.equal(pick.lesson.id,l.id);assert.equal(pick.round,r);assert(pick.fromLesson);
   for(const f of [s.pdf,s.answerPdf]){const info=execFileSync('pdfinfo',['public'+f],{encoding:'utf8'});assert.match(info,/Pages:\s+2\b/);assert.match(info,/Page size:.*A4/);}
   for(const f of s.previews)assert(readFileSync('public'+f).length>1000);
  }
 }
 assert.equal(phases,480);assert.equal(answers,600);assert.equal(ids.size,600);
});
test('long vowels and duplicate k tiles build and restore as complete sound cards',()=>{
 for(const [w,units]of [['kaak',['k','aa','k']],['kook',['k','oo','k']],['mee',['m','ee']]]){
  assert.deepEqual(getClassroomLesson(w).units,units);const state=freshClassroom('basic','a',w);
  for(const u of units)state.tiles=placeTile(state.tiles,u,undefined,w);
  assert.deepEqual(state.tiles,units);assert.deepEqual(restoreClassroom(JSON.stringify(state)).tiles,units);
 }
 for(const w of ['stad','tand','bord','maand']){const units=getClassroomLesson(w).units;assert.equal(units.at(-1),'d');assert.equal(classroomSoundId(units,units.length-1),'t');}
});
test('source review blockers have matching questions, precise answers and explicit April context',()=>{
 assert.match(item('sok','c',3).title,/tweede zin/);assert.match(item('stop','a',10).body,/Ik ____ bij de deur/);assert.equal(item('stad','a',8).answer,'d');assert.match(item('stad','c',8).body,/persoon in de tekst koopt/);
 for(const w of ['boon','boot'])assert.match(item(w,'a',7).answer,/1, 5 en 8/);
 assert.equal(item('boon','b',4).answer,'bruine');assert(!/boon|boot/.test(item('boom','b',9).answer));
 assert.equal(item('tand','b',1).answer,'tand');assert.equal(item('been','b',1).answer,'been');assert.match(item('been','b',8).answer,/doet pijn/);assert.match(item('bord','c',10).body,/moet liggen/);assert.match(item('jurk','c',9).answer,/pak ik hem uit de kast/);
 for(const [w,q]of [['kook','Wie kookt de bonen?'],['koop','Wie koopt een brood?'],['maak','Wie maakt een kaart?']])assert.equal(item(w,'b',8).title,q);
 assert(!/gekocht/.test(item('koop','c',10).answer));assert(!/erop/.test(item('maak','c',10).answer));
 const month=getClassroomLesson('maand');for(const r of ['b','c'])for(const p of month.routes[r].phases)assert.match(p.prompt,/Oefensituatie: het is nu april 2027/);
 assert.match(item('maand','a',2).answer,/4 t/);assert.equal(item('maand','a',8).answer,'d');assert.equal(item('mee','b',8).answer,'buur');assert(!/gedaan/.test(item('mee','c',10).answer));assert.equal(item('meer','b',4).answer,'meer soep');assert.equal(item('meer','c',8).answer,'In mijn kom.');
});
