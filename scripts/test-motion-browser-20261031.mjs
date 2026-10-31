import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {chromium, webkit} from 'playwright';
import {chapterCollections, chapterHash, practiceChapters} from '../lib/practice-chapters.ts';
import {exerciseSetHelp} from '../lib/content-levels.ts';
import {synonymCollections} from '../lib/synonyms.ts';
import {pilotBlocks} from '../lib/alfa-c-practice.ts';
import {dailyBlocks} from '../lib/alfa-c-dagelijks.ts';
import {functionalBlocks} from '../lib/alfa-c-functioneel.ts';

const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18987';
const out=process.env.KLINK_MOTION_OUTPUT||'outputs/motion-20261031/browser';
const baseline=process.env.KLINK_MOTION_BASELINE==='1';
const touchOnly=process.env.KLINK_MOTION_TOUCH_ONLY==='1';
const alfaOnly=process.env.KLINK_MOTION_ALFA_ONLY==='1';
mkdirSync(out,{recursive:true});
const collection=id=>chapterCollections(id).find(c=>!c.contentUrl&&c.exercises.length>1);
const route=(activity,c=collection(activity))=>chapterHash({chapter:practiceChapters.find(ch=>ch.activities.includes(activity)).id,activity,collection:c.id,level:c.level,help:exerciseSetHelp(c.exercises)});
const synonym=synonymCollections[0];
const routes=['#learner/home','#learner/words','#learner/review','#learner/chapters/sounds?level=alfa-a&help=practice',route('cards'),route('cards',synonym),route('synonyms',synonym),route('match'),route('memory'),'#teacher/materials'];
const snapshots=[],checks=[],errors=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const theme of (touchOnly?['light']:['light','dark']))for(const width of (touchOnly?[390]:[1366,390,320])){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme,hasTouch:width<650,isMobile:width<650});
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    const Native=window.Audio;window.__motionAudio=[];
    window.Audio=function(...args){const audio=new Native(...args);window.__motionAudio.push(audio);return audio;};
   });
   const activate=locator=>touchOnly?locator.tap():locator.click();
   for(const hash of (touchOnly?[]:alfaOnly?[pilotBlocks[0],dailyBlocks[0],functionalBlocks[0]].map(b=>'#learner/alfa-c/'+b.id):routes)){
    await page.goto(base+'/'+hash);
    await page.locator(alfaOnly?'.pilot-footer':hash==='#teacher/materials'?'.kpd-worksheets':hash.includes('/home')?'.cp-home':hash==='#learner/words'?'.word-library-page':hash==='#learner/review'?'.review-page':hash.includes('/sounds?')?'.cp-chapters':'[data-exercise-id]').waitFor();
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
    const snapshot=await page.evaluate(()=>{
     const selectors=['h1','h2','.cp-direct-levels button','.cp-direct-actions button','[data-chapter]','.cp-global-word-grid article:nth-child(-n+4)','.review-page .cp-page-workspace','.honest-empty','.cp-flash-card','.cp-match-board button','.cp-memory-grid button','.cp-exercise-record-head','.cp-exercise-feedback','.kpd-worksheet-lesson','.pilot-footer','.ac-workspace','.pilot-player-head'];
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,elements:[...document.querySelectorAll(selectors.join(','))].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{tag:e.tagName,className:e.className,x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,color:s.color,background:s.backgroundColor};})};
    });
    assert.equal(snapshot.overflow,false,`${name}/${width}/${hash} overflow`);
    snapshots.push({name,theme,width,hash,...snapshot});
   }
   await page.screenshot({path:`${out}/${name}-${theme}-${width}-materials.png`});
   if(!baseline&&!alfaOnly){
    for(const c of [collection('cards'),synonym]){
     await page.goto(base+'/'+route('cards',c));const card=page.locator('.cp-flash-card');await card.waitFor();
     const box=await card.boundingBox();await card.focus();await page.keyboard.press('Enter');assert.equal(await card.getAttribute('aria-pressed'),'true');
     await page.waitForTimeout(300);assert.equal(await card.locator('.cp-card-front').getAttribute('aria-hidden'),'true');
     assert.equal(await card.locator('.cp-card-back').getAttribute('aria-hidden'),'false');assert.deepEqual(await card.boundingBox(),box);
     await card.focus();await page.keyboard.press('Space');await page.waitForTimeout(300);assert.equal(await card.getAttribute('aria-pressed'),'false');
     for(let i=0;i<8;i++)await activate(card);await page.waitForTimeout(300);assert.equal(await card.getAttribute('aria-pressed'),'false');
     await page.emulateMedia({reducedMotion:'reduce'});await activate(card);
     assert.equal(await card.locator('.cp-card-turn').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
     assert.equal(await card.locator('.cp-card-back').evaluate(e=>getComputedStyle(e).visibility),'visible');
     await page.emulateMedia({reducedMotion:'no-preference'});
     checks.push({name,theme,width,card:c.id,enterSpace:true,rapidClicks:true,boxPreserved:true,reducedMotion:true});
    }
    await page.goto(base+'/'+route('synonyms',synonym));await page.locator('[data-exercise-id]').waitFor();
    const first=synonym.exercises[0],id=first.exerciseId;await page.waitForTimeout(300);
    const answer=first.answer.correctOptionIds[0],wrong=first.options.find(o=>o.id!==answer),right=first.options.find(o=>o.id===answer);
    await activate(page.locator('.cp-choice-grid').getByRole('button',{name:wrong.label,exact:true}));
    await page.locator('.cp-exercise-feedback.wrong').waitFor();assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),id);
    await activate(page.locator('.cp-choice-grid').getByRole('button',{name:right.label,exact:true}));
    await page.locator('.cp-exercise-feedback.right').waitFor();await page.waitForTimeout(350);
    assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),id,'Motion never advances a synonym answer');
    await page.locator('.cp-exercise-record-head h3').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')!==id,id);
    await page.keyboard.press('ArrowLeft');await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')===id,id);
    checks.push({name,theme,width,wrongRightFeedback:true,manualAdvance:true,enterNext:true,arrowBack:true});
    await page.goto(base+'/#learner/words');await page.locator('.cp-word-listen').first().waitFor();
    const protectedState=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|attempt|learning-review/.test(k))));
    const listen=page.locator('.cp-word-listen:not(:disabled)').first();await activate(listen);
    await page.waitForFunction(()=>document.querySelector('[data-audio-active="true"]'));
    await page.waitForFunction(()=>window.__motionAudio.some(a=>a.ended&&!a.error));
    await page.waitForFunction(()=>!document.querySelector('[data-audio-active="true"]'));
    const save=page.locator('.cp-global-word-grid article').first().getByRole('button',{name:/ bewaren$/});await activate(save);
    const saved=await page.evaluate(()=>localStorage.getItem('klink.taalroute.savedWords.v1'));
    await page.reload();await page.locator('.word-library-page').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.savedWords.v1')),saved);
    assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/progress|attempt|learning-review/.test(k)))),protectedState);
    checks.push({name,theme,width,nativeAudioHighlight:true,clearedOnEnd:true,saveReload:true,progressPreserved:true});
    if(touchOnly){
     await page.goto(base+'/'+route('match'));await page.locator('.cp-match-board').waitFor();
     const start=page.getByRole('button',{name:'Nu jij',exact:true});
     if(await start.isVisible()){
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.notEqual(await page.locator('.cp-match-demo .cp-demo-item').first().evaluate(e=>getComputedStyle(e).animationName),'none','Preserve the existing static-step teaching demonstration');
      await page.emulateMedia({reducedMotion:'no-preference'});await start.tap();
     }
     const e=collection('match').exercises[0],source=e.sources[0],target=e.targets.findIndex(t=>t.id===e.answer.mapping[source.id]);
     await page.locator('.cp-match-board > div').first().locator('button').first().tap();
     await page.locator('.cp-match-board > div').nth(1).locator('button').nth(target).tap();
     assert.equal(await page.locator('.cp-match-board button:has(> .lucide-check)').count(),2);
     assert.equal(await page.locator('.cp-match-board button:has(> .lucide-check)').first().evaluate(e=>getComputedStyle(e).animationName),'klink-appear');
     await page.goto(base+'/'+route('memory'));await page.locator('.cp-memory-grid button').first().tap();
     assert.equal(await page.locator('.cp-memory-grid button.open').first().evaluate(e=>getComputedStyle(e).animationName),'klink-reveal');
     await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.cp-memory-grid button.open').first().evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
     await page.goto(base+'/#learner/home');await page.getByRole('button',{name:'Klankenkaart',exact:true}).tap();await page.locator('.cp-sound-play').first().tap();
     await page.waitForFunction(()=>document.querySelector('.cp-sound-play[data-audio-active="true"]'));await page.waitForFunction(()=>window.__motionAudio.some(a=>a.ended&&!a.error));await page.waitForFunction(()=>!document.querySelector('[data-audio-active="true"]'));
     await page.goto(base+'/#learner/words');await page.locator('.cp-word-listen:not(:disabled)').first().tap();await page.waitForFunction(()=>document.querySelector('[data-audio-active="true"]'));
     const audioSource=await page.evaluate(()=>window.__motionAudio.at(-1).src);
     await page.getByRole('navigation',{name:'Cursistnavigatie'}).getByRole('button',{name:'Start',exact:true}).tap();assert.equal(await page.locator('[data-audio-active="true"]').count(),0);
     await page.goto(base+'/#learner/words');await page.route(audioSource,r=>r.abort());await page.locator('.cp-word-listen:not(:disabled)').first().tap();await page.waitForFunction(()=>window.__motionAudio.some(a=>a.error));assert.equal(await page.locator('[data-audio-active="true"]').count(),0);await page.unroute(audioSource);
     checks.push({name,theme,width,touchOnly:true,pairedFeedback:true,memoryReveal:true,soundPlaying:true,routeCancellation:true,audioFailureCleared:true});
    }

    await page.goto(base+'/'+route('cards',synonym));await page.locator('.cp-flash-card').waitFor();await page.locator('.cp-flash-card').click();await page.waitForTimeout(300);await page.screenshot({path:`${out}/${name}-${theme}-${width}-card.png`});
   }
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);
if(process.env.KLINK_MOTION_COMPARE)assert.deepEqual(snapshots,JSON.parse(readFileSync(process.env.KLINK_MOTION_COMPARE)).snapshots,'Every sampled layout remains identical to the latest approved live version');
writeFileSync(`${out}/results.json`,JSON.stringify({base,baseline,touchOnly,alfaOnly,snapshots,checks,errors},null,2)+'\n');
console.log(`PASS ${snapshots.length} layout samples, ${checks.length} interaction journeys; ${baseline?'baseline recorded':'keyboard, audio, storage and reduced motion preserved'}`);
