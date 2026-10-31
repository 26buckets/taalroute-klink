import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {openGroupActivity,answerActivity} from './browser-route-helpers.mjs';
import {taalroutePackages,exercisesForLesson} from '../lib/taalroute-packages.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18832';
const out=process.env.KLINK_ARTICLES_OUTPUT||'../articles-checks';mkdirSync(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();const errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
const fits=async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page fits');
try{
 for(const width of [1366,768,390,320]){
  await p.setViewportSize({width,height:width===320?568:900});
  await p.goto(base+'/#learner/package/groep-1');await p.locator('.cp-word-grid').waitFor();
  assert.deepEqual(await p.locator('.cp-word-grid .cp-word-article').allTextContents(),['de mat','de tas','de jas','de man','de map','de pan']);
  await fits();
  await p.locator('.cp-tabs').getByRole('button',{name:'Stap voor stap',exact:true}).click();await p.locator('.cp-start-lesson').first().click();
  await p.locator('.cp-model-content').waitFor();assert.equal(await p.locator('.cp-model-content .cp-word-article').innerText(),'de mat');
  const label=p.locator('.cp-model-content .cp-word-article');
  assert(await label.evaluate(el=>{const b=el.getBoundingClientRect(),s=el.closest('.cp-exercise-stage').getBoundingClientRect();return b.x>=s.x&&b.right<=s.right&&b.y>=s.y&&b.bottom<=s.bottom&&parseFloat(getComputedStyle(el).fontSize)<=18;}));
  if(width===1366){const photo=await p.locator('.cp-model-content img').boundingBox(),text=await label.boundingBox();assert(text.x>photo.x+photo.width,'Small phrase to the right of the photo');}
  if(width===1366||width===320)await p.screenshot({path:`${out}/meet-${width}.png`});
  await fits();
  const ex=exercisesForLesson(taalroutePackages[0],taalroutePackages[0].lessons[0]);
  for(const e of ex){
   if(e.componentId!=='ALF-CMP-001')assert.equal(await p.locator('.cp-exercise-stage .cp-word-article').count(),0,'No article in letter/answer task');
   await answerActivity(p,e,{checkFocus:false});
  }
  checks.push(`${width}: six cards, introduction, small label, complete first lesson with unchanged bare-word letters`);
  await p.goto(base+'/#learner/package/groep-1');await p.locator('.cp-tabs').waitFor();await openGroupActivity(p,'cards');
  const card=p.locator('.cp-flash-card');await card.waitFor();assert.equal(await card.locator('.cp-word-article').count(),0,'Photo side must not disclose answer');await card.click();assert.match(await card.locator('.cp-word-article').innerText(),/^de (mat|tas|jas|man|map|pan)$/);await card.click();assert.equal(await card.locator('.cp-word-article').count(),0);await fits();
  checks.push(`${width}: card turns, no answer on photo side`);
 }
 await p.goto(base+'/#learner/package/groep-1');await p.locator('.cp-word-grid').waitFor();await p.locator('.cp-save-button').first().click();
 await p.goto(base+'/#learner/words');await p.getByLabel('Toon', {exact:true}).selectOption('saved');assert.equal(await p.locator('.cp-global-word-grid .cp-word-article').first().innerText(),'de mat');
 await p.reload();await p.getByLabel('Toon', {exact:true}).selectOption('saved');assert.equal(await p.locator('.cp-global-word-grid .cp-word-article').first().innerText(),'de mat');
 await p.goto(base+'/#learner/review');await p.locator('.review-word-list .cp-word-article').waitFor();assert.equal(await p.locator('.review-word-list .cp-word-article').first().innerText(),'de mat');checks.push('Saved words, reload and review retain article and storage');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/result.json`,JSON.stringify({passed:true,checks,errors},null,2));console.log('PASS',checks.length,'checks');
}finally{await b.close();}
