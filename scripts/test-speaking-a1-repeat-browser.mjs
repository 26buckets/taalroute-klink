import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/speaking-a1-repeat-20261105/',m=JSON.parse(readFileSync(root+'manifest.json')),bank=JSON.parse(readFileSync(root+'source-bank.json'));
const base=process.env.BASE_URL||'http://127.0.0.1:19125',out=process.env.EVIDENCE_DIR||root+'local',checks=[],rounds=[],errors=[];
mkdirSync(out,{recursive:true});
const hash=chapterHash({chapter:'speaking',activity:'speak',collection:m.row.id,level:'a1',help:'practice'});
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}:{})});
 try{for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:width===390?'dark':'light'});page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('speaking-a1-preserve')){localStorage.setItem('speaking-a1-preserve','existing-data');localStorage.setItem('klink.taalroute.attempts.v1',JSON.stringify([{exerciseId:'preserved-old-answer',answer:'bestaand',assessment:'participation',correct:true,attempts:1}]));}window.nativeEnded=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',e=>{const a=e.detail;if(seen.has(a))return;seen.add(a);a.addEventListener('ended',()=>window.nativeEnded.push({src:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,duration:a.duration}));});});
  await page.goto(base+'/'+hash);
  for(const[i,e]of bank.exercises.entries()){
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   await task.getByRole('button',{name:'Luister naar '+e.exampleWord,exact:true}).first().click();
   await page.waitForFunction(src=>window.nativeEnded.some(a=>a.src===src&&a.native&&a.duration>0),e.prompt.audio.src);
   assert(await task.getByText(e.selfCheck,{exact:true}).isVisible());
   assert.equal(await task.getByText(e.meaning,{exact:true}).count(),0);
   await task.getByRole('button',{name:'Help',exact:true}).click();assert(await task.getByText(e.meaning,{exact:true}).isVisible());
   await task.getByRole('button',{name:'Verberg voorbeeld',exact:true}).click();
   if(i===0&&engine==='chromium'){
    await task.getByRole('button',{name:'Neem op',exact:true}).click();await task.getByRole('button',{name:'Stop',exact:true}).waitFor();
    assert(await task.locator('[data-practice-next]').isDisabled());await page.waitForTimeout(450);
    await task.getByRole('button',{name:'Stop',exact:true}).click();await task.locator('audio[aria-label="Jouw opname"]').waitFor();
    await task.locator('audio[aria-label="Jouw opname"]').evaluate(async a=>{await a.play();await new Promise(r=>a.addEventListener('ended',r,{once:true}));});
   }
   await task.getByRole('button',{name:'Klaar',exact:true}).click();await page.waitForFunction(id=>document.querySelector(`[data-exercise-id="${id}"]`)?.dataset.practiceReady==='true',e.exerciseId);
   assert(await task.getByText(e.feedback,{exact:true}).isVisible());
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')));const a=saved.findLast(x=>x.exerciseId===e.exerciseId);assert.equal(a.assessment,'participation');assert(saved.some(x=>x.exerciseId==='preserved-old-answer'&&x.answer==='bestaand'));
   assert.equal(await page.evaluate(()=>localStorage.getItem('speaking-a1-preserve')),'existing-data');
   checks.push({engine,width,id:e.exerciseId,nativeAudio:true,optionalMeaning:true,selfCheck:true,participationOnly:true,oldAnswerPreserved:true,recording: i===0&&engine==='chromium'?'synthetic microphone and real playback':'not tested'});
   if(i===0)await page.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});
   await task.locator('[data-practice-next]').click();
  }
  await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
  await page.reload();await page.waitForTimeout(1000);
  const ids=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).map(x=>x.exerciseId));assert(bank.exercises.every(e=>ids.includes(e.exerciseId)));
  rounds.push({engine,width,completed:10,allAttemptsSurviveReload:true});await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,rounds,errors,audioMocked:false,physicalPhone:false,humanListeningClaim:false},null,2)+'\n');}
assert.equal(checks.length,40);assert.equal(rounds.length,4);assert.deepEqual(errors,[]);console.log('PASS 40 repetitions, native audio, four rounds/reloads, two synthetic microphone recordings.');
