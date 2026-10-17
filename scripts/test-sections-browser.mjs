import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {taalroutePackages as packs} from '../lib/taalroute-packages.ts';
import sectionPhotos from '../data/klink-section-photos.json' with {type:'json'};
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
    assert(decodeURIComponent(await cards.nth(i).locator('img').getAttribute('src')).includes(sectionPhotos[p.id] ?? p.cover.image));
    await cards.nth(i).scrollIntoViewIfNeeded();
    await cards.nth(i).locator('img').evaluate(img=>img.decode());
    assert(await cards.nth(i).locator('img').evaluate(img=>img.naturalWidth>0));
  }
  for(const width of [1366,768,390,320]) {
    await page.setViewportSize({width,height:950});await cards.first().scrollIntoViewIfNeeded();
    assert(await page.locator('.cp-home-preview img').isVisible());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    for (const card of await cards.all()) {
      const geometry = await card.evaluate(el => {
        const photo = el.querySelector('.cp-section-photo').getBoundingClientRect();
        const copy = el.querySelector('.cp-package-copy').getBoundingClientRect();
        const box = el.getBoundingClientRect();
        return {photo: {width: photo.width, height: photo.height, bottom: photo.bottom}, copyTop: copy.top, cardWidth: box.width};
      });
      assert(geometry.photo.bottom <= geometry.copyTop + 1, 'Photo stays above the title');
      assert(Math.abs(geometry.photo.width / geometry.photo.height - 1.5) < .02, 'Keep complete 3:2 navigation scenes');
      assert(geometry.photo.width >= geometry.cardWidth - 3, 'Photo fills the card width');
      assert(!/\d+ lessen|\d+ woorden/.test(await card.innerText()));
    }
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
  console.log('PASS 15 photo-above cards, four separate navigation scenes, preserved first steps and old group-2 resume');
}finally{await browser.close();}
