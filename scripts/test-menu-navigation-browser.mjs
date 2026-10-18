import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { practiceChapters, chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { learnerListName } from '../lib/learner-copy.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/menu-review-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
const pass = message => { checks.push(message); console.log('PASS', message); };
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 30); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const menu = () => page.getByRole('navigation', { name: 'Cursistnavigatie' });
async function teacher() { await page.goto(`${base}/#teacher/overview`); await page.locator('.cp-menu-guide').waitFor(); }
try {
  await page.goto(`${base}/#learner/home`);
  await page.getByRole('heading', { name: 'Begin hier', exact: true }).waitFor();
  assert.deepEqual(await menu().locator('button span').allTextContents(), ['Verder', 'Lessen', 'Oefenen', 'Woorden', 'Herhalen']);
  for (const [label, path, selector] of [
    ['Lessen', 'packages', '.cp-library-page'], ['Oefenen', 'chapters', '[data-chapter-page="all"]'],
    ['Woorden', 'words', '.word-library-page'], ['Herhalen', 'review', '.review-page'],
  ]) {
    await menu().getByRole('button', { name: label, exact: true }).click();
    await page.locator(selector).waitFor();
    assert(page.url().endsWith(`#learner/${path}`));
    await page.reload(); await page.locator(selector).waitFor();
    assert.equal(await menu().getByRole('button', { name: label, exact: true }).getAttribute('aria-current'), 'page');
  }
  await menu().getByRole('button', { name: 'Woorden', exact: true }).click();
  await menu().getByRole('button', { name: 'Lessen', exact: true }).click();
  await page.goBack(); await page.locator('.word-library-page').waitFor();
  await page.goForward(); await page.locator('.cp-library-page').waitFor();
  pass('Five unchanged main buttons have correct active states; refresh and browser history retain each destination');

  await page.goto(`${base}/#learner/chapters?level=alfa-a`);
  await page.locator('[data-chapter-page="all"]').waitFor();
  await menu().getByRole('button', { name: 'Lessen', exact: true }).click();

  await page.locator('.cp-package-grid > button').first().click();
  await page.locator('.cp-player-bar').waitFor();
  assert(page.url().endsWith(`#learner/package/${packs[0].id}`));
  await page.reload(); await page.locator('.cp-player-bar').waitFor();
  assert.equal(await page.locator('.cp-player-bar strong').innerText(), learnerListName(packs[0]));
  await page.getByRole('button', { name: 'Terug naar lessen', exact: true }).click();
  await page.locator('.cp-library-page').waitFor();
  assert.equal(await page.locator('.cp-package-grid > button').count(), 15);
  await page.goto(`${base}/#learner/package/not-a-package`);
  await page.locator('.cp-library-page').waitFor();
  pass('Section links reopen the correct shared word overview; invalid sections fail back to the lesson library');

  const position = { packageId: packs[0].id, lessonId: packs[0].lessons[0].id, exerciseId: packs[0].exercises.find(e => e.lessonId === packs[0].lessons[0].id).exerciseId };
  const saved = JSON.stringify({ completed: [], position });
  await page.evaluate(value => localStorage.setItem('klink.taalroute.route.v1', value), saved);
  await teacher();
  assert.deepEqual(await page.locator('.staff-nav button span').allTextContents(), ['Overzicht', 'Lessen', 'Oefenen', 'Media']);
  assert.equal(await page.getByRole('button', { name: 'Zoeken', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Meer', exact: true }).count(), 0);
  for (const [label, path] of [['Lessen', 'packages'], ['Oefenen', 'activities'], ['Media', 'media'], ['Overzicht', 'overview']]) {
    await page.getByRole('navigation', { name: 'Docentnavigatie' }).getByRole('button', { name: label, exact: true }).click();
    assert(page.url().endsWith(`#teacher/${path}`));
    await page.reload();
    await page.locator('.staff-nav button[aria-current="page"]').waitFor();
    assert.equal(await page.locator('.staff-nav button[aria-current="page"] span').innerText(), label);
  }
  await page.locator('.cp-menu-guide summary').click();
  for (const chapter of practiceChapters) {
    await page.locator('.cp-menu-guide-links').getByRole('link', { name: chapter.title, exact: true }).click();
    await page.locator(`[data-chapter-page="${chapter.id}"]`).waitFor();
    assert.equal(await page.locator('.cp-chapters h1').innerText(), chapter.title);
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), saved);
    await page.goBack(); await page.locator('.cp-menu-guide').waitFor();
    await page.locator('.cp-menu-guide summary').click();
  }
  pass('Teacher labels match learners; all twelve guide links open the intended chapter and return without altering lesson progress');

  await page.goto(`${base}/#learner/home`);
  await menu().getByRole('button', { name: 'Verder', exact: true }).click();
  await page.locator('[data-exercise-id]').waitFor();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'), position.exerciseId);
  pass('Verder still resumes the exact saved exercise after the navigation change');

  for (const width of [1366, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await teacher(); await page.locator('.cp-menu-guide summary').click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `teacher overflow ${width}`);
    for (const button of await page.locator('.staff-nav > button').all()) {
      assert(await button.evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.width >= 48 && r.height >= 48 && r.left >= 0 && r.right <= innerWidth && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }), `all teacher destinations visible and reachable without horizontal scrolling at ${width}`);
    }
    for (const link of await page.locator('.cp-menu-guide a').all()) {
      const box = await link.boundingBox(); assert(box.width >= 48 && box.height >= 48, `guide target ${width}`);
    }
    await page.getByRole('navigation', { name: 'Docentnavigatie' }).getByRole('button', { name: 'Overzicht', exact: true }).click();
    assert.equal(await page.evaluate(() => window.scrollY), 0, 'An active menu button returns to the top on a phone too');
    await page.screenshot({ path: `${out}/teacher-${width}.png` });
    const collection = chapterCollections('sound-path')[0];
    await page.goto(`${base}/${chapterHash({ chapter: 'sounds', activity: 'sound-path', collection: collection.id, level: 'all' })}`);
    await page.locator('.is-mixed-round').waitFor();
    assert.equal(await page.locator('[aria-label="Je bent hier"]').innerText(), 'Oefenen · Klanken');
    assert.equal(await page.locator('.cp-chapters h1').innerText(), 'Klanken in woorden');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `learner overflow ${width}`);
    const next = page.locator('.cp-exercise-feedback > button');
    await next.scrollIntoViewIfNeeded();
    assert(await next.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    await page.screenshot({ path: `${out}/learner-${width}.png` });
  }
  pass('Location stays visible without answer leakage; desktop, tablet and phone fit with reachable continuation');
  await teacher();
  const link = page.locator('.cp-menu-guide').getByRole('link', { name: 'Woorden', exact: true });
  await link.focus(); await page.keyboard.press('Enter'); await page.locator('.word-library-page').waitFor();
  assert.equal(await page.locator('.cp-menu-guide').count(), 0);
  assert.deepEqual(errors, []);
  pass('Guide works by keyboard and stays out of the learner interface; no page errors');
} finally {
  writeFileSync(`${out}/checks.json`, JSON.stringify({ base, checks, errors, checkedAt: new Date().toISOString() }, null, 2));
  await browser.close();
}
