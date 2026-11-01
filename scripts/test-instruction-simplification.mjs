import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='data/klink-imported-practice.json';
const proof=JSON.parse(readFileSync('docs/instruction-simplification-20261101/amendment.json'));
const prior=JSON.parse(execFileSync('git',['show',`${proof.sourceCommit}:${file}`],{maxBuffer:20e6}));
const current=JSON.parse(readFileSync(file));
void test('Exact reviewed wording is the only change; IDs, saved-answer hashes, targets, criteria and media stay intact',()=>{
 const restored=structuredClone(current);
 for(const change of proof.changes){
  assert.equal(change.file,file);
  assert.equal(change.path[0],'items');
  const [,index,...path]=change.path;
  assert(['grammar','spelling'].includes(current.items[index].teacherWorkflow.kind));
  const key=path.join('/');
  const ordinary=/^(prompt|stimulus|teacherWorkflow\/phases\/0\/(instruction|learnerText\/[12]))$/.test(key);
  const roleNote=current.items[index].id==='kg-a1-f15-001'&&['teacherGuidance','teacherWorkflow/expected'].includes(key);
  assert(ordinary||roleNote,`Unreviewed field ${key}`);
  let parent=restored;for(const part of change.path.slice(0,-1))parent=parent[part];
  assert.equal(parent[change.path.at(-1)],change.after);parent[change.path.at(-1)]=change.before;
 }
 assert.deepEqual(restored,prior);
});
void test('Every mirrored instruction agrees; identical spelling tasks receive the same shorter instruction',()=>{
 const templates=new Map();
 for(const [i,item]of current.items.entries()){
  const flow=item.teacherWorkflow;if(!flow||!['grammar','spelling'].includes(flow.kind))continue;
  const phase=flow.phases[0];
  if(flow.kind==='grammar'&&phase.learnerText.length===3){
   assert.equal(phase.learnerText[2],item.prompt,item.id);assert.equal(phase.instruction,item.prompt,item.id);assert.equal(phase.learnerText[1],item.stimulus,item.id);
  }
  if(flow.kind==='spelling'){
   const old=prior.items[i].teacherWorkflow.phases[0].instruction;
   if(templates.has(old))assert.equal(phase.instruction,templates.get(old));
   templates.set(old,phase.instruction);assert.deepEqual(phase.learnerText,prior.items[i].teacherWorkflow.phases[0].learnerText);
  }
 }
});
void test('The email still requires every teaching point and keeps both deliberately flawed examples',()=>{
 const item=current.items.find(x=>x.id==='kg-b1-g62-001');
 for(const text of ['drie korte alinea’s','Wat is er mis?','Waarom wil je iets veranderen?','Wat vraag je?','één dat- of omdat-bijzin','één duidelijke verwijzing','Omdat ik overdag werk ik kan alleen in de avond komen.','Deze wil ik wijzigen.','hele e-mail met aanhef en afsluiting'])assert(item.prompt.includes(text),text);
 for(const text of ['3 maart','oefencursus','groep B','groep A','inhoud is gelijk','alleen groep B is ’s avonds','Je werkt overdag','aanmelding kan veranderen','vóór de eerste les antwoord','zakelijke, gewone e-mail','Verstuur die niet echt'])assert(item.stimulus.includes(text),text);
 const old=prior.items.find(x=>x.id===item.id);
 assert(item.prompt.split(/\s+/).length<old.prompt.split(/\s+/).length);
 assert(item.stimulus.split(/\s+/).length<old.stimulus.split(/\s+/).length);
});
