import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-sentences-20261102',m=JSON.parse(readFileSync(root+'/import-manifest.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||root+'/local';mkdirSync(out+'/screens',{recursive:true});
const checks=[],errors=[],seed={'klink.taalroute.savedWords.v1':'["TL1227"]','klink.learning-review.v1':'{"existing":{"last":1,"due":2,"streak":2}}','klink.taalroute.content-workflow.v1:existing':'{"draft":"Mijn bestaande antwoord"}'};
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}});
  await context.addInitScript(seed=>{
   if(!localStorage.getItem('k10-seed')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('k10-seed','1');}
   window.k10AllowAudioEnd=false;window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setInterval(()=>{if(!window.k10AllowAudioEnd)return;clearInterval(this.timer);this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearInterval(this.timer);this.paused=true;}};
  },seed);
  const page=await context.newPage();page.on('pageerror',error=>errors.push({engine,width,message:error.message}));
  for(const{row}of m.newRows){
   const es=JSON.parse(readFileSync('public'+row.url)).exercises;
   await page.goto(base+'/'+chapterHash({chapter:'sentences',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
   for(const[index,e]of es.entries()){
    const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();const kind=e.exerciseId.split('-').at(-2);
    if(index===0)await page.screenshot({path:`${out}/screens/${engine}-${width}-${row.id}.png`,fullPage:true});
    assert(await task.locator('[data-practice-next]').isDisabled());
    if(e.requiresAudio){
     const control=kind==='LLM'?task.locator('[data-word-token]').first():kind==='ZDZ'?task.locator('.cp-extended-option > button:first-child').first():task.locator('.cp-text-entry input');
     assert(await control.isDisabled(),'Whole audio must precede answering');
    }
    await page.evaluate(()=>{window.k10AllowAudioEnd=true;});await page.locator('.cp-exercise-listen').first().click();
    if(kind==='LLM'){
     const accepted=e.standardTask.acceptedSelections[0];const wrong=e.standardTask.tokens.find(t=>!accepted.includes(t.id));
     await task.locator(`[data-word-token="${wrong.id}"]`).click();await task.locator('[data-practice-check]').click();assert(await task.locator('[data-practice-next]').isDisabled());await task.getByRole('button',{name:'Wis',exact:true}).click();
     for(const id of accepted)await task.locator(`[data-word-token="${id}"]`).click();await task.locator('[data-practice-check]').click();
    }else if(kind==='ZDZ'){
     const wrong=e.options.find(o=>!e.answer.correctOptionIds.includes(o.id));await task.getByRole('button',{name:wrong.label,exact:true}).click();assert(await task.locator('[data-practice-next]').isDisabled());
     await task.getByRole('button',{name:e.options.find(o=>e.answer.correctOptionIds.includes(o.id)).label,exact:true}).click();
    }else if(kind==='TDZ'){
     const input=task.locator('.cp-text-entry input');await input.fill('een fout antwoord');await task.locator('[data-practice-check]').click();assert(await task.locator('[data-practice-next]').isDisabled());
     const correct=e.fields[0].acceptedAnswers[0];await input.fill(correct);await task.locator('[data-practice-check]').click();
     const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.exerciseId);assert.equal(saved.first,'een fout antwoord');assert.equal(saved.last,correct);
    }else if(kind==='MDZ'){
     const parts=e.sequenceStages??[e];for(const[phase,p]of parts.entries()){
      for(const id of p.targetOrderIds)await task.locator(`[data-order-item="${id}"]`).click();await task.locator('[data-practice-check]').click();
      if(phase<parts.length-1){assert(await task.locator('[data-practice-next]').isDisabled());await task.getByRole('button',{name:'Goed. Volgende zin',exact:true}).click();}
     }
    }else if(kind==='VWZ'){
     assert.equal(await task.getByRole('button',{name:'Bekijk een voorbeeld',exact:true}).count(),0);assert.equal(await task.getByText(e.modelSentence,{exact:true}).count(),0);
     await task.getByRole('button',{name:'Typ de zin',exact:true}).click();const own='Mijn eigen zin met '+e.sentenceWord+'.';await task.getByLabel('Jouw eigen zin',{exact:true}).fill(own);await task.getByRole('button',{name:'Mijn zin is klaar',exact:true}).click();assert(await task.locator('[data-practice-next]').isDisabled());
     await task.getByRole('button',{name:'Bekijk een voorbeeld',exact:true}).click();assert(await task.getByText(e.modelSentence,{exact:true}).isVisible());
     for(const cb of await task.locator('input[type=checkbox]').all())await cb.check();await task.getByRole('button',{name:'Nagekeken en klaar',exact:true}).click();
     const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.own-sentence.v1:'+id)),e.exerciseId);assert.deepEqual(saved.first,{medium:'typed',text:own});assert.equal(saved.draft,own);
    }
    await page.waitForFunction(()=>!document.querySelector('[data-practice-next]')?.disabled);await page.evaluate(()=>{window.k10AllowAudioEnd=false;});await task.locator('[data-practice-next]').click();
    checks.push({engine,width,id:e.exerciseId,kind,answerCompleted:true,wholeAudioGate:!!e.requiresAudio,originalOwnAnswerPreserved:kind==='VWZ'||kind==='TDZ',sentenceStages:e.sequenceStages?.length??1});
   }
   await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   for(const[k,v]of Object.entries(seed))assert.equal(await page.evaluate(k=>localStorage.getItem(k),k),v);
  }
  await context.close();
 }}finally{await browser.close();}
}
assert.equal(checks.length,880);assert.deepEqual(errors,[]);writeFileSync(out+'/browser.json',JSON.stringify({checks,errors,existingProgressPreserved:true,nativeAudioTested:false},null,2)+'\n');console.log('880 sentence flows passed across Chrome/WebKit and mobile/desktop.');
