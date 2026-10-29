import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pilotBlocks, pilotStorageKey } from '../lib/alfa-c-practice.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18880';
const out = process.env.KLINK_PHOTOS_OUTPUT ?? '/tmp/klink-herstel-photos';
fs.mkdirSync(out, { recursive: true });
const checks = [], failures = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.Audio = class extends EventTarget { play() { this.t = setTimeout(() => this.dispatchEvent(new Event('ended')), 10); return Promise.resolve(); } pause() { clearTimeout(this.t); } }; });
    await page.goto(base + '/#learner/alfa-c');
    for (const block of pilotBlocks) for (const [index, step] of block.steps.entries()) {
      await page.evaluate(({ key, id, index }) => localStorage.setItem(key, JSON.stringify({ version: 1, positions: { [id]: index }, records: {} })), { key: pilotStorageKey, id: block.id, index });
      await page.goto(base + '/#learner/alfa-c/' + block.id); await page.reload();
      const player = page.locator(`[data-pilot-step="${step.id}"]`); await player.waitFor();
      for (const view of ['task', 'example', 'help']) {
        if (view !== 'task') {
          const control = player.getByRole('button', { name: view === 'example' ? 'Voorbeeld' : 'Help', exact: true });
          if (!await control.count()) continue;
          await control.click();
          await page.waitForFunction(() => !document.querySelector('.ac-support-tools button')?.disabled);
        }
        await player.locator('img').evaluateAll(xs => Promise.all(xs.map(x => x.decode())));
        const bad = await player.evaluate(root => {
          const footer = root.querySelector('.pilot-footer').getBoundingClientRect();
          const main = document.querySelector('.learner-main');
          const bad = [...root.querySelectorAll('.cp-exercise-stage button,.cp-exercise-stage p,.cp-exercise-stage img,.cp-exercise-stage strong')].filter(e => e.checkVisibility()).filter(e => e.getBoundingClientRect().bottom > footer.top + 1 || e.getBoundingClientRect().right > innerWidth + 1).map(e => e.textContent || e.getAttribute('src'));
          if (main.scrollHeight > main.clientHeight + 2 || footer.bottom > innerHeight + 1) bad.push('page overflow');
          return bad;
        });
        checks.push({ engine, id: step.id, view, fit: !bad.length });
        if (bad.length) failures.push({ engine, id: step.id, view, bad });
        if (view === 'task' && step.exercise.wordId) await page.screenshot({ path: `${out}/${engine}-${step.id.replaceAll(':', '-')}.png` });
        if (view === 'example') {
          const yours = player.getByRole('button', { name: 'Nu jij', exact: true });
          if (await yours.count()) await yours.click();
        }
      }
    }
    for (const [width, height] of [[390,844],[320,568],[667,375]]) {
      await page.setViewportSize({width,height});
      await page.goto(base + '/#learner/alfa-c/bus'); await page.reload();
      await page.locator('[data-pilot-step]').waitFor();
      await page.locator('.pilot-footer').scrollIntoViewIfNeeded();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      checks.push({engine,width,height,reflow:true});
    }
  } finally { await browser.close(); }
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify({checks,errors,failures},null,2));
assert.deepEqual(errors, []); assert.deepEqual(failures, []);
console.log(`PASS ${checks.length} word practice and responsive views; all images decoded.`);
