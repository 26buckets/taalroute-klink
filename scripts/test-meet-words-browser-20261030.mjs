import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18859',out=process.env.KLINK_MEET_OUTPUT||'docs/meet-words-20261030/browser';mkdirSync(out,{recursive:true});
const rows=JSON.parse(readFileSync('data/klink-production-index.json')).filter(r=>r.id.startsWith('word-meet:'));
const checks=[],errors=[],url=r=>base+'/'+chapterHash({chapter:'words',activity:'meet',collection:r.id,level:r.level,help:'practice'});
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 for(const viewport of [{width:1366,height:950},{width:1024,height:600},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){window.__played.push(this.src);this.paused=false;this.t=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},40);return Promise.resolve();}pause(){clearTimeout(this.t);this.paused=true;}load(){}removeAttribute(){}};});
 const chosen=viewport.width===1366?rows:['alfa-c','a1','a2','b1'].map(l=>rows.find(r=>r.level===l));
 for(const row of chosen){
  const es=JSON.parse(readFileSync('public'+row.url)).exercises;
  await page.goto(base+'/#learner/home');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('klink.meet-preservation-probe','unchanged');});await page.goto(url(row));
  const complete=rows.find(r=>r.level===row.level).id===row.id;
  for(const [i,e] of (complete?es:es.slice(0,1)).entries()){
   const stage=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await stage.waitFor();
   const button=stage.getByRole('button',{name:`Luister naar ${e.text.primary}`,exact:true});await button.click();await page.waitForFunction(src=>window.__played.includes(src),e.prompt.audio.src);
   if(e.prompt.image.placeholderWord)assert((await button.innerText()).includes(e.text.primary));else await button.locator('img').evaluate(el=>el.decode());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const geometry=await stage.locator('.cp-exercise-stage').evaluate(el=>{const r=el.getBoundingClientRect();return {height:r.height,bottom:r.bottom,overflow:el.scrollHeight-el.clientHeight};});assert(geometry.overflow<=2,JSON.stringify({row:row.id,viewport,geometry}));
   if(i===0&&complete)await page.screenshot({path:`${out}/${engine}-${viewport.width}-${row.level}.png`});
   await page.locator('.cp-exercise-feedback').getByRole('button',{name:/^(Verder|Ronde afronden|Klaar)$/}).click();
   if(i===0&&complete){await page.reload();await page.locator(`[data-exercise-id="${es[1].exerciseId}"]`).waitFor();}
  }
  if(complete){await page.reload();assert(await page.evaluate(id=>Object.entries(localStorage).some(([k,v])=>k.includes('round-progress')&&k.includes(id)&&JSON.parse(v).done.length===12),row.id));}
  assert.equal(await page.evaluate(()=>localStorage.getItem('klink.meet-preservation-probe')),'unchanged');checks.push({engine,viewport,row:row.id,complete,words:complete?12:1});
 }
 await page.close();
 }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2));console.log('PASS',checks.length,'round openings, 24 complete rounds, audio and resume');
