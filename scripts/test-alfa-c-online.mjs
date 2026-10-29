import test from 'node:test';import assert from 'node:assert/strict';
import {functionalBlocks,readFunctionalProgress} from '../lib/alfa-c-functioneel.ts';
import {emptyFunctionalResponse,functionalResponseReady,functionalResponseText,functionalActions,responseForStep,responseLines,isStrikeResponse} from '../lib/alfa-c-response.ts';
import {teacherTasks,startSession,startProblem,appendEvent,firstResponse,readTeacherStore} from '../lib/alfa-c-docent.ts';
test('all online fields require actual input and preserve first and later responses',()=>{
 for(const b of functionalBlocks)for(const step of b.steps){
 const actions=functionalActions(step);if(!step.responseSetup&&!actions.length)continue;
 const r=emptyFunctionalResponse();assert(!functionalResponseReady(step,r),step.id);r.actions=actions.map((_,n)=>n);
 if(isStrikeResponse(step))r.crossed=responseLines(step).map((_,n)=>n);
 if(step.responseSetup?.fields.length)for(const field of step.responseSetup.fields)r.fields[field]='Eigen '+field;else r.text='Eigen eerste antwoord';
 assert(functionalResponseReady(step,r),step.id);const first=structuredClone(r),later={...r,text:'Verbeterd antwoord'};
 const record={assessment:'participation',tries:0,helpUsed:false,response:later,firstResponse:first,completed:true};
 const loaded=readFunctionalProgress(JSON.stringify({version:1,positions:{[b.id]:step.number-1},records:{[step.id]:record}}));
 assert.deepEqual(loaded.records[step.id],record);assert.equal(loaded.records[step.id].correct,undefined);
 assert.equal(responseForStep(step,{...r,actions:[99],crossed:[99]}).crossed.length,0);assert.equal(responseForStep(step,{...r,actions:[99],crossed:[99]}).actions.length,0);
 if(!isStrikeResponse(step))assert(functionalResponseText(step,record));
 }});
test('digital dictee correction links same learner/session and preserves original',()=>{
 const now=new Date().toISOString(),d=teacherTasks.find(t=>t.kind==='dictation'),c=teacherTasks.find(t=>t.kind==='check');
 const prep=t=>({learner:'synthetic',meeting:'test',lesson:'test',preparedMeeting:'test-before',preparedAt:now,timezone:'Europe/Amsterdam',evidence:'test',checks:t.preparation.map(()=>true),exposure:'test',interveningActivity:'test',paperPresent:false});
 let store=startSession({version:1,sessions:[]},d,prep(d),now),id=store.sessions[0].id;
 for(const src of d.stages[0].audio)store=appendEvent(store,id,{type:'audio',stage:0,at:now,src});
 store=appendEvent(store,id,{type:'first',stage:0,at:now,text:'Eigen fout antwoord',responseMedium:'digital'});
 assert.equal(startProblem(store,c,prep(c)),undefined);assert(startProblem(store,c,{...prep(c),learner:'ander'}));assert(startProblem(store,c,{...prep(c),meeting:'ander'}));
 store=startSession(store,c,prep(c),now);assert.equal(store.sessions[1].linkedSessionId,id);
 store=appendEvent(store,store.sessions[1].id,{type:'first',stage:0,at:now,text:'Eigen verbeterd antwoord',responseMedium:'digital'});
 const loaded=readTeacherStore(JSON.stringify(store));assert.equal(firstResponse(loaded.sessions[0],0).text,'Eigen fout antwoord');assert.equal(firstResponse(loaded.sessions[1],0).text,'Eigen verbeterd antwoord');
});
