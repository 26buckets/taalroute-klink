import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/dictation-ac-ready10-20261104',m=JSON.parse(readFileSync(root+'/manifest.json'));
const bank=JSON.parse(readFileSync('docs/dictation-ac-ready10-20261104/source-bank.json'));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19164',out=process.env.KLINK_TEST_OUTPUT||root+'/local';mkdirSync(out,{recursive:true});
const checks=[],failures=[];
for(const [url,hash]of [[m.row.url,m.bankSha256],...Object.values(m.recordings).map(c=>[c.src,c.sha256])]){
 const response=await fetch(base+url);assert(response.ok);assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),hash);
}
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>failures.push(e.message));
  await page.addInitScript(()=>{const NativeAudio=window.Audio;window.audioEvents=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);for(const event of ['ended','error'])this.addEventListener(event,()=>window.audioEvents.push({event,native:this instanceof HTMLAudioElement,duration:this.duration}));}};});
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'sentence-dictation',collection:m.row.id,level:'alfa-c',help:'practice'}));
  for(const [i,e]of bank.exercises.entries()){
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   for(const [role,selector]of [...(i===0?[['instruction','.cp-instruction-listen']]:[]),['target','.cp-exercise-listen']]){
    await page.evaluate(()=>{window.audioEvents=[];});await page.locator(selector).first().click();
    await page.waitForFunction(()=>window.audioEvents.some(e=>e.event==='ended'),null,{timeout:30000});
    const events=await page.evaluate(()=>window.audioEvents);assert(!events.some(e=>e.event==='error'));assert(events.some(e=>e.native&&e.duration>0));
    checks.push({engine,sourceId:e.exerciseId,role,actualNativePlayback:true});
   }
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.fill(e.fields[0].acceptedAnswers.at(-1));
   await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   if(i<9)await page.getByRole('button',{name:'Verder',exact:true}).click();
  }
 }finally{await browser.close();}
}}finally{writeFileSync(out+'/native-player.json',JSON.stringify({base,checks,failures,offeredBankAndAudioByteIdentical:true,humanListeningPerformed:false},null,2)+'\n');}
assert.equal(checks.length,22);assert.deepEqual(failures,[]);console.log('22 actual instruction/target playback completions through the production player; all ten answered in both engines.');
