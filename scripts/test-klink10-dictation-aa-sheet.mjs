import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {alfaADictationRound} from '../lib/klink10-writing-dictation-aa.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19048',out=process.env.KLINK_TEST_OUTPUT||'docs/klink10-dictation-aa-20261102/local';mkdirSync(out,{recursive:true});const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
 const c=await b.newContext({viewport:{width:320,height:568}});
 await c.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(src){super();this.dataset={};this.src=src;this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){this.paused=true;clearTimeout(this.timer);}};});
 const p=await c.newPage();p.on('pageerror',e=>errors.push({engine,message:e.message}));
 for(const round of [alfaADictationRound]){
  await p.goto(base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-a',help:'practice'}));await p.getByRole('button',{name:'Op één blad',exact:true}).click();
  const sheet=p.locator('.cp-practice-sheet');await sheet.waitFor();
  for(const[i,e]of round.exercises.entries()){
   const row=sheet.locator(`[data-sheet-exercise="${e.exerciseId}"]`);await row.waitFor();const input=row.getByRole('textbox',{name:'Jouw antwoord',exact:true});assert(await input.isDisabled());
   assert.equal(await row.locator('.cp-picture-help,.cp-meaning-contexts,img').count(),0);assert.equal(await row.locator('.cp-word-hint').count(),0);
   const listen=row.getByRole('button',{name:'Luister naar het woord',exact:true});await listen.click();await p.waitForFunction(id=>!document.querySelector(`[data-sheet-exercise="${CSS.escape(id)}"] .cp-text-entry input`).disabled,e.exerciseId);
   if(i===0)await listen.click();
   await input.fill('zzq');await row.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await row.getAttribute('data-practice-ready'),'false');
   assert.equal(await row.locator('.cp-word-hint strong,.cp-word-hint p').count(),0);assert((await row.locator(':scope > output').innerText()).includes(e.feedback));
   await input.fill(round.positions[i].word);await row.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await row.getAttribute('data-practice-ready'),'true');
   assert((await row.locator(':scope > output').innerText()).includes(e.correctFeedback));
   const a=await p.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));assert.equal(a.exerciseId,e.exerciseId);assert.equal(a.independentReading,false);assert.equal(a.reviewEligible,false);assert.equal(a.pictureSupport,undefined);assert.equal(a.helpUsed,i===0);
   assert((await p.evaluate(()=>document.documentElement.scrollWidth))<=321);
   checks.push({engine,sourceId:e.writingSourceId,audioRequiredBeforeTyping:true,wrongRetried:true,correctAccepted:true,helpAndReplayTracked:true,correctExplanation:true,noAnswerOrImageBeforeHelp:true,noHintAfterWrong:true,modelHintAbsent:true,noHorizontalOverflow:true});
  }
  await c.clearCookies();
 }
 await c.close();
 }finally{await b.close();}
}}finally{writeFileSync(out+'/sheet.json',JSON.stringify({base,simulatedPlayback:true,checks,errors},null,2)+'\n');}
assert.equal(checks.length,20);assert.deepEqual(errors,[]);console.log('Passed: 20 worksheet flows with audio gate, hidden answer, replay, explanations and 320px layout in Chromium/WebKit.');
