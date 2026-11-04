import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {alfaADictationRound as round} from '../lib/klink10-writing-dictation-aa.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19044',out=process.env.KLINK_TEST_OUTPUT||'docs/klink10-dictation-aa-20261102/local';
mkdirSync(out,{recursive:true});const checks=[],flows=[];
const sources=[...new Set(round.positions.flatMap(p=>[p.audio,p.instructionAudio]))];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>{const NativeAudio=window.Audio;window.audioEnds=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);this.addEventListener('ended',()=>window.audioEnds.push(this.currentSrc));}};});
  await page.goto(base);
  for(const src of sources){
   const v=await page.evaluate(src=>new Promise((resolve,reject)=>{const a=new Audio();const t=setTimeout(()=>reject(Error('Decode timeout')),15000);a.addEventListener('loadeddata',()=>{clearTimeout(t);const v={duration:a.duration,readyState:a.readyState};a.pause();a.removeAttribute('src');a.load();resolve(v);},{once:true});a.addEventListener('error',()=>{clearTimeout(t);reject(Error('Audio decode failure'));},{once:true});a.src=src;a.load();}),src);
   assert(v.duration>0&&v.readyState>=2);checks.push({engine,src,...v});
  }
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-a',help:'practice'}));
  const e=round.exercises[0],position=round.positions[0],task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
  await task.getByRole('button',{name:'Luister naar het woord',exact:true}).first().click();
  await page.waitForFunction(src=>window.audioEnds.some(s=>s.endsWith(src)),position.audio);
  const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.fill(position.word);
  await task.getByRole('button',{name:'Controleer',exact:true}).click();await page.locator(`[data-exercise-id="${e.exerciseId}"][data-practice-ready="true"]`).waitFor();
  flows.push({engine,sourceId:position.sourceId,realPlayerEnded:true,answerAccepted:true});
 }finally{await browser.close();}
}
assert.equal(checks.length,22);assert.equal(flows.length,2);writeFileSync(out+'/native-media.json',JSON.stringify({base,checks,flows,humanListeningAllClips:false},null,2)+'\n');
console.log('22 native decodes and two real dictation player flows passed.');
