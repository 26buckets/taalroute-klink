import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18945';
const out='docs/content-audio-repair-20261030';
const clips=JSON.parse(readFileSync(out+'/audio.json'));
const checks=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.repairPlayed=[];const play=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){window.repairPlayed.push(this.src);return play.call(this);};});
 try{
  await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  for(const c of clips){
   const duration=await page.evaluate(async src=>{const res=await fetch(src);if(!res.ok)throw Error(src);const ctx=new AudioContext();const data=await ctx.decodeAudioData(await res.arrayBuffer());await ctx.close();window.repairClip=new Audio(src);await window.repairClip.play();return data.duration;},c.src);
   assert(duration>0);await page.waitForFunction(()=>window.repairClip.currentTime>.15);await page.evaluate(()=>window.repairClip.pause());
   checks.push({engine:engine.name(),id:c.id,duration,nativePlayback:true});
  }
  for(const width of [1366,390]){
   await page.setViewportSize({width,height:900});
   await page.goto(base+'/#learner/chapters/practical/dialogues/klink-dialogue-579b29dc10de977f?level=a2');await page.locator('.cp-dialogue').waitFor();
   await page.getByRole('button',{name:'Oefen per beurt',exact:true}).click();
   while(await page.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).isEnabled())await page.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).click();
   await page.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();await page.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();
   if(await page.getByRole('button',{name:'Meelezen',exact:true}).count())await page.getByRole('button',{name:'Meelezen',exact:true}).click();
   assert.equal(await page.locator('.cp-dialogue-current p').innerText(),clips.find(c=>c.id==='medische-vraag').text);
   await page.getByRole('button',{name:'Luister naar deze beurt',exact:true}).click();
   await page.waitForFunction(()=>window.repairPlayed.some(s=>s.endsWith('/inhoudherstel-20261030/medische-vraag.mp3')));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   checks.push({engine:engine.name(),width,medicalSourceAndAudio:true});
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
writeFileSync(out+(base.startsWith('https')?'/browser-live.json':'/browser.json'),JSON.stringify(checks,null,2)+'\n');
console.log('Passed native playback for seven repairs and medical dialogue on desktop/mobile in Chromium and WebKit');
