import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {taalroutePackages as packs} from '../lib/taalroute-packages.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18828';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:950}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
mkdirSync('outputs/sections-20261017',{recursive:true});
try {
  await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  const cards=page.locator('.cp-package-grid > button');assert.equal(await cards.count(),15);
  for(const [i,p] of packs.entries()) {
    assert.equal(await cards.nth(i).locator('strong').innerText(),p.title);
    assert(decodeURIComponent(await cards.nth(i).locator('img').getAttribute('src')).includes(p.cover.image));
    await cards.nth(i).scrollIntoViewIfNeeded();
    await cards.nth(i).locator('img').evaluate(img=>img.decode());
    assert(await cards.nth(i).locator('img').evaluate(img=>img.naturalWidth>0));
  }
  for(const width of [1366,768,390,320]) {
    await page.setViewportSize({width,height:950});await cards.first().scrollIntoViewIfNeeded();
    assert(await page.locator('.cp-home-preview img').isVisible());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert(await cards.first().evaluate(el=>el.getBoundingClientRect().height>=48));
    if(width!==768)await page.screenshot({path:`outputs/sections-20261017/klink-${width}.png`});
  }
  await page.setViewportSize({width:1366,height:950});await cards.first().click();
  assert.deepEqual(await page.locator('.cp-lesson-list h2').allTextContents(),['mat','tas','map','man · pan','jas']);
  const lesson=packs[0].lessons[2],exerciseId=lesson.guidedExerciseIds[1];
  await page.evaluate(position=>localStorage.setItem('klink.taalroute.route.v1',JSON.stringify({position,completed:[]})),{packageId:'groep-2',lessonId:lesson.id,exerciseId});
  await page.reload();await page.getByRole('button',{name:'Ga verder',exact:true}).click();
  await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')===id,exerciseId);
  assert.deepEqual(errors,[]);
  writeFileSync('outputs/sections-20261017/browser-'+(base.startsWith('https')?'live':'local')+'.json',JSON.stringify({base,sections:15,photos:15,resume:'old group 2 at exact exercise',errors},null,2));
  console.log('PASS 15 selected photos, five small first steps, desktop/tablet/mobile and old group-2 resume');
}finally{await browser.close();}
