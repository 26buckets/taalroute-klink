import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { progressKey } from '../lib/learner-progress.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18847';
const out = process.env.KLINK_HAND_OUTPUT || '/tmp/klink-hand-review';
mkdirSync(out, { recursive: true });
const checks = [];
for (const engine of (process.env.KLINK_TEST_ENGINES || 'chromium,webkit').split(',')) {
  const browser = await engines[engine].launch();
  try {
    for (const [width, height, reducedMotion] of [[320,568,'no-preference'], [390,740,'no-preference'], [1366,900,'no-preference'], [320,568,'reduce']]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const pack = taalroutePackages[0];
      const lesson = pack.lessons[1];
      const exercise = exercisesForLesson(pack, lesson).find(e => e.mode === 'word-image-match');
      await page.addInitScript(({ key, position }) => {
        localStorage.setItem(key, JSON.stringify({ completed: [], position }));
        localStorage.setItem('klink.hand-preservation', 'keep');
      }, { key: progressKey, position: { packageId: pack.id, lessonId: lesson.id, exerciseId: exercise.exerciseId } });
      await page.goto(`${base}/#learner/home`);
      await page.locator('.cp-home-hero button').click();
      const hand = page.locator('.cp-match-hand');
      await hand.waitFor({ state: 'attached' });
      assert.equal(await page.locator('.cp-match-demo svg').count(), 1);
      assert.equal(await page.locator('.cp-exercise-demo button').count(), 1);
      assert.equal(await page.locator('.cp-exercise-demo button').innerText(), 'Nu jij');
      assert.equal(await page.locator('.cp-exercise-demo .cp-letter-cue').innerText(), 'Kijk eerst');
      assert.equal(await page.getByRole('button', { name: /Stop|Pauze|Beschrijving/ }).count(), 0);
      const before = await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1'));
      const t0 = await hand.evaluate(el => el.getAnimations()[0].currentTime);
      await page.waitForTimeout(200);
      assert(await hand.evaluate(el => el.getAnimations()[0].currentTime) > t0, 'animation actually runs');
      const frame = async time => {
        await page.locator('.cp-match-demo').evaluate((el, t) => {
          for (const a of el.getAnimations({ subtree: true })) { a.pause(); a.currentTime = t; }
        }, time);
        return hand.evaluate(el => {
          const s = getComputedStyle(el), r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, opacity: s.opacity, transform: s.transform, background: s.backgroundColor, fill: s.fill, border: s.borderWidth, count: el.getAnimations()[0].effect.getTiming().iterations };
        });
      };
      const first = await frame(1000);
      assert.equal(first.background, 'rgba(0, 0, 0, 0)');
      assert.equal(first.fill, 'rgb(201, 221, 210)');
      assert.equal(first.border, '0px'); assert.equal(first.count, 1);
      assert(await page.locator('.cp-match-demo').evaluate(el => {
        const r=el.getBoundingClientRect(), navigation=document.querySelector('.learner-bottom-nav, [aria-label="Cursistnavigatie"]')?.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= (navigation?.width >= innerWidth * .8 ? navigation.top : innerHeight);
      }), 'both demonstration cards start fully in view');
      if (reducedMotion === 'reduce') assert.equal(first.transform, 'none');
      else assert.notEqual(first.transform, 'matrix(1, 0, 0, 1, 0, 0)');
      await page.screenshot({ path: `${out}/${engine}-${width}-${reducedMotion}-word.png` });
      const middle = await frame(2100); assert.equal(Number(middle.opacity), 0);
      const second = await frame(3200); assert(second.x > first.x + 40);
      assert(Number(second.opacity) > .9);
      await page.screenshot({ path: `${out}/${engine}-${width}-${reducedMotion}-photo.png` });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const button = page.getByRole('button', { name: 'Nu jij', exact: true });
      await button.scrollIntoViewIfNeeded();
      assert(await button.evaluate(el => { const r=el.getBoundingClientRect(); return r.height >= 48 && el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); }));
      const end = await frame(4500); assert.equal(Number(end.opacity), 0);
      assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
      assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), before, 'demonstration records no answer');
      await button.click();
      await page.getByRole('button', { name: 'Kijk nog eens', exact: true }).click();
      assert(await hand.evaluate(el => el.getAnimations()[0].currentTime) < 1000, 'replay restarts');
      await answerActivity(page, exercise, { advance: false, checkFocus: false });
      await page.waitForTimeout(900);
      assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId, 'manual pace preserved');
      assert.equal(await page.evaluate(() => localStorage.getItem('klink.hand-preservation')), 'keep');
      assert.deepEqual(errors, []);
      checks.push({ engine, width, height, reducedMotion, passed: true });
      await page.close();
    }
  } finally { await browser.close(); }
}
writeFileSync(`${out}/checks.json`, JSON.stringify(checks,null,2));
console.log(`${checks.length} mobile/desktop/reduced-motion checks passed`);
