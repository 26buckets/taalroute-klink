import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { teacherPictureExamples } from '../lib/teacher-picture-guide.ts';
import { pictureGrowth } from '../lib/learner-route.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/picture-guide-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [], checks = [];
const pass = text => { checks.push(text); console.log('PASS', text); };
page.on('pageerror', error => errors.push(error.message));
try {
  assert.deepEqual(teacherPictureExamples.map(item => item.id), pictureGrowth.map(item => item.id));
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(`${base}/#learner/home`); await page.locator('.cp-home-hero').waitFor();
    assert.equal(await page.locator('[data-picture-stage], [data-picture-example]').count(), 0);
    assert.equal(await page.locator('.cp-practice-line button, .cp-practice-line [aria-current]').count(), 0);
    assert(await page.locator('.cp-home-hero').evaluate(el => Boolean(el.compareDocumentPosition(document.querySelector('.cp-practice-line')) & Node.DOCUMENT_POSITION_FOLLOWING)));
    for (const number of await page.locator('.cp-line-number').all()) {
      const css = await number.evaluate(el => ({ radius: getComputedStyle(el).borderRadius, color: getComputedStyle(el).color }));
      assert.equal(css.radius, '50%'); assert.notEqual(css.color, 'rgb(255, 255, 255)');
    }
    assert.equal(Math.round((await page.locator('.header-klink-logo').boundingBox()).width), width <= 440 ? 65 : 78);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${out}/home-${width}.png` });
    await page.goto(`${base}/#teacher`); await page.locator('[data-teacher-picture-guide]').waitFor();
    const guide = page.locator('[data-teacher-picture-guide]');
    assert.equal(await guide.locator('[data-picture-stage]').count(), 5);
    assert.equal(await guide.locator('[data-picture-example]').count(), 5);
    assert.deepEqual(await guide.locator('[data-picture-stage] strong').allTextContents(), teacherPictureExamples.map(item => item.title));
    assert((await guide.innerText()).includes('geen nieuwe cursistreeks'));
    assert.equal(await guide.locator('.cp-example-note li').allTextContents().then(items => items.join(',')), 'map,pen');
    for (const img of await guide.locator('img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.decode());
      assert(await img.evaluate(el => el.complete && el.naturalWidth > 0));
    }
    for (const item of teacherPictureExamples) {
      const button = guide.locator(`[data-picture-stage="${item.id}"] button`);
      const box = await button.boundingBox(); assert(box.width >= 48 && box.height >= 48);
      await button.focus(); await page.keyboard.press('Enter');
      assert(page.url().endsWith('#teacher'));
      assert(await guide.locator(`[data-picture-example="${item.id}"]`).evaluate(el => document.activeElement === el));
      assert(await guide.locator(`[data-picture-example="${item.id}"] h3`).evaluate(el => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return hit === el || el.contains(hit); }), `${width}: example heading must not be covered by sticky navigation`);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if ([1366, 390].includes(width)) {
      await guide.evaluate(el => el.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: `${out}/teacher-${width}.png` });
      await guide.locator('[data-picture-stage="object"] button').click();
      await page.screenshot({ path: `${out}/example-${width}.png` });
    }
  }
  pass('Learner home has no teacher image planning, a neutral numbered overview below Start and a 15% smaller approved logo at four widths');
  pass('Teacher has five matching blocks and five real visual examples, keyboard jumps, unchanged app route and visible preparation/observation guidance');
  await page.goto(`${base}/#learner/package/groep-1`);
  await page.locator('.cp-tabs').getByRole('button', { name: 'Samen oefenen', exact: true }).click();
  await page.locator('[data-stage-link="make"]').click();
  assert.equal(await page.locator('[data-stage-link="make"]').getAttribute('aria-current'), 'step');
  assert.equal(await page.locator('[data-stage-link="make"] .cp-line-number').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
  assert.equal(await page.locator('[data-stage-link="make"] .cp-line-number').evaluate(el => getComputedStyle(el).borderRadius), '50%');
  assert(await page.locator('[data-practice-stage="make"] h2').evaluate(el => document.activeElement === el));
  pass('Interactive practice line retains real stage navigation and focus; only the selected step gets a white number in a dark circle');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-${base.startsWith('https') ? 'live' : 'local'}.json`, JSON.stringify({ base, checks, errors, checkedAt: new Date().toISOString() }, null, 2));
} finally { await browser.close(); }
