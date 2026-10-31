import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {taalroutePackages as packs} from '../lib/taalroute-packages.ts';
import {compactImageSrc} from '../lib/compact-images.ts';
import {learnerListName} from '../lib/learner-copy.ts';
import sectionPhotos from '../data/klink-section-photos.json' with {type:'json'};
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18828';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:950}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
mkdirSync('outputs/sections-20261017',{recursive:true});
try {
  await page.goto(base+'/#learner/packages');await page.locator('.cp-package-grid').waitFor();
  assert.equal(await page.locator('.cp-context-meta').innerText(),'15 onderdelen · 302 lessen');
  const cards=page.locator('.cp-package-grid > button');assert.equal(await cards.count(),15);
  for(const [i,p] of packs.entries()) {
    assert.equal(await cards.nth(i).locator('strong').innerText(),learnerListName(p));
    assert(decodeURIComponent(await cards.nth(i).locator('img').getAttribute('src')).includes(compactImageSrc(sectionPhotos[p.id] ?? p.cover.image)));
    await cards.nth(i).scrollIntoViewIfNeeded();
    await cards.nth(i).locator('img').evaluate(img=>img.decode());
    assert(await cards.nth(i).locator('img').evaluate(img=>img.naturalWidth>0));
  }
  for(const width of [1920,1366,1101,1100,768,701,700,481,480,390,320]) {
    await page.setViewportSize({width,height:950});await cards.first().scrollIntoViewIfNeeded();
    const gridWidth = await page.locator('.cp-package-grid').evaluate(el => el.getBoundingClientRect().width);
    const columns = width <= 480 ? 2 : Math.max(1, Math.floor((gridWidth + 12) / 212));
    const boxes = await cards.evaluateAll(items => items.map(item => {
      const {x,y,width,height} = item.getBoundingClientRect(); return {x,y,width,height};
    }));
    assert.equal(boxes.filter(box => Math.abs(box.y - boxes[0].y) < 1).length, columns, 'Responsive columns; two smaller cards on phones');
    for (let i=0;i<boxes.length;i++) {
      assert(Math.abs(boxes[i].width-boxes[0].width)<1, 'Cards have equal widths');
      assert(Math.abs(boxes[i].y-boxes[Math.floor(i/columns)*columns].y)<1, 'Each row is aligned');
    }
    const grid = await page.locator('.cp-package-grid').boundingBox();
    assert(Math.abs(boxes[columns-1].x + boxes[columns-1].width - grid.x - grid.width) < 1, 'First row uses the full available width');
    assert(boxes.every(box => box.width < 420), 'Cards remain compact');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    for (const card of await cards.all()) {
      const geometry = await card.evaluate(el => {
        const photo = el.querySelector('.cp-section-photo').getBoundingClientRect();
        const copy = el.querySelector('.cp-package-copy').getBoundingClientRect();
        const box = el.getBoundingClientRect();
        const img = el.querySelector('.cp-section-photo img');
        const image = img.getBoundingClientRect();
        return {photo: {width: photo.width, height: photo.height, bottom: photo.bottom}, copyTop: copy.top, cardWidth: box.width,
          imageFillsPhoto: Math.abs(image.left-photo.left)<1 && Math.abs(image.top-photo.top)<1 && Math.abs(image.width-photo.width)<1 && Math.abs(image.height-photo.height)<1,
          objectFit: getComputedStyle(img).objectFit, naturalRatio: img.naturalWidth / img.naturalHeight,
          naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, imageWidth: image.width, imageHeight: image.height,
          openHeight: el.querySelector('.cp-section-open').getBoundingClientRect().height,
          titleSize: parseFloat(getComputedStyle(el.querySelector('strong')).fontSize)};
      });
      assert(geometry.photo.bottom <= geometry.copyTop + 1, 'Photo stays above the title');
      assert(Math.abs(geometry.naturalRatio - 1) < .01, 'Every section cover, including 7, 9, 14 and 15, is a square source image');
      assert(Math.abs(geometry.photo.width / geometry.photo.height - geometry.naturalRatio) < .02, 'Show the full natural aspect ratio, not a forced crop');
      assert(geometry.photo.width >= geometry.cardWidth - 3, 'Photo fills the card width');
      assert(geometry.imageFillsPhoto, 'Image box reaches every edge of the photo frame');
      assert.equal(geometry.objectFit, 'contain', 'No photo crop or zoom');
      assert(geometry.imageWidth <= geometry.naturalWidth && geometry.imageHeight <= geometry.naturalHeight, 'Never enlarge beyond the actual image dimensions');
      assert(geometry.openHeight>=48 && geometry.titleSize>=20, 'Compact cards keep large controls and readable titles');
      assert(!/\d+ lessen|\d+ woorden/.test(await card.innerText()));
    }
    if(width!==768)await page.screenshot({path:`outputs/sections-20261017/klink-${width}.png`});
    if(width===390)for(const index of [6,13]) {
      await cards.nth(index).scrollIntoViewIfNeeded();
      await page.screenshot({path:`outputs/sections-20261017/square-photos-${index+1}-390.png`});
    }
  }
  await page.setViewportSize({width:1366,height:950});await cards.first().click();
  await page.locator('.cp-tabs').getByRole('button',{name: 'Stap voor stap',exact:true}).click();
  assert.deepEqual(await page.locator('.cp-lesson-list h2').allTextContents(),['mat','tas','map','man · pan','jas']);
  const lesson=packs[0].lessons[2],exerciseId=lesson.guidedExerciseIds[1];
  await page.evaluate(position=>localStorage.setItem('klink.taalroute.route.v1',JSON.stringify({position,completed:[]})),{packageId:'groep-2',lessonId:lesson.id,exerciseId});
  await page.reload();await page.getByRole('navigation',{name:'Cursistnavigatie'}).getByRole('button',{name: 'Start',exact:true}).click(); await page.getByRole('button', { name: /^Verder met / }).click();
  await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')===id,exerciseId);
  assert.deepEqual(errors,[]);
  writeFileSync('outputs/sections-20261017/browser-'+(base.startsWith('https')?'live':'local')+'.json',JSON.stringify({base,sections:15,photos:15,resume:'old group 2 at exact exercise',errors},null,2));
  console.log('PASS 15 photo-above cards, four separate navigation scenes, preserved first steps and old group-2 resume');
}finally{await browser.close();}
