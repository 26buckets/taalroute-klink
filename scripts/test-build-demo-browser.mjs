import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { hasFirstLetterGuide } from '../lib/lesson-plan.ts';
import { progressKey } from '../lib/learner-progress.ts';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18847';
const out = process.env.KLINK_BUILD_DEMO_OUTPUT || '/tmp/klink-build-demo-review';
mkdirSync(out, { recursive: true });
const samples = ['mat','maan','mappen','huiskamer'].map(word => {
  for (const pack of taalroutePackages) for (const lesson of pack.lessons) {
    const exercise = exercisesForLesson(pack,lesson).find(e=>e.exampleWord===word && hasFirstLetterGuide(e,true));
    if (exercise) return { pack,lesson,exercise };
  }
  throw new Error(`No guided sample for ${word}`);
});
const checks=[];
for (const engine of (process.env.KLINK_TEST_ENGINES || 'chromium,webkit').split(',')) {
  const browser=await engines[engine].launch();
  try {
    for (const [width,height,reducedMotion] of [[320,568,'no-preference'],[390,740,'no-preference'],[1366,900,'no-preference'],[320,568,'reduce']]) for (const {pack,lesson,exercise} of samples) {
      const page=await browser.newPage({viewport:{width,height},reducedMotion});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(({key,position})=>{
        localStorage.setItem(key,JSON.stringify({completed:[],position}));
        localStorage.setItem('klink.build-demo-preservation','keep');
      },{key:progressKey,position:{packageId:pack.id,lessonId:lesson.id,exerciseId:exercise.exerciseId}});
      await page.goto(`${base}/#learner/home`);
      await page.locator('.cp-home-hero button').click();
      const demo=page.locator('.cp-letter-demo'), arrival=page.locator('.cp-demo-arrival');
      await arrival.waitFor({state:'attached'});
      assert(await page.locator('.cp-first-letter-guide > button').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e;}),'Nu jij is visible above the mobile navigation');
      const before=await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1'));
      assert.equal(await demo.locator('.lucide-pointer').count(),1);
      assert.equal(await page.locator('.cp-first-letter-guide > button').count(),1);
      assert.equal(await page.locator('.cp-first-letter-guide > button').innerText(),'Nu jij');
      assert.equal(await page.locator('.cp-letter-cue').innerText(),'Kijk eerst');
      const a0=await arrival.evaluate(e=>e.getAnimations()[0].currentTime);
      await page.waitForTimeout(100);
      assert(await arrival.evaluate(e=>e.getAnimations()[0].currentTime)>a0);
      const frame=async time=>{
        await demo.evaluate((el,t)=>{for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=t;}},time);
        return arrival.evaluate(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform,iterations:el.getAnimations()[0].effect.getTiming().iterations}));
      };
      assert.equal((await frame(700)).opacity,'0','slot stays empty until the tap');
      const hand=await demo.locator('.cp-demo-source > svg').evaluate(e=>({background:getComputedStyle(e).backgroundColor,fill:getComputedStyle(e).fill,border:getComputedStyle(e).borderWidth}));
      assert.deepEqual(hand,{background:'rgba(0, 0, 0, 0)',fill:'rgb(201, 221, 210)',border:'0px'});
      const slotsBefore=await demo.locator('div > span').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
      if(exercise.exampleWord==='mat') await page.screenshot({path:`${out}/${engine}-${width}-${reducedMotion}-empty.png`});
      const final=await frame(1700);assert.equal(final.opacity,'1');assert.equal(final.iterations,1);
      if(reducedMotion==='reduce')assert.equal(final.transform,'none');
      assert.deepEqual(await demo.locator('div > span').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))),slotsBefore,'slot sizes do not jump');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1')),before,'example is not an answer');
      if(exercise.exampleWord==='mat')await page.screenshot({path:`${out}/${engine}-${width}-${reducedMotion}-filled.png`});
      await page.getByRole('button',{name:'Nu jij',exact:true}).click();
      assert.equal(await page.locator('.cp-tile-bank button:disabled').count(),0,'demonstrated letter is still for the learner to choose');
      const target=exercise.answer.targetTileIds;
      const advanced=exercise.exampleWord==='mappen'?2:1;
      for(let i=0;i<advanced;i++)await page.locator('.cp-first-tile').click();
      const chosen=await page.locator('.cp-build-slots button').evaluateAll(es=>es.map(e=>e.querySelector('.cp-letter-model')?'':e.textContent));
      await page.getByRole('button',{name:'Kijk nog eens',exact:true}).click();
      await arrival.waitFor({state:'attached'});
      assert(await arrival.evaluate(e=>e.getAnimations()[0].currentTime)<1000,'replay restarts');
      assert(await page.locator('.cp-first-letter-guide > button').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e;}),'Nu jij remains visible on replay');
      await frame(700);assert.equal(await arrival.evaluate(e=>getComputedStyle(e).opacity),'0');
      assert.equal(await arrival.textContent(),exercise.tiles.find(t=>t.id===target[advanced]).token,'current letter or letter group is demonstrated');
      for(let i=0;i<advanced;i++)assert.equal(await demo.locator('div > span').nth(i).innerText(),chosen[i],'previous letters retained');
      await frame(1700);
      if(exercise.exampleWord==='mappen'&&width===320)await page.screenshot({path:`${out}/${engine}-double-letter-${reducedMotion}.png`});
      await page.getByRole('button',{name:'Nu jij',exact:true}).click();
      assert.deepEqual(await page.locator('.cp-build-slots button').evaluateAll(es=>es.map(e=>e.querySelector('.cp-letter-model')?'':e.textContent)),chosen);
      for(let i=advanced;i<target.length;i++)await page.locator('.cp-first-tile').click();
      await page.waitForTimeout(700);
      assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'),exercise.exerciseId,'manual continuation preserved');
      assert.equal(await page.locator('.cp-exercise-feedback > button').isDisabled(),false);
      assert.equal(await page.evaluate(()=>localStorage.getItem('klink.build-demo-preservation')),'keep');
      assert.deepEqual(errors,[]);
      checks.push({engine,width,height,reducedMotion,word:exercise.exampleWord,passed:true});
      await page.close();
    }
  }finally{await browser.close();}
}
writeFileSync(`${out}/checks.json`,JSON.stringify(checks,null,2));
console.log(`${checks.length} build demos passed: tap before arrival, replay, letter groups, progress and manual continuation`);
