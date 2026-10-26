import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const dialogues=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues;
const base=process.env.KLINK_TEST_URL||'http://localhost:18932';const out=process.env.KLINK_SELF_LISTENING_OUTPUT||'outputs/self-listening';mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__ended=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;}play(){this.timer=setTimeout(()=>{window.__ended.push(this.src);this.dispatchEvent(new Event('ended'));},40);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
try{
 for(const width of [320,390,1366]){
  await page.setViewportSize({width,height:900});await page.goto(`${base}/#learner/chapters/practical/dialogues?level=all&help=practice`);
  await page.locator('.cp-chapter-collections > button').first().waitFor();
  while(await page.getByRole('button',{name:'Meer opdrachten',exact:true}).count())await page.getByRole('button',{name:'Meer opdrachten',exact:true}).click();
  const cards=page.locator('.cp-chapter-collections > button');assert.equal(await cards.count(),128);for(const label of await cards.locator('small').allTextContents())assert(label.includes('Zelf oefenen')&&!label.includes('Met de docent'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/cards-${width}.png`});
 }
 for(const d of dialogues){
  await page.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=${d.sourceLevel.toLowerCase()}`);
  await page.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),d.id);
  assert.equal(await page.getByText('Samen met je docent.',{exact:true}).count(),0);
  assert.equal(await page.locator('.cp-dialogue-support-note').innerText(),'Luister naar het hele gesprek. Je kunt daarna nog een keer luisteren.');
 }
 const before=await page.evaluate(()=>({route:localStorage.getItem('klink.taalroute.route.v1'),review:localStorage.getItem('klink.learning-review.v1')}));
 const finish=page.getByRole('button',{name:'Ronde afronden',exact:true});assert(await finish.isDisabled());
 await page.getByRole('button',{name:'Langzamer afspelen',exact:true}).click();await page.getByRole('button',{name:'Luister naar het gesprek',exact:true}).click();await page.waitForFunction(()=>window.__ended.length===4);await finish.click();
 const attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
 assert(['geluisterd','geoefend'].includes(attempt.answer));assert.equal(attempt.assessment,'participation');assert.equal(attempt.support,'listening');assert.equal(attempt.independentReading,false);assert.notEqual(attempt.reviewEligible,true);
 assert.deepEqual(await page.evaluate(()=>({route:localStorage.getItem('klink.taalroute.route.v1'),review:localStorage.getItem('klink.learning-review.v1')})),before);
 await page.goto(`${base}/#learner/chapters/spelling/content-spelling?help=guided`);await page.locator('.cp-chapter-collections > button').first().waitFor();assert((await page.locator('.cp-chapter-collections > button small').allTextContents()).every(s=>s.includes('Met de docent')));
 await page.goto(`${base}/docenten/hoofdstuk-8`);await page.getByText(/Bij Oefenen staan de luistergesprekken onder Zelf oefenen/).waitFor();
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({passed:true,dialogues:128,widths:[320,390,1366],cardsIndependent:true,legacyRoutes:true,participationOnly:true,progressPreserved:true,teacherTasksRetained:true,manualUpdated:true,errors},null,2)+'\n');console.log('PASS 128 independent listening routes, 384 cards, participation-only completion, teacher tasks and progress retained');
}finally{await browser.close();}
