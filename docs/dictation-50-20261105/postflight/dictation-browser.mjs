import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from './browser-tools/node_modules/playwright/index.mjs';
import {chapterHash} from './candidate-repo/lib/practice-chapters.ts';
import {readProductionBank} from './candidate-repo/scripts/read-production-bank.mjs';
const dir='docs/spelling-dictation-20261104/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19042',out=process.env.KLINK_TEST_OUTPUT||'/tmp/klink-spelling-b1-browser';
const read=p=>JSON.parse(readFileSync(p)),m=read(dir+'import-manifest.json'),refs=read(dir+'media-reuse-proof.json'),source=new Map(read(dir+'source-records.json').map(x=>[x.id,x.source]));
const adaptation=read(dir+'editorial-adaptations.json');
const rows=read('/Users/nicoknoester/Documents/Codex/2026-11-05/klink-50-dictees-publicatie/work/candidate/banks.json').map(x=>({...x,bank:readProductionBank(x.row),sha256:x.row.url.split('/').at(-1).replace('.json','')}));
for(const s of read('/Users/nicoknoester/Documents/Codex/2026-11-05/klink-50-dictees-publicatie/work/evidence/source-50.json'))source.set(s.exerciseId,s);
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const {row,bank,sha256} of rows){
 const res=await fetch(base+row.url);assert.equal(res.status,200);assert.equal(sha(Buffer.from(await res.arrayBuffer())),sha256);
 for(const e of bank.exercises){
  const s=source.get(e.exerciseId);assert.deepEqual(e.fields[0].acceptedAnswers,s.answerModel.acceptedValues);
  if(adaptation[e.exerciseId])assert.equal(adaptation[e.exerciseId].original,s.feedback.whenIncorrect);
  assert.equal(e.feedback,adaptation[e.exerciseId]?.retry??s.feedback.whenIncorrect);
  assert(e.sourceWordDictationExact&&e.requiresAudio&&e.audioOnly&&e.manualAdvance&&e.requiresExplicitCompletion);
 }
}
for(const {source,sha256}of refs.sourceRecordings){const res=await fetch(base+source);assert.equal(res.status,200);assert.equal(sha(Buffer.from(await res.arrayBuffer())),sha256);}
mkdirSync(out,{recursive:true});const flows=[],native=[],errors=[];
try{
 await Promise.all(Object.entries({chromium,webkit}).map(async([engine,type])=>{
  const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{
   await Promise.all([[1280,844],[390,844]].map(async([width,height])=>{
    const c=await b.newContext({viewport:{width,height},colorScheme:width===390?'dark':'light'});const p=await c.newPage();p.on('pageerror',e=>errors.push({engine,message:e.message}));
    await c.addInitScript(()=>{localStorage.setItem('klink.writing-answer.v1:retention-check','{"draft":"Oud concept"}');window.ended=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',ev=>{const a=ev.detail;if(seen.has(a))return;seen.add(a);a.addEventListener('ended',()=>window.ended.push({key:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,seconds:a.duration}));});});
    for(const {row,bank}of rows){
     const link=base+'/'+chapterHash({chapter:'writing',activity:row.activity,collection:row.id,level:row.level,help:row.help});
     await p.goto(link);for(const [i,e]of bank.exercises.entries()){
      const task=p.locator('[data-exercise-id="'+e.exerciseId+'"]'),input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true}),check=task.getByRole('button',{name:'Controleer',exact:true}),listen=task.getByRole('button',{name:'Luister naar het woord',exact:true});
      const word=e.fields[0].acceptedAnswers[0],wrong=word[0].toUpperCase()+word.slice(1);
      await task.waitFor();await input.waitFor();assert(await input.isDisabled());assert(await check.isDisabled());
      assert(!(await task.innerText()).includes(word));assert.equal(await task.locator('img,.cp-word-hint').count(),0);
      await listen.click();await p.waitForFunction(src=>window.ended.some(x=>x.key===src&&x.native&&x.seconds>0),e.prompt.audio.src);
      if(i===0)await p.screenshot({path:out+'/'+row.level+'-'+row.id.split(':').at(-1)+'-'+engine+'-'+width+'.png',fullPage:true});
      await input.fill(wrong);await check.click();assert.equal(await task.getAttribute('data-practice-ready'),'false');await task.getByText('Het woord is: '+word+'.',{exact:false}).waitFor();
      const firstEnded=await p.evaluate(src=>window.ended.filter(x=>x.key===src).length,e.prompt.audio.src);
      await listen.focus();await p.keyboard.press('Enter');await p.waitForFunction(({src,n})=>window.ended.filter(x=>x.key===src&&x.native).length>n,{src:e.prompt.audio.src,n:firstEnded});
      native.push({engine,width,id:e.exerciseId,replay:true});
      
      await input.fill(word+'.');await check.click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
      const accepted=' '+word+' ';await input.fill(accepted);await input.press('Enter');await p.locator('[data-practice-next]:not(:disabled)').waitFor();
      const saved=await p.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.writingSourceId);assert.equal(saved.first,wrong);assert.equal(saved.last,accepted);
      const attempts=await p.evaluate(id=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).filter(x=>x.exerciseId===id),e.exerciseId);assert.equal(attempts[0].helpUsed,false);assert(attempts.at(-1).helpUsed);assert.equal(attempts.at(-1).reviewEligible,false);
      if(i===0) {
       await p.reload();await input.waitFor();await p.waitForFunction(v=>document.querySelector('.cp-text-entry input')?.value===v,accepted);assert(await input.isDisabled());
       await listen.click();await p.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);await check.click();
      }
      assert.equal(await p.evaluate(()=>localStorage.getItem('klink.writing-answer.v1:retention-check')),'{"draft":"Oud concept"}');
      assert(await p.evaluate(w=>document.documentElement.scrollWidth<=w+1,width));
      flows.push({engine,width,id:e.exerciseId,answerHiddenBeforePlayback:true,strictAnswer:true,exactInputSaved:true,reloadChecked:i===0});
      await p.locator('[data-practice-next]:not(:disabled)').click();
     }
     await p.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
    }await c.close();
   }));
  }finally{await b.close();}
 }));
}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,flows,native,errors,humanListeningPerformed:false},null,2)+'\n');}
assert.equal(flows.length,200);assert.equal(native.length,200);assert.deepEqual(errors,[]);console.log('200 dictation flows and native target clips verified.');
