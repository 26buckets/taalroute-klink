import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18840';
const out = process.env.KLINK_PREVIEW_OUTPUT || 'outputs/collapsed-menu-preview';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => { window.Audio = class extends EventTarget { play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 50); return Promise.resolve(); } pause() { clearTimeout(this.timer); } }; });
const shots = [];
async function capture(name, label, menu = true) {
  const pause = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true });
  if (await pause.count()) await pause.click();
  for (const expanded of menu ? [false, true] : [false]) {
    const trigger = page.getByRole('button', { name: 'Andere oefening', exact: true });
    if (menu) {
      await trigger.waitFor();
      assert.equal(await page.locator('.cp-exercise-record-head h3').count(), 1);
      assert.equal(await page.locator('.cp-exercise-workspace > aside').count(), 0);
      if ((await trigger.getAttribute('aria-expanded') === 'true') !== expanded) await trigger.click();
    }
    await page.locator('.learner-main').evaluate(el => el.scrollTo(0, 0));
    await page.waitForFunction(() => [...document.querySelectorAll('.learner-main img')].filter(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every(el => el.complete && el.naturalWidth > 0));
    const file = `${name}-${expanded ? 'open' : 'dicht'}.png`;
    await page.screenshot({ path: `${out}/${file}` });
    shots.push({ name, label, expanded, file, url: page.url() });
  }
}
try {
  await page.goto(base + '/#learner/package/groep-1');
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-start-lesson').first().click();
  await capture('les', 'Actieve les');
  for (const [name, label, chapter, activity] of [['woorden-oefenen', 'Pen en kip', 'words', 'meet'], ['luisteren', 'Hoor en kies', 'listening', 'listen'], ['klanken', 'Klanken', 'sounds', 'sound-compare']]) {
    const items = chapterCollections(activity);
    const collection = items.find(item => item.title === 'pen · kip') || items[0];
    const url = chapterHash({ chapter, activity, collection: collection.id, level: collection.level });
    await page.goto(base + '/' + url);
    await capture(name, label);
  }
  await page.goto(base + '/#learner/package/groep-1');
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click();
  await page.getByRole('button', { name: 'Woordenmix', exact: true }).click();
  await capture('mix', 'Woordenmix');
  for (const [route, label] of [['home', 'Start'], ['chapters', 'Oefenen'], ['words', 'Woorden'], ['review', 'Herhalen']]) {
    await page.goto(base + '/#learner/' + route);
    await page.locator('.cp-context-header h1').waitFor();
    await capture(route, label, false);
  }
  writeFileSync(`${out}/screens.json`, JSON.stringify(shots, null, 2));
  console.log(`Captured ${shots.length} views with loaded images and one instruction heading.`);
} finally { await browser.close(); }
