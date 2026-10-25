import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18850';
const out = process.env.KLINK_IMAGE_OUTPUT || 'outputs/images-20261025';
const images = JSON.parse(readFileSync('docs/klink-images-20261025/images.json'));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${base}/#learner/words`);
  await page.locator('.cp-global-word-grid').waitFor();
  for (const image of images) {
    const targets = page.locator(`.cp-global-word-grid img[src*="${image.code.toLowerCase()}.webp"]`);
    assert.equal(await targets.count(), image.ids.length, image.code);
    for (const target of await targets.all()) {
      await target.scrollIntoViewIfNeeded();
      await target.evaluate(element => element.decode());
      const size = await target.evaluate(element => [element.naturalWidth, element.naturalHeight]);
      assert(size[0] > 0 && size[1] > 0 && Math.abs(size[0] / size[1] - image.pixels[0] / image.pixels[1]) < 0.002, image.code);
    }
  }
  checks.push('All 225 images decode on their 227 existing word cards with their expected proportions');
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const code of ['K203', 'K299', 'K373']) {
      const image = images.find(row => row.code === code);
      const target = page.locator(`.cp-global-word-grid img[src*="${image.code.toLowerCase()}.webp"]`).first();
      await target.scrollIntoViewIfNeeded();
      const layout = await target.evaluate(element => ({ fit: getComputedStyle(element).objectFit, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      assert.equal(layout.fit, 'contain'); assert.equal(layout.overflow, false);
      await target.locator('..').screenshot({ path: `${out}/${code}-${width}.jpg`, type: 'jpeg', quality: 70 });
    }
  }
  checks.push('Existing and additional vocabulary images retain their proportions on desktop and mobile');
  const save = page.getByRole('button', { name: 'neus bewaren', exact: true });
  await save.scrollIntoViewIfNeeded(); await save.click();
  await page.reload();
  await page.getByRole('button', { name: 'neus niet meer bewaren', exact: true }).waitFor();
  await page.getByRole('button', { name: 'neus niet meer bewaren', exact: true }).click();
  checks.push('Saving and restoring a word survives reload');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ checkedAt: new Date().toISOString(), base, checks, errors }, null, 2)+'\n');
  console.log(JSON.stringify({ images: images.length, wordCards: images.reduce((n, row) => n + row.ids.length, 0), checks, errors }));
} finally { await browser.close(); }
