import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/klink10-grammar-20261102',manifest=JSON.parse(readFileSync(root+'/import-manifest.json'));
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
    const audio=new Audio();audio.preload='auto';
    try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Media timeout')),15000);audio.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve({duration:audio.duration,readyState:audio.readyState});},{once:true});audio.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Media decoding failed'));},{once:true});audio.src=src;audio.load();});}
    finally{audio.pause();audio.removeAttribute('src');audio.load();}
   },src);
   assert(result.duration>0&&result.readyState>=2,src);checks.push({engine,src,...result});
  }
  for(const{row}of manifest.newRows.filter(r=>['grammar-path','sentence-build'].includes(r.row.activity)).slice(0,3)){
   const bank=JSON.parse(readFileSync('public'+row.url)),exercise=bank.exercises[0];
   await page.goto(base+'/'+chapterHash({chapter:'grammar',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
   const task=page.locator(`[data-exercise-id="${exercise.exerciseId}"]`);await task.waitFor();
   await page.evaluate(()=>{window.k10AudioEvents=[];});
   const listen=page.locator('.cp-exercise-listen').first();
   if(await listen.count())await listen.click();
   else await page.getByRole('button',{name:/Luister/}).first().click();
   await page.waitForFunction(()=>window.k10AudioEvents.some(e=>e.event==='ended'),null,{timeout:30000});
   assert(!await page.evaluate(()=>window.k10AudioEvents.some(e=>e.event==='error')));
  }
  await context.close();
 }finally{await browser.close();}
}
assert.equal(checks.length,sources.length*2);
writeFileSync(out+'/native-media.json',JSON.stringify({checks,playerPlaybackChecks:6,humanListening:false},null,2)+'\n');
console.log(`Passed ${checks.length} native media decodes and six player playback checks.`);
