import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18840';
const out = process.env.KLINK_PREVIEW_OUTPUT || 'outputs/compact-exercises';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 100); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const collection = chapterCollections('meet').find(c => c.title === 'pen · kip');
const route = chapterHash({ chapter: 'words', activity: 'meet', collection: collection.id, level: collection.level });
try {
  for (const [width, height] of [[1280, 720], [390, 844], [320, 640], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/${route}`);
    await page.locator('.cp-exercise-feedback > button').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.cp-model-content img').evaluate(img => img.decode());
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/${process.env.KLINK_BASELINE ? 'before' : 'preview'}-${width}.png` });
    const initial = await page.locator('.learner-main').evaluate(el => ({ overflow: getComputedStyle(el).overflowY, height: el.clientHeight, scrollHeight: el.scrollHeight }));
    // Wheel over the page gutter: scrolling the internal picture alone cannot reveal the footer.
    const main = await page.locator('.learner-main').boundingBox();
    await page.mouse.move(main.x + 4, Math.min(main.y + 100, height - 100));
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(200);
    const position = await page.locator('.learner-main').evaluate(el => el.scrollTop);
    const reachable = await page.locator('.cp-exercise-feedback > button').evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    checks.push({ width, height, initial, position, reachable });
    writeFileSync(`${out}/scroll-checks.json`, JSON.stringify({ checks, errors }, null, 2));
    assert(reachable, `${width}×${height}: Verder must be reachable with the page scroll wheel`);
    if (initial.scrollHeight > initial.height + 1) assert(position > 0, 'Overflow must scroll naturally');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal clipping');
    await page.locator('.learner-main').evaluate(el => el.scrollTo(0, 0));
    const stage = await page.locator('.cp-exercise-stage').boundingBox();
    await page.mouse.move(stage.x + stage.width / 2, Math.min(stage.y + 50, height - 90));
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(200);
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(200);
    if (initial.scrollHeight > initial.height + 1) assert(await page.locator('.learner-main').evaluate(el => el.scrollTop > 0), 'Scrolling over the exercise must continue to the page, not trap the wheel');
    await page.locator('.learner-main').evaluate(el => el.scrollTo(0, 0));
    await page.getByRole('button', { name: 'Op één blad', exact: true }).click();
    await page.locator('.cp-practice-sheet').waitFor();
    await page.mouse.move(main.x + 4, Math.min(main.y + 100, height - 100));
    await page.mouse.wheel(0, 10000);
    await page.waitForTimeout(200);
    assert(await page.locator('.cp-practice-sheet > footer button').first().evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), 'Sheet footer must remain reachable above navigation');
    await page.getByRole('button', { name: 'Eén voor één', exact: true }).click();
    await page.locator('.cp-exercise-browser').waitFor();
    await page.getByRole('button', { name: 'Andere opdracht', exact: true }).click();
    await page.locator(`[data-collection="${collection.id}"]`).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: wheel scrolling, footer reachability, sheet switching and return navigation at four screen sizes');
} finally { await browser.close(); }
