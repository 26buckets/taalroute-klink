import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18984',out=process.env.KLINK_TEST_OUTPUT;assert(out);mkdirSync(out,{recursive:true});
const collections=chapterCollections('grammar-path').filter(c=>c.exercises[0].localGrammar),results=[],errors=[];
const hash=c=>chapterHash({chapter:'grammar',activity:'grammar-path',collection:c.id,level:c.level,help:'practice'});
async function ready(p){await p.locator('[data-exercise-id]').waitFor();await p.waitForFunction(()=>!document.querySelector('.cp-opening-loader'));}
async function answer(p,e,wrong=false){
 const s=p.locator('.cp-exercise-browser');
 if(e.componentId==='ALF-CMP-002'){
  const option=e.options.find(o=>e.answer.correctOptionIds.includes(o.id)!==wrong);await s.locator('.cp-choice-grid button').filter({has:p.locator(`img[alt="${option.label}"]`)}).click();
 }else if(e.standardTask){const t=e.standardTask,o=t.options.find(o=>t.acceptedAnswers.includes(o.label)!==wrong);await s.locator('.cp-choice-grid').getByRole('button',{name:o.label,exact:true}).click();}
 else{const t=e.contentTask,o=t.options.find(o=>t.correctOptionIds.includes(o.id)!==wrong);await s.locator('.cp-choice-grid').getByRole('button',{name:o.text,exact:true}).click();await s.locator('[data-practice-check]').click();}
 if(wrong)assert.equal(await s.getAttribute('data-practice-ready'),'false');else await p.waitForFunction(()=>document.querySelector('[data-practice-ready="true"]'));
}
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{
 for(const width of [390,1366])for(const theme of ['light','dark']){
  const p=await browser.newPage({viewport:{width,height:950},colorScheme:theme});p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(theme=>{localStorage.setItem('taalroute-klink-appearance-v1',theme);localStorage.setItem('grammar-preserve','existing');window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;}play(){window.__played.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();}pause(){clearTimeout(this.timer)}};},theme);
  for(const level of ['alfa-a','alfa-b','alfa-c','b1']){
   const c=collections.find(c=>c.level===level&&c.exercises.length>1);await p.goto(base+'/'+hash(c));await ready(p);const e=c.exercises[0];
   assert.equal(await p.getByRole('button',{name:'Begin samen',exact:true}).count(),0);
   if(e.requiresAudio)await p.locator('.cp-choice-grid button').first().waitFor({state:'visible'});
   await answer(p,e,true);
   const word=p.locator('.cp-exercise-browser [data-word-audio]').first();if(await word.count()){
    assert.equal(await word.evaluate(n=>getComputedStyle(n).padding),'0px');assert.equal(await word.evaluate(n=>getComputedStyle(n).minHeight),'0px');
    await word.click();await p.waitForFunction(()=>window.__played.length>0);assert.equal(await p.locator('.cp-exercise-browser').getAttribute('data-practice-ready'),'false');
   }
   await answer(p,e);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:`${out}/${name}-${width}-${theme}-${level}.png`});
   await p.locator('[data-practice-next]').click();await p.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')!==id,e.exerciseId);
   const id=await p.locator('[data-exercise-id]').getAttribute('data-exercise-id');await p.reload();await ready(p);assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),id);assert.equal(await p.evaluate(()=>localStorage.getItem('grammar-preserve')),'existing');
   results.push({engine:name,width,theme,level,wrongCorrectAudioResume:true});
  }await p.close();
 }
 // All authored answers, including one-task collections, reach the manual completion control.
 const p=await browser.newPage();p.setDefaultTimeout(15000);await p.addInitScript(()=>{window.Audio=class extends EventTarget{play(){setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();}pause(){}};});
 for(const c of collections){await p.goto(base+'/'+hash(c));await ready(p);for(const e of c.exercises){assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),e.exerciseId);await answer(p,e);await p.locator('[data-practice-next]').click();}await p.getByRole('heading',{name:'Goed geoefend'}).waitFor();results.push({engine:name,collection:c.id,completed:c.exercises.length});}await p.close();
 // Lesson entrance follows each selected axis, teacher choice stays optional.
 for(const level of ['alfa-a','alfa-b','alfa-c','b1']){
  const c=collections.find(c=>c.level===level),e=c.exercises[0],p=await browser.newPage();p.setDefaultTimeout(15000);
  await p.addInitScript(e=>localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy:'all',language:'all',pictures:'always',[e.contentAxis]:e.contentLevel})),e);
  await p.goto(base+'/#learner/package/'+c.pack.id);await p.locator('.cp-tabs').getByRole('button',{name:'Gebruiken',exact:true}).click();await p.locator('.cp-step-scope select').selectOption(e.lessonId);
  assert.equal(await p.getByRole('button',{name:'Nu zelf',exact:true}).getAttribute('aria-pressed'),'true');await p.locator('[data-activity="grammar-path"]').click();await ready(p);
  const id=await p.locator('[data-exercise-id]').getAttribute('data-exercise-id');assert(c.exercises.some(e=>e.exerciseId===id));results.push({engine:name,level,lesson:e.lessonId,lessonEntry:true});await p.close();
 }
 // Real decoder/playback, no synthetic audio. Required listening must finish first.
 for(const level of ['alfa-a','alfa-b']){
  const c=collections.find(c=>c.level===level),p=await browser.newPage();p.setDefaultTimeout(20000);
  await p.addInitScript(()=>{window.__native=[];window.addEventListener('klink-audio-source',e=>{e.detail.muted=true;e.detail.addEventListener('ended',()=>window.__native.push({src:e.detail.src,duration:e.detail.duration}));});});
  await p.goto(base+'/'+hash(c));await ready(p);await p.locator('[data-practice-listen]').first().click();await p.waitForFunction(()=>window.__native?.some(a=>Number.isFinite(a.duration)&&a.duration>0));await answer(p,c.exercises[0]);results.push({engine:name,level,nativeAudio:await p.evaluate(()=>window.__native)});await p.close();
 }
 }finally{await browser.close();writeFileSync(out+'/browser.json',JSON.stringify({results,errors},null,2));}
}
assert.deepEqual(errors,[]);console.log(`${results.length} checks passed`);
