import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { writingDictationRounds } from '../lib/writing-dictation.ts';
import { chapterHash } from '../lib/practice-chapters.ts';
import { groupSessionKey } from '../lib/group-practice.ts';
import { collectionProgressId } from '../lib/round-progress.ts';
import { recordingForWord, wordRecordingKey } from '../lib/word-listening.ts';

const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||'docs/writing-dictation-20261101/local';
mkdirSync(out,{recursive:true});
const round=writingDictationRounds.find(r=>r.exercises.some(e=>e.writingSourceId==='KSW-AC-HT-082'));
const exercise=round.exercises.find(e=>e.writingSourceId==='KSW-AC-HT-082');
const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',error=>errors.push({engine,message:error.message}));
  await page.addInitScript(({key,id})=>{
   localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));
   window.nativeEnded=[];
   const seen=new WeakSet();
   window.addEventListener('klink-audio-source',event=>{const audio=event.detail;if(seen.has(audio))return;seen.add(audio);audio.addEventListener('ended',()=>window.nativeEnded.push({key:audio.dataset.klinkSource,native:audio instanceof HTMLAudioElement}));});
  },{key:groupSessionKey('chapter:dictation:'+round.id,'dictation',collectionProgressId('dictation',round.id)),id:exercise.exerciseId});
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-c',help:'practice'}));
  const task=page.locator(`[data-exercise-id="${exercise.exerciseId}"]`),input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});
  await task.waitFor();await task.getByRole('button',{name:'Luister naar het woord',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
  await input.fill('zzq');await task.getByRole('button',{name:'Controleer',exact:true}).click();
  assert.equal(await task.locator('.cp-word-hint strong,.cp-word-hint p').count(),0);
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes(exercise.feedback));
  await task.getByRole('button',{name:'Help',exact:true}).click();
  assert.equal(await task.locator('.cp-word-hint p').innerText(),exercise.meaning);
  assert.equal(await input.inputValue(),'zzq');
  const key=wordRecordingKey(recordingForWord(exercise.helpWord));
  await page.evaluate(()=>{window.nativeEnded=[];});
  await task.locator('.cp-word-hint strong button.cp-inline-word').click();
  await page.waitForFunction(key=>window.nativeEnded.some(row=>row.key===key&&row.native),key);
  const before=await page.evaluate(()=>window.nativeEnded.length);
  await task.locator('.cp-word-hint p [data-word-listening-units="sound"]').click();
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>window.nativeEnded.length),before,'A spelling fragment must not play an unrelated whole word');
  await input.fill(exercise.helpWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();
  await page.locator('[data-practice-ready="true"]').waitFor();
  const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),exercise.writingSourceId);
  assert.equal(saved.first,'zzq');assert.equal(saved.last,exercise.helpWord);
  const attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert(attempt.correct&&attempt.helpUsed);assert.equal(attempt.support,'requested-help');
  checks.push({engine,sourceId:exercise.writingSourceId,realAudio:true,noHintAfterWrong:true,sourceHintBehindHelp:true,nativeHelpWordEnded:true,spellingFragmentExcluded:true,ownAnswerUnchangedByHelp:true,firstWrongRetained:true,helpTracked:true});
 }finally{await browser.close();}
}}finally{writeFileSync(out+'/help-audio.json',JSON.stringify({base,simulatedPlayback:false,checks,errors,humanListeningPerformed:false},null,2)+'\n');}
assert.equal(checks.length,2);assert.deepEqual(errors,[]);
console.log('Passed: native Help-word playback, spelling-fragment exclusion and retained first answer in Chromium/WebKit.');
