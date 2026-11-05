import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash,displayedChapterCollections} from '../lib/practice-chapters.ts';
import {productionIndex} from '../lib/production-practice.ts';
import {readProductionBank} from './read-production-bank.mjs';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19206';
const out=process.env.KLINK_TEST_OUTPUT||'docs/hear-type-focus-20261105/local';
const all=process.env.KLINK_TEST_ALL==='1';
const catalog=['dictation','sentence-dictation'].flatMap(activity=>displayedChapterCollections(activity,{level:'all',help:'all'}).map(row=>({...row,activity,exercises:row.contentUrl?readProductionBank(productionIndex.find(p=>p.url===row.contentUrl)).exercises:row.exercises})));
assert(catalog.every(r=>r.exercises.every(e=>e.componentId==='ALF-CMP-006'&&['word-dictation','sentence-dictation'].includes(e.mode))));
const exactIds=new Set(JSON.parse(readFileSync('docs/dictation-50-20261105/banks.json')).map(x=>x.row.id));
const extras=['groep-1.alfa-a','voorbereiding.alfa-b','ksw-ac-ht-001-007','klink10:writing-dictation:alfa-a:20261102~words-1','groep-1.a1','groep-3.a2'];
const rows=all?catalog.filter(r=>r.exercises[0].requiresAudio):catalog.filter(r=>exactIds.has(r.id)||extras.includes(r.id));
assert.equal(rows.length,all?122:15);
mkdirSync(out,{recursive:true});const checks=[],sheets=[],errors=[];
const inputFor=task=>task.getByRole('textbox',{name:'Jouw antwoord',exact:true});
async function focused(input){await input.page().waitForFunction(el=>document.activeElement===el,await input.elementHandle(),{timeout:7000});}
async function ready(input){await input.page().waitForFunction(el=>!el.disabled,await input.elementHandle());}
async function type(page,value){await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(value);}
const route=row=>base+'/'+chapterHash({chapter:'writing',activity:row.activity,collection:row.id,level:row.level,help:row.help??'all'});
try{await Promise.all(Object.entries({chromium,webkit}).map(async([engine,kind])=>{
 const browser=await kind.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{await Promise.all((all?[1280]:[1280,390]).map(async width=>{
  const context=await browser.newContext({viewport:{width,height:844},colorScheme:width===390?'dark':'light',hasTouch:width===390});
  if(all)await context.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},40);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});
  else await context.addInitScript(()=>{window.nativeEnds=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',({detail:a})=>{if(seen.has(a))return;seen.add(a);a.addEventListener('ended',()=>window.nativeEnds.push({source:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,duration:a.duration}));});});
  const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,error:e.message}));
  for(const row of rows){
   await page.goto(route(row));
   const exercises=row.exercises.slice(0,all?2:exactIds.has(row.id)?undefined:3);
   for(const[i,e]of exercises.entries()){
    const task=page.locator('[data-exercise-id="'+e.exerciseId+'"]'),input=inputFor(task);
    await input.waitFor();
    if(i===0&&e.requiresAudio)await task.locator('.cp-exercise-listen').click();
    await ready(input);await focused(input);
    if(!all&&e.requiresAudio)assert(await page.evaluate(src=>window.nativeEnds.some(x=>x.source===src&&x.native&&x.duration>0),e.prompt.audio.src));
    const word=e.fields[0].acceptedAnswers[0];
    await type(page,'zzq');await page.keyboard.press('Enter');
    await task.locator('.cp-exercise-feedback.wrong').waitFor();await ready(input);await focused(input);
    if(i===0){
     await task.locator('.cp-exercise-listen').click();await focused(input);
     assert.equal(await input.inputValue(),'zzq','Replay preserves the draft');
    }
    await type(page,word);await page.keyboard.press('Enter');
    await page.waitForFunction(el=>el.dataset.practiceReady==='true',await task.elementHandle());
    await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-practice-next'));
    const saved=e.writingSourceId?await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.writingSourceId):null;
    if(saved){assert.equal(saved.first,'zzq');assert.equal(saved.last,word);}
    checks.push({engine,width,row:row.id,id:e.exerciseId,mode:e.mode,nativeAudio:!all&&!!e.requiresAudio,keyboardOnlyAnswer:true,wrongAnswerFocus:true,replayFocus:i===0,firstLastPreserved:!!saved});
    await page.keyboard.press('Enter');
   }
   if(exercises.length===row.exercises.length)await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   if(!all&&width===390&&row.activity==='dictation'){
    // A separate context avoids completed-round state affecting the sheet.
    const sc=await browser.newContext({viewport:{width,height:844},hasTouch:true}),sp=await sc.newPage();await sp.goto(route(row));await sp.getByRole('button',{name:'Op één blad',exact:true}).click();
    for(const e of row.exercises.slice(0,2)){
     const task=sp.locator('[data-sheet-exercise="'+e.exerciseId+'"]'),input=inputFor(task);
     await task.locator('.cp-exercise-listen').click();await ready(input);await focused(input);
     await type(sp,'zzq');await sp.keyboard.press('Enter');await task.locator('output').filter({hasText:/./}).waitFor();await ready(input);await focused(input);
     await type(sp,e.fields[0].acceptedAnswers[0]);await sp.keyboard.press('Enter');
     await sp.waitForFunction(el=>el.dataset.practiceReady==='true',await task.elementHandle());
     sheets.push({engine,row:row.id,id:e.exerciseId,keyboardOnlyAnswer:true,nativeAudio:true});
    }await sc.close();
   }
  }await context.close();
 }));}finally{await browser.close();}
}));}finally{writeFileSync(out+'/'+(all?'catalog':'browser')+'.json',JSON.stringify({base,simulatedAudio:all,catalog:catalog.map(r=>({id:r.id,activity:r.activity,level:r.level,count:r.exercises.length})),checks,sheets,errors},null,2)+'\n');}
assert.deepEqual(errors,[]);assert.equal(checks.length,rows.reduce((n,r)=>n+Math.min(r.exercises.length,all?2:exactIds.has(r.id)?Infinity:3),0)*(all?2:4));
if(!all)assert.equal(sheets.length,rows.filter(r=>r.activity==='dictation').reduce((n,r)=>n+Math.min(2,r.exercises.length),0)*2);
console.log(`Passed ${checks.length} keyboard flows and ${sheets.length} sheet flows; ${all?'simulated':'native'} audio.`);
