import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const root='docs/klink10-bingo-20261102',m=JSON.parse(readFileSync(root+'/manifest.json')),base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||root+'/local';mkdirSync(out+'/screens',{recursive:true});const checks=[],errors=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of[390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}});await context.addInitScript(()=>{window.allowEnd=false;window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.currentTime=0;this.paused=true;this.playbackRate=1;}play(){this.paused=false;this.timer=setInterval(()=>{if(window.allowEnd){clearInterval(this.timer);this.paused=true;this.dispatchEvent(new Event('ended'));}},20);return Promise.resolve();}pause(){clearInterval(this.timer);this.paused=true;}};});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const [ri,r]of m.rows.entries()){
   const bank=JSON.parse(readFileSync('public'+r.row.url)).exercises,es=r.questionIds.map(id=>bank.find(e=>e.exerciseId===id)),prior=bank.at(-1).exerciseId,progress=roundProgressPrefix+collectionProgressId('word-bingo',r.oldRow.id,r.oldRow.url),session=groupSessionKey('chapter:word-bingo:'+r.row.id,'word-bingo');
   await page.goto(base+'/');await page.evaluate(({progress,session,id,prior,total})=>{localStorage.setItem(progress,JSON.stringify({version:1,total,done:[prior]}));localStorage.setItem(session,JSON.stringify({version:1,exerciseId:id,done:false}));localStorage.setItem('klink.bingo-preserve','existing draft');window.allowEnd=false;},{progress,session,id:es[0].exerciseId,prior,total:bank.length});
   await page.goto(base+'/'+chapterHash({chapter:'repeat',activity:'word-bingo',collection:r.row.id,level:'alfa-c',help:'guided'}));
   for(const [i,e]of es.entries()){
    const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();assert(await task.locator('[data-practice-next]').isDisabled());assert(await task.locator('.cp-board-grid button').first().isDisabled());
    await page.evaluate(()=>{window.allowEnd=true;});await task.locator('.cp-exercise-listen').first().click();
    const correct=e.cells.find(c=>c.cellId===e.answer.correctCellId),wrong=e.cells.find(c=>c.cellId!==correct.cellId&&!e.markedCellIds.includes(c.cellId));
    if(wrong){await task.getByRole('button',{name:wrong.text,exact:true}).click();await task.locator('.cp-exercise-feedback small').getByText(wrong.feedback,{exact:true}).waitFor();assert(await task.locator('[data-practice-next]').isDisabled());}
    await task.getByRole('button',{name:correct.text,exact:true}).click();await task.locator('.cp-exercise-feedback small').getByText(correct.feedback,{exact:true}).waitFor();
    if(ri===0&&i===0)await page.screenshot({path:`${out}/screens/${engine}-${width}.png`,fullPage:true});
    await page.evaluate(()=>{window.allowEnd=false;});await task.locator('[data-practice-next]').click();
    await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)).done.includes(id),{key:progress,id:e.exerciseId});
    if(i===0){await page.reload();await page.locator(`[data-exercise-id="${es[1].exerciseId}"]`).waitFor();}
    checks.push({engine,width,id:e.exerciseId,wrongFeedback:!!wrong,correctFeedback:true,wholeAudioGate:true,oldProgressKey:progress});
   }
   const done=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).done,progress);assert(done.includes(prior));assert(es.every(e=>done.includes(e.exerciseId)));assert.equal(await page.evaluate(()=>localStorage.getItem('klink.bingo-preserve')),'existing draft');
  }await context.close();
 }}finally{await browser.close();}
}
assert.equal(checks.length,120);assert.deepEqual(errors,[]);writeFileSync(out+'/browser.json',JSON.stringify({base,checks,errors,oldProgressAndResumePreserved:true,audioMocked:true},null,2)+'\n');console.log('PASS 120 bingo answer/audio-gate flows; prior progress, old keys and resume retained.');
