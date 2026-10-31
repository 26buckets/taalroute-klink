import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18950',out=process.env.KLINK_READING_OUTPUT||'docs/leesrondes-audio-20261031';
const prior=JSON.parse(execFileSync('git',['show','f323da366f7f7f0c456831f177d8c4d9a70dbd9f:data/klink-production-index.json'])),rows=productionIndex.filter(r=>r.id.startsWith('klink-teksten-zelf-')),checks=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const row of rows)for(const completed of [false,true]){
  const page=await browser.newPage({viewport:{width:390,height:900},hasTouch:true,isMobile:true});
  const old=prior.find(r=>r.id===row.id),exercises=JSON.parse(readFileSync('public'+row.url)).exercises,ids=exercises.map(e=>e.exerciseId);
  const groupKey=`klink.group.v1:chapter:${row.activity}:${row.id}:${row.activity}`,roundKey=`klink.round-progress.v1:collection:${row.activity}:${row.id}:${old.url}`;
  const group={version:1,exerciseId:ids[completed?11:4],done:completed},round={version:1,total:12,done:completed?ids:ids.slice(0,4)};
  const sentinel='klink.old-preservation-audio-test';
  await page.addInitScript(()=>{window.__nativeReadingPlayed=false;window.addEventListener('klink-audio-source',e=>e.detail.addEventListener('playing',()=>{window.__nativeReadingPlayed=true;},{once:true}));});
  await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  await page.evaluate(({groupKey,roundKey,group,round,sentinel})=>{localStorage.setItem(groupKey,JSON.stringify(group));localStorage.setItem(roundKey,JSON.stringify(round));localStorage.setItem(sentinel,'old-content-progress');},{groupKey,roundKey,group,round,sentinel});
  const route=chapterHash({chapter:'texts',activity:row.activity,collection:row.id,level:row.level,help:'practice'});
  await page.goto(base+'/'+route);
  if(completed){
   await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();await page.reload();await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();await page.locator(`[data-exercise-id="${ids[0]}"]`).waitFor();
  }else{
   await page.locator(`[data-exercise-id="${ids[4]}"]`).waitFor();await page.locator('.cp-source-text button').click();await page.waitForFunction(()=>window.__nativeReadingPlayed);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),roundKey),JSON.stringify(round),'Optional narration never changes earlier completion');
   await page.getByRole('button',{name:'Andere opdracht',exact:true}).first().click();await page.locator(`[data-collection="${row.id}"]`).click();await page.locator(`[data-exercise-id="${ids[4]}"]`).waitFor();
   const e=exercises[4],correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));await page.locator('.cp-choice-grid .cp-extended-option > button:first-child').nth(correct).click();
   await page.locator('.cp-exercise-feedback [data-practice-next]').click();await page.locator(`[data-exercise-id="${ids[5]}"]`).waitFor();
   await page.reload();await page.locator(`[data-exercise-id="${ids[5]}"]`).waitFor();
  }
  await page.getByRole('button',{name:'Andere opdracht',exact:true}).first().click();
  const card=page.locator(`[data-collection="${row.id}"]`);await card.waitFor();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),roundKey);assert.equal(saved.done.length,completed?12:5);assert(saved.done.every(id=>ids.includes(id)));
  assert((await card.innerText()).includes(completed?'12 van 12':'5 van 12'));assert.equal(await page.evaluate(key=>localStorage.getItem(key),sentinel),'old-content-progress');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('klink.round-progress.v1:collection:text-question:klink-teksten-zelf-')).length),1,'No new progress key or reset');
  await card.click();await page.locator(`[data-exercise-id="${ids[completed?0:5]}"]`).waitFor();
  checks.push({engine:name,level:row.level,previouslyCompleted:completed,oldKeysRetained:true,originalCompletionRetained:true,sessionRestored:true});await page.close();
 }}finally{await browser.close();}
}
writeFileSync(out+'/progress-check.json',JSON.stringify({base,checks},null,2)+'\n');console.log('PASS eight old partial/completed sessions, retained original badges, optional narration, reload, back, reopen and repeat');
