import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='outputs/exercise-map-20261018';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const pass=label=>{checks.push(label);console.log('PASS',label);};
try {
  for(const width of [1366,820,390,320]) {
    await page.setViewportSize({width,height:950});
    await page.goto('http://127.0.0.1:18830/#learner/home');
    await page.getByRole('heading',{name:'Oefenen met woorden',exact:true}).waitFor();
    assert.equal(await page.getByRole('heading',{name:'Oefenen met vaardigheden',exact:true}).count(),1);
    assert.deepEqual(await page.locator('.learner-nav nav button span').allTextContents(),['Start','Lessen','Oefenen','Woorden','Herhalen']);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:`${out}/home-${width}.png`,fullPage:true});
    await page.locator('.cp-package-grid>button').first().click();
    await page.locator('.cp-tabs').getByRole('button',{name:'Oefenen met deze woorden',exact:true}).click();
    await page.locator('[data-group-practice]').waitFor();
    assert.equal(await page.locator('[data-group-practice] h1').innerText(),'Oefenen met deze woorden');
    await page.locator('[data-activity="meet"]').click();
    await page.locator('[data-exercise-id]').waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:`${out}/practice-${width}.png`,fullPage:true});
    pass(`App entrance labels, unchanged menu, exercise launch and no horizontal overflow at ${width}px`);
  }
  await page.goto(pathToFileURL(resolve(`${out}/klink-oefenkaart-preview.html`)).href);
  const frame=page.frameLocator('iframe');
  await frame.locator('[data-results] li').first().waitFor();
  assert.equal(await frame.locator('[data-results]>li').count(),2);
  await frame.locator('[data-all-stages]').click();
  assert.equal(await frame.locator('[data-results]>li').count(),46);
  assert.equal(await frame.locator('[data-chapters] li').count(),12);
  await frame.locator('[data-level="alfa-c"]').click();
  assert.equal(await frame.locator('[data-results]>li').count(),0);
  await frame.locator('[data-level="b1"]').click();
  assert.equal(await frame.locator('[data-results]>li').count(),0);
  await frame.locator('[data-level="a1"]').click();
  assert((await frame.locator('[data-results]>li').count())>0);
  await frame.locator('[data-level="all"]').click();
  await frame.locator('[data-stage="recognize"]').click();
  assert.equal(await frame.locator('[data-results]>li').count(),8);
  await frame.locator('[data-chapter]').selectOption('sounds');
  assert.equal(await frame.locator('[data-results]>li').count(),2);
  await frame.locator('[data-stage="meet"]').focus();await page.keyboard.press('Enter');
  assert.equal(await frame.locator('[data-results]>li').count(),0);
  await frame.locator('[data-chapter]').selectOption('all');
  assert.equal(await frame.locator('[data-results]>li').count(),2);
  pass('All 46 live activities, 12 chapters, keyboard phase selection, level/skill intersection and honest empty levels');
  for(const width of [736,390,320]) {
    await page.setViewportSize({width,height:950});
    assert(await frame.locator('#klink-exercise-map').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    await page.screenshot({path:`${out}/map-${width}.png`,fullPage:true});
  }
  await page.emulateMedia({colorScheme:'dark'});
  await page.setViewportSize({width:736,height:950});
  await page.screenshot({path:`${out}/map-dark.png`,fullPage:true});
  assert.deepEqual(errors,[]);pass('Map fits 736/390/320px, dark appearance captured, no browser errors');
} finally {writeFileSync(`${out}/checks.json`,JSON.stringify({checkedAt:new Date().toISOString(),checks,errors,publication:'local only; no deploy',audio:'unchanged'},null,2));await browser.close();}
