import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18937',browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1366,height:950}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){this.paused=false;window.__played.push(this.src);this.t=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},40);return Promise.resolve();}pause(){clearTimeout(this.t);this.paused=true;}};});
const data=row=>JSON.parse(readFileSync('public'+row.url)).exercises;
const url=row=>base+'/'+chapterHash({chapter:practiceChapters.find(c=>c.activities.includes(row.activity)).id,activity:row.activity,collection:row.id,level:row.level,help:row.help});
const next=()=>page.locator('.cp-exercise-feedback').getByRole('button',{name:/^(Verder|Ronde afronden|Klaar)$/});
async function finish(e,scope=page){
 if(e.mode==='copy-word'){
  const input=scope.locator('.cp-text-entry input');await input.fill('zzzfout');await input.press('Enter');assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Probeer opnieuw'));
  await input.fill(e.fields[0].acceptedAnswers[0]);await input.press('Enter');
 }else if(e.mode==='word-build'){
  if(e.requiresAudio)await scope.getByRole('button',{name:'Luister naar het woord',exact:true}).click();
  for(const id of e.answer.targetTileIds)await scope.locator('.cp-tile-bank button').nth(e.tiles.findIndex(t=>t.id===id)).click();
 }else if(e.mode==='word-bingo'){
  const at=e.cells.findIndex(c=>c.cellId===e.answer.correctCellId);await scope.locator('.cp-board-grid button').nth(at).click();
 }else if(e.mode==='word-sort'){
  for(const item of e.standardTask.items)await scope.locator(`[data-sort-category="${item.categoryId}"]`).click();
 }else if(e.mode==='memory'){
  for(const key of new Set(e.items.map(i=>i.pairKey))){for(let n=0;n<e.items.length;n++)if(e.items[n].pairKey===key)await scope.locator('.cp-memory-grid button').nth(n).click();await page.waitForTimeout(600);}
 }else if(e.mode==='learning-choice'){
  await scope.getByRole('button',{name:e.options.find(o=>o.id===e.answer.correctOptionIds[0]).label,exact:true}).click();
 }else if(!['read-series','model','learning-example'].includes(e.mode))throw Error(e.mode);
}
try{
 await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
 const selected=[...new Map(productionIndex.map(r=>[r.activity,r])).values()];
 for(const row of selected){
  await page.goto(url(row));const ex=data(row);await page.locator('[data-exercise-id],.cp-word-worksheet').waitFor();
  if(row.activity.startsWith('worksheet')){
   await page.getByRole('button',{name:'Luister naar de opdracht',exact:true}).click();
   for(const e of ex.slice(0,4))await finish(e,page.locator(`[data-worksheet-exercise="${e.exerciseId}"]`));
   assert(await page.locator('.cp-word-worksheet').getByRole('button',{name:'Verder',exact:true}).isEnabled());
  }else{
   const count=row.activity==='spelling-path'?4:row.activity==='word-bingo'?3:1;
   for(const e of ex.slice(0,count)){
    await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();await finish(e);await next().click();
   }
   if(ex.length>count){
    await page.locator(`[data-exercise-id="${ex[count].exerciseId}"]`).waitFor();await page.reload();await page.locator(`[data-exercise-id="${ex[count].exerciseId}"]`).waitFor();
   }
  }
  checks.push({activity:row.activity,answered:true,resume:!row.activity.startsWith('worksheet')});console.log('PASS answers',row.activity);
 }
 const played=await page.evaluate(()=>window.__played);assert(played.some(s=>s.includes('productie-instructies')));assert(!played.some(s=>/\/instructions\//.test(s)));
 // Actual file decoding, beyond mocked playback interactions.
 const media=JSON.parse(readFileSync('docs/production-20261029/audio-check.json')).files;
 const decode=[...media.filter(f=>f.src.endsWith('.wav')),...media.filter(f=>f.role==='instruction').slice(0,2),...media.filter(f=>f.role==='word'&&f.src.includes('kijk-luister')).slice(0,2)];
 for(const f of decode){const duration=await page.evaluate(async src=>{const context=new AudioContext();try{const r=await fetch(src);if(!r.ok)throw Error('Audio unavailable');const b=await context.decodeAudioData(await r.arrayBuffer());return b.duration;}finally{await context.close();}},f.src);assert(duration>.2);}
 checks.push({nativeDecoded:decode.length});
 const out='outputs/production-20261029';mkdirSync(out,{recursive:true});const images=[];
 for(const row of productionIndex.filter(r=>r.activity==='meet'))for(const e of data(row)){
  const key=groupSessionKey('chapter:meet:'+row.id,'meet');await page.evaluate(({key,id})=>localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false})),{key,id:e.exerciseId});
  await page.goto(url(row));await page.reload();await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
  const img=page.locator('.cp-model-content img');await img.waitFor();await img.evaluate(el=>el.decode());const actual=new URL(await img.getAttribute('src'),base);assert.equal(actual.searchParams.get('url')||actual.pathname,e.prompt.image.src);
  await page.screenshot({path:out+'/'+e.exerciseId+'-desktop.png'});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:out+'/'+e.exerciseId+'-mobile.png'});await page.setViewportSize({width:1366,height:950});images.push(e.exerciseId);
 }
 assert.equal(images.length,44);assert.deepEqual(errors,[]);
 writeFileSync('docs/image-repairs-20261030/answer-check.json',JSON.stringify({checks,images,errors,localOnly:true},null,2));console.log('PASS images',images.length);
}finally{await browser.close();}
