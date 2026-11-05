import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
import {readProductionBank} from './read-production-bank.mjs';
import {spokenWords} from '../lib/word-listening-text.ts';
import {recordingForWord,wordRecordingKey} from '../lib/word-listening.ts';
const root='docs/reading-comprehension-20261105/',m=JSON.parse(readFileSync(root+'manifest.json')),base=process.env.BASE_URL||'http://127.0.0.1:19135',out=process.env.EVIDENCE_DIR||root+'local';
const checks=[],rounds=[],errors=[];mkdirSync(out,{recursive:true});
async function click(page,target){await target.scrollIntoViewIfNeeded();await target.click();}
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280])for(const row of m.rows){
  const es=readProductionBank(row).exercises,page=await browser.newPage({viewport:{width,height:900},colorScheme:width===390?'dark':'light'});page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('reading-preserve')){localStorage.setItem('reading-preserve','bestaand');localStorage.setItem('klink.taalroute.attempts.v1',JSON.stringify([{exerciseId:'preserved-old-answer',answer:'bestaand',correct:true,attempts:1}]));}window.nativeEnded=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',e=>{const a=e.detail;if(seen.has(a))return;seen.add(a);a.addEventListener('ended',()=>window.nativeEnded.push({src:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,duration:a.duration}));});});
  await page.goto(base+'/'+chapterHash({chapter:'texts',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
  for(const[i,e]of es.entries()){
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();assert(await task.locator('[data-practice-next]').isDisabled());assert.equal(await task.locator('.cp-source-text p').innerText(),e.sourceText);
   const word=spokenWords(e.question).at(-1).text,source=wordRecordingKey(recordingForWord(word));await page.evaluate(()=>window.nativeEnded=[]);
   await click(page,task.locator('h4 button[data-word-audio]').last());await page.waitForFunction(src=>window.nativeEnded.some(x=>x.src===src&&x.native&&x.duration>0),source);
   assert.equal(await task.locator('[data-word-audio-missing]').count(),0);
   if(i===0)await page.screenshot({path:`${out}/${row.level}-${engine}-${width}.png`,fullPage:true});
   for(const o of e.options.filter(o=>!e.answer.correctOptionIds.includes(o.id))){await click(page,task.locator('.cp-extended-option>button').nth(e.options.indexOf(o)));assert(await task.locator('[data-practice-next]').isDisabled());assert((await task.locator('.cp-exercise-feedback').innerText()).includes(e.optionFeedback[o.id]));}
   const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));await click(page,task.locator('.cp-extended-option>button').nth(correct));await task.locator('[data-practice-next]:not(:disabled)').waitFor();assert((await task.locator('.cp-exercise-feedback').innerText()).includes(e.optionFeedback[e.options[correct].id]));
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1'))),a=saved.findLast(x=>x.exerciseId===e.exerciseId);assert(a.correct&&a.helpUsed);assert.equal(a.independentReading,false);assert.equal(a.attempts,3);assert(saved.some(x=>x.exerciseId==='preserved-old-answer'&&x.answer==='bestaand'));
   checks.push({engine,width,id:e.exerciseId,nativeWord:word,nativeAudio:true,wrongChoicesRejected:2,correctAccepted:true,feedbackExact:true,helpNotIndependentReading:true,oldAnswerPreserved:true});
   await click(page,task.locator('[data-practice-next]'));
   if(i===0){await page.reload();await page.locator(`[data-exercise-id="${es[1].exerciseId}"]`).waitFor();}
  }
  await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();await page.reload();await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
  const key=roundProgressPrefix+collectionProgressId(row.activity,row.id,row.url);assert.equal((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).done.length,10);assert.equal(await page.evaluate(()=>localStorage.getItem('reading-preserve')),'bestaand');
  rounds.push({engine,width,level:row.level,complete:10,partialAndCompleteReload:true});await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,rounds,errors,audioMocked:false,physicalPhone:false,humanListeningClaim:false},null,2)+'\n');}
assert.equal(checks.length,80);assert.equal(rounds.length,8);assert.deepEqual(errors,[]);console.log('PASS 80 reading/word-audio flows, 160 rejected distractors, eight rounds and partial/completed reloads.');
