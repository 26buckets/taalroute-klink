import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const d=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues.find(d=>d.id==='klink-dialogue-d0a263adf67c1b3c');
const base=process.env.KLINK_TEST_URL||'http://localhost:18931';const out=process.env.KLINK_READALONG_OUTPUT||'outputs/readalong';mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const p=await browser.newPage({viewport:{width:390,height:844}});
await p.addInitScript(()=>{const NativeAudio=window.Audio;window.__ended=[];window.Audio=class extends NativeAudio{constructor(src){super(src);this.muted=true;this.addEventListener('ended',()=>window.__ended.push({src:new URL(this.src).pathname,rate:this.playbackRate,pitch:this.preservesPitch}));}};});
try{
 await p.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=a2`);await p.getByRole('button',{name:'Langzamer afspelen',exact:true}).click();
 for(const round of [1,2]){
  await p.evaluate(()=>window.__ended=[]);await p.getByRole('button',{name:'Luister naar het gesprek',exact:true}).click();
  assert.equal(await p.getByRole('button',{name:round===1?'Tekst verbergen':'Meelezen',exact:true}).getAttribute('aria-pressed'),String(round===1));
  await p.waitForFunction(()=>window.__ended.length===4,undefined,{timeout:90000});const ended=await p.evaluate(()=>window.__ended);assert.deepEqual(ended.map(r=>r.src),d.turns.map(t=>t.src));assert(ended.every(r=>r.rate===.65&&r.pitch));
 }
 await p.getByRole('button',{name:'Meelezen',exact:true}).click();assert.equal(await p.locator('.cp-dialogue-current p').innerText(),d.turns[3].text);assert.equal(await p.getByRole('button',{name:'Langzamer afspelen',exact:true}).getAttribute('aria-pressed'),'true');
 await p.goto(`${base}/docenten/hoofdstuk-8`);await p.getByText(/staat bij elk nieuw gesprek aan/).waitFor();
 writeFileSync(`${out}/native.json`,JSON.stringify({passed:true,nativeAudio:true,muted:true,noAcceleration:true,rounds:2,firstWithText:true,secondWithoutText:true,manualRestore:true,slowPreserved:true,manualUpdated:true},null,2)+'\n');console.log('PASS two native slow listening rounds with automatic readalong switch and manual restore');
}finally{await browser.close();}
