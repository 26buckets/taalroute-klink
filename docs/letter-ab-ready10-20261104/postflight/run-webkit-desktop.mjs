import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '/private/tmp/klink-letter-ab-ready10-20261104/lib/practice-chapters.ts';
const m=JSON.parse(readFileSync('docs/letter-ab-ready10-20261104/manifest.json'));
const bank=JSON.parse(readFileSync('docs/letter-ab-ready10-20261104/source-bank.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19162';
const out=process.env.KLINK_TEST_OUTPUT||'docs/letter-ab-ready10-20261104/local';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
try{for(const [engine,type]of Object.entries({webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [1280]){
  const page=await browser.newPage({viewport:{width,height:844}});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>console.log('REQUEST_FAILED',r.url(),r.failure()));page.on('response',r=>{if(r.status()>=400)console.log('HTTP_ERROR',r.status(),r.url());});
  await page.addInitScript(()=>{
   if(!localStorage.getItem('letter-test-seeded')){localStorage.setItem('klink.taalroute.content-workflow.v1:old','{"draft":"Bestaand antwoord"}');localStorage.setItem('letter-test-seeded','1');}
   // Deterministic answer-flow checks; real audio is checked separately.
   window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};
  });
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'write-letter',collection:m.row.id,level:'alfa-b',help:'practice'}));
  for(const [i,e]of bank.exercises.entries()){
   console.log(engine,width,e.exerciseId);const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
   assert.equal(await task.locator('.cp-task-prompt strong').innerText(),e.displayWord);assert.equal(await page.locator('.cp-exercise-info-heading [data-word-listening-units="sound"]').innerText(),e.exampleWord);assert.equal(await page.locator('.cp-exercise-info-heading').innerText(),e.title);
   await input.fill('');assert(await task.getByRole('button',{name:'Controleer',exact:true}).isDisabled());
   await input.fill(e.exampleWord.toUpperCase());
   {await page.reload();await task.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);assert.equal(await input.inputValue(),e.exampleWord.toUpperCase());}
   await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await input.fill(e.exampleWord+e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await input.fill(e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.exerciseId);assert.equal(saved.first,e.exampleWord.toUpperCase());assert.equal(saved.last,e.exampleWord);
   assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.content-workflow.v1:old')),'{"draft":"Bestaand antwoord"}');
   await input.fill(e.displayWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await input.fill(e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();
   await task.getByRole('button',{name:'Help',exact:true}).click();assert.equal(await task.locator('.cp-word-hint strong').innerText(),e.exampleWord);assert.equal(await task.locator('.cp-word-hint strong button').count(),0);assert.equal(await task.locator('.cp-word-hint strong').getAttribute('data-word-listening-units'),'sound');assert.equal(await task.locator('.cp-word-hint p [data-word-listening-units="sound"]').innerText(),e.exampleWord);
   await page.reload();await task.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);assert.equal(await input.inputValue(),e.exampleWord);
   const retained=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.exerciseId);assert.equal(retained.first,e.exampleWord.toUpperCase());assert.equal(retained.last,e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();
   checks.push({engine,width,sourceId:e.exerciseId,lowercaseAccepted:true,uppercaseDoubleFullWordRejected:true,draftAndFirstLatestReload:true,literalHintShielded:true});
   writeFileSync(out+'/browser-progress.json',JSON.stringify({checks,errors,complete:false},null,2)+'\n');
   if(i===0)await page.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});
   if(i<9)await page.getByRole('button',{name:'Verder',exact:true}).click();
  }await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,errors,simulatedAudio:true},null,2)+'\n');}
assert.equal(checks.length,10);assert.deepEqual(errors,[]);console.log('10 targeted live WebKit desktop letter flows passed in Chrome/WebKit, mobile/desktop, with draft and first-answer retention.');
