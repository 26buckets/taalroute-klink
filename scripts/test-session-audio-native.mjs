import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.KLINK_TEST_URL||'http://localhost:18930';const out=process.env.KLINK_SESSION_OUTPUT||'outputs/session-audio';mkdirSync(out,{recursive:true});
const dialogue=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues.find(d=>d.id==='klink-dialogue-d0a263adf67c1b3c');
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});
await page.addInitScript(()=>{
 const NativeAudio=window.Audio;window.__started=[];window.__ended=[];
 window.Audio=class extends NativeAudio{
  constructor(src){super(src);this.muted=true;window.__audio=this;this.addEventListener('ended',()=>window.__ended.push({src:new URL(this.src).pathname,rate:this.playbackRate}));}
  play(){window.__started.push({src:new URL(this.src).pathname,rate:this.playbackRate,pitch:this.preservesPitch});return super.play();}
 };
});
try{
 await page.goto(`${base}/#learner/chapters/practical/dialogues/${dialogue.id}?level=a2`);
 await page.getByRole('button',{name:'Luister naar het gesprek',exact:true}).click();await page.waitForFunction(()=>window.__audio.currentTime>.15);
 const before=await page.evaluate(()=>window.__audio.currentTime);
 const slow=page.getByRole('button',{name:'Langzamer afspelen',exact:true});await slow.click();
 assert.equal(await page.evaluate(()=>window.__audio.playbackRate),.65);assert((await page.evaluate(()=>window.__audio.currentTime))>=before);assert.equal(await page.evaluate(()=>window.__started.length),1);
 await page.waitForFunction(()=>window.__ended.length===4,undefined,{timeout:90000});
 const played=await page.evaluate(()=>({started:window.__started,ended:window.__ended}));assert.deepEqual(played.ended.map(r=>r.src),dialogue.turns.map(t=>t.src));assert(played.ended.every(r=>r.rate===.65));assert(played.started.every(r=>r.pitch));assert(played.started.slice(1).every(r=>r.rate===.65));
 await slow.click();assert.equal(await page.evaluate(()=>window.__audio.playbackRate),.85);assert(await page.getByRole('button',{name:'Ronde afronden',exact:true}).isEnabled());
 await page.goto(`${base}/docenten/hoofdstuk-8`);await page.getByText(/Met de slakkenknop/).waitFor();
 writeFileSync(`${out}/native.json`,JSON.stringify({passed:true,nativeAudio:true,muted:true,noAcceleration:true,immediateWithoutRestart:true,normalRestored:true,manualUpdated:true,...played},null,2)+'\n');console.log('PASS real four-turn playback at 0.65, in-place rate change, original pitch setting, restore and teacher guide');
}finally{await browser.close();}
