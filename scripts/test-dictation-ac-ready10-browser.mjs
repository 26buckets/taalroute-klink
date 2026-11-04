import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const m=JSON.parse(readFileSync('docs/dictation-ac-ready10-20261104/manifest.json'));
const bank=JSON.parse(readFileSync('docs/dictation-ac-ready10-20261104/source-bank.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19164';
const out=process.env.KLINK_TEST_OUTPUT||'docs/dictation-ac-ready10-20261104/local';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
try{for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},colorScheme:width===390?'dark':'light'});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem('klink.taalroute.content-workflow.v1:old','{"draft":"Bestaand antwoord"}');
   // Deterministic answer checks; the separate media test uses native playback.
   window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};
  });
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'sentence-dictation',collection:m.row.id,level:'alfa-c',help:'practice'}));
  for(const [i,e]of bank.exercises.entries()){
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.waitFor();
   await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
   const model=e.fields[0].acceptedAnswers[0];
   assert(!(await task.innerText()).includes(model));
   assert.equal(await task.locator('.cp-word-hint,.cp-picture-help,.cp-meaning-contexts,img').count(),0);
   await input.fill('');assert(await task.getByRole('button',{name:'Controleer',exact:true}).isDisabled());
   if(i===0){await input.fill('Mijn concept');await page.reload();await task.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);assert.equal(await input.inputValue(),'Mijn concept');}
   const wrong=i===1?'Mijn vriend komt om 9 uur.':'Dit is een andere zin.';
   await input.fill(wrong);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await input.fill(model.toLowerCase().replace(/\.$/,''));await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   let answer=model;
   if(i===1){answer=e.fields[0].acceptedAnswers[1];assert(answer.includes('8'));await input.fill(answer);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');}
   else{await input.fill(model);await task.getByRole('button',{name:'Controleer',exact:true}).click();}
   const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.writingSourceId);assert.equal(saved.first,wrong);assert.equal(saved.last,answer);assert.equal(saved.draft,answer);
   assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.content-workflow.v1:old')),'{"draft":"Bestaand antwoord"}');
   checks.push({engine,width,sourceId:e.exerciseId,targetHidden:true,wrongRejected:true,modelAccepted:true,caseAndPunctuationAccepted:true,explicitEightVariant:i===1,firstAndLastPreserved:true});
   if(i===0)await page.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});
   if(i<9)await page.getByRole('button',{name:'Verder',exact:true}).click();
  }
  await page.locator('[data-practice-next]').click();
  await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
  await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,errors,simulatedAudio:true,humanListeningPerformed:false},null,2)+'\n');}
assert.equal(checks.length,40);assert.deepEqual(errors,[]);console.log('40 dictation flows passed: hidden target, explicit alternatives, draft/first/last preservation.');
