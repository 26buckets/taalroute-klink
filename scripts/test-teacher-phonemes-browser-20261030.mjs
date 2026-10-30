import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_URL||'http://127.0.0.1:18947';
const out=process.env.KLINK_PHONEMES_OUTPUT||'docs/teacher-phonemes-20261030/browser';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 for(const width of [1366,390]){
  const page=await browser.newPage({viewport:{width,height:950}});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__soundEvents=[];const original=Reflect.get(HTMLMediaElement.prototype,'play');HTMLMediaElement.prototype.play=function(){this.addEventListener('ended',()=>window.__soundEvents.push({src:this.currentSrc,rate:this.playbackRate,duration:this.duration}),{once:true});return original.call(this);};});
  await page.goto(base+'/#teacher/plus',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Les openen',exact:true}).click();await page.getByRole('button',{name:'3 Klanken',exact:true}).click();
  for(const id of ['m','a','t']){
   const button=page.locator('.kpd-stage').getByRole('button',{name:`Luister naar de klank ${id==='a'?'korte a':id}`,exact:true});await button.click();
   await page.waitForFunction(id=>window.__soundEvents.some(e=>e.src.endsWith(`/docent/${id}-20261030.mp3`)),id);
   const event=await page.evaluate(id=>window.__soundEvents.find(e=>e.src.endsWith(`/docent/${id}-20261030.mp3`)),id);assert.equal(event.rate,1);assert(event.duration>0.3&&event.duration<2);checks.push({engine,width,id,...event});
  }
  assert.equal(await page.locator('.kpd-stage .kpd-missing').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.getByRole('button',{name:'4 Bouwen',exact:true}).click();await page.getByRole('button',{name:'Leg m',exact:true}).click();await page.getByRole('button',{name:'3 Klanken',exact:true}).click();await page.reload();await page.getByRole('button',{name:'4 Bouwen',exact:true}).click();assert.equal(await page.locator('[data-tile-slot="0"]').innerText(),'m');
  await page.screenshot({path:`${out}/${engine}-${width}.png`});await page.close();
 }
 const p=await browser.newPage();let fail=true;await p.route('**/klank-audio/docent/t-20261030.mp3',r=>fail?r.abort():r.continue());await p.goto(base+'/#teacher/plus',{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Les openen',exact:true}).click();await p.getByRole('button',{name:'3 Klanken',exact:true}).click();await p.locator('.kpd-stage .kpd-missing').waitFor();assert(await p.locator('.kpd-stage').getByRole('button',{name:'Luister naar de klank t',exact:true}).isDisabled());assert(await p.locator('.kpd-stage').getByRole('button',{name:'Luister naar de klank m',exact:true}).isEnabled());fail=false;await p.reload();await p.locator('.kpd-stage').getByRole('button',{name:'Luister naar de klank t',exact:true}).click();await p.close();checks.push({engine,errorRecovery:true});
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors,realNativePlayback:true},null,2));console.log('PASS',checks.length,'native phoneme playback, persistence and recovery checks');
