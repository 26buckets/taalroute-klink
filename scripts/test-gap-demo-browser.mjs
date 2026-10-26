import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {taalroutePackages,exercisesForLesson} from '../lib/taalroute-packages.ts';
import {beginnerExerciseDemo} from '../lib/lesson-plan.ts';
import {progressKey} from '../lib/learner-progress.ts';
const engines=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18847';
const out=process.env.KLINK_GAP_OUTPUT||'/tmp/klink-gap-review';mkdirSync(out,{recursive:true});
const samples=['pen','ik','maan','sjaal'].map(word=>{
 for(const pack of taalroutePackages)for(const lesson of pack.lessons)for(const exercise of exercisesForLesson(pack,lesson)){
  if(exercise.mode!=='missing-grapheme'||!beginnerExerciseDemo(pack,exercise,true))continue;
  const option=exercise.options.find(o=>exercise.answer.correctOptionIds.includes(o.id));
  const letter=option.label??option.grapheme;
  if(exercise.maskedWord.replace('…',letter)===word)return {pack,lesson,exercise,word,letter};
 }
 throw new Error(`Missing sample ${word}`);
});
const checks=[];
for(const engine of (process.env.KLINK_TEST_ENGINES||'chromium,webkit').split(',')){
 const browser=await engines[engine].launch();
 try{for(const [width,height,reducedMotion]of [[320,568,'no-preference'],[390,740,'no-preference'],[1366,900,'no-preference'],[320,568,'reduce']])for(const {pack,lesson,exercise,word,letter}of samples){
  const page=await browser.newPage({viewport:{width,height},reducedMotion});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,position})=>{localStorage.setItem(key,JSON.stringify({completed:[],position}));localStorage.setItem('klink.gap-demo-preservation','keep');},{key:progressKey,position:{packageId:pack.id,lessonId:lesson.id,exerciseId:exercise.exerciseId}});
  await page.goto(`${base}/#learner/home`);await page.locator('.cp-home-hero button').click();
  if(beginnerExerciseDemo(pack,exercise,true)==='repeat')await page.getByRole('button',{name:'Kijk nog eens',exact:true}).click();
  const demo=page.locator('.cp-gap-demo'),arrival=demo.locator('.cp-demo-arrival'),card=page.locator('.cp-gap-choice');await arrival.waitFor({state:'attached'});
  const before=await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1'));
  assert.equal(await card.locator('.cp-demo-hand').count(),1);assert.equal(await card.locator('.cp-letter-cue').innerText(),'Kijk eerst');
  assert.equal(await card.locator(':scope > button').count(),1);assert.equal(await card.locator(':scope > button').innerText(),'Nu jij');
  assert.equal(await card.locator('.cp-choice-grid > button:disabled').count(),exercise.options.length);
  assert.equal(await card.locator('.cp-choice-grid .cp-demo-hand').locator('..').locator('strong').innerText(),letter);
  const t=await arrival.evaluate(e=>e.getAnimations()[0].currentTime);await page.waitForTimeout(100);assert(await arrival.evaluate(e=>e.getAnimations()[0].currentTime)>t);
  const frame=async time=>{await card.evaluate((el,t)=>{for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=t;}},time);return arrival.evaluate(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform,iterations:el.getAnimations()[0].effect.getTiming().iterations}));};
  const geometry=()=>demo.evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
  const visible=el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el||el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));};
  assert(await card.locator(':scope > button').evaluate(visible),'Nu jij visible');assert(await demo.evaluate(visible),'word visible');
  const hand=await card.locator('.cp-demo-hand').evaluate(e=>({background:getComputedStyle(e).backgroundColor,fill:getComputedStyle(e).fill,border:getComputedStyle(e).borderWidth}));assert.deepEqual(hand,{background:'rgba(0, 0, 0, 0)',fill:'rgb(201, 221, 210)',border:'0px'});
  assert.equal((await frame(700)).opacity,'0','letter does not arrive before tap');const size=await geometry();
  if(word==='pen')await page.screenshot({path:`${out}/${engine}-${width}-${reducedMotion}-before.png`});
  const after=await frame(1700);assert.equal(after.opacity,'1');assert.equal(after.iterations,1);if(reducedMotion==='reduce')assert.equal(after.transform,'none');
  assert.deepEqual(await geometry(),size,'no layout jump');assert.equal(await arrival.textContent(),letter);assert.equal(await demo.locator(':scope > span').last().innerText(),word);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1')),before);
  if(word==='pen'||(word==='sjaal'&&width===320))await page.screenshot({path:`${out}/${engine}-${width}-${reducedMotion}-${word}-after.png`});
  await page.getByRole('button',{name:'Nu jij',exact:true}).click();assert.equal(await page.locator('.cp-missing-word').innerText(),exercise.maskedWord);assert.equal(await card.locator('.cp-choice-grid > button:disabled').count(),0);
  await page.getByRole('button',{name:'Kijk nog eens',exact:true}).click();await arrival.waitFor({state:'attached'});assert(await arrival.evaluate(e=>e.getAnimations()[0].currentTime)<1000,'replay restarts');assert.equal((await frame(700)).opacity,'0');await frame(1700);
  await page.getByRole('button',{name:'Nu jij',exact:true}).click();await card.locator('.cp-choice-grid > button').filter({hasText:new RegExp(`^${letter}$`)}).click();await page.waitForTimeout(700);
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'),exercise.exerciseId,'no automatic next exercise');assert.equal(await page.locator('.cp-exercise-feedback > button').isDisabled(),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('klink.gap-demo-preservation')),'keep');assert.deepEqual(errors,[]);checks.push({engine,width,height,reducedMotion,word,letter,passed:true});await page.close();
 }}finally{await browser.close();}
}
writeFileSync(`${out}/checks.json`,JSON.stringify(checks,null,2));console.log(`${checks.length} gap demonstrations passed: tap, arrival, replay, visible controls and manual continuation`);
