import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync}from'node:fs';
const{chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const data=JSON.parse(readFileSync('data/klink-dialogue-repair.json'));const base=process.env.KLINK_TEST_URL||'http://localhost:18925';const out=process.env.KLINK_DIALOGUE_OUTPUT||'outputs/dialogue-browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
try{
 for(const d of data.dialogues){
  await page.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=${d.sourceLevel.toLowerCase()}`);
  await page.locator('.cp-dialogue').waitFor();await page.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),d.id);
  const img=page.locator('.cp-dialogue-scene img');await img.waitFor();await img.evaluate(el=>el.complete?Promise.resolve():new Promise((resolve,reject)=>{el.onload=resolve;el.onerror=reject;}));assert(await img.evaluate(el=>el.naturalWidth>0));
  assert.equal(await page.locator('.cp-dialogue-current h3').innerText(),d.turns[0].speaker);
  await page.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();assert.equal(await page.locator('.cp-dialogue-current h3').innerText(),d.turns[1].speaker);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push(d.id);
 }
 assert.deepEqual(errors,[]);writeFileSync(`${out}/all-dialogues.json`,JSON.stringify({checked:checks.length,ids:checks,errors},null,2));console.log('128 dialogue pages: scene loads, correct two speakers, no overflow');
 const files=data.dialogues.flatMap(d=>d.turns.map(t=>t.src));const results=await page.evaluate(async files=>{
  let next=0;const results=[];async function worker(){while(next<files.length){const src=files[next++];await new Promise(resolve=>{const a=new Audio(src);a.muted=true;a.playbackRate=16;const timer=setTimeout(()=>{results.push({src,error:'timeout'});a.pause();resolve();},20000);a.onended=()=>{clearTimeout(timer);results.push({src,ended:true,duration:a.duration});resolve();};a.onerror=()=>{clearTimeout(timer);results.push({src,error:'media'});resolve();};a.play().catch(e=>{clearTimeout(timer);results.push({src,error:e.message});resolve();});});}}await Promise.all(Array.from({length:4},worker));return results;
 },files);
 writeFileSync(`${out}/real-audio.json`,JSON.stringify({method:'real browser decoding and ended events; muted at 16x, four independent test players; not human listening',results},null,2));assert.equal(results.length,512);assert(results.every(r=>r.ended&&r.duration>0));console.log('512 real audio files reached ended');
}finally{await browser.close();}
