import test from 'node:test';
import assert from 'node:assert/strict';
import {classroomLessons,phasesForRoute,routeIds} from '../lib/teacher-classroom.ts';

void test('all 58 lessons have eight unnumbered phase titles in all three rounds without changing source content',()=>{
 const before=JSON.stringify(classroomLessons);let checked=0,cleaned=0;
 assert.equal(classroomLessons.length,58);
 for(const lesson of classroomLessons)for(const route of routeIds){
  const original=route==='a'?lesson.phases:lesson.routes[route].phases;
  const phases=phasesForRoute(route,lesson.id);assert.equal(phases.length,8);
  for(const [index,phase] of phases.entries()){
   const source=original[index];const expected=source.title.split('. ').at(-1);
   assert.equal(phase.title,expected,lesson.id+'/'+route+'/'+index);
   assert(!/^(?:Woord|Zin|Tekst)\s+\d|^\d/.test(phase.title));
   assert.deepEqual({...phase,title:source.title},source,'Only the display title changes');
   checked++;if(phase.title!==source.title)cleaned++;
  }
 }
 assert.equal(checked,1392);assert.equal(cleaned,240);assert.equal(JSON.stringify(classroomLessons),before);
 assert.equal(phasesForRoute('a','mat')[0].title,'Kijken');
});
