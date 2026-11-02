import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-listening-20261102',m=JSON.parse(readFileSync(root+'/import-manifest.json')),checks=[];
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||root+'/local';
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:844},colorScheme:theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(theme=>{localStorage.setItem('taalroute-klink-appearance-v1',theme);window.Audio=class extends EventTarget{dataset={};paused=true;play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};},theme);
  const row=m.newRows.find(r=>r.row.activity==='suitable-reply').row;
  await page.goto(base+'/'+chapterHash({chapter:'listening',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
  await page.waitForFunction(()=>Boolean(window.TaalrouteAppearance));await page.evaluate(theme=>window.TaalrouteAppearance.set(theme),theme);await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
  const text=page.locator('[data-view-content="text"]').first(),toggle=page.locator('[data-view-toggle="text"]'),choice=page.locator('.cp-extended-option > button:first-child').first();await toggle.waitFor();
  assert(await text.isHidden());assert.equal(await toggle.getAttribute('aria-pressed'),'false');await toggle.click();assert(await text.isVisible());assert(await choice.isDisabled(),'Text support cannot bypass required audio');
  await page.screenshot({path:`${out}/screens/access-${engine}-${width}-${theme}.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await toggle.click();assert(await text.isHidden());await page.reload();await toggle.waitFor();assert(await text.isHidden());assert.equal(await toggle.getAttribute('aria-pressed'),'false');assert.deepEqual(errors,[]);
  checks.push({engine,width,theme,earlyTextSupport:true,audioGatePreserved:true,preferenceSurvivesReload:true,horizontalOverflow:false});await page.close();
 }}finally{await browser.close();}
}
writeFileSync(out+'/access.json',JSON.stringify({checks},null,2)+'\n');console.log('Eight early text-support, audio-gate, theme and persisted-preference checks passed.');
