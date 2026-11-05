import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { practicePreferencesKey } from '../lib/practice-navigation.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_PANEL_OUTPUT || 'outputs/route-panel-20261105';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [], checks = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/#learner/home');
  await page.locator('.cp-direct-levels').waitFor();
  const progress = JSON.stringify({ completed: ['existing-lesson'] });
  await page.evaluate(value => localStorage.setItem('klink.taalroute.route.v1', value), progress);
  for (const [label, level] of [['Alfa B', 'alfa-b'], ['A2', 'a2']]) {
    const choice = page.getByRole('button', { name: label, exact: true });
    await choice.focus(); await page.keyboard.press('Enter');
    assert.equal(await choice.getAttribute('aria-pressed'), 'true');
    assert(await page.locator('.cp-home').isVisible());
    await page.locator('.cp-practice-modes').getByRole('button', { name: 'Met je docent', exact: true }).click();
    await page.reload(); await page.locator('.cp-direct-levels').waitFor();
    await page.waitForFunction(({ key, level }) => JSON.parse(localStorage.getItem(key))?.level === level, { key: practicePreferencesKey, level });
    assert.equal(await choice.getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), practicePreferencesKey), { level, help: 'guided' });
    await page.locator('[data-chapter="words"]').click();
    assert(page.url().includes(`level=${level}`));
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), progress);
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click();
  }
  checks.push('Keyboard level and help choice, reload, chapter routing and unchanged lesson progress');
  for (const width of [1366, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    const nav = page.getByRole('navigation', { name: 'Cursistnavigatie' });
    assert.deepEqual(await nav.locator('button span').allTextContents(), ['Start', 'Woorden bekijken', 'Nog een keer']);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const button of await page.locator('.cp-direct-levels button:visible, .cp-practice-modes button').all()) {
      const r = await button.boundingBox(); assert(r.width >= 47.5 && r.height >= 47.5);
    }
    await page.getByRole('button', { name: 'Stap voor stap', exact: true }).click(); await page.locator('.cp-package-grid').waitFor();
    await nav.getByRole('button', { name: 'Start', exact: true }).click(); await page.locator('.cp-direct-levels').waitFor();
    await page.screenshot({ path: `${out}/${width}.png` });
  }
  checks.push('Approved three-button menu, direct level choices and reachable library at four widths');
  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value: () => { throw Error('Storage denied'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw Error('Storage denied'); } });
  });
  const privatePage = await denied.newPage(); privatePage.on('pageerror', e => errors.push(e.message));
  await privatePage.goto(base + '/#learner/home');
  await privatePage.getByRole('button', { name: 'Alfa B', exact: true }).click();
  assert.equal(await privatePage.getByRole('button', { name: 'Alfa B', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.match(await privatePage.locator('[data-my-route] output').innerText(), /kan hier niet worden bewaard/);
  await denied.close(); checks.push('Denied storage leaves usable choices and an honest persistence message');
  assert.deepEqual(errors, []);
} finally { writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2)); await browser.close(); }
console.log('PASS', ...checks);
