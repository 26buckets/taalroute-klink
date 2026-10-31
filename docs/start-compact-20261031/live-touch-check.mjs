import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {lessonPackages} from '../../lib/package-content.ts';
import {progressKey} from '../../lib/learner-progress.ts';
import {writeFileSync} from 'node:fs';
const pack=lessonPackages.find(p=>p.lessons.some(l=>l.guidedExerciseIds?.length));
const lesson=pack.lessons.find(l=>l.guidedExerciseIds?.length);
const position={packageId:pack.id,lessonId:lesson.id,exerciseId:lesson.guidedExerciseIds[0]};
const saved={position,completed:[lesson.id]},checks=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  await page.addInitScript(()=>{const AudioClass=window.Audio;window.__touchAudio=[];window.Audio=function(src){const audio=new AudioClass(src);window.__touchAudio.push(audio);return audio;};});
  await page.goto('https://klink.taalroute.nl/#learner/home');await page.locator('.cp-home').waitFor();
  await page.evaluate(({saved,progressKey})=>{localStorage.setItem(progressKey,JSON.stringify(saved));localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy:'alfa-a',language:'b1',pictures:'request'}));localStorage.setItem('klink.taalroute.practice-navigation.v1',JSON.stringify({level:'alfa-a',help:'practice'}));},{saved,progressKey});
  await page.reload();await page.locator('.cp-direct-resume').waitFor();
  await page.getByRole('button',{name:'Klankenkaart',exact:true}).tap();await page.locator('[data-sound="a"]').waitFor();assert.equal(await page.locator('[data-sound]').count(),46);
  await page.locator('[data-sound="a"] .cp-sound-play').tap();await page.waitForFunction(()=>window.__touchAudio.some(a=>a.ended&&!a.error));
  const nav=page.getByRole('navigation',{name:'Cursistnavigatie'});
  await nav.getByRole('button',{name:'Start',exact:true}).tap();await page.getByRole('button',{name:'Stap voor stap',exact:true}).tap();await page.locator('.cp-package-grid > button').first().waitFor();
  await nav.getByRole('button',{name:'Start',exact:true}).tap();await page.locator('.cp-direct-resume').tap();await page.locator(`[data-exercise-id="${position.exerciseId}"]`).waitFor();
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),progressKey),saved,'Resume retains both completed lessons and exact exercise position');
  checks.push({browser:name,mobileTouch:true,sounds:46,nativeAudio:true,stepByStep:true,resume:true,progressUnchanged:true});
 }finally{await browser.close();}
}
writeFileSync('outputs/start-compact-live-20261031/touch.json',JSON.stringify(checks,null,2)+'\n');
console.log('PASS touch navigation, original sound playback, step-by-step and resume in both mobile browser engines');
