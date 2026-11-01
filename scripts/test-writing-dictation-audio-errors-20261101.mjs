import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {writingDictationRounds} from '../lib/writing-dictation.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||'docs/writing-dictation-20261101/local';mkdirSync(out,{recursive:true});const checks=[],errors=[];
const round=writingDictationRounds[0],e=round.exercises[0];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const sheet of[false,true]){
  const c=await b.newContext(),p=await c.newPage();p.on('pageerror',error=>errors.push({engine,sheet,message:error.message}));let unavailable=true,failedRequests=0;
  await p.route('**'+e.prompt.audio.src,route=>{if(unavailable){failedRequests++;return route.fulfill({status:503,headers:{'cache-control':'no-store'},body:'Temporarily unavailable'});}return route.continue();});
  await p.goto(base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-c',help:'practice'}));await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
  if(sheet)await p.getByRole('button',{name:'Op één blad',exact:true}).click();
  const task=sheet?p.locator(`[data-sheet-exercise="${e.exerciseId}"]`):p.locator(`[data-exercise-id="${e.exerciseId}"]`),input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});
  assert(await input.isDisabled());await task.getByRole('button',{name:'Luister naar het woord',exact:true}).click();
  await p.waitForFunction(({sheet,id})=>{const row=document.querySelector(sheet?`[data-sheet-exercise="${CSS.escape(id)}"]`:`[data-exercise-id="${CSS.escape(id)}"]`);return row&&/Luisteren lukt niet|Probeer Luister opnieuw/.test(row.textContent);},{sheet,id:e.exerciseId});
  assert(failedRequests>0);assert(await input.isDisabled());assert.equal(await task.getAttribute('data-practice-ready'),'false');
  unavailable=false;await task.getByRole('button',{name:'Luister naar het woord',exact:true}).click();await p.waitForFunction(({sheet,id})=>!document.querySelector((sheet?`[data-sheet-exercise="${CSS.escape(id)}"]`:`[data-exercise-id="${CSS.escape(id)}"]`)+' input').disabled,{sheet,id:e.exerciseId});
  await input.fill(e.helpWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();await p.waitForFunction(({sheet,id})=>document.querySelector(sheet?`[data-sheet-exercise="${CSS.escape(id)}"]`:`[data-exercise-id="${CSS.escape(id)}"]`).dataset.practiceReady==='true',{sheet,id:e.exerciseId});
  checks.push({engine,sheet,failedRequests,realAudio:true,answerBlockedAfter503:true,retryRecovered:true,correctAcceptedAfterNativePlayback:true});await c.close();
 }}finally{await b.close();}
}}finally{writeFileSync(out+'/audio-errors.json',JSON.stringify({base,simulatedPlayback:false,checks,errors},null,2)+'\n');}
assert.equal(checks.length,4);assert.deepEqual(errors,[]);console.log('Passed:4 real-audio failure/retry/answer-gate cases in Chromium/WebKit, single task and worksheet.');
