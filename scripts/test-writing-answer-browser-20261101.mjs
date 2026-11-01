import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
import {writingDictationRounds} from '../lib/writing-dictation.ts';
import {writingAnswerKey,writingAnswerSourceId} from '../lib/writing-answer.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {collectionProgressId} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||'docs/writing-dictation-20261101/local';mkdirSync(out,{recursive:true});const checks=[],errors=[];
const copy=chapterCollections('copy').filter(r=>r.contentUrl).flatMap(row=>JSON.parse(readFileSync('public'+row.contentUrl)).exercises.map(e=>({row,e,activity:'copy'})));
const samples=[{row:{...writingDictationRounds[0],level:'alfa-c',help:'practice'},e:writingDictationRounds[0].exercises[0],activity:'dictation'},...['KSW-AC-TN-001','KSW-AC-TN-097','KSW-AA-TN-006'].map(id=>{const row=copy.find(x=>x.e.exerciseId===id);assert(row,id);return row;})];
const route=s=>base+'/'+chapterHash({chapter:'writing',activity:s.activity,collection:s.row.id,level:s.row.level,help:s.row.help});
const mock=()=>{window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){this.paused=true;clearTimeout(this.timer);}};};
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
 for(const s of samples){
  const c=await b.newContext(),p=await c.newPage();await c.addInitScript(mock);p.on('pageerror',e=>errors.push({engine,message:e.message}));
  await c.addInitScript(({key,id})=>{if(!localStorage.getItem('writing-storage-seed')){localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));localStorage.setItem('writing-storage-seed','1');}},{key:groupSessionKey('chapter:'+s.activity+':'+s.row.id,s.activity,collectionProgressId(s.activity,s.row.id,s.row.contentUrl)),id:s.e.exerciseId});
  const key=writingAnswerKey(writingAnswerSourceId(s.e));await p.goto(route(s));await p.locator(`[data-exercise-id="${s.e.exerciseId}"]`).waitFor();const input=p.getByRole('textbox',{name:'Jouw antwoord',exact:true});await p.waitForFunction(()=>!document.querySelector('.cp-text-entry input')?.disabled);assert.equal(await input.inputValue(),'','A model is never prefilled as an answer');
  await input.fill('Mijn eerste eigen versie');await p.reload();await p.waitForFunction(()=>!document.querySelector('.cp-text-entry input')?.disabled);assert.equal(await input.inputValue(),'Mijn eerste eigen versie');
  await p.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).first,'Mijn eerste eigen versie');
  await input.fill('Mijn herziene eigen versie');await p.reload();await p.waitForFunction(()=>!document.querySelector('.cp-text-entry input')?.disabled);assert.equal(await input.inputValue(),'Mijn herziene eigen versie');assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).first,'Mijn eerste eigen versie');
  await input.fill(s.e.fields[0].acceptedAnswers[0]);await p.getByRole('button',{name:'Controleer',exact:true}).click();await p.locator('[data-practice-ready="true"]').waitFor();const saved=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.first,'Mijn eerste eigen versie');assert.equal(saved.last,s.e.fields[0].acceptedAnswers[0]);
  checks.push({engine,sourceId:writingAnswerSourceId(s.e),activity:s.activity,draftReloaded:true,firstIncorrectKept:true,latestCorrectKept:true,modelNeverPrefilled:true});await c.close();
 }
 const c=await b.newContext(),p=await c.newPage();await c.addInitScript(mock);await c.addInitScript(()=>{const set=Object.getOwnPropertyDescriptor(Storage.prototype,'setItem').value;Storage.prototype.setItem=function(key,value){if(key.startsWith('klink.writing-answer.v1:'))throw new DOMException('Test: storage unavailable','QuotaExceededError');return set.call(this,key,value);};window.__restoreWritingStorage=()=>{Storage.prototype.setItem=set;};});p.on('pageerror',e=>errors.push({engine,message:e.message}));
 const s=samples[0],key=writingAnswerKey(writingAnswerSourceId(s.e));await p.goto(route(s));const input=p.getByRole('textbox',{name:'Jouw antwoord',exact:true});await p.waitForFunction(()=>!document.querySelector('.cp-text-entry input')?.disabled);await input.fill('Mijn eigen eerste antwoord');await p.getByRole('button',{name:'Controleer',exact:true}).click();await p.getByText('Je antwoord is alleen in dit scherm bewaard. Opslaan op dit apparaat lukt nu niet.',{exact:true}).waitFor();assert.equal(await input.inputValue(),'Mijn eigen eerste antwoord');assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),null);
 await p.evaluate(()=>window.__restoreWritingStorage());await input.fill(s.e.helpWord);await p.getByRole('button',{name:'Controleer',exact:true}).click();const saved=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.first,'Mijn eigen eerste antwoord');assert.equal(saved.last,s.e.helpWord);assert.equal(await p.getByText('Je antwoord is alleen in dit scherm bewaard. Opslaan op dit apparaat lukt nu niet.',{exact:true}).count(),0);
 checks.push({engine,storageDenied:true,warningVisibleOnlyOnFailure:true,inMemoryResponseRetained:true,storageRecoveryKeepsFirstResponse:true});await c.close();
 }finally{await b.close();}
}}finally{writeFileSync(out+'/answer-storage.json',JSON.stringify({base,simulatedPlayback:true,checks,errors},null,2)+'\n');}
assert.equal(checks.length,10);assert.deepEqual(errors,[]);console.log('Passed:8 real browser draft/first/latest cases across HT and published copy batches;2 storage-denial/recovery cases.');
