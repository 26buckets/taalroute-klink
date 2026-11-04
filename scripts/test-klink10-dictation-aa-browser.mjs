import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {alfaADictationRound as round} from '../lib/klink10-writing-dictation-aa.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19048';
const out=process.env.KLINK_TEST_OUTPUT||'docs/klink10-dictation-aa-20261102/local';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:engine==='chromium'?390:1280,height:844}});
  page.on('pageerror',e=>errors.push({engine,error:e.message}));
  await page.addInitScript(()=>{
   if(!localStorage.getItem('klink10-test-seeded')){localStorage.setItem('klink.taalroute.content-workflow.v1:old','{"draft":"Bestaand antwoord"}');localStorage.setItem('klink10-test-seeded','1');}
   // Playback state is deterministic here; exact audio bytes have separate live checks.
   window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};
  });
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-a',help:'practice'}));
  for(const[index,e]of round.exercises.entries()){
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
   assert.equal(await task.locator('.cp-word-hint,.cp-picture-help,.cp-meaning-contexts,img').count(),0);
   assert.equal(await task.getByRole('button',{name:'Help',exact:true}).count(),0);
   if(index===0){await input.fill('eigen concept');await page.reload();await task.waitFor();assert.equal(await input.inputValue(),'eigen concept');await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);}
   await input.fill('zzq');await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   assert.equal(await task.locator('.cp-word-hint').count(),0);
   await input.fill(round.positions[index].word);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.writingSourceId);assert.equal(saved.first,'zzq');assert.equal(saved.last,round.positions[index].word);
   assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.content-workflow.v1:old')),'{"draft":"Bestaand antwoord"}');
   checks.push({engine,sourceId:e.writingSourceId,noModelHelp:true,wrongRejected:true,rightAccepted:true,firstWrongPreserved:true,existingDraftPreserved:true});
   if(index===0)await page.screenshot({path:out+'/'+engine+'.png',fullPage:true});
   if(index<round.exercises.length-1)await page.getByRole('button',{name:'Verder',exact:true}).click();
  }
 }finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,errors,simulatedAudio:true,humanListeningPerformed:false},null,2)+'\n');}
assert.equal(checks.length,20);assert.deepEqual(errors,[]);console.log('20 source-variant flows passed, drafts/resume preserved; pronunciation evidence is recorded separately.');
