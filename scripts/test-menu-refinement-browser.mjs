import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { learningReviewKey } from '../lib/learning-review.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/menu-review-round2-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const checks = [], errors = [];
page.on('pageerror', e => errors.push(e.message));
const pass = message => { checks.push(message); console.log('PASS', message); };
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 30); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
try {
  await page.goto(`${base}/#learner/package/groep-1`);
  await page.locator('.cp-word-grid').waitFor();
  await page.locator('.cp-content .cp-panel-heading').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click();
  await page.locator('[data-group-practice]').waitFor();
  assert.equal(await page.locator('[data-group-practice] h1').innerText(), 'Oefenen met deze woorden');
  assert.equal(await page.locator('.cp-tabs [aria-current="page"]').innerText(), 'Oefenen met deze woorden');
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-lesson-picker').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click();
  await page.getByRole('button', { name: 'Woordenmix', exact: true }).click();
  assert.equal(await page.locator('.cp-tabs [aria-current="page"]').innerText(), 'Oefenen met deze woorden');
  await page.locator('.cp-mixed-practice > .text-back').click();
  await page.locator('[data-group-practice]').waitFor();
  pass('Word overview button, section tab and practice heading agree; mixed lessons keep a visible parent and return to lessons');

  const list = { chapter: 'texts', activity: 'text-question', level: 'all' };
  const collections = chapterCollections(list.activity);
  assert(collections.length > 12);
  const id = collections[12].id;
  const selected = () => page.locator('[data-collection]').evaluateAll((nodes, id) => nodes.some(node => node.dataset.collection === id), id);
  for (const width of [1366, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(`${base}/${chapterHash(list)}`); await page.reload();
    await page.locator('[data-collection]').first().waitFor();
    assert.equal(await page.locator('[data-collection]').count(), 12);
    await page.getByRole('button', { name: 'Meer opdrachten', exact: true }).click();
    await page.locator('[data-collection]').nth(12).click();
    await page.locator('.is-mixed-round').waitFor();
    await page.locator('.cp-chapters > .text-back').click();
    await page.locator('[data-collection]').first().waitFor();
    assert(await selected(), `13th collection retained ${width}`);
    await page.waitForFunction(id => document.activeElement?.getAttribute('data-collection') === id, id);
    assert(await page.evaluate(() => { const style = getComputedStyle(document.activeElement); return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2; }), 'Returned card has visible focus after a pointer click too');
    const rect = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, screen: innerHeight }; });
    assert(rect.top >= 0 && rect.bottom <= rect.screen, `${width}: return target ${JSON.stringify(rect)}`);
    await page.keyboard.press('Enter'); await page.locator('.is-mixed-round').waitFor();
    await page.goBack();
    await page.waitForFunction(id => document.activeElement?.getAttribute('data-collection') === id, id);
    await page.goto(`${base}/${chapterHash({ ...list, collection: id })}`); await page.reload();
    await page.locator('.is-mixed-round').waitFor();
    await page.locator('.cp-chapters > .text-back').click();
    await page.waitForFunction(id => document.activeElement?.getAttribute('data-collection') === id, id);
    assert(await selected());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${out}/return-${width}.png` });
  }
  pass('More results, in-app Back, browser Back and reloaded deep links return to the selected card with keyboard focus at four widths');

  await page.evaluate(({ key }) => { localStorage.removeItem('klink.taalroute.savedWords.v1'); localStorage.removeItem('klink.taalroute.route.v1'); localStorage.setItem(key, JSON.stringify({ 'removed:recall:word': { due: 0, last: 0, streak: 0 } })); }, { key: learningReviewKey });
  await page.goto(`${base}/#learner/review`); await page.reload();
  await page.locator('.review-page').waitFor();
  assert.equal(await page.getByRole('link', { name: 'Oefen opnieuw', exact: true }).count(), 0);
  assert(await page.getByRole('button', { name: 'Kies woorden', exact: true }).isVisible());
  const recall = chapterCollections('learning-review')[0].exercises[0].exerciseId;
  await page.evaluate(({ key, id }) => localStorage.setItem(key, JSON.stringify({ [id]: { due: 0, last: 0, streak: 0 } })), { key: learningReviewKey, id: recall });
  await page.reload();
  await page.getByRole('link', { name: 'Oefen opnieuw', exact: true }).click();
  await page.locator('[data-collection]').first().waitFor();
  await page.locator('[data-collection]').first().click(); await page.locator('.is-mixed-round').waitFor();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'), recall);
  pass('Removed review IDs do not create dead-end links; available due work opens the exact real exercise');
  await page.goto(`${base}/#teacher/overview`);
  await page.locator('.cp-menu-guide').waitFor();
  await page.keyboard.press('Tab');
  for (const control of [page.locator('.cp-menu-guide a').first(), page.locator('.cp-menu-guide summary')]) {
    await control.focus();
    assert(await control.evaluate(el => { const s = getComputedStyle(el); return s.outlineStyle === 'solid' && parseFloat(s.outlineWidth) >= 2; }), 'Teacher guide has an actual visible keyboard focus line');
  }
  pass('Teacher guide links and disclosure control have a visible keyboard focus line');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/checks.json`, JSON.stringify({ base, checks, errors, checkedAt: new Date().toISOString() }, null, 2));
  await browser.close();
}
