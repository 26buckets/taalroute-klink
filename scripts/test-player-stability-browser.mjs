import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/player-stability-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__fail = false;
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; }
    play() {
      if (window.__fail) return Promise.reject(Error('Audio unavailable'));
      this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 200);
      return Promise.resolve();
    }
    pause() { clearTimeout(this.timer); }
  };
});
async function open(activity, word) {
  const chapter = activity === 'build-model' ? 'spelling' : 'words';
  const c = chapterCollections(activity).find(c => !word || c.exercises.some(e => e.text?.primary === word));
  assert(c, `Missing ${activity}/${word}`);
  const e = c.exercises.find(e => e.text?.primary === word) || c.exercises[0];
  await page.goto(`${base}/#learner/chapters`);
  await page.evaluate(({ id, activity, exerciseId }) => {
    localStorage.setItem(`klink.group.v1:chapter:${activity}:${id}:${activity}`, JSON.stringify({ version: 1, exerciseId }));
  }, { id: c.id, activity, exerciseId: e.exerciseId });
  await page.goto(`${base}/${chapterHash({ chapter, activity, collection: c.id, level: c.level })}`);
  await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}
async function measure() {
  return page.evaluate(() => {
    const parent = document.querySelector('.cp-exercise-main').getBoundingClientRect();
    return Object.fromEntries(['.cp-exercise-main', '.cp-exercise-stage', '.cp-exercise-feedback', '.cp-exercise-feedback > button', '.cp-model-content', '.cp-model-content img', '.cp-model-content strong'].map(selector => {
      const el = document.querySelector(selector);
      if (!el) return [selector, null];
      const r = el.getBoundingClientRect();
      return [selector, { x: r.x - parent.x, y: r.y - parent.y, w: r.width, h: r.height }];
    }));
  });
}
function same(a, b, selectors = Object.keys(a)) {
  for (const s of selectors) for (const key of ['x', 'y', 'w', 'h']) {
    assert(Math.abs(a[s][key] - b[s][key]) <= 1, `${s} ${key}: ${a[s][key]} → ${b[s][key]}`);
  }
}
const shell = ['.cp-exercise-main', '.cp-exercise-stage', '.cp-exercise-feedback', '.cp-exercise-feedback > button'];
try {
  for (const [width, height] of [[1366, 950], [820, 950], [390, 844], [320, 640], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await open('meet', 'lam');
    const lam = await measure();
    const listen = page.getByRole('button', { name: 'Luister naar lam', exact: true });
    await listen.click(); same(lam, await measure());
    await page.waitForTimeout(300); same(lam, await measure());
    await page.locator('.cp-exercise-feedback > button').click();
    await page.waitForTimeout(100);
    same(lam, await measure());
    await page.getByRole('button', { name: 'Vorige oefening', exact: true }).click();
    await page.getByRole('button', { name: 'Luister naar lam', exact: true }).waitFor();
    same(lam, await measure());
    await open('meet', 'kat');
    same(lam, await measure());
    // Loading a different image must not collapse its frame or move the word.
    await page.locator('.cp-model-content img').evaluate(img => { img.src = '/missing-stability-image.png'; img.removeAttribute('srcset'); });
    same(lam, await measure());
    await page.evaluate(() => { window.__fail = true; });
    await page.getByRole('button', { name: 'Luister naar kat', exact: true }).click();
    await page.locator('.cp-audio-retry').waitFor();
    same(lam, await measure(), shell);
    await page.evaluate(() => { window.__fail = false; });
    await page.getByRole('button', { name: 'Opnieuw luisteren', exact: true }).click();
    await page.locator('.cp-audio-retry').waitFor({ state: 'detached' });
    same(lam, await measure());
    for (const activity of ['read', 'cards', 'build-model']) {
      await open(activity);
      const box = await measure();
      assert.equal(box['.cp-exercise-stage'].h, lam['.cp-exercise-stage'].h, `${activity}: fixed stage`);
      const next = page.locator('.cp-exercise-feedback > button');
      await next.scrollIntoViewIfNeeded();
      assert(await next.evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.width >= 48 && r.height >= 48 && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }), `${activity}: reachable next button`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await open('meet', 'lam');
    await page.screenshot({ path: `${out}/player-${width}.png`, fullPage: true });
    checks.push(`${width}×${height}: lam/kat, audio, image loading, error recovery, other activities and reachable controls`);
    console.log('PASS', checks.at(-1));
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-${base.startsWith('https') ? 'live' : 'local'}.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), checks, errors }, null, 2));
} finally { await browser.close(); }
