import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium, webkit} from 'playwright';
import {functionalBlocks, functionalStorageKey} from '../lib/alfa-c-functioneel.ts';
import {dailyBlocks, dailyStorageKey} from '../lib/alfa-c-dagelijks.ts';
import {functionalAudio, dailyAudio} from '../lib/alfa-c-audio.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19145';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = 'outputs/listen-labels-20261109'; mkdirSync(out, {recursive: true});
const checks = [], errors = [];
const functional = functionalBlocks.find(b => b.steps.some(s => s.handwriting));
const handwriting = functional.steps.findIndex(s => s.handwriting);
const daily = dailyBlocks[0];
for (const [engine, type] of Object.entries({chromium, webkit})) {
  const browser = await type.launch();
  try {
    for (const [width, height] of [[1280, 900], [390, 844], [320, 568], [740, 390]]) for (const colorScheme of ['light', 'dark']) {
      const page = await browser.newPage({viewport: {width, height}, hasTouch: width < 1100, colorScheme, reducedMotion: 'reduce'});
      page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        window.played = [];
        window.addEventListener('klink-audio-source', e => {
          const audio = e.detail; audio.muted = true;
          const row = {src: audio.dataset.klinkSource, ended: false}; window.played.push(row);
          audio.addEventListener('ended', () => {row.ended = true;}, {once: true});
        });
      });
      for (const {kind, block, index, key} of [{kind: 'functional', block: functional, index: handwriting, key: functionalStorageKey}, {kind: 'daily', block: daily, index: 1, key: dailyStorageKey}]) {
        await page.goto(base + '/#learner/home'); await page.locator('.cp-home').waitFor();
        await page.evaluate(({key, id, index}) => localStorage.setItem(key, JSON.stringify({version: 1, positions: {[id]: index}, records: {}})), {key, id: block.id, index});
        await page.goto(base + '/#learner/alfa-c/' + block.id);
        await page.locator(`[data-${kind}-step="${block.steps[index].id}"]`).waitFor();
        const text = page.getByRole('button', {name: 'Tekst horen', exact: true}), guide = page.getByRole('button', {name: 'Uitleg horen', exact: true});
        await text.waitFor(); await guide.waitFor(); await page.waitForTimeout(200);
        for (const control of [text, guide]) {
          assert(await control.locator('span').isVisible());
          assert(await control.evaluate(e => {
            const r = e.getBoundingClientRect(), s = e.querySelector('span').getBoundingClientRect();
            return r.height >= 44 && r.width >= 44 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && s.left >= r.left && s.right <= r.right && s.top >= r.top && s.bottom <= r.bottom && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          }), `${engine} ${width} ${kind}: visible label and full touch target`);
        }
        assert(await page.locator('.ac-support-tools button').evaluateAll(elements => elements.every(e => { const r = e.getBoundingClientRect(); return !r.width || (r.left >= 0 && r.right <= innerWidth); })), 'All toolbar buttons stay inside the screen');
        if (engine === 'chromium') await page.screenshot({path: `${out}/${kind}-${width}-${colorScheme}.png`});
        let nativeAudio = false;
        if (width === 390 && colorScheme === 'light') {
          const step = block.steps[index];
          const source = kind === 'functional' ? functionalAudio('target', step.presentation.find(v => v.kind !== 'previousResponse' && v.kind !== 'audioOnly').text) : dailyAudio(step.audio.O);
          const explanation = kind === 'functional' ? functionalAudio('guide', step.instruction) : dailyAudio(step.audio.I);
          await page.evaluate(() => window.played = []);
          await text.tap(); await page.waitForFunction(src => window.played.some(r => r.src === src && r.ended), source, {timeout: 60000});
          await page.waitForFunction(() => !document.querySelector('[aria-label="Uitleg horen"]').disabled);
          await guide.focus(); await page.keyboard.press('Enter');
          await page.waitForFunction(src => window.played.some(r => r.src === src && r.ended), explanation, {timeout: 60000});
          assert.equal(await page.getByRole('alert').count(), 0);
          await page.getByRole('button', {name: 'Naar de opdracht', exact: true}).click();
          await page.evaluate(() => window.played = []);
          await text.focus(); await page.keyboard.press('Space');
          await page.waitForFunction(src => window.played.some(r => r.src === src && r.ended), source, {timeout: 60000});
          const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
          await page.reload(); await text.waitFor();
          assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key), saved);
          nativeAudio = true;
        }
        checks.push({engine, width, height, colorScheme, kind, visibleLabels: true, nativeAudio});
      }
      for (const block of functionalBlocks) for (const [index, step] of block.steps.entries()) {
        if (!step.dictationTexts.length) continue;
        await page.goto(base + '/#learner/home'); await page.locator('.cp-home').waitFor();
        await page.evaluate(({key, id, index}) => localStorage.setItem(key, JSON.stringify({version: 1, positions: {[id]: index}, records: {}})), {key: functionalStorageKey, id: block.id, index});
        await page.goto(base + '/#learner/alfa-c/' + block.id);
        await page.locator(`[data-functional-step="${step.id}"]`).waitFor();
        await page.locator('.cp-listen-slot button').waitFor();
        await page.waitForTimeout(150);
        for (const model of [false, true]) {
          if (model) { await page.getByRole('button', {name: 'Voorbeeld', exact: true}).click(); await page.waitForFunction(() => [...document.querySelectorAll('.ac-support-tools button')].some(button => button.textContent === 'Voorbeeld' && button.getAttribute('aria-expanded') === 'true')); }
          assert(await page.locator('.ac-support-tools button').evaluateAll(elements => elements.every(e => { const r = e.getBoundingClientRect(); return !r.width || (r.left >= 0 && r.right <= innerWidth && r.height >= 44); })), `${engine} ${width} ${step.id} ${model}: complete toolbar fits`);
          if (engine === 'chromium' && step.id.endsWith('formulier-08')) await page.screenshot({path: `${out}/number-${width}-${colorScheme}-${model ? 'example' : 'task'}.png`});
          checks.push({engine, width, height, colorScheme, kind: 'dictation', step: step.id, model, toolbarFits: true});
        }
      }
      await page.close();
    }
  } finally {await browser.close(); writeFileSync(out + '/labels.json', JSON.stringify({checks, errors}, null, 2));}
}
assert.deepEqual(errors, []); assert.equal(checks.length, 160);
console.log('PASS 160 label/layout/model cases, including 4 native text/instruction/keyboard/reload cases');
