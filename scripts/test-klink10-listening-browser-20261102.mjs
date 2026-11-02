import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-listening-20261102', manifest=JSON.parse(readFileSync(root+'/import-manifest.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||root+'/local';
mkdirSync(out+'/screens',{recursive:true});
const checks=[],errors=[],seed={'klink.taalroute.savedWords.v1':'["TL1227"]','klink.learning-review.v1':'{"existing":{"last":1,"due":2,"streak":2}}','klink.taalroute.content-workflow.v1:existing':'{"draft":"Mijn bestaande antwoord"}'};
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}});
  await context.addInitScript(seed=>{
   if(!localStorage.getItem('k10-seed')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('k10-seed','1');}
   // Answer/state tests are independent of native media verification.
   window.k10AllowAudioEnd=false;window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setInterval(()=>{if(!window.k10AllowAudioEnd)return;clearInterval(this.timer);this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearInterval(this.timer);this.paused=true;}};
  },seed);
  const page=await context.newPage();page.on('pageerror',error=>errors.push({engine,width,message:error.message}));
  for(const {row}of manifest.newRows){
   const bank=JSON.parse(readFileSync('public'+row.url));
   await page.goto(base+'/'+chapterHash({chapter:'listening',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
   for(const [index,e]of bank.exercises.entries()){
    const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
    if(index===0)await page.screenshot({path:`${out}/screens/${engine}-${width}-${row.id}.png`,fullPage:true});
    const choices=task.locator('.cp-extended-option > button:first-child');
    assert(await choices.first().isDisabled(),'Listening is required before answering');
    const transcript=task.locator('[data-view-content="text"]');assert(await transcript.count()>0);assert(await transcript.first().isHidden(),'Transcript must not reveal the answer');
    await page.evaluate(()=>{window.k10AllowAudioEnd=true;});await page.locator('.cp-exercise-listen').first().click();await choices.first().waitFor();await page.waitForFunction(()=>!document.querySelector('.cp-extended-option > button:first-child')?.disabled);
    assert(await transcript.first().isHidden(),'Listening alone must not reveal transcript');
    const wrong=e.options.find(o=>!e.answer.correctOptionIds.includes(o.id));await task.getByRole('button',{name:wrong.label,exact:true}).click();
    assert(await task.locator('[data-practice-next]').isDisabled());assert(await transcript.first().isVisible(),'Answer reveals transcript');
    const correct=e.options.find(o=>e.answer.correctOptionIds.includes(o.id));await task.getByRole('button',{name:correct.label,exact:true}).click();
    await page.evaluate(()=>{window.k10AllowAudioEnd=false;});await task.locator('[data-practice-next]').click();
    checks.push({engine,width,id:e.exerciseId,correctAnswerCompleted:true,wrongChoiceDidNotAdvance:true,transcriptHiddenUntilAnswer:true});
   }
   await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   for(const[key,value]of Object.entries(seed))assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),value,'Existing learner data changed');
  }
  await context.close();
 }}finally{await browser.close();}
}
assert.equal(checks.length,480);assert.deepEqual(errors,[]);
writeFileSync(out+'/browser.json',JSON.stringify({checks,errors,existingProgressPreserved:true,nativeAudioTested:false},null,2)+'\n');
console.log('Passed 480 listening exercise flows in Chromium/WebKit, mobile/desktop.');
