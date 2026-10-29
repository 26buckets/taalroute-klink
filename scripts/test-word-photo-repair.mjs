import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { allPackageWords } from '../lib/package-content.ts';
const rows = JSON.parse(readFileSync('docs/word-photo-repair-20261029/manifest.json'));
const media = JSON.parse(readFileSync('data/klink-media.json'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(rows.length, 18);
for (const row of rows) {
  assert.equal(hash(readFileSync(`public${row.original.image}`)), row.original_sha256, `${row.word}: original preserved`);
  assert.deepEqual(media[row.id], { ...row.original, image: row.replacement }, `${row.word}: audio and review unchanged`);
  const bytes = readFileSync(`public${row.replacement}`);
  assert.equal(hash(bytes), row.replacement_sha256);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, 768); assert.equal(metadata.height, 768);
  assert(bytes.length < 250_000, `${row.word}: web size`);
  const matches = allPackageWords.filter(word => word.id === row.id);
  assert(matches.length > 0, `${row.word}: runtime word exists`);
  assert(matches.every(word => word.image === row.replacement), `${row.word}: runtime mapping`);
}
const { chromium } = await import('playwright');
const browser = await chromium.launch({headless:true});
const out = 'outputs/word-photo-repair-20261029'; mkdirSync(out,{recursive:true});
const checks = [];
try {
  for (const viewport of [{width:1366,height:950},{width:390,height:844}]) {
    const page = await browser.newPage({viewport}); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${process.env.KLINK_TEST_URL || 'http://127.0.0.1:18929'}/#learner/words`);
    await page.locator('.cp-global-word-grid').waitFor();
    for (const row of rows) {
      const img = page.locator(`.cp-global-word-grid img[src*="${encodeURIComponent(row.replacement)}"]`).first();
      assert.equal(await img.count(),1, `${row.word}: word card`);
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.decode());
      // Allow the browser to paint lazily decoded images after scrolling the inner workspace.
      await page.waitForTimeout(150);
      const metrics = await img.evaluate(el => ({naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
      assert(metrics.naturalWidth > 0); assert.equal(metrics.naturalWidth,metrics.naturalHeight);
      assert(Math.abs(metrics.width-metrics.height)<2, `${row.word}: square display`);
      if (['vijf','hand','wangen','tand'].includes(row.word)) {
        const card = img.locator('xpath=../..');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const box = await card.boundingBox();
        const screenshot = await page.screenshot();
        if (row.word === 'hand') writeFileSync(`${out}/${viewport.width}-viewport.png`, screenshot);
        await sharp(screenshot).extract({left:Math.ceil(box.x),top:Math.ceil(box.y),width:Math.floor(box.width),height:Math.floor(box.height)}).toFile(`${out}/${viewport.width}-${row.word}.png`);
      }
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1));
    assert.deepEqual(errors,[]);
    checks.push({viewport,wordCards:18,loaded:true,square:true,overflow:false,pageErrors:errors});
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync(`${out}/checks.json`,JSON.stringify(checks,null,2)+'\n');
console.log('PASS: 18 originals preserved; 18 square web images; runtime mappings and 36 desktop/mobile word cards verified.');
