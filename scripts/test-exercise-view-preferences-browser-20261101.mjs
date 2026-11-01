import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
import {exerciseSetHelp} from '../lib/content-levels.ts';
import {routeSettingsKey,defaultRouteSettings} from '../lib/learner-route.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996',out=process.env.KLINK_VIEW_OUTPUT||'outputs/exercise-view-20261101/preferences';
mkdirSync(out,{recursive:true});
const c=chapterCollections('meet').find(c=>c.level==='alfa-a'&&!c.contentUrl&&c.exercises.length>1);
const hash=chapterHash({chapter:'words',activity:'meet',collection:c.id,level:c.level,help:exerciseSetHelp(c.exercises)}),key='klink.exercise-view.v1',checks=[],errors=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const mode of ['always','request','after','malformed','blocked']){
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(e.message));
   const legacy=JSON.stringify({...defaultRouteSettings,pictures:['always','request','after'].includes(mode)?mode:'always'});
   await page.addInitScript(({legacy,routeKey,key,mode})=>{
    localStorage.setItem(routeKey,legacy);localStorage.setItem('klink.view-test.old-progress','{"completed":["behouden"],"position":3}');
    if(mode==='malformed'&&localStorage.getItem(key)===null)localStorage.setItem(key,'{broken');
    window.Audio=class extends EventTarget{paused=true;play(){this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),10);return Promise.resolve();}pause(){clearTimeout(this.timer);}};
    if(mode==='blocked'){Storage.prototype.getItem=()=>{throw Error('Blocked storage');};Storage.prototype.setItem=()=>{throw Error('Blocked storage');};}
   },{legacy,routeKey:routeSettingsKey,key,mode});
   await page.goto(base+'/'+hash);const photo=page.locator('[data-view-toggle="photo"]'),text=page.locator('[data-view-toggle="text"]');await photo.waitFor();await page.waitForTimeout(100);
   assert.equal(await photo.getAttribute('aria-pressed'),String(!['request','after'].includes(mode)));
   for(const button of [photo,text])if(await button.getAttribute('aria-pressed')==='true')await button.tap();
   assert.equal(await photo.getAttribute('aria-pressed'),'false');assert.equal(await text.getAttribute('aria-pressed'),'false');
   if(mode!=='blocked'){
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),routeSettingsKey),legacy);
    assert.equal(await page.evaluate(()=>localStorage.getItem('klink.view-test.old-progress')),'{"completed":["behouden"],"position":3}');
    // Init scripts intentionally leave the persisted new view choice intact on reload.
    await page.reload();await photo.waitFor();await page.waitForTimeout(100);assert.equal(await photo.getAttribute('aria-pressed'),'false');assert.equal(await text.getAttribute('aria-pressed'),'false');
   }
   checks.push({engine:name,mode,legacyPreserved:true,togglesWork:true,reload:mode!=='blocked'});await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const Native=window.Audio;window.__viewAudio=[];window.Audio=function(...args){const a=new Native(...args);window.__viewAudio.push(a);return a;};});
  await page.goto(base+'/'+hash);await page.locator('.cp-view-panel').waitFor();
  const automatic=page.locator('[data-practice-automatic][aria-pressed="true"]');if(await automatic.count())await automatic.click();
  await page.locator('.cp-listen-slot button').click();await page.waitForFunction(()=>window.__viewAudio.some(a=>!a.paused&&a.currentTime>0.01));
  await page.evaluate(()=>{window.__viewPlaying=window.__viewAudio.findLast(a=>!a.paused);window.__viewCount=window.__viewAudio.length;});
  await page.locator('[data-view-toggle="photo"]').tap();await page.locator('[data-view-toggle="text"]').tap();
  assert(await page.evaluate(()=>!window.__viewPlaying.paused&&!window.__viewPlaying.error&&window.__viewAudio.length===window.__viewCount),'Visibility switches leave the original audio playing');
  checks.push({engine:name,nativeAudioContinues:true});await page.close();
  const replay=await browser.newPage({viewport:{width:390,height:844}});replay.on('pageerror',e=>errors.push(e.message));
  await replay.addInitScript(()=>{window.Audio=class extends EventTarget{play(){this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
  await replay.goto(base+'/#learner/chapters/speaking/dialogues/klink-dialogue-32f962399de8f4c3?level=a2&help=practice');
  const mainListen=replay.locator('.cp-listen-slot button');await mainListen.waitFor();
  for(let n=0;n<2;n++){await mainListen.click();await replay.waitForFunction(()=>document.querySelector('.cp-listen-slot button')?.getAttribute('data-audio-active')!=='true');}
  assert.equal(await replay.locator('[data-view-toggle="text"]').getAttribute('aria-pressed'),'true','Replaying audio never changes the chosen text visibility');
  checks.push({engine:name,replayPreservesTextChoice:true});await replay.close();
 }finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2)+'\n');assert.deepEqual(errors,[]);assert.equal(checks.length,14);console.log('PASS 14 legacy, reload, blocked-storage and uninterrupted-native-audio/replay checks');
