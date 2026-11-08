import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {chromium, webkit} from 'playwright';
import {functionalBlocks, functionalStorageKey} from '../lib/alfa-c-functioneel.ts';
import {imageWordRectangle} from '../lib/image-word-listening.ts';
import {recordingForWord, wordRecordingKey} from '../lib/word-listening.ts';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19145';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = 'outputs/audio-start-click-repair/source-click'; mkdirSync(out, {recursive: true});
const block = functionalBlocks.find(block => block.steps.some(step => step.handwriting));
const at = block.steps.findIndex(step => step.handwriting);
const word = JSON.parse(readFileSync('data/klink-image-word-listening.json'))['/alfa-c/handschrift/lesbriefje.png'].words.find(word => word.text === 'map');
const source = wordRecordingKey(recordingForWord('map')), checks = [], errors = [];
for (const [engine, type] of Object.entries({chromium, webkit})) {
  const browser = await type.launch();
  try {
    for (const [width, height] of [[1280, 844], [390, 844], [740, 390], [320, 568]]) for (const colorScheme of ['light', 'dark']) {
      const page = await browser.newPage({viewport: {width, height}, hasTouch: width <= 1100, colorScheme, reducedMotion: 'reduce'});
      page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({key, id, at}) => {
        localStorage.setItem(key, JSON.stringify({version: 1, positions: {[id]: at}, records: {}}));
        window.__sourceAudio = [];
        window.addEventListener('klink-audio-source', event => {
          const audio = event.detail; audio.muted = true;
          const row = {source: audio.dataset.klinkSource, ended: false}; window.__sourceAudio.push(row);
          audio.addEventListener('ended', () => { row.ended = true; }, {once: true});
        });
      }, {key: functionalStorageKey, id: block.id, at});
      await page.goto(base + '/#learner/chapters/alfa-c-paper/sequence/' + block.id + '?level=alfa-c&help=practice');
      const image = page.locator('.ac-handwriting img'); await image.waitFor();
      await page.waitForFunction(() => Number(document.querySelector('.ac-source-viewport')?.dataset.panelHeight) > 40);
      await image.evaluate(image => image.decode());
      const geometry = await image.evaluate(image => ({rect: image.getBoundingClientRect().toJSON(), width: image.naturalWidth, height: image.naturalHeight, fit: getComputedStyle(image).objectFit}));
      const rect = imageWordRectangle(geometry.rect, geometry.width, geometry.height, geometry.fit, word.box);
      const point = {x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2};
      assert(await image.evaluate((image, point) => document.elementFromPoint(point.x, point.y) === image, point));
      const saved = await page.evaluate(key => localStorage.getItem(key), functionalStorageKey);
      if (width <= 1100) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
      await page.waitForFunction(source => window.__sourceAudio.filter(row => row.source === source && row.ended).length === 1, source);
      await page.keyboard.press('Alt+w');
      const announcement = page.locator('output.sr-only[aria-live="polite"]');
      for (let i = 0; i < 60 && !(await announcement.textContent()).startsWith('map.'); i++) await page.keyboard.press('ArrowRight');
      assert((await announcement.textContent()).startsWith('map.'));
      assert.equal(await page.evaluate(() => getSelection().rangeCount), 0, 'Keyboard selection is the image word, not neighbouring text');
      await page.keyboard.press('Space');
      await page.waitForFunction(source => window.__sourceAudio.filter(row => row.source === source && row.ended).length === 2, source);
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), functionalStorageKey), saved);
      await page.screenshot({path: `${out}/${engine}-${width}-${colorScheme}.png`});
      await page.reload(); await image.waitFor();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), functionalStorageKey), saved);
      checks.push({engine, width, height, colorScheme, nativePointerAudio: true, nativeKeyboardAudio: true, progressRetained: true});
      await page.close();
    }
  } finally { await browser.close(); writeFileSync(out + '/checks.json', JSON.stringify({checks, errors}, null, 2)); }
}
assert.deepEqual(errors, []); assert.equal(checks.length, 16);
console.log('PASS 16 real Alfa C image-pointer/keyboard/audio/reload cases');
