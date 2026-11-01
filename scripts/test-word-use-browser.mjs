import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {wordUseCollections,wordUseBank} from '../lib/word-use.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
const cache='/Users/nicoknoester/.cache/klink-word-use-20261101';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:'+readFileSync(cache+'/dev-port.txt','utf8');
const out='docs/word-use-20261101/'+(base.startsWith('https')?'online':'local');mkdirSync(out,{recursive:true});
const audio=JSON.parse(readFileSync('docs/word-use-20261101/audio.json'));
const checks=[],layouts=[],native=[],decoded=[],errors=[];
const route=c=>'/'+chapterHash({chapter:c.exercises[0].mode==='word-combinations'?'words':'listening',activity:c.exercises[0].mode,collection:c.id,level:c.level,help:'practice'});
const choice=page=>page.locator('.cp-choice-grid .cp-extended-option > button:first-child');
async function inspect(page,label){
 const result=await page.evaluate(()=>{
  const stage=document.querySelector('.cp-exercise-stage'),buttons=[...document.querySelectorAll('.cp-choice-grid .cp-extended-option > button:first-child')],footer=document.querySelector('.cp-exercise-feedback');
  return {horizontal:document.documentElement.scrollWidth-innerWidth,stageOverflow:stage.scrollHeight-stage.clientHeight,stageTop:stage.getBoundingClientRect().top,stageBottom:stage.getBoundingClientRect().bottom,footerBottom:footer.getBoundingClientRect().bottom,options:buttons.map(b=>({text:b.textContent,horizontal:b.scrollWidth-b.clientWidth,vertical:b.scrollHeight-b.clientHeight,top:b.getBoundingClientRect().top,bottom:b.getBoundingClientRect().bottom}))};
 });
 assert(result.horizontal<=1,label+JSON.stringify(result));assert(result.options.every(b=>b.horizontal<=2&&b.vertical<=2),label+': text clipped '+JSON.stringify(result));
 assert.equal(await page.locator('.cp-task-card img,.cp-task-card video').count(),0);assert.equal(await choice(page).count(),4);
 return result;
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:engine===chromium?{width:1366,height:768}:{width:390,height:844},hasTouch:engine===webkit,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push({engine:engine.name(),message:e.message}));
  for(const collection of wordUseCollections){
   await page.goto(base+route(collection));await page.locator('[data-exercise-id]').waitFor();
   // Each round uses its own saved position; the previous rounds remain intact.
   for(let i=0;i<collection.exercises.length;i++){
    const e=collection.exercises[i];await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
    assert.deepEqual(await choice(page).allTextContents(),e.options.map(o=>o.label));
    const row=wordUseBank.entries.find(r=>r.id===e.exerciseId);assert.equal(await page.locator('.cp-synonym-context').innerText(),row.context);assert.equal(await page.locator('.cp-synonym-word').innerText(),row.prompt);
    const dimensions=await inspect(page,engine.name()+':'+e.exerciseId),correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));
    if(engine===webkit)await choice(page).nth((correct+1)%4).tap();else await choice(page).nth((correct+1)%4).click();
    await page.locator('.cp-exercise-feedback.wrong').waitFor();
    if(i===0){await page.keyboard.press('Enter');assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),e.exerciseId);}
    if(engine===webkit)await choice(page).nth(correct).tap();else await choice(page).nth(correct).click();
    await page.locator('.cp-exercise-feedback.right').waitFor();assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.correctFeedback));
    checks.push({engine:engine.name(),id:e.exerciseId,wrongAndCorrect:true,touch:engine===webkit,...dimensions});
    await page.locator('.cp-exercise-feedback > button').click();
    if(i===2){await page.reload();await page.locator(`[data-exercise-id="${collection.exercises[3].exerciseId}"]`).waitFor();}
   }
   await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   const review=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.learning-review.v1')||'{}'));
   for(const e of collection.exercises)assert(review[e.exerciseId]?.streak===0,'Wrong answers must return for review: '+e.exerciseId);
  }
  await context.close();
  for(const viewport of [{width:1366,height:768},{width:390,height:844},{width:320,height:740}])for(const colorScheme of ['light','dark']){
   const ctx=await browser.newContext({viewport,colorScheme,reducedMotion:'reduce'});
   for(const activity of ['word-combinations','suitable-reply'])for(const level of ['a1','a2','b1']){
    const candidates=wordUseCollections.filter(c=>c.level===level&&c.exercises[0].mode===activity);
    const pair=candidates.flatMap(c=>c.exercises.map(e=>({c,e,size:String(e.wordUseContext).length+e.prompt.text.length+e.options.reduce((n,o)=>n+o.label.length,0)}))).sort((a,b)=>b.size-a.size)[0];
    const p=await ctx.newPage();await p.addInitScript(({key,id})=>localStorage.setItem(key,JSON.stringify({version:1,done:false,exerciseId:id})),{key:groupSessionKey('chapter:'+activity+':'+pair.c.id,activity),id:pair.e.exerciseId});
    await p.goto(base+route(pair.c));await p.locator(`[data-exercise-id="${pair.e.exerciseId}"]`).waitFor();const dimensions=await inspect(p,'layout:'+engine.name()+':'+viewport.width+':'+activity+':'+level);
    for(let i=0;i<4;i++){await choice(p).nth(i).scrollIntoViewIfNeeded();assert(await choice(p).nth(i).isVisible());}
    await p.locator('.cp-exercise-stage').evaluate(e=>e.scrollTo({top:0}));await p.screenshot({path:out+'/'+engine.name()+'-'+viewport.width+'-'+colorScheme+'-'+activity+'-'+level+'.png',animations:'disabled'});
    layouts.push({engine:engine.name(),...viewport,colorScheme,activity,level,id:pair.e.exerciseId,...dimensions});await p.close();
   }await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage();
  await p.addInitScript(()=>{
   window.__nativeAudio=[];const original=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(...args){const row={src:this.src,ended:false};window.__nativeAudio.push(row);this.addEventListener('ended',()=>{row.ended=true;row.duration=this.duration;},{once:true});return original.apply(this,args);};
  });
  for(const activity of ['word-combinations','suitable-reply'])for(const level of ['a1','a2','b1']){
   const c=wordUseCollections.find(c=>c.level===level&&c.exercises[0].mode===activity),e=c.exercises[0];
   await p.goto(base+route(c));await p.locator('[data-exercise-id]').waitFor();assert.equal(await p.evaluate(()=>window.__nativeAudio.length),0,'No forced narration on a new card');
   await p.getByRole('button',{name:activity==='word-combinations'?'Luister naar de combinatie en de antwoorden':'Luister naar de ander en de antwoorden',exact:true}).click();
   await p.waitForFunction(()=>window.__nativeAudio.length===6&&window.__nativeAudio.every(x=>x.ended),null,{timeout:120000});
   const clips=await p.evaluate(()=>window.__nativeAudio);assert.deepEqual(clips.map(x=>new URL(x.src).pathname),[e.instructionAudio.src,e.prompt.audio.src,...e.options.map(o=>o.audio.src)]);
   assert(clips.every(x=>x.duration>.2));assert.equal(await choice(p).first().isDisabled(),false);native.push({engine:engine.name(),activity,level,clips});
   if(level==='a1'&&activity==='word-combinations'){
    await p.keyboard.press('Space');await p.waitForFunction(()=>window.__nativeAudio.length===11&&window.__nativeAudio.every(x=>x.ended),null,{timeout:90000});
    assert.deepEqual((await p.evaluate(()=>window.__nativeAudio.slice(6))).map(x=>new URL(x.src).pathname),[e.prompt.audio.src,...e.options.map(o=>o.audio.src)]);
   }
  }
  // Decode every delivered recording, using the browser's real codec and actual bytes.
  await p.goto(base+route(wordUseCollections[0]));await p.locator('[data-exercise-id]').waitFor();
  const results=await p.evaluate(async rows=>{
   const ctx=new AudioContext(),out=[];let at=0;
   async function worker(){while(at<rows.length){const row=rows[at++],r=await fetch(row.src);if(!r.ok)throw Error('Audio HTTP '+r.status+': '+row.src);const bytes=await r.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join(''),buffer=await ctx.decodeAudioData(bytes.slice(0));if(hash!==row.sha256||buffer.duration<=.2)throw Error('Audio mismatch '+row.src);out.push({src:row.src,sha256:hash,duration:buffer.duration});}}
   await Promise.all([worker(),worker(),worker(),worker()]);await ctx.close();return out;
  },audio.map(c=>({src:c.src,sha256:c.sha256})));assert.equal(results.length,audio.length);decoded.push({engine:engine.name(),clips:results});
  await ctx.close();
 }finally{await browser.close();}
}
assert.equal(checks.length,576);assert.equal(layouts.length,72);assert.equal(native.length,12);assert.deepEqual(errors,[]);
writeFileSync(out+'/browser-checks.json',JSON.stringify({checks,layouts,native,decoded,errors},null,2)+'\n');
console.log(JSON.stringify({questions:288,answerRuns:checks.length,layouts:layouts.length,nativeSequences:native.length,decodedAudioFiles:decoded.reduce((n,e)=>n+e.clips.length,0),errors:errors.length}));
