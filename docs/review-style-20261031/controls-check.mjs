import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium,webkit} from '/Users/nicoknoester/.cache/klink-direct-release-20261030/node_modules/playwright/index.mjs';
import {allPackageWords,contentPackages} from '/Users/nicoknoester/.cache/klink-review-style-20261031/lib/package-content.ts';
import {chapterCollections} from '/Users/nicoknoester/.cache/klink-review-style-20261031/lib/practice-chapters.ts';
import {learningReviewKey} from '/Users/nicoknoester/.cache/klink-review-style-20261031/lib/learning-review.ts';
import {progressKey} from '/Users/nicoknoester/.cache/klink-review-style-20261031/lib/learner-progress.ts';
const base=process.argv[2],output=process.argv[3];assert(base&&output);
const lesson=contentPackages.flatMap(p=>p.lessons).find(l=>l.newWords?.length>=2);
const recall=chapterCollections('learning-review').flatMap(c=>c.exercises).find(e=>e.exerciseId.includes(':recall:'));
const checks=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__reviewAudio=[];window.Audio=function(src){const audio=new NativeAudio(src);window.__reviewAudio.push(audio);return audio;};});
  await page.goto(base+'/#learner/review');await page.locator('.review-page').waitFor();
  const state={
   [progressKey]:JSON.stringify({completed:[lesson.id]}),
   [learningReviewKey]:JSON.stringify({[recall.exerciseId]:{due:0,last:1,streak:0}}),
   'klink.taalroute.attempts.v1':JSON.stringify([{exerciseId:recall.exerciseId,correct:false,at:'2026-10-31T08:00:00.000Z'}])
  };
  await page.evaluate(state=>{for(const[k,v]of Object.entries(state))localStorage.setItem(k,v);localStorage.setItem('klink.taalroute.savedWords.v1','[]');},state);await page.reload();await page.locator('.cp-review-tools').waitFor();
  await page.getByRole('link',{name:'Oefen opnieuw',exact:true}).focus();await page.keyboard.press('Enter');await page.locator('[data-collection]').first().waitFor();
  await page.goto(base+'/#learner/review');await page.getByRole('button',{name:'Woordenmix',exact:true}).focus();await page.keyboard.press('Space');await page.locator('.is-mixed-round').waitFor();
  await page.getByRole('button',{name:'Terug',exact:true}).first().tap();await page.locator('.review-page').waitFor();
  await page.getByRole('link',{name:'Oefen opnieuw',exact:true}).tap();await page.locator('[data-collection]').first().waitFor();
  await page.goto(base+'/#learner/review');await page.getByRole('button',{name:'Kies woorden',exact:true}).tap();await page.locator('.cp-global-word-grid article').first().waitFor();
  await page.locator('.cp-global-word-grid article').first().getByRole('button',{name:/ bewaren$/}).tap();
  const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.savedWords.v1'))[0]);const word=allPackageWords.find(w=>w.id===id);assert(word?.audio);
  await page.getByRole('navigation',{name:'Cursistnavigatie'}).getByRole('button',{name:'Nog een keer',exact:true}).tap();await page.locator('.review-word-list > div > button').tap();
  await page.waitForFunction(src=>window.__reviewAudio.some(a=>a.src.endsWith(src)&&a.ended&&!a.error),word.audio);
  assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(state)),state);
  checks.push({browser:name,enter:true,space:true,mobileTouch:true,chooseSaveAndPlay:true,nativeOriginalAudio:word.audio,progressUnchanged:true});
 }finally{await browser.close();}
}
writeFileSync(output,JSON.stringify({base,checks},null,2)+'\n');console.log('PASS Enter, Space, touch, choose/save/play and unchanged progress in both mobile browsers');
