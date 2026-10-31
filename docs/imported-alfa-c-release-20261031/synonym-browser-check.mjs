import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {synonymCollections} from '../../lib/synonyms.ts';
import {chapterHash} from '../../lib/practice-chapters.ts';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18889';
const out='/private/tmp/klink-release-20261030/docs/imported-alfa-c-release-20261031/synonyms';mkdirSync(out,{recursive:true});
const clips=JSON.parse(readFileSync('docs/synonyms-20261030/audio.json'));const checks=[];
const collection=synonymCollections.find(x=>x.level==='b1'&&x.exercises.length>3);
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [1366,390,320]){
   const page=await browser.newPage({viewport:{width,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const activity of ['synonyms','cards']){
    await page.goto(base+'/'+chapterHash({chapter:'words',activity,collection:collection.id,level:'b1',help:'practice'}));
    const selector=activity==='cards'?'.cp-flash-card':'.cp-synonym-word';await page.locator(selector).waitFor();
    const measure=await page.locator(selector).evaluate(node=>{const text=node.querySelector('strong')??node;const range=document.createRange();range.selectNodeContents(text);const a=node.getBoundingClientRect(),b=range.getBoundingClientRect(),s=getComputedStyle(text);return {dx:Math.abs((a.left+a.right-b.left-b.right)/2),dy:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),weight:s.fontWeight,overflow:document.documentElement.scrollWidth>innerWidth};});
    assert(measure.dx<3&&measure.dy<6,JSON.stringify({width,activity,...measure}));assert.equal(measure.weight,'500');assert.equal(measure.overflow,false);
    if(activity==='synonyms')assert(await page.locator('.cp-extended-option>button:first-child').evaluateAll(nodes=>nodes.length===4&&nodes.every(node=>getComputedStyle(node).fontWeight==='500')));
    else{await page.locator(selector).click();assert.equal(await page.locator(selector+' strong').evaluate(node=>getComputedStyle(node).fontWeight),'500');}
    checks.push({engine:engine.name(),width,activity,...measure});
    if(engine===chromium&&width===1366)await page.screenshot({path:out+'/'+(activity==='cards'?'draaikaart':'woordkaart')+(base.startsWith('https')?'-online':'')+'.png',fullPage:true});
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  const page=await browser.newPage();await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  for(const clip of clips){
   const result=await page.evaluate(async({src,expected})=>{
    const response=await fetch(src);if(!response.ok)throw Error(src);const bytes=await response.arrayBuffer();const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(sha!==expected)throw Error('Hash mismatch '+src);
    const context=new AudioContext();const audio=await context.decodeAudioData(bytes.slice(0));await context.close();window.reviewClip=new Audio(src);await window.reviewClip.play();return {duration:audio.duration,sha256:sha};
   },{src:clip.src,expected:clip.sha256});
   await page.waitForFunction(()=>window.reviewClip.currentTime>.15);await page.evaluate(()=>window.reviewClip.pause());assert(Math.abs(result.duration-clip.duration)<.15,clip.word);checks.push({engine:engine.name(),id:clip.id,word:clip.word,nativePlayback:true,...result});
  }
 }finally{await browser.close();}
}
assert.equal(checks.filter(x=>x.nativePlayback).length,136);assert.equal(checks.filter(x=>x.activity).length,12);
writeFileSync('docs/imported-alfa-c-release-20261031/synonyms-native-browser'+(base.startsWith('https')?'-live':'')+'.json',JSON.stringify(checks,null,2)+'\n');console.log('PASS 12 centered-card/weight/mobile cases and 136 native playback/hash checks.');
