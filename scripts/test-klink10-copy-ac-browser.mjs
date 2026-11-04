import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const m=JSON.parse(readFileSync('docs/klink10-copy-ac-20261103/manifest.json'));
const bank=JSON.parse(readFileSync('public'+m.row.url)); bank.exercises=bank.exercises.slice(0,10);
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19046';
const out=process.env.KLINK_TEST_OUTPUT||'docs/klink10-copy-ac-20261103/local';mkdirSync(out,{recursive:true});
const checks=[],errors=[],crossRoute=[];
try{for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   if(!localStorage.getItem('letter-test-seeded')){localStorage.setItem('klink.taalroute.content-workflow.v1:old','{"draft":"Bestaand antwoord"}');localStorage.setItem('letter-test-seeded','1');}
   // Deterministic answer-flow checks; real audio is checked separately.
   window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};
  });
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:m.oldRow.id,level:'alfa-c',help:'guided'}));
  const sourceId=bank.exercises[0].exerciseId;
  const prior=page.locator(`[data-exercise-id="${sourceId}"]`);
  const priorInput=prior.getByRole('textbox',{name:'Jouw antwoord',exact:true});await priorInput.waitFor();
  await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
  await priorInput.fill('HAND');await prior.getByRole('button',{name:'Controleer',exact:true}).click();
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:m.row.id,level:'alfa-c',help:'practice'}));
  await page.locator(`[data-exercise-id="${sourceId}"]`).waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.value==='HAND');
  crossRoute.push({engine,width,guidedDraftResumed:true,sharedFirstAnswerPreserved:true});
  for(const [i,e]of bank.exercises.entries()){
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
   assert.equal(await task.locator('.cp-task-prompt strong').innerText(),e.exampleWord);
   await input.fill('');assert(await task.getByRole('button',{name:'Controleer',exact:true}).isDisabled());
   await input.fill(e.exampleWord.toUpperCase());
   if(i===0){await page.reload();await task.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);assert.equal(await input.inputValue(),e.exampleWord.toUpperCase());}
   await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await page.getByText(/^Kijk bij teken/).waitFor(); await input.fill(e.exampleWord+e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await input.fill(e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.exerciseId);assert.equal(saved.first,e.exampleWord.toUpperCase());assert.equal(saved.last,e.exampleWord);
   assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.content-workflow.v1:old')),'{"draft":"Bestaand antwoord"}');
   checks.push({engine,width,sourceId:e.exerciseId,exactModelAccepted:true,uppercaseAndDoubleRejected:true,firstAnswerPreserved:true});
   if(i===0)await page.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});
   if(i<9)await page.getByRole('button',{name:'Verder',exact:true}).click();
  }await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,crossRoute,errors,simulatedAudio:true},null,2)+'\n');}
assert.equal(checks.length,40);assert.deepEqual(errors,[]);assert.equal(crossRoute.length,4);console.log('40 self-copy flows and four guided-to-self storage continuations passed.');
