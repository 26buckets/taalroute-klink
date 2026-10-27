import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pilotBlocks, pilotStorageKey } from '../lib/alfa-c-practice.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18862';
const out = process.env.KLINK_ALFAC_OUTPUT ?? 'outputs/alfa-c-texts';
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.Audio = class extends EventTarget {
        play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 15); return Promise.resolve(); }
        pause() { clearTimeout(this.timer); }
      };
    });
    await page.goto(base + '/#learner/alfa-c');
    await page.locator('[data-pilot-block]').first().waitFor();
    await page.evaluate(() => localStorage.setItem('klink.taalroute.attempts.v1', '[{"sentinel":true}]'));
    const listen = async () => {
      await page.getByRole('button', { name: 'Luister', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.pilot-tools button')?.textContent === 'Luister');
    };
    for (const block of pilotBlocks) {
      await page.locator(`[data-pilot-block="${block.id}"]`).click();
      for (const [i, step] of block.steps.entries()) {
        const player = page.locator(`[data-pilot-step="${step.id}"]`);
        await player.waitFor();
        const next = page.getByRole('button', { name: 'Verder', exact: true });
        assert(await next.isDisabled());
        const model = page.getByRole('button', { name: 'Nu jij', exact: true });
        if (i > 2) {
          if (!await model.count()) await page.getByRole('button', { name: 'Voorbeeld', exact: true }).click();
          assert.equal(await page.locator('.pilot-model strong').innerText(), step.model);
          assert((await page.locator('.pilot-model').innerText()).includes(step.exampleInstruction));
          assert.equal(await page.locator('.pilot-model .cp-tile-bank').count(), 0);
          await model.click();
          assert.equal(await page.locator('.pilot-instruction p').last().innerText(), step.spokenInstruction);
          await page.getByRole('button', { name: 'Help', exact: true }).click();
          assert.equal(await page.locator('.pilot-help p').innerText(), step.help);
          await page.getByRole('button', { name: 'Help', exact: true }).click();
        } else {
          assert.equal(await page.getByRole('button', { name: 'Help', exact: true }).count(), 0);
          if (i === 0) assert((await player.innerText()).includes(block.startText));
        }
        await listen();
        if (step.exercise.options) {
          const opts = step.exercise.options, right = opts.findIndex(x => step.exercise.answer.correctOptionIds.includes(x.id));
          const buttons = page.locator('.cp-choice-grid > button');
          await buttons.nth((right + 1) % opts.length).click();
          assert((await page.locator('.pilot-footer output').innerText()).includes(step.errorFeedback));
          assert(await next.isDisabled());
          await buttons.nth(right).click();
        } else if (step.exercise.tiles) {
          const ids = step.exercise.answer.targetTileIds;
          const select = async id => {
            const tile = step.exercise.tiles.find(t => t.id === id);
            await page.locator('.cp-tile-bank').getByRole('button', { name: tile.token, exact: true }).click();
          };
          for (const id of [...ids].reverse()) await select(id);
          assert((await page.locator('.pilot-footer output').innerText()).includes(step.errorFeedback));
          assert(await next.isDisabled());
          const slots = page.locator('.cp-build-slots button');
          const oldSlots = await slots.allTextContents();
          await listen();
          assert.deepEqual(await slots.allTextContents(), oldSlots, 'Luister must not silently erase cards');
          if (i === 5) {
            for (let n = 0; n < ids.length; n++) {
              await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
            }
            assert((await slots.allTextContents()).every(x => !x.trim()));
          } else {
            await page.getByRole('button', { name: 'Help', exact: true }).click();
            await page.getByRole('button', { name: 'Voorbeeld', exact: true }).click();
            assert.equal(await page.locator('.pilot-help').count(), 0);
            assert(!(await page.locator('.pilot-footer output').innerText()).includes(step.errorFeedback));
            await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
            assert((await slots.allTextContents()).every(x => !x.trim()));
            assert.equal(await page.locator('.pilot-help').count(), 0);
            assert(!(await page.locator('.pilot-footer output').innerText()).includes(step.errorFeedback));
          }
          for (const id of ids) await select(id);
        }
        assert(await next.isEnabled(), step.id);
        if (i > 2) assert((await page.locator('.pilot-footer output').innerText()).includes(step.goodFeedback));
        if (i < 3) assert((await page.locator('.pilot-footer output').innerText()).includes(step.afterListening));
        if (i === 8) await page.screenshot({ path: `${out}/${engineName}-${block.id}-herstel.png` });
        if (engineName === 'chromium') {
          await page.setViewportSize({ width: 320, height: 568 });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          await next.scrollIntoViewIfNeeded();
          const box = await next.boundingBox();
          assert(box.y >= 0 && box.y + box.height <= 568);
          if (i === 8) await page.screenshot({ path: `${out}/mobile-${block.id}.png` });
          await page.setViewportSize({ width: 1366, height: 900 });
        }
        checks.push({ engine: engineName, step: step.id, correctAfterRetry: i > 2, narrow: engineName === 'chromium' });
        await next.click();
      }
      await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
      assert((await page.locator('.pilot-complete').innerText()).includes(block.endText));
      await page.getByRole('button', { name: 'Kies een ander blok', exact: true }).click();
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), '[{"sentinel":true}]');
    const saved = JSON.parse(await page.evaluate(key => localStorage.getItem(key), pilotStorageKey));
    for (const b of pilotBlocks) for (const s of b.steps) assert.equal(saved.records[s.id].correct, true);
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
assert.equal(checks.length, 72);
fs.writeFileSync(`${out}/browser-checks.json`, JSON.stringify({ checks, errors, audio: 'Simulated existing playback for deterministic interaction checks; native playback checked separately.' }, null, 2));
console.log('PASS 72 steps across Chromium/WebKit, 54 wrong-answer retries, six card resets, all 36 narrow screens and preserved storage.');
