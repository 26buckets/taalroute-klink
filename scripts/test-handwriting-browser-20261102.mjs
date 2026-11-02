import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync}from'node:fs';
import {chromium,webkit}from'playwright';
import {chapterHash}from'../lib/practice-chapters.ts';
import {recordingForWord,wordRecordingKey}from'../lib/word-listening.ts';
const folder='docs/handwriting-20261102/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out,{recursive:true});
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json')),checks=[],rounds=[],reloads=[],nativeHelp=[],errors=[];
const previous={'klink.taalroute.savedWords.v1':'["TL1227"]','klink.writing-prior-attempts.v1':'[]','klink.writing-answer.v1:KSW-AA-TN-006':'{"version":1,"draft":"Mijn eigen tekst","first":"M","last":"ma"}','klink.learning-review.v1':'{"old:recall:word":{"last":1,"due":2,"streak":2}}'};
const oldInk={version:1,draft:[[[20,20],[30,50]]],first:[[[15,15],[25,40]]],last:[[[20,20],[30,50]]],firstUsedModel:false};
async function readInk(page,id){return page.evaluate(id=>new Promise((resolve,reject)=>{const open=indexedDB.open('klink-writing-ink-v1',1);open.onsuccess=()=>{const db=open.result,r=db.transaction('answers').objectStore('answers').get(id);r.onsuccess=()=>{resolve(r.result);db.close();};r.onerror=()=>reject(r.error);};open.onerror=()=>reject(open.error);}),id);}
async function draw(page,svg,variant=0){
 await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox(),x=box.x+box.width*(variant ? .48 : .14),y=box.y+box.height*.2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+box.width*.12,y+box.height*.55,{steps:6});await page.mouse.move(x+box.width*.24,y,{steps:6});await page.mouse.up();
}
async function play(page,wrapper,id,src){
 await page.evaluate(()=>{window.hsEnded=[];});await wrapper.locator('[data-practice-listen]').click();
 await page.waitForFunction(({id,src})=>{const s=document.querySelector(`[data-handwriting-source="${id}"] svg.kpd-writing`);return s&&s.getAttribute('aria-disabled')!=='true'&&window.hsEnded.some(x=>x.key===src&&x.native&&x.duration>0);},{id,src});
}
try{await Promise.all(Object.entries({chromium,webkit}).map(async([engine,type])=>{
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(seed=>{
   if(!localStorage.getItem('hs-seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('hs-seeded','1');}
   window.hsEnded=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',event=>{const audio=event.detail;if(seen.has(audio))return;seen.add(audio);audio.addEventListener('ended',()=>window.hsEnded.push({key:audio.dataset.klinkSource,native:audio instanceof HTMLAudioElement,duration:audio.duration}));});
  },previous);
  const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,message:e.message}));await page.goto(base);
  await page.evaluate(ink=>new Promise((resolve,reject)=>{const r=indexedDB.open('klink-writing-ink-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('answers');r.onsuccess=()=>{const db=r.result,t=db.transaction('answers','readwrite');t.objectStore('answers').put(ink,'previous-source');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};r.onerror=()=>reject(r.error);}),oldInk);
  for(const{row}of manifest.newRows){
   const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
   await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'paper-dictation',collection:row.id,level:'alfa-c',help:'practice'}));await page.locator(`[data-handwriting-source="${exercises[0].exerciseId}"]`).waitFor();
   assert.equal(await page.getByRole('button',{name:'Op één blad',exact:true}).count(),0);
   for(const[index,e]of exercises.entries()){
    const wrapper=page.locator(`[data-exercise-id="${e.exerciseId}"]`),task=wrapper.locator(`[data-handwriting-source="${e.exerciseId}"]`),svg=task.locator('svg.kpd-writing');
    await task.waitFor();assert.equal(await task.locator('input,textarea').count(),0);assert.equal(await task.locator('.cp-paper-model,.cp-word-hint strong').count(),0);assert.equal(await svg.locator('polyline').count(),0);
    assert(await task.getByRole('button',{name:'Vergelijk',exact:true}).isDisabled());await play(page,wrapper,e.exerciseId,e.prompt.audio.src);
    const earlyHelp=index===6;
    if(earlyHelp){await task.getByRole('button',{name:'Help',exact:true}).click();assert.equal(await task.locator('.cp-word-hint strong').innerText(),e.target);assert.equal(await svg.locator('polyline').count(),0);assert.equal((await readInk(page,e.exerciseId)).first,undefined);await task.getByRole('button',{name:'Verberg voorbeeld',exact:true}).click();}
    await draw(page,svg);const originalBox=await svg.boundingBox();assert(originalBox.height>100&&Math.abs(originalBox.width/originalBox.height-1000/450)<.05);let saved=await readInk(page,e.exerciseId);assert(saved.draft[0].length>2);assert(saved.draft[0].every(([x,y])=>x>50&&x<950&&y>10&&y<440));assert.equal(saved.first,undefined);
    if(index===0){const draft=saved.draft;await page.reload();await task.waitFor();await play(page,wrapper,e.exerciseId,e.prompt.audio.src);saved=await readInk(page,e.exerciseId);assert.deepEqual(saved.draft,draft);assert.equal(saved.first,undefined);assert.equal(await task.locator('.cp-paper-model').count(),0);reloads.push({engine,sourceId:e.exerciseId,ownInkRestored:true,noModelPrefill:true});}
    await task.getByRole('button',{name:'Vergelijk',exact:true}).click();await task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).waitFor();assert.equal(await wrapper.getAttribute('data-practice-ready'),'false');assert.equal(await task.locator('.cp-paper-model').innerText(),e.target);
    const comparedBox=await svg.boundingBox();assert(Math.abs(comparedBox.width-originalBox.width)<1&&Math.abs(comparedBox.height-originalBox.height)<1,'Showing a model must not distort the original handwriting');
    saved=await readInk(page,e.exerciseId);const first=saved.first;assert.deepEqual(first,saved.draft);assert.equal(saved.firstUsedModel,earlyHelp);
    if(['KSW-AC-HS-061','KSW-AC-HS-084','KSW-AC-HS-094','KSW-AC-HS-095'].includes(e.exerciseId)){
     const key=wordRecordingKey(recordingForWord(e.target));await page.evaluate(()=>{window.hsEnded=[];});await task.locator('.cp-paper-model button.cp-inline-word').click();await page.waitForFunction(key=>window.hsEnded.some(x=>x.key===key&&x.native),key);nativeHelp.push({engine,sourceId:e.exerciseId,nativePlaybackEnded:true});
    }
    await task.getByRole('button',{name:'Wis bord',exact:true}).click();saved=await readInk(page,e.exerciseId);assert.deepEqual(saved.draft,[]);assert.deepEqual(saved.first,first);await draw(page,svg,1);
    await task.getByRole('button',{name:'Vergelijk',exact:true}).click();await task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).waitFor();saved=await readInk(page,e.exerciseId);assert.deepEqual(saved.first,first);assert.notDeepEqual(saved.last,first);assert.equal(saved.firstUsedModel,earlyHelp);
    await task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).click();assert.equal(await wrapper.getAttribute('data-practice-ready'),'true');
    const attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));assert.equal(attempt.exerciseId,e.exerciseId);assert.equal(attempt.assessment,'participation');assert.equal(attempt.independentReading,false);assert.equal(attempt.reviewEligible,false);assert.equal(attempt.answer,'Eigen schrijfwerk bewaard op dit apparaat.');
    assert.deepEqual(await page.evaluate(seed=>Object.fromEntries(Object.keys(seed).map(k=>[k,localStorage.getItem(k)])),previous),previous);assert.deepEqual(await readInk(page,'previous-source'),oldInk);assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=391);
    checks.push({engine,sourceId:e.exerciseId,samplePointerStrokesOnly:true,noOcrOrSpellingScore:true,audioGateAndNativePlayback:true,ownDraftFirstLastRetained:true,emptyCannotComplete:true,modelHiddenBeforeAttemptOrHelp:true,firstModelUseTracked:earlyHelp,priorStoresPreserved:true,noHorizontalOverflow:true});
    await page.locator('[data-practice-next]').click();
   }
   await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   const prior=await readInk(page,exercises[0].exerciseId);await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();await page.locator(`[data-handwriting-source="${exercises[0].exerciseId}"]`).waitFor();assert.deepEqual(await readInk(page,exercises[0].exerciseId),prior);
   rounds.push({engine,id:row.id,count:exercises.length,explicitCompletion:true,restartKeepsOwnDraftAndVersions:true});
  }
  await context.close();
 }finally{await browser.close();}
}));}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,simulatedPlayback:false,sampleInkNotRecognizedWords:true,checks,rounds,reloads,nativeHelp,errors,humanListeningPerformed:false,physicalPenOrPhoneTested:false},null,2)+'\n');}
assert.equal(checks.length,200);assert.equal(rounds.length,30);assert.equal(reloads.length,30);assert.equal(nativeHelp.length,8);assert.deepEqual(errors,[]);console.log('Passed200 actual pointer/audio/storage flows,30 short rounds,30 reloads and8 native model-word plays in Chromium/WebKit; participation only.');
