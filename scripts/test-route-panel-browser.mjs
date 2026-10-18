import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_PANEL_OUTPUT || 'outputs/route-panel-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const pass = text => { checks.push(text); console.log('PASS', text); };
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 25); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const home = async () => { await page.goto(`${base}/#learner/home`); await page.locator('.cp-route-panel').waitFor(); };
const choose = label => page.locator('.cp-route-panel').getByRole('button', { name: label, exact: true });
try {
  await home();
  assert.equal(await page.locator('.cp-route-panel summary').count(), 0);
  assert.equal(await page.locator('.cp-route-level').count(), 6);
  assert.equal(await page.locator('.cp-route-axis').count(), 2);
  assert.equal(await page.locator('.cp-route-panel [data-picture-settings]').count(), 0);
  for (const label of ['Alfa C', 'B1']) {
    assert(await choose(label).isDisabled());
    assert((await choose(label).innerText()).includes('Nog niet beschikbaar'));
    assert(await choose(label).getAttribute('aria-describedby'));
    assert.equal(await choose(label).evaluate(el => getComputedStyle(el).opacity), '1');
  }
  assert.equal(await page.locator('.cp-practice-line li').count(), 6);
  assert.equal(await page.locator('.cp-practice-line [aria-current]').count(), 0);
  assert.equal(await page.locator('[data-picture-stage]').count(), 5);
  assert.equal(await page.locator('[data-picture-stage][data-available="false"]').count(), 2);
  assert.equal(await page.locator('.cp-picture-growth button').count(), 0);
  pass('Six visible choices in two axes, six learning steps, and five image stages; missing content is labelled grey, not a locked achievement');

  const progress = JSON.stringify({ completed: ['klink-leesstap-01'] });
  await page.evaluate(value => localStorage.setItem('klink.taalroute.route.v1', value), progress);
  const originalUrl = page.url();
  await choose('Alfa B').focus(); await page.keyboard.press('Enter');
  assert.equal(page.url(), originalUrl);
  assert.equal(await choose('Alfa B').getAttribute('aria-pressed'), 'true');
  assert((await choose('Alfa B').innerText()).includes('Gekozen'));
  await choose('A2').click(); assert.equal(page.url(), originalUrl);
  await page.getByRole('button', { name: 'Bekijk mijn oefeningen', exact: true }).click();
  await page.locator('[data-chapter-page="words"]').waitFor();
  assert(page.url().includes('level=alfa-b'));
  assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), progress);
  await home(); await page.locator('.cp-route-axis').first().getByRole('button', { name: 'Samen kiezen', exact: true }).click();
  await page.getByRole('button', { name: 'Bekijk mijn oefeningen', exact: true }).click();
  await page.locator('[data-chapter-page="texts"]').waitFor(); assert(page.url().includes('level=a2'));
  pass('Keyboard choice stays on Start; explicit Continue follows literacy or language choice without changing saved lesson progress');

  await home(); await choose('Alfa A').click();
  await page.goto(`${base}/#learner/package/groep-1`);
  await page.locator('.cp-tabs').getByRole('button', { name: 'Samen oefenen', exact: true }).click();
  await page.locator('[data-stage-link="make"]').click();
  assert.equal(await page.locator('[data-stage-link="make"]').getAttribute('aria-current'), 'step');
  assert(await page.locator('[data-practice-stage="make"] h2').evaluate(el => el === document.activeElement));
  await page.locator('[data-activity="dictation"]').click(); await page.locator('.cp-exercise-browser').waitFor();
  assert.equal(await page.locator('.cp-practice-line').count(), 0);
  await page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first().click();
  assert.equal(await page.locator('[data-stage-link="make"]').getAttribute('aria-current'), 'step');
  await page.locator('[data-level-picker] summary').click();
  await page.locator('[data-level-picker]').getByRole('button', { name: 'Alfa C', exact: true }).click();
  assert.equal(await page.locator('[data-stage-link]:disabled').count(), 5);
  assert.equal(await page.locator('[data-activity]').count(), 0);
  pass('Exercise line jumps to the correct section with focus, remembers the chosen stage and greys unavailable stages without empty exercise links');

  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 }); await home();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const button of await page.locator('.cp-route-panel button').all()) {
      const rect = await button.boundingBox(); assert(rect.width >= 48 && rect.height >= 48, `${width}: touch target`);
    }
    await page.locator('.cp-route-panel').screenshot({ path: `${out}/choices-${width}.png` });
    await page.locator('.cp-practice-line').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.locator('.cp-practice-line').screenshot({ path: `${out}/line-${width}.png` });
    await page.locator('.cp-picture-growth').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.locator('.cp-picture-growth').screenshot({ path: `${out}/images-${width}.png` });
  }
  pass('Desktop, tablet and 390/320px layouts retain readable labels, full availability text and 48px choice targets');
  for (const width of [1366, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 950 }); await home();
    const nav = page.locator('.learner-nav');
    assert.deepEqual(await nav.locator('nav button span').allTextContents(), ['Start', 'Lessen', 'Oefenen', 'Woorden', 'Herhalen']);
    const bounds = await nav.boundingBox();
    if (width <= 820) {
      assert.equal(await nav.evaluate(el => getComputedStyle(el).position), 'fixed');
      assert(Math.abs(bounds.y + bounds.height - 950) <= 1, 'Approved menu stays at bottom');
      for (const button of await nav.locator('nav button').all()) {
        const rect = await button.boundingBox(); assert(rect.width >= 48 && rect.height >= 48);
      }
    } else assert.equal(bounds.x, 0, 'Existing desktop sidebar is preserved');
    await nav.getByRole('button', { name: 'Lessen', exact: true }).click();
    await page.locator('.cp-package-grid').waitFor();
    await nav.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.cp-route-panel').waitFor();
  }
  pass('Approved five-button bottom menu preserved through 820px, original desktop placement retained, buttons navigate correctly');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ base, checks, errors, checkedAt: new Date().toISOString(), published: base.startsWith('https://klink.taalroute.nl') }, null, 2));
} finally { await browser.close(); }
