import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {writingAnswerKey} from '../lib/writing-answer.ts';
import {recordingForWord,wordRecordingKey} from '../lib/word-listening.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
import {groupSessionKey} from '../lib/group-practice.ts';

const folder='docs/writing-copy-aa-17-20261102/';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out,{recursive:true});
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json'));
const oldRow=manifest.existingAaThreeRowUnchanged,oldProgress=collectionProgressId('copy',oldRow.id,oldRow.url);
const old={'klink.taalroute.savedWords.v1':'["TL1227"]','klink.writing-prior-attempts.v1':'[]',[writingAnswerKey('KSW-AA-TN-006')]:JSON.stringify({version:1,draft:'Mijn eigen tekst',first:'M',last:'ma'}),[roundProgressPrefix+oldProgress]:JSON.stringify({version:1,total:3,done:['KSW-AA-TN-006','KSW-AA-TN-007','KSW-AA-TN-008']}),[groupSessionKey('chapter:copy:'+oldRow.id,'copy',oldProgress)]:JSON.stringify({version:1,exerciseId:'KSW-AA-TN-007',done:false})};
const checks=[],rounds=[],native=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const sheet of[false,true]){
  const context=await browser.newContext({viewport:{width:320,height:568}});
  await context.addInitScript(seed=>{
   if(!localStorage.getItem('aa17-seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('aa17-seeded','1');}
   window.aa17NativeEnded=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',event=>{const audio=event.detail;if(seen.has(audio))return;seen.add(audio);audio.addEventListener('ended',()=>window.aa17NativeEnded.push({key:audio.dataset.klinkSource,native:audio instanceof HTMLAudioElement}));});
  },old);
  const page=await context.newPage();page.on('pageerror',error=>errors.push({engine,sheet,message:error.message}));
  for(const{row}of manifest.newRows){
   const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
   await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:row.id,level:'alfa-a',help:'guided'}));await page.locator(`[data-exercise-id="${exercises[0].exerciseId}"]`).waitFor();
   const automatic=page.locator('[data-practice-automatic]');if(await automatic.getAttribute('aria-pressed')==='false')await automatic.click();
   if(sheet)await page.getByRole('button',{name:'Op één blad',exact:true}).click();
   for(const[index,e]of exercises.entries()){
    let task=page.locator(sheet?`[data-sheet-exercise="${e.exerciseId}"]`:`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
    let input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await page.waitForFunction(selector=>document.querySelector(selector+' input')?.disabled===false,sheet?`[data-sheet-exercise="${e.exerciseId}"]`:`[data-exercise-id="${e.exerciseId}"]`);
    assert.equal(await input.inputValue(),'');assert.equal(await task.locator('.cp-task-prompt strong').innerText(),e.exampleWord);
    if(['KSW-AA-TN-001','KSW-AA-TN-012'].includes(e.exerciseId)){
     const key=wordRecordingKey(recordingForWord(e.exampleWord));await page.evaluate(()=>{window.aa17NativeEnded=[];});await task.locator('.cp-task-prompt strong').click();await page.waitForFunction(key=>window.aa17NativeEnded.some(row=>row.key===key&&row.native),key);native.push({engine,sheet,sourceId:e.exerciseId,actualNativePlaybackEnded:true});assert.equal(await input.inputValue(),'');
    }
    const wrong=e.exampleWord.toUpperCase();await input.fill(wrong);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
    assert((await page.locator(sheet?`[data-sheet-exercise="${e.exerciseId}"] > output`:'.cp-exercise-feedback').innerText()).includes(sheet?e.feedback:'Kijk bij teken 1.'));
    if(index===0&&!sheet){await input.fill(e.exampleWord+'x');await page.reload();task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);assert.equal(await input.inputValue(),e.exampleWord+'x');const auto=page.locator('[data-practice-automatic]');if(await auto.getAttribute('aria-pressed')==='false')await auto.click();}
    await input.fill(e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
    assert((await page.locator(sheet?`[data-sheet-exercise="${e.exerciseId}"] > output`:'.cp-exercise-feedback').innerText()).includes(e.correctFeedback));
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),writingAnswerKey(e.exerciseId));assert.equal(saved.first,wrong);assert.equal(saved.last,e.exampleWord);
    const attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));assert.equal(attempt.exerciseId,e.exerciseId);assert.notEqual(attempt.independentReading,true);assert.notEqual(attempt.reviewEligible,true);assert.equal(attempt.support,'model');assert(attempt.correct);
    assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=321);assert.deepEqual(await page.evaluate(seed=>Object.fromEntries(Object.keys(seed).map(key=>[key,localStorage.getItem(key)])),old),old);
    checks.push({engine,sheet,sourceId:e.exerciseId,modelVisibleButNeverPrefilled:true,wrongCaseRejected:true,correctAccepted:true,firstWrongAndLastCorrectRetained:true,originalSourceFeedbackOrDocumentedAdaptation:true,oldAaThreeProgressAndAnswersUnchanged:true,noReadingOrHandwritingClaim:true,noHorizontalOverflow:true});
    if(!sheet)await page.locator('[data-practice-next]').click();
   }
   if(!sheet)await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   rounds.push({engine,sheet,id:row.id,positions:exercises.length,completed:true,firstDraftReloaded:!sheet});
  }
  await context.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,rounds,native,errors,simulatedPlayback:false,humanListeningPerformed:false},null,2)+'\n');}
assert.equal(checks.length,68);assert.equal(rounds.length,12);assert.equal(native.length,8);assert.deepEqual(errors,[]);
console.log('Passed:68 actual copy answer/storage flows,12 short rounds and8 native model-word plays; existing AA answers and progress retained.');
