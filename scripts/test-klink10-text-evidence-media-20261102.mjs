import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-text-evidence-20261102',m=JSON.parse(readFileSync(root+'/manifest.json')),base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||root+'/local',checks=[],flows=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{const page=await browser.newPage({viewport:{width:390,height:844}});await page.addInitScript(()=>{const NativeAudio=window.Audio;window.events=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);for(const event of['playing','ended','error'])this.addEventListener(event,()=>window.events.push({event,src:this.currentSrc}));}};});await page.goto(base);
 for(const src of Object.keys(m.media)){
  const info=await page.evaluate(src=>new Promise((resolve,reject)=>{const a=new Audio();a.preload='auto';const timer=setTimeout(()=>reject(Error('Decode timeout')),15000);a.addEventListener('loadeddata',()=>{clearTimeout(timer);const result={duration:a.duration,readyState:a.readyState};a.pause();a.removeAttribute('src');a.load();resolve(result);},{once:true});a.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Decode failed'));},{once:true});a.src=src;a.load();}),src);assert(info.duration>0&&info.readyState>=2);checks.push({engine,src,...info});
 }
 const es=JSON.parse(readFileSync('public'+m.row.url)).exercises;
 await page.goto(base+'/'+chapterHash({chapter:'texts',activity:'text-evidence',collection:m.row.id,level:'a1',help:'practice'}));
 for(const e of es.slice(0,2)){const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();await page.evaluate(()=>{window.events=[];});await task.locator('.cp-instruction-listen').click();await page.waitForFunction(src=>window.events.some(e=>e.event==='ended'&&e.src.endsWith(src)),e.instructionAudio.src);assert(!await page.evaluate(()=>window.events.some(e=>e.event==='error')));for(const id of e.standardTask.acceptedSelections[0])await task.locator(`[data-word-token="${id}"]`).click();await task.locator('[data-practice-check]').click();await task.locator('[data-practice-next]:not(:disabled)').waitFor();await task.locator('[data-practice-next]').click();flows.push({engine,id:e.exerciseId,realPlayerEnded:true});}
 await page.close();}finally{await browser.close();}
}
assert.equal(checks.length,22);assert.equal(flows.length,4);writeFileSync(out+'/native-media.json',JSON.stringify({base,checks,flows,humanListening:false},null,2)+'\n');console.log('PASS 22 native audio decodes and 4 real evidence player flows.');
