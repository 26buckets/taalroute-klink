import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {dailyBlocks,dailyStorageKey} from '../lib/alfa-c-dagelijks.ts';
import {functionalBlocks,functionalStorageKey} from '../lib/alfa-c-functioneel.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:18996',folder=process.env.KLINK_TEST_OUTPUT||'outputs/alfa-c-no-scroll-20261101';mkdirSync(folder,{recursive:true});
const checks=[],errors=[];
async function reveal(p,locator){await locator.focus();await p.waitForTimeout(100);assert(await locator.isVisible());assert(await locator.evaluate(e=>{const w=e.closest('.ac-page-window'),r=e.getBoundingClientRect(),v=w.getBoundingClientRect();return r.top>=v.top-1&&r.bottom<=v.bottom+1&&w.scrollTop===0;}),'Focused control stays fully visible without scrolling');}
for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.played=[];const native=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){this.volume=0;window.played.push({src:this.src,ended:false});const row=window.played.at(-1);this.addEventListener('ended',()=>row.ended=true,{once:true});return native.call(this);};});
 await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();
 await p.evaluate(()=>localStorage.setItem('klink.taalroute.attempts.v1','[{"retained":true}]'));
 for(const[kind,block,index,key]of[['daily',dailyBlocks.find(b=>b.id==='dagelijks-later'),4,dailyStorageKey],['functional',functionalBlocks.find(b=>b.id==='formulier'),10,functionalStorageKey]]){
  await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();await p.evaluate(({key,id,index})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[id]:index},records:{}})),{key,id:block.id,index});
  await p.goto(base+'/#learner/alfa-c/'+block.id);await p.locator(`[data-${(kind==='daily'?'daily':'functional')}-step]`).waitFor();await p.locator('.cp-listen-slot button').waitFor();
  await p.locator('.cp-listen-slot button').click();await p.waitForFunction(()=>window.played.some(r=>r.ended),null,{timeout:60000});assert(!(await p.getByRole('alert').count()),'Native playback has no error');
  if(await p.getByRole('button',{name:'Naar de opdracht',exact:true}).count())await p.getByRole('button',{name:'Naar de opdracht',exact:true}).click();
  for(const name of ['Foto','Tekst']){const control=p.locator('.cp-view-panel button').filter({has:p.locator('svg')}).nth(name==='Foto'?0:1);if(await control.isEnabled()){const before=await control.getAttribute('aria-pressed');await control.tap();assert.notEqual(await control.getAttribute('aria-pressed'),before);await control.tap();assert.equal(await control.getAttribute('aria-pressed'),before);}}
  await p.locator('.ac-panel-switch button').last().tap();
  if(kind==='daily'){
   const step=block.steps[index],right=p.getByRole('button',{name:step.options.find(o=>o.correct).text,exact:true});await reveal(p,right);await p.keyboard.press('Enter');
   await p.waitForFunction(()=>!document.querySelector('.pilot-footer .primary-button').disabled,null,{timeout:60000});
   const record=await p.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).records[id],{key,id:step.id});assert.equal(record.last.correct,true);
   await p.locator('.pilot-footer > .primary-button').focus();await p.keyboard.press('Enter');await p.locator(`[data-daily-step="${block.steps[index+1].id}"]`).waitFor();await p.getByRole('button',{name:'Vorige opdracht',exact:true}).focus();await p.keyboard.press('Space');await p.locator(`[data-daily-step="${step.id}"]`).waitFor();
  }else{
   const inputs=p.locator('.ac-answer-panel input');assert(await inputs.count()>0);
   for(let i=0;i<await inputs.count();i++){await reveal(p,inputs.nth(i));await inputs.nth(i).fill('Bewaard '+i);await p.keyboard.press('ArrowLeft');await p.keyboard.press('Space');assert((await inputs.nth(i).inputValue()).includes('Bewaard'));}
   const save=p.getByRole('button',{name:'Bewaar antwoord',exact:true});await reveal(p,save);await save.tap();await p.waitForFunction(()=>!document.querySelector('.pilot-footer .primary-button').disabled,null,{timeout:60000});
   const stored=await p.evaluate(key=>localStorage.getItem(key),key);await p.reload();await p.locator('[data-functional-step]').waitFor();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),stored);for(let i=0;i<await inputs.count();i++)assert((await inputs.nth(i).inputValue()).includes('Bewaard'));
  }
  checks.push({engine,kind,nativeAudio:true,keyboard:true,touch:true,toggles:true,progress:true});await p.evaluate(()=>window.played=[]);
 }
 assert.equal(await p.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1')),'[{"retained":true}]');await p.close();
 }finally{await b.close();}
}
assert.deepEqual(errors,[]);writeFileSync(folder+'/interaction.json',JSON.stringify({checks,errors},null,2));console.log('PASS',checks.length,'native audio, keyboard, touch, independent view controls and stored answers');
