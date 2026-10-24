import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { groupSessionKey } from '../lib/group-practice.ts';
import { openGroupActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18840';
const out = process.env.KLINK_MENU_OUTPUT || 'outputs/exercise-menu';mkdirSync(out,{recursive:true});
const browser = await chromium.launch({ channel:'chrome', headless:true });
const page = await browser.newPage();const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{ window.Audio=class extends EventTarget { play(){this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),100);return Promise.resolve();} pause(){clearTimeout(this.timer);} }; });
const collection=chapterCollections('meet').find(c=>c.title==='pen · kip');
const route=chapterHash({chapter:'words',activity:'meet',collection:collection.id,level:collection.level});
const savedKey=groupSessionKey(`chapter:meet:${collection.id}`,'meet');
const menu=()=>page.locator('.cp-exercise-menu');
const trigger=()=>menu().getByRole('button',{name:'Andere oefening',exact:true});
const choice=id=>menu().locator(`[data-exercise-choice="${id}"]`);
async function pause() { const button=page.getByRole('button',{name:'Automatisch verder pauzeren',exact:true});if(await button.count()) await button.click(); }
try {
 for(const [width,height] of [[1280,720],[768,1024],[390,844],[320,640],[320,480],[844,390]]) {
  await page.setViewportSize({width,height});await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  await page.evaluate(({key,id})=>localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false})),{key:savedKey,id:collection.exercises[1].exerciseId});
  await page.goto(base+'/'+route);await trigger().waitFor();await pause();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),collection.exercises[1].exerciseId);
  assert.equal(await trigger().getAttribute('aria-expanded'),'false');
  const oldPosition=await page.evaluate(key=>localStorage.getItem(key),savedKey);
  await trigger().focus();await page.keyboard.press('Enter');assert.equal(await trigger().getAttribute('aria-expanded'),'true');
  assert((await choice('sound-compare').innerText()).includes('Vergelijk klanken'));
  for(const id of ['meet','listen','read','build-model','sound-compare','speak']) {
   const button=choice(id);await button.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   const box=await button.boundingBox();assert(box.width>=48&&box.height>=48);
   assert(await button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}), `${width}x${height}: ${id} is reachable`);
  }
  await choice('meet').focus();await page.keyboard.press('Escape');assert.equal(await trigger().getAttribute('aria-expanded'),'false');assert(await trigger().evaluate(el=>el===document.activeElement));
  await trigger().click();await choice('listen').click();await page.waitForURL(/\/listen\//);await pause();
  assert.equal(await trigger().getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),savedKey),oldPosition);
  await trigger().click();await choice('build-model').click();await page.waitForURL(/\/spelling\/build-model\//);await pause();
  await trigger().click();await choice('sound-compare').click();await page.waitForURL(/\/sounds\/sound-compare\//);
  await trigger().click();await choice('meet').click();await page.waitForURL(/\/meet\//);await pause();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),collection.exercises[1].exerciseId);
  await page.reload();await trigger().waitFor();await pause();assert.equal(await trigger().getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),collection.exercises[1].exerciseId);
  const main=page.locator('.learner-main');await main.evaluate(el=>el.scrollTo(0,0));
  await page.screenshot({path:`${out}/closed-${width}x${height}.png`});
  await trigger().click();await page.screenshot({path:`${out}/open-${width}x${height}.png`});
  await trigger().click();await page.locator('.cp-exercise-feedback > button').scrollIntoViewIfNeeded();
  assert(await page.locator('.cp-exercise-feedback > button').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  checks.push(`${width}x${height}: keyboard, choices, cross-skill route, saved position, reload, reachable menu and footer`);
 }
 await page.setViewportSize({width:1280,height:900});
 await trigger().click();await choice('listen').click();await page.waitForURL(/\/listen\//);
 await page.waitForFunction(()=>!document.querySelector('.cp-choice-grid button')?.disabled);
 const waitingId=await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
 const heard=chapterCollections('listen').find(c=>c.id===collection.id).exercises.find(e=>e.exerciseId===waitingId);
 await page.locator('.cp-choice-grid button').nth(heard.options.findIndex(o=>heard.answer.correctOptionIds.includes(o.id))).click();
 await trigger().click();await page.waitForTimeout(1100);
 assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),waitingId);
 await trigger().click();await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')!==id,waitingId);
 checks.push('Opening the menu suspends automatic advancement; closing restores the chosen playback mode');
 await trigger().click();await choice('read-series').click();await page.waitForURL(/read-series/);
 await page.getByRole('button',{name:'6 seconden',exact:true}).click();await trigger().click();
 const timedId=await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
 await page.waitForTimeout(6400);assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),timedId);
 await trigger().click();await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')!==id,timedId);
 checks.push('Timed reading also pauses while the menu is open and resumes after closing');
 await page.setViewportSize({width:1280,height:900});await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();await page.locator('.cp-package-grid > button').first().click();await page.locator('.cp-tabs').getByRole('button',{name:'Oefenen met deze woorden',exact:true}).click();await openGroupActivity(page,'meet');await trigger().waitFor();await pause();await trigger().click();await choice('listen').click();await pause();assert.equal(await trigger().getAttribute('aria-expanded'),'false');assert.equal(await choice('listen').getAttribute('aria-pressed'),'true');checks.push('Existing lesson-word practice uses the same menu and available scope');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/checks.json`,JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
} finally {await browser.close();}
