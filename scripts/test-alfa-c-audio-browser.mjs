import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import audio from '../data/klink-alfa-c-audio.json' with {type:'json'};
const base=process.env.KLINK_URL??'http://127.0.0.1:18862',out=process.env.KLINK_ALFAC_OUTPUT??'outputs/alfa-c-guide-audio';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
try{
 const page=await browser.newPage();await page.goto(base+'/#learner/alfa-c/words');await page.locator('[data-pilot-block]').first().waitFor();
 await page.evaluate(clips=>{
  window.codecClips=clips;window.codecChecks=[];
  const button=document.createElement('button');button.textContent='Controleer audiobestanden';button.style.cssText='position:fixed;top:100px;left:300px;z-index:99999';document.body.appendChild(button);
  button.onclick=async()=>{try{const a=new Audio();for(const c of window.codecClips){a.src=c.src;a.playbackRate=4;await new Promise((resolve,reject)=>{a.onended=resolve;a.onerror=()=>reject(Error(c.src));a.play().catch(reject);});window.codecChecks.push({src:c.src,duration:a.duration,ended:a.ended});}window.codecDone=true;}catch(e){window.codecError=String(e);}};
 },Object.values(audio.clips));
 await page.getByRole('button',{name:'Controleer audiobestanden',exact:true}).click();
 await page.waitForFunction(()=>window.codecDone||window.codecError,{},{timeout:120000});
 assert.equal(await page.evaluate(()=>window.codecError),undefined);const codec=await page.evaluate(()=>window.codecChecks);assert.equal(codec.length,36);assert(codec.every(c=>c.ended&&c.duration>0));
 const fail=await browser.newPage();
 await fail.addInitScript(()=>{
  window.failTarget=true;window.maxActive=0;window.activeCount=0;
  window.Audio=class extends EventTarget{
   play(){this.playing=true;window.activeCount++;window.maxActive=Math.max(window.maxActive,window.activeCount);this.timer=setTimeout(()=>{this.playing=false;window.activeCount--;this.dispatchEvent(new Event(window.failTarget&&!this.src.includes('/alfa-c-uitleg-')?'error':'ended'));},30);return Promise.resolve();}
   pause(){clearTimeout(this.timer);if(this.playing){this.playing=false;window.activeCount--;}}
  };
 });
 await fail.goto(base+'/#learner/alfa-c/words');await fail.locator('[data-pilot-block="winkel"]').click();
 await fail.getByRole('button',{name:'Luister',exact:true}).click();await fail.getByRole('alert').waitFor();assert(await fail.getByRole('button',{name:'Verder',exact:true}).isDisabled(),'Instruction alone must not unlock target completion');
 await fail.evaluate(()=>window.failTarget=false);await fail.getByRole('button',{name:'Luister',exact:true}).click();await fail.waitForFunction(()=>!document.querySelector('.pilot-footer button').disabled);
 assert.equal(await fail.evaluate(()=>window.maxActive),1);
 await fail.getByRole('button',{name:'Andere oefening',exact:true}).click();assert.equal(await fail.evaluate(()=>window.activeCount),0);
 fs.writeFileSync(out+'/native-audio-checks.json',JSON.stringify({nativeDecodedFiles:codec,batchDecoderPlaybackRate:4,instructionCannotReplaceTarget:true,errorRetry:true,singleActiveAudio:true,humanListeningReview:false},null,2)+'\n');
 await page.getByRole('button',{name:'Controleer audiobestanden',exact:true}).evaluate(el=>el.remove());
 await page.screenshot({path:out+'/audio-overzicht.png'});console.log('PASS 36 native audio files, correct instruction/target separation, failed target stays locked, retry and navigation cancellation.');
}finally{await browser.close();}
