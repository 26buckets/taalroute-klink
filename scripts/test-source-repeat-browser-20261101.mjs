import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {sourceRepeatRounds,sourceRepeatBanks,sourceRepeatExercises} from '../lib/source-repeat.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/repeat-rounds-20261101/local';mkdirSync(out,{recursive:true});
const rounds=sourceRepeatRounds.slice(0,Number(process.env.KLINK_TEST_ROUND_LIMIT)||48);
const banks=new Map(),rows=new Map();for(const r of sourceRepeatRounds)for(const b of sourceRepeatBanks(r)){rows.set(b.id,b);if(!banks.has(b.id))banks.set(b.id,JSON.parse(readFileSync('public'+b.url)).exercises);}
const old={
 'klink.taalroute.attempts.v1':JSON.stringify(Array.from({length:200},(_,i)=>({exerciseId:`old:${i}`,correct:true}))),
 'klink.learning-review.v1':JSON.stringify({'old:recall:word':{last:1,due:2,streak:2}}),
 'klink.taalroute.savedWords.v1':'["TL1227"]',
 'klink.round-progress.v1:previous-round':'{"version":1,"total":2,"done":["old-task"]}'
};
for(const bank of rows.values()){
 old[roundProgressPrefix+collectionProgressId(bank.activity,bank.id,bank.url)]=JSON.stringify({version:1,total:bank.count,done:banks.get(bank.id).map(e=>e.exerciseId)});
 old[groupSessionKey(`chapter:${bank.activity}:${bank.id}`,bank.activity)]=JSON.stringify({version:1,done:true});
}
for(const r of sourceRepeatRounds)for(const p of r.positions)old[`klink.taalroute.content-workflow.v1:${p.sourceId}`]='{"completed":true}';
const route=r=>'/'+chapterHash({chapter:'repeat',activity:'learning-review',collection:r.id,level:r.level,help:'practice'});
const checks=[],roundChecks=[],errors=[],requests=new Set();
try{for(const[engine,type]of Object.entries({chromium,webkit}).filter(([e])=>!process.env.KLINK_TEST_ENGINE||e===process.env.KLINK_TEST_ENGINE)){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const c=await b.newContext({viewport:{width:390,height:844}});
  await c.addInitScript(seed=>{
   if(!localStorage.getItem('klink.repeat-test.seed')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('klink.repeat-test.seed','1');}
   // Fast deterministic state tests; real file decoding and native playback have a separate media check.
   window.Audio=class extends EventTarget{
    constructor(src){super();this.dataset={};this.src=src;this.paused=true;this.playbackRate=1;this.currentTime=0;}
    play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}
    pause(){clearTimeout(this.timer);this.paused=true;}
   };
  },old);
  const p=await c.newPage();p.on('pageerror',e=>errors.push({engine,message:e.message}));p.on('request',r=>{if(r.url().includes('/practice-content/'))requests.add(new URL(r.url()).pathname);});
  const finished={};
  for(const round of rounds){
   const exercises=sourceRepeatExercises(round,banks);const key=roundProgressPrefix+collectionProgressId('learning-review',round.id);
   await p.goto(base+route(round));await p.locator(`[data-exercise-id="${exercises[0].exerciseId}"]`).waitFor();
   assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),null,'Original completion cannot finish a repeat');
   const auto=p.locator('[data-practice-automatic]');if(await auto.count()&&await auto.getAttribute('aria-pressed')==='false')await auto.click();
   for(const [i,e]of exercises.entries()){
    await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
    if(e.mode==='heard-word'||e.mode==='text-question'){
     const buttons=p.locator('.cp-choice-grid button');await buttons.first().waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('.cp-choice-grid button')].some(b=>!b.disabled));
     const correct=e.answer.correctOptionIds[0];const wrong=e.options.findIndex(o=>o.id!==correct);
     await buttons.nth(wrong).click();assert((await p.locator('.cp-exercise-feedback output').innerText()).includes('Probeer opnieuw'));
     if(e.optionFeedback)assert((await p.locator('.cp-exercise-feedback output').innerText()).includes(e.optionFeedback[e.options[wrong].id]));
     await buttons.nth(e.options.findIndex(o=>o.id===correct)).click();
    }else{
     assert.equal(e.mode,'hear-match');
     const sourceButtons=p.locator('.cp-match-board > div').nth(0).locator('button'),targetButtons=p.locator('.cp-match-board > div').nth(1).locator('button');
     for(const [j,s]of e.sources.entries()){
      await sourceButtons.nth(j).click();const target=e.answer.mapping[s.id],targetIndex=e.targets.findIndex(t=>t.id===target);
      await targetButtons.nth(targetIndex).waitFor();await p.waitForFunction(index=>!document.querySelectorAll('.cp-match-board > div')[1].querySelectorAll('button')[index].disabled,targetIndex);
      if(j===0){const wrong=e.targets.findIndex(t=>t.id!==target);await targetButtons.nth(wrong).click();assert((await p.locator('.cp-exercise-feedback output').innerText()).includes('Probeer opnieuw'));}
      await targetButtons.nth(targetIndex).click();
     }
    }
    await p.locator('[data-practice-ready="true"]').waitFor();
    const next=p.locator('[data-practice-next]');assert(await next.isEnabled());await next.click();
    checks.push({engine,roundId:round.id,position:e.exerciseId,source:e.repeatSourceId,mode:e.mode,wrongAnswerRetried:true,correctAnswerAccepted:true});
    if(i===4){await p.locator(`[data-exercise-id="${exercises[5].exerciseId}"]`).waitFor();await p.reload();await p.locator(`[data-exercise-id="${exercises[5].exerciseId}"]`).waitFor();const a=p.locator('[data-practice-automatic]');if(await a.count()&&await a.getAttribute('aria-pressed')==='false')await a.click();}
   }
   await p.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   assert.equal(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).done.length,key),12);
   assert.deepEqual(await p.evaluate(seed=>Object.fromEntries(Object.keys(seed).map(k=>[k,localStorage.getItem(k)])),old),old,'Every seeded original score, review, draft, session and completion remains byte-identical');
   for(const[k,v]of Object.entries(finished))assert.equal(await p.evaluate(k=>localStorage.getItem(k),k),v);
   finished[key]=await p.evaluate(k=>localStorage.getItem(k),key);
   await p.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();await p.locator(`[data-exercise-id="${exercises[0].exerciseId}"]`).waitFor();
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),finished[key],'Restart retains completion');
   await p.reload();await p.locator(`[data-exercise-id="${exercises[0].exerciseId}"]`).waitFor();
   roundChecks.push({engine,id:round.id,positions:12,resumeAfterReload:true,restartRetainsCompletion:true,originalCompletionIsolated:true,originalKeysPreserved:Object.keys(old).length,earlierRepeatCompletionPreserved:true});
  }
  await c.close();
 }finally{await b.close();}
}assert.equal(checks.length,rounds.length*12*(process.env.KLINK_TEST_ENGINE?1:2));assert.deepEqual(errors,[]);
const allowed=new Set([...rows.values()].map(b=>b.url));assert([...requests].every(url=>allowed.has(url)),'No second exercise catalogue is requested');
}catch(e){errors.push({failure:e.stack});throw e;}finally{writeFileSync(out+'/browser-checks.json',JSON.stringify({base,checks,roundChecks,requests:[...requests],errors,audioPlayback:'simulated for state checks; real media tested separately',physicalPhoneTested:false},null,2)+'\n');}
console.log(`PASS ${checks.length} task flows; ${roundChecks.length} independent rounds; ${Object.keys(old).length} original storage keys byte-identical.`);
