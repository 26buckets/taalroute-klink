import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
const out='docs/sentence-second-review-20261030';
const clips=JSON.parse(readFileSync(out+'/audio.json'));
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18946';
const collections=['a1','a2'].flatMap(level=>availableChapterCollections('sentences',{level,help:'guided'}).map(c=>({...c,level})));
const checks=[],errors=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
   const page=await browser.newPage({viewport});page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push({engine:engine.name(),width:viewport.width,url:page.url(),message:e.message}));
   await page.addInitScript(()=>{window.sentencePlayback=[];const play=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){window.sentencePlayback.push(this);return play.call(this);};});
   await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
   for(const clip of clips){
    const collection=collections.find(c=>c.exercises.some(e=>e.contextId===clip.contentId));assert(collection);
    const exercise=collection.exercises.find(e=>e.contextId===clip.contentId);
    const storage=groupSessionKey('chapter:sentences:'+collection.id,'sentences');
    await page.evaluate(({storage,id})=>localStorage.setItem(storage,JSON.stringify({version:1,exerciseId:id,done:false})),{storage,id:exercise.exerciseId});
    await page.goto(`${base}/?sentence-review=${clip.id}#learner/chapters/sentences/sentences/${collection.id}?level=${collection.level}&help=guided`);
    await page.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
    const block=page.locator('.cp-reading-blocks > button');assert.equal(await block.innerText(),clip.text);
    await block.click();await page.waitForFunction(src=>window.sentencePlayback.some(a=>a.src.endsWith(src)&&a.currentTime>.15),clip.src);
    const media=await page.evaluate(async src=>{const res=await fetch(src);if(!res.ok)throw Error('audio not served');const bytes=await res.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',bytes);return {sha256:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''),duration:window.sentencePlayback.find(a=>a.src.endsWith(src)).duration};},clip.src);
    assert.equal(media.sha256,clip.sha256);assert(media.duration>0);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    checks.push({engine:engine.name(),width:viewport.width,id:clip.id,level:collection.level,text:true,nativePlayback:true,servedFileHash:media.sha256});
    console.log(engine.name(),viewport.width,clip.id,'passed');
    if(clip.id==='zin-51')await page.screenshot({path:`${out}/${engine.name()}-${viewport.width}-maximum.png`,fullPage:true});
   }
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);assert.equal(checks.length,56);
writeFileSync(out+'/audio-browser.json',JSON.stringify({checks,errors},null,2)+'\n');console.log('56 revised sentence/player/audio checks passed');
