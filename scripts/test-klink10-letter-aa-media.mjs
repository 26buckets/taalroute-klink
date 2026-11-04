import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-letter-aa-20261103',m=JSON.parse(readFileSync(root+'/manifest.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19046',out=process.env.KLINK_TEST_OUTPUT||root+'/local';mkdirSync(out,{recursive:true});
const response=await fetch(base+m.instruction.src);assert(response.ok);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),m.instruction.sha256);
const checks=[];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>{const NativeAudio=window.Audio;window.letterAudioEvents=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);for(const event of ['playing','ended','error'])this.addEventListener(event,()=>window.letterAudioEvents.push({event,src:this.currentSrc}));}};});
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'write-letter',collection:m.row.id,level:'alfa-a',help:'practice'}));
  await page.locator('[data-exercise-id="KSW-N26R2-AA-WL-001"]').waitFor();
  await page.locator('.cp-instruction-listen').first().click();
  await page.waitForFunction(()=>window.letterAudioEvents.some(e=>e.event==='ended'),null,{timeout:30000});
  const events=await page.evaluate(()=>window.letterAudioEvents);assert(!events.some(e=>e.event==='error'));assert(events.some(e=>e.event==='playing'&&e.src.endsWith('KAC-ONLINE-f2eda6738ed4.mp3')));
  checks.push({engine,instructionPlayedToEnd:true,events});
 }finally{await browser.close();}
}
writeFileSync(out+'/native-media.json',JSON.stringify({base,checks,fullAudioSha256:m.instruction.sha256,humanListeningPerformed:false},null,2)+'\n');console.log('Both native players completed the existing instruction; full offered bytes matched.');
