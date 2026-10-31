import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium, webkit} from 'playwright';
import {chapterCollections, chapterHash, practiceChapters} from '../lib/practice-chapters.ts';
import {exerciseSetHelp} from '../lib/content-levels.ts';
import {pilotBlocks} from '../lib/alfa-c-practice.ts';
import {dailyBlocks} from '../lib/alfa-c-dagelijks.ts';
import {functionalBlocks} from '../lib/alfa-c-functioneel.ts';

const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18993';
const out=process.env.KLINK_LISTEN_OUTPUT||'outputs/listen-corner-20261031/browser';
mkdirSync(out,{recursive:true});
const activities=['meet','cards','synonyms','listen','build','dictation','sentences','sentence-dictation','text-question','text-evidence','dialogues','word-sort','grammar-path'];
const routes=activities.map(activity=>{
 const collections=chapterCollections(activity).filter(c=>!c.contentUrl&&c.exercises.length);
 const c=collections.find(c=>c.exercises[0].readingRoundId)||collections.find(c=>c.exercises.length>1)||collections[0];
 assert(c,activity);
 return {name:activity,hash:chapterHash({chapter:practiceChapters.find(ch=>ch.activities.includes(activity)).id,activity,collection:c.id,level:c.level,help:exerciseSetHelp(c.exercises)})};
});
for(const [name,b]of [['pilot',pilotBlocks[0]],['daily',dailyBlocks[0]],['functional',functionalBlocks[0]]])routes.push({name,hash:'#learner/alfa-c/'+b.id});
const checks=[],errors=[];
for(const [engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const width of [1366,390,320])for(const theme of ['light','dark']){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme,hasTouch:width<600,isMobile:width<600});
   page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    const Native=window.Audio;window.__listenAudio=[];window.__listenPlays=[];
    window.Audio=function(...args){const a=new Native(...args);a.addEventListener('playing',()=>window.__listenPlays.push(a.src));window.__listenAudio.push(a);return a;};
    localStorage.setItem('klink.listen-corner.sentinel','behouden');
   });
   for(const route of routes){
    await page.goto(base+'/'+route.hash);
    await page.locator('[data-exercise-id], [data-pilot-step], [data-daily-step], [data-functional-step]').first().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    const button=page.locator('.cp-listen-slot button:visible');
    await page.waitForTimeout(100);
    const count=await button.count();
    assert(count<=1,`${route.name}: one primary listen control`);
    if(count){
     const geometry=await button.evaluate(b=>{
      const r=b.getBoundingClientRect(),h=b.closest('.cp-exercise-record-head').getBoundingClientRect();
      return {width:r.width,height:r.height,right:h.right-r.right,top:r.top-h.top,bottom:h.bottom-r.bottom,label:b.getAttribute('aria-label')};
     });
     assert(geometry.width>=48&&geometry.height>=48);
     assert(geometry.right>=0&&geometry.right<=24,JSON.stringify({route,width,geometry}));
     assert(geometry.top>=0&&geometry.top<=16&&geometry.bottom>=0,JSON.stringify({route,width,geometry}));
     assert(geometry.label);
     if(['meet','cards','text-question'].includes(route.name)&&theme==='light'&&width===390){
      await page.waitForFunction(()=>window.__listenAudio.every(a=>a.paused||a.ended));
      const before=await page.evaluate(()=>window.__listenPlays.length);
      await button.tap();
      await page.waitForFunction(n=>window.__listenPlays.length>n&&window.__listenAudio.some(a=>a.currentTime>0&&!a.paused&&a.duration>0),before);
      assert(await page.evaluate(()=>window.__listenAudio.at(-1).error===null));
      assert.equal(await button.getAttribute('data-audio-active'),'true');
     }
     checks.push({engine:engineName,width,theme,route:route.name,geometry});
    }else checks.push({engine:engineName,width,theme,route:route.name,noPrimaryAudio:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route.name+' horizontal overflow');
    assert.equal(await page.evaluate(()=>localStorage.getItem('klink.listen-corner.sentinel')),'behouden');
    if(engineName==='chromium'&&theme==='light'&&['cards','text-question','pilot'].includes(route.name))await page.screenshot({path:`${out}/${route.name}-${width}.png`});
   }
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);
writeFileSync(out+'/checks.json',JSON.stringify({checks,errors,physicalPhoneTested:false},null,2));
console.log('PASS',checks.length,'desktop/mobile/light/dark checks; native audio in both engines');
