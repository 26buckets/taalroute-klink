import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18851';
const out = process.env.KLINK_IMAGE_OUTPUT || 'outputs/word-images-20261026';
const images = JSON.parse(readFileSync('docs/klink-word-images-20261026/images.json'));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${base}/#learner/words`);
  await page.locator('.cp-global-word-grid').waitFor();
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const image of images) {
      const target = page.locator(`.cp-global-word-grid img[src*="${image.code.toLowerCase()}.webp"]`);
      assert.equal(await target.count(), image.ids.length, image.code);
      await target.scrollIntoViewIfNeeded();
      await target.evaluate(element => element.decode());
      const layout = await target.evaluate(element => ({
        width: element.naturalWidth, height: element.naturalHeight,
        fit: getComputedStyle(element).objectFit,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      }));
      assert(layout.width > 0 && layout.height > 0, image.code);
      assert(Math.abs(layout.width / layout.height - image.pixels[0] / image.pixels[1]) < 0.002, image.code);
      assert.equal(layout.fit, 'contain', image.code);
      assert.equal(layout.overflow, false, image.code);
      await target.locator('..').screenshot({ path: `${out}/${image.code}-${width}.jpg`, type: 'jpeg', quality: 80 });
      checks.push({ code: image.code, viewport: width, ...layout });
    }
  }
  const save = page.getByRole('button', { name: 'been bewaren', exact: true });
  await save.scrollIntoViewIfNeeded(); await save.click(); await page.reload();
  await page.getByRole('button', { name: 'been niet meer bewaren', exact: true }).waitFor();
  await page.getByRole('button', { name: 'been niet meer bewaren', exact: true }).click();
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ checkedAt: new Date().toISOString(), base, images: images.length, savedWordRestored: true, checks, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ images: images.length, placements: checks.length, savedWordRestored: true, errors }));
} finally { await browser.close(); }
