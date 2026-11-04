import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {learningGoalFor} from '../lib/learning-goals.ts';
const d='docs/writing-messages-texts-audio-fix-20261103/', base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19038',out=process.env.KLINK_TEST_OUTPUT||'/tmp/klink-messages-texts-local';
const json=p=>JSON.parse(readFileSync(p)),m=json(d+'import-manifest.json'),audio=json(d+'audio-review.json');
const source=new Map(readFileSync(d+'source-records.jsonl','utf8').trim().split('\n').map(JSON.parse).map(r=>[r.id,r.sourceRecord]));
const sha=b=>createHash('sha256').update(b).digest('hex');
const banks=m.newRows.map(({row})=>({row,exercises:json('public'+row.url).exercises})),all=banks.flatMap(b=>b.exercises);
assert.equal(new Set(all.map(e=>e.exerciseId)).size,220);assert.equal(all.flatMap(e=>e.sourceWritingExamples).length,440);
for(const e of all){
 let s=source.get(e.exerciseId);while(typeof s==='string')s=JSON.parse(s);
 const models=s.goodModels??s.modelMessages??s.modelTexts??s.models;
 assert.deepEqual(e.sourceWritingExamples.map(x=>x.text),models.map(x=>typeof x==='string'?x:x.text));
 assert(e.sourceFreeWriting&&e.manualAdvance&&e.requiresExplicitCompletion&&!e.reviewEligible&&!e.independentReading);
 assert.equal(e.assessment,'participation');
 assert.equal(learningGoalFor(e)?.id,e.exerciseId.includes('-SB-')?'bericht':'eigen-tekst-schrijven');
}
const bundle=Buffer.from(await(await fetch(base+m.deliveryBundle.src)).arrayBuffer());assert.equal(sha(bundle),m.deliveryBundle.sha256);
for(const {row}of banks)assert.equal(JSON.parse(bundle).banks[row.id],readFileSync('public'+row.url,'utf8'));
const media=new Map(await Promise.all(audio.bundles.map(async x=>{const b=Buffer.from(await(await fetch(base+x.src)).arrayBuffer());assert.equal(sha(b),x.sha256);assert(b.length<4*1024*1024);return [x.src,b];})));
for(const clip of audio.selected)assert.equal(sha(media.get(clip.source.src).subarray(clip.offset,clip.offset+clip.length)),clip.record.sha256);
const checks=[],rounds=[],reloaded=[],native=[],errors=[];
const route=r=>base+'/'+chapterHash({chapter:'writing',activity:r.activity,collection:r.id,level:r.level,help:r.help});
const data=(page,id)=>page.evaluate(id=>new Promise((resolve,reject)=>{const r=indexedDB.open('klink-writing-form-v1',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('answers'),q=t.objectStore('answers').get(id);t.oncomplete=()=>{resolve(q.result);db.close();};t.onerror=()=>reject(t.error);};r.onerror=()=>reject(r.error);}),id);
mkdirSync(out,{recursive:true});
try{
 await Promise.all(Object.entries({chromium,webkit}).map(async([engine,type])=>{
  const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{
   const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.addInitScript(()=>{window.writingEnded=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',event=>{const a=event.detail;if(seen.has(a))return;seen.add(a);a.addEventListener('ended',()=>window.writingEnded.push({key:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,seconds:a.duration}));});});
   if(process.env.KLINK_TEST_FULL_AUDIO_RESPONSE==='1')await ctx.route('**/package-audio/klink10-messages-texts-20261103/*.bin',route=>{const b=media.get(new URL(route.request().url()).pathname);assert(b);return route.fulfill({status:200,contentType:'application/octet-stream',body:b});});
   const p=await ctx.newPage();p.on('pageerror',err=>errors.push({engine,message:err.message}));const played=new Set();
   for(const {row,exercises}of banks){await p.goto(route(row));
    for(const [i,e] of exercises.entries()){
     const task=p.locator('[data-source-writing-text="'+e.exerciseId+'"]'),input=task.locator('textarea'),compare=task.getByRole('button',{name:'Bewaar en vergelijk',exact:true}),finish=task.getByRole('button',{name:'Nagekeken en klaar',exact:true});
     await task.waitFor();assert.equal(await input.inputValue(),'');assert(await compare.isDisabled());assert.equal(await finish.count(),0);assert.equal(await task.locator('.cp-source-text p').first().textContent(),e.sourceWritingContext);
     if(!played.has(row.activity)){
      await p.locator('.cp-instruction-listen').click();await p.waitForFunction(src=>window.writingEnded.some(e=>e.key===src&&e.native&&e.seconds>0),e.instructionAudio.src);
      native.push({engine,activity:row.activity});played.add(row.activity);
     }
     const first='  Mijn eigen tekst.  ',last=' '+e.sourceWritingExamples[0].text+' ';await input.fill(first);
     if(i===0){const before=await data(p,e.exerciseId);assert.equal(before.draft.text,first);assert.equal(before.first,undefined);await p.reload();await p.waitForFunction(v=>document.querySelector('[data-source-writing-text] textarea')?.value===v,first);assert.equal(await finish.count(),0);reloaded.push({engine,id:e.exerciseId});}
     await compare.click();await finish.waitFor();assert(await p.locator('[data-practice-next]').isDisabled());assert.deepEqual(await task.locator('.cp-source-text').last().locator('div > p:first-child').evaluateAll(xs=>xs.map(x=>x.textContent)),e.sourceWritingExamples.map(x=>x.text));
     await input.fill(last);await compare.click();await finish.click();await p.locator('[data-practice-next]:not(:disabled)').waitFor();
     const saved=await data(p,e.exerciseId);assert.equal(saved.first.text,first);assert.equal(saved.last.text,last);assert.equal(saved.draft.text,last);
     const attempt=await p.evaluate(id=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).filter(a=>a.exerciseId===id).at(-1),e.exerciseId);
     assert(attempt.assessment==='participation'&&!attempt.independentReading&&!attempt.reviewEligible&&!JSON.parse(attempt.answer).automaticGrammarScoring);
     assert.equal(await task.locator('[data-word-audio-missing]').count(),0);
     checks.push({engine,id:e.exerciseId,sourceExamplesUnchanged:true,rawFirstAndLatest:true,participationOnly:true});await p.locator('[data-practice-next]').click();
    }
    await p.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();rounds.push({engine,id:row.id});
   }
  }finally{await b.close();}
 }));
}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,rounds,reloaded,native,errors,reviewedModelTexts:440,fullResponseScenario:process.env.KLINK_TEST_FULL_AUDIO_RESPONSE==='1',humanListeningPerformed:false,independentHumanNT2ReviewPerformed:false},null,2)+'\n');}
assert.equal(checks.length,440);assert.equal(rounds.length,66);assert.equal(reloaded.length,66);assert.equal(native.length,4);assert.deepEqual(errors,[]);
console.log('440 writing flows, 66 completed rounds, 66 reloads and 4 instruction plays passed.');
