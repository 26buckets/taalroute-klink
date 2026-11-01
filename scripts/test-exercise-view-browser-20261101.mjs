import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
import {exerciseSetHelp} from '../lib/content-levels.ts';
import {pilotBlocks} from '../lib/alfa-c-practice.ts';
import {dailyBlocks} from '../lib/alfa-c-dagelijks.ts';
import {functionalBlocks} from '../lib/alfa-c-functioneel.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_VIEW_OUTPUT||'outputs/exercise-view-20261101/browser';
mkdirSync(out,{recursive:true});
const activities=['meet','cards','synonyms','listen','build','copy','dictation','sentences','sentence-dictation','text-question','text-evidence','dialogues','word-sort','grammar-path'];
const routes=activities.map(activity=>{
 const all=chapterCollections(activity).filter(c=>!c.contentUrl&&c.exercises.length);
 const c=all.find(c=>c.exercises[0].readingRoundId)||all.find(c=>c.exercises.length>1)||all[0];assert(c,activity);
 return {name:activity,hash:chapterHash({chapter:practiceChapters.find(ch=>ch.activities.includes(activity)).id,activity,collection:c.id,level:c.level,help:exerciseSetHelp(c.exercises)})};
});
for(const[name,b]of [['pilot',pilotBlocks[0]],['daily',dailyBlocks[0]],['functional',functionalBlocks[0]]])routes.push({name,hash:'#learner/alfa-c/'+b.id});
routes.push({name:'marked-dialogue',hash:'#learner/chapters/speaking/dialogues/klink-dialogue-32f962399de8f4c3?level=a2&help=practice'});
const checks=[],errors=[];
for(const[engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const width of [1366,390,320])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<600,isMobile:width<600,colorScheme:theme});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.Audio=class extends EventTarget{paused=true;play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};localStorage.setItem('klink.view-check.sentinel','behouden');});
  for(const route of routes){
   await page.goto(base+'/'+route.hash);await page.locator('.cp-exercise-stage .cp-exercise-tools').waitFor();
   const automatic=page.locator('[data-practice-automatic][aria-pressed="true"]');if(await automatic.count())await automatic.click();
   await page.waitForTimeout(120);
   const panel=page.locator('.cp-exercise-stage .cp-view-panel'),stage=page.locator('.cp-exercise-stage');
   assert.equal(await panel.count(),1);assert.equal(await page.locator('[data-picture-settings]').count(),0);
   const before=await panel.boundingBox(),s=await stage.boundingBox();assert(before.x>=s.x&&before.x+before.width<=s.x+s.width+1);assert(s.x+s.width-before.x-before.width<=24,JSON.stringify({route:route.name,width,theme,before,s}));assert(before.y-s.y>=0&&before.y-s.y<=28,JSON.stringify({route:route.name,width,theme,before,s}));
   const storage=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='klink.exercise-view.v1').map(k=>[k,localStorage.getItem(k)])));
   const id=await stage.evaluate(e=>e.closest('[data-exercise-id], [data-pilot-step], [data-daily-step], [data-functional-step]')?.getAttribute('data-exercise-id'));
   let toggles=0;
   for(const kind of ['photo','text']){
    const button=panel.locator(`[data-view-toggle="${kind}"]`),targets=stage.locator(`[data-view-content="${kind}"]`);
    assert.equal(await button.isEnabled(),(await targets.count())>0,route.name+' '+kind);
    const rect=await button.boundingBox();assert(rect.width>=44&&rect.height>=44);
    if(await button.isEnabled()){
     const start=await button.getAttribute('aria-pressed');
     if(width<600)await button.tap();else{await button.focus();await page.keyboard.press('Space');}
     assert.notEqual(await button.getAttribute('aria-pressed'),start);
     const hidden=(await button.getAttribute('aria-pressed'))==='false';
     assert(await targets.evaluateAll((nodes,hidden)=>nodes.every(e=>(getComputedStyle(e).visibility==='hidden')===hidden&&e.hasAttribute('inert')===hidden),hidden));
     await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),start);
     const now=await panel.boundingBox();assert(Math.abs(now.x-before.x)<1&&Math.abs(now.y-before.y)<1,'Controls stay in place');toggles+=2;
    }
   }
   assert.equal(await stage.evaluate(e=>e.closest('[data-exercise-id], [data-pilot-step], [data-daily-step], [data-functional-step]')?.getAttribute('data-exercise-id')),id,'Toggling never advances the exercise');
   assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='klink.exercise-view.v1').map(k=>[k,localStorage.getItem(k)]))),storage,'Existing storage unchanged');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route.name);
   if(route.name==='marked-dialogue'){
    await stage.evaluate(e=>{e.scrollTop=e.scrollHeight;});const r=await panel.boundingBox(),q=await stage.boundingBox();assert(r.y-q.y>=0&&r.y-q.y<=28,'Panel stays in the playfield while scrolling');
    await stage.evaluate(e=>{e.scrollTop=0;});
   }
   if(['meet','marked-dialogue'].includes(route.name)&&engineName==='chromium'&&theme==='light')await page.screenshot({path:`${out}/${route.name}-${width}.png`,fullPage:true});
   checks.push({engine:engineName,width,theme,route:route.name,toggles,fixedPanel:true,existingStoragePreserved:true});
  }
  await page.goto(base+'/#learner/home');await page.locator('.cp-direct-explanation').waitFor();assert.equal(await page.locator('[data-picture-settings], .cp-direct-help').count(),0);assert.equal(await page.locator('.cp-direct-levels button[aria-hidden="true"]').count(),1);
  await page.close();
 }}finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2)+'\n');assert.deepEqual(errors,[]);assert.equal(checks.length,216);console.log('PASS '+checks.length+' screen, view-toggle, keyboard, touch and storage checks');
