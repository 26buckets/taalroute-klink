import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18984',out=process.env.KLINK_TEST_OUTPUT;assert(out);mkdirSync(out,{recursive:true});
const results=[],errors=[];
const samples=['verb-choice','sentence-build','content-grammatica','grammar-path'].map(activity=>({activity,c:chapterCollections(activity).find(c=>c.level===(activity==='content-grammatica'?'a1':'a2')&&(activity!=='content-grammatica'||c.exercises[0].access==='self-practice'))}));
async function ready(page){await page.locator('[data-exercise-id]').waitFor();await page.waitForFunction(()=>!document.querySelector('.cp-opening-loader'));}
for(const [engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{
 for(const width of [1366,390])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:950},colorScheme:theme});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(theme=>{localStorage.setItem('taalroute-klink-appearance-v1',theme);localStorage.setItem('grammar-preserve','old-answer');window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;} play(){window.__played.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();}pause(){clearTimeout(this.timer)}};},theme);
 for(const {activity,c}of samples){
  assert(c);await page.goto(base+'/'+chapterHash({chapter:'grammar',activity,collection:c.id,level:c.level,help:'practice'}));await ready(page);
  assert.equal(await page.getByRole('button',{name:'Begin samen',exact:true}).count(),0);
  const e=c.exercises[0],surface=page.locator('.cp-exercise-browser');
  if(activity==='verb-choice'){
   const input=surface.locator('input');await input.fill('onjuist');await surface.locator('[data-practice-check]').click();assert.equal(await surface.getAttribute('data-practice-ready'),'false');
   await input.fill(e.standardTask.acceptedAnswers[0]);
   const word=surface.locator('button[data-word-audio]').first();assert.equal(await word.evaluate(n=>getComputedStyle(n).padding),'0px');assert(['inline','inline-block'].includes(await word.evaluate(n=>getComputedStyle(n).display)));assert.equal(await word.evaluate(n=>getComputedStyle(n).minHeight),'0px');const before=await input.inputValue();await word.click();await page.waitForFunction(()=>window.__played.length>0);assert.equal(await input.inputValue(),before);assert.equal(await surface.getAttribute('data-practice-ready'),'false');
   await surface.locator('[data-practice-check]').click();await page.waitForFunction(()=>document.querySelector('[data-practice-ready="true"]'));
  }else if(activity==='sentence-build'){
   for(const id of e.answer.targetTileIds){const token=e.tiles.find(t=>t.id===id).token;await surface.locator('.cp-tile-bank button:enabled').filter({hasText:new RegExp('^'+token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first().click();}
   await page.waitForFunction(()=>document.querySelector('[data-practice-ready="true"]'));
  }else if(activity==='content-grammatica'){
   const t=e.contentTask;await surface.getByRole('button',{name:t.options.find(o=>!t.correctOptionIds.includes(o.id)).text,exact:true}).click();await surface.locator('[data-practice-check]').click();assert.equal(await surface.getAttribute('data-practice-ready'),'false');
   await surface.getByRole('button',{name:t.options.find(o=>t.correctOptionIds.includes(o.id)).text,exact:true}).click();await surface.locator('[data-practice-check]').click();await page.waitForFunction(()=>document.querySelector('[data-practice-ready="true"]'));
  }
  await page.locator('[data-practice-next]').click();
  if(c.exercises.length>1)await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')!==id,e.exerciseId);
  const continued=await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
  await page.reload();await ready(page);assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),continued,'Resume the same next task');
  assert.equal(await page.evaluate(()=>localStorage.getItem('grammar-preserve')),'old-answer');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(activity==='verb-choice')await page.screenshot({path:`${out}/${engineName}-${width}-${theme}.png`});
  results.push({engine:engineName,width,theme,activity,independent:true,resumed:true});
 }
 await page.close();
 }
 // Enter the same exercises through an existing lesson, with teacher support as a separate choice.
 const lessonPage=await browser.newPage();await lessonPage.addInitScript(()=>localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy:'all',language:'a2',pictures:'always'})));
 const lessonCollection=samples[0].c,lessonId=lessonCollection.exercises[0].lessonId;
 await lessonPage.goto(base+'/#learner/package/'+lessonCollection.pack.id);
 await lessonPage.locator('.cp-tabs').getByRole('button',{name:'Gebruiken',exact:true}).click();
 await lessonPage.locator('.cp-step-scope select').selectOption(lessonId);
 assert.equal(await lessonPage.getByRole('button',{name:'Nu zelf',exact:true}).getAttribute('aria-pressed'),'true');
 await lessonPage.locator('[data-activity="verb-choice"]').click();await ready(lessonPage);
 const lessonExercise=await lessonPage.locator('[data-exercise-id]').getAttribute('data-exercise-id');assert(lessonCollection.exercises.some(e=>e.exerciseId===lessonExercise));
 await lessonPage.screenshot({path:`${out}/${engineName}-leskoppeling.png`});
 await lessonPage.goto(base+'/'+chapterHash({chapter:'grammar',activity:'verb-choice',collection:lessonCollection.id,level:'a2',help:'guided'}));await ready(lessonPage);
 assert.equal(await lessonPage.getByRole('button',{name:'Begin samen',exact:true}).count(),0);
 results.push({engine:engineName,lessonId,lessonEntry:true,oldGuidedLinkPreserved:true});await lessonPage.close();
 // Native playback: actually decode and play a visible word, without the test audio double.
 const page=await browser.newPage();await page.addInitScript(()=>{window.__native=[];window.addEventListener('klink-audio-source',e=>{e.detail.muted=true;e.detail.addEventListener('playing',()=>window.__native.push({src:e.detail.src,duration:e.detail.duration}));});});
 const {c}=samples[0];await page.goto(base+'/'+chapterHash({chapter:'grammar',activity:'verb-choice',collection:c.id,level:c.level,help:'practice'}));await ready(page);await page.locator('.cp-gap-sentence [data-word-audio]').first().click();await page.waitForFunction(()=>window.__native?.some(a=>Number.isFinite(a.duration)&&a.duration>0));results.push({engine:engineName,nativeAudio:await page.evaluate(()=>window.__native)});await page.close();
 }finally{await browser.close();writeFileSync(out+'/browser.json',JSON.stringify({results,errors},null,2));}
}
assert.deepEqual(errors,[]);console.log(`${results.length} browser checks passed`);
