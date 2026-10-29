import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://localhost:18929';
const out='outputs/look-listen-text-20261029';mkdirSync(out,{recursive:true});
const rows=productionIndex.filter(r=>r.activity==='meet');
const checks=[];
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const row of rows){
   const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
   const url=base+'/'+chapterHash({chapter:'words',activity:'meet',collection:row.id,level:row.level,help:row.help});
  for(const [width,height] of [[1366,768],[768,1024],[390,844],[320,568]]){
   const page=await browser.newPage({viewport:{width,height}});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){window.__played.push(this.src);this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},30);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});
   await page.goto(url);await page.locator('.cp-model-sentence').waitFor();
   const pause=page.getByRole('button',{name:'Automatisch verder pauzeren',exact:true});if(await pause.count())await pause.click();
   for(let i=0;i<exercises.length;i++){
    const ex=exercises[i];await page.locator(`[data-exercise-id="${ex.exerciseId}"]`).waitFor();
    const text=page.locator('.cp-model-sentence > strong');assert.equal(await text.innerText(),ex.text.primary);
    const bounds=await text.evaluate(el=>{
     const stage=el.closest('.cp-exercise-stage'),s=stage.getBoundingClientRect(),t=el.getBoundingClientRect();
     const range=document.createRange();range.selectNodeContents(el);
     return {font:parseFloat(getComputedStyle(el).fontSize),fits:t.top>=s.top-1&&t.bottom<=s.bottom+1,linesFit:[...range.getClientRects()].every(r=>r.left>=s.left-1&&r.right<=s.right+1),noInnerScroll:stage.scrollHeight<=stage.clientHeight+1,noPageOverflow:document.documentElement.scrollWidth<=innerWidth+1};
    });
    assert(bounds.font>=24&&bounds.font<=36,JSON.stringify(bounds));
    assert(bounds.fits&&bounds.linesFit&&bounds.noInnerScroll&&bounds.noPageOverflow,`${name} ${width} ${ex.exerciseId}: ${JSON.stringify(bounds)}`);
    await page.locator('.cp-model-sentence').click();
    await page.waitForFunction(src=>window.__played.includes(src),ex.prompt.audio.src);
    checks.push({browser:name,width,height,id:ex.exerciseId,...bounds});
    if(i===0)await page.screenshot({path:`${out}/after-${row.id.split(':').at(-1)}-${name}-${width}.png`,fullPage:true});
    if(i<exercises.length-1)await page.locator('.cp-exercise-feedback > button').click();
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  }
  // The same renderer keeps individual word models large.
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  await page.goto(base+'/#learner/chapters/alfa-c-words/sequence?level=alfa-c&help=practice');
  await page.locator('[data-pilot-block]').first().click();await page.locator('.cp-model-content > strong').waitFor();
  assert.equal(await page.locator('.cp-model-sentence').count(),0);
  assert.equal(await page.locator('.cp-model-content > strong').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),44);
 }finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({checks,singleWordsPreserved:true,audioRoutingPreserved:true},null,2)+'\n');
console.log(`PASS ${checks.length} complete sentence layouts and audio routes; large single words preserved in both browsers.`);
