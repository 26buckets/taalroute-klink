import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-sentences-alfa-c-20261103',manifest=JSON.parse(readFileSync(root+'/import-manifest.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||root+'/local';
const sources=[...Object.keys(manifest.newAudio),...Object.keys(manifest.reusedAudio)],checks=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{const NativeAudio=window.Audio;window.k10AudioEvents=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);for(const event of ['playing','ended','error'])this.addEventListener(event,()=>window.k10AudioEvents.push({event,src:this.currentSrc}));}};});
  const page=await context.newPage();
  await page.goto(base);
  for(const src of sources){
   const result=await page.evaluate(async src=>{
    const audio=new Audio();audio.preload='auto';let objectUrl;
    const [path,fragment]=src.split('#bytes=');if(fragment){const[offset,length]=fragment.split(',').map(Number),response=await fetch(path,{headers:{Range:`bytes=${offset}-${offset+length-1}`}});assertStatus(response.status);const body=await response.arrayBuffer(),bytes=response.status===200?body.slice(offset,offset+length):body;if(bytes.byteLength!==length)throw Error('Incomplete range');objectUrl=URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));}
    function assertStatus(status){if(status!==200&&status!==206)throw Error('Audio fetch failed '+status);}
    try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Media timeout')),15000);audio.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve({duration:audio.duration,readyState:audio.readyState});},{once:true});audio.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Media decoding failed'));},{once:true});audio.src=objectUrl??src;audio.load();});}
    finally{audio.pause();audio.removeAttribute('src');audio.load();if(objectUrl)URL.revokeObjectURL(objectUrl);}
   },src);
   assert(result.duration>0&&result.readyState>=2,src);checks.push({engine,src,...result});
  }
  for(const{row}of manifest.newRows){
   const bank=JSON.parse(readFileSync('public'+row.url)),exercise=bank.exercises[0];
   await page.goto(base+'/'+chapterHash({chapter:'sentences',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
   const task=page.locator(`[data-exercise-id="${exercise.exerciseId}"]`);await task.waitFor();
   await page.evaluate(()=>{window.k10AudioEvents=[];});
   await page.locator('.cp-instruction-listen').first().click();
   await page.waitForFunction(()=>window.k10AudioEvents.some(e=>e.event==='ended'),null,{timeout:30000});
   assert(!await page.evaluate(()=>window.k10AudioEvents.some(e=>e.event==='error')));
   await page.evaluate(()=>{window.k10AudioEvents=[];});
   const listen=page.locator('.cp-exercise-listen').first();
   if(await listen.count())await listen.click();
   else await page.getByRole('button',{name:/Luister/}).first().click();
   await page.waitForFunction(()=>{const control=document.querySelector('[data-word-token], .cp-extended-option > button:first-child, .cp-text-entry input');return control&&!control.disabled;},null,{timeout:60000});
   assert(await page.evaluate(()=>window.k10AudioEvents.some(e=>e.event==='ended')));
   assert(!await page.evaluate(()=>window.k10AudioEvents.some(e=>e.event==='error')));
  }
  await context.close();
 }finally{await browser.close();}
}
assert.equal(checks.length,sources.length*2);
writeFileSync(out+'/native-media.json',JSON.stringify({checks,playerPlaybackChecks:4,humanListening:false},null,2)+'\n');
console.log(`Passed ${checks.length} native media decodes and four instruction/target playback checks.`);
