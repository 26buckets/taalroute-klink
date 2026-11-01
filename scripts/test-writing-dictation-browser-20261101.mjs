import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {writingDictationRounds} from '../lib/writing-dictation.ts';
import {chapterHash,displayedChapterCollections} from '../lib/practice-chapters.ts';
import {contentPackages} from '../lib/package-content.ts';
import {progressKey} from '../lib/learner-progress.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/writing-dictation-20261101/local';mkdirSync(out,{recursive:true});
const checks=[],rounds=[],errors=[];
const old={'klink.taalroute.savedWords.v1':'["TL1227"]','klink.learning-review.v1':'{"old:recall:word":{"last":1,"due":2,"streak":2}}','klink.round-progress.v1:old-writing':'{"version":1,"total":2,"done":["old"]}','klink.taalroute.content-workflow.v1:old':'{"draft":"Mijn eigen tekst"}'};
const previousLesson=contentPackages.find(pack=>pack.lessons.some(l=>l.guidedExerciseIds?.length));
const lesson=previousLesson.lessons.find(l=>l.guidedExerciseIds?.length);
old[progressKey]=JSON.stringify({completed:[lesson.id],position:{packageId:previousLesson.id,lessonId:lesson.id,exerciseId:lesson.guidedExerciseIds[0]}});
const referencedIds=new Set(writingDictationRounds.flatMap(r=>r.exercises.filter(e=>e.exerciseId!==e.writingSourceId).map(e=>e.exerciseId)));
const originalCollections=displayedChapterCollections('dictation',{level:'all',help:'all'}).filter(row=>!row.id.startsWith('ksw-ac-ht-')&&row.exercises.some(e=>referencedIds.has(e.exerciseId))).slice(0,3);
assert.equal(originalCollections.length,3);
for(const row of originalCollections){
 const source=row.wordRound??row.readingSelection,id=collectionProgressId('dictation',source?.sourceId??row.id,row.contentUrl),ids=source?.allExerciseIds??row.exercises.map(e=>e.exerciseId);
 old[roundProgressPrefix+id]=JSON.stringify({version:1,total:ids.length,done:ids});
 old[groupSessionKey('chapter:dictation:'+row.id,'dictation',id)]=JSON.stringify({version:1,done:true});
}
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
 const c=await b.newContext({viewport:{width:390,height:844}});
 await c.addInitScript(seed=>{
  if(!localStorage.getItem('ht-seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('ht-seeded','1');}
  // State/answer tests use deterministic playback; the actual files need a separate native-audio check.
  window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;this.playbackRate=1;this.currentTime=0;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};
 },old);
 const p=await c.newPage();p.on('pageerror',e=>errors.push({engine,message:e.message}));
 for(const round of writingDictationRounds){
  const route=base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-c',help:'practice'});
  const progressKey=roundProgressPrefix+collectionProgressId('dictation',round.id);
  await p.goto(route);await p.locator(`[data-exercise-id="${round.exercises[0].exerciseId}"]`).waitFor();
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),progressKey),null);
  for(const[i,e]of round.exercises.entries()){
   const task=p.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();
   assert.equal(await task.locator('.cp-picture-help,.cp-meaning-contexts,img').count(),0);
   assert.equal(await task.locator('.cp-word-hint strong').count(),0);
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.waitFor();
   await p.waitForFunction(()=>!document.querySelector('.cp-text-entry input')?.disabled);
   assert.equal(await input.inputValue(),'');
   if(e.meaningCue)assert((await task.innerText()).includes(e.meaningCue));
   await input.fill('zzq');await task.getByRole('button',{name:'Controleer',exact:true}).click();
   assert.equal(await task.getAttribute('data-practice-ready'),'false');
   if(i===0&&e.helpWord.length>1){await input.fill(e.helpWord[0]+' '+e.helpWord.slice(1));await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');}
   if(i===6){await task.getByRole('button',{name:'Help',exact:true}).click();assert.equal(await task.locator('.cp-word-hint strong').innerText(),e.helpWord);}
   await input.fill(i===0?'  '+e.helpWord.toLocaleUpperCase('nl-NL')+'  ':e.helpWord);
   await task.getByRole('button',{name:'Controleer',exact:true}).click();await p.locator('[data-practice-ready="true"]').waitFor();
   const attempts=await p.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')||'[]'));const attempt=attempts.at(-1);
   assert.equal(attempt.exerciseId,e.exerciseId);assert.equal(attempt.correct,true);assert.equal(attempt.independentReading,false);assert.equal(attempt.reviewEligible,false);
   assert.equal(attempt.pictureSupport,undefined);
   assert.equal(attempt.support,i===6?'requested-help':'none');assert.equal(attempt.helpUsed,i===6);
   await p.locator('[data-practice-next]').click();
   checks.push({engine,sourceId:e.writingSourceId,canonicalId:e.exerciseId,wrongRejected:true,correctAccepted:true,noAnswerModelBeforeHelp:true,noImage:true,noReadingOrReviewClaim:true,helpTracked:i===6});
   if(i===4){await p.locator(`[data-exercise-id="${round.exercises[5].exerciseId}"]`).waitFor();await p.reload();await p.locator(`[data-exercise-id="${round.exercises[5].exerciseId}"]`).waitFor();}
  }
  await p.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();assert.equal(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).done.length,progressKey),20);
  assert.deepEqual(await p.evaluate(seed=>Object.fromEntries(Object.keys(seed).map(k=>[k,localStorage.getItem(k)])),old),old);
  const saved=await p.evaluate(k=>localStorage.getItem(k),progressKey);
  await p.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();await p.locator(`[data-exercise-id="${round.exercises[0].exerciseId}"]`).waitFor();assert.equal(await p.evaluate(k=>localStorage.getItem(k),progressKey),saved);
  rounds.push({engine,id:round.id,positions:20,resumeAtSix:true,completionRetainedOnRestart:true,oldProgressAndDraftsUnchanged:true});
 }
 await c.close();
 }finally{await b.close();}
}}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,simulatedPlayback:true,checks,rounds,errors},null,2)+'\n');}
assert.equal(checks.length,200);assert.equal(rounds.length,10);assert.deepEqual(errors,[]);console.log('Passed: 200 answer/help flows, 10 rounds, resume/restart and existing stores in Chromium/WebKit. Actual media remains a separate check.');
