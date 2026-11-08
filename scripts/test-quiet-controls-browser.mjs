import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_QUIET_OUTPUT || 'docs/quiet-controls-speed-20261106/controls';
const reproduce = process.env.KLINK_QUIET_REPRO === '1';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
async function tapWord(page, selector) {
  const point = await page.locator(selector).evaluate(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const node = walker.nextNode(); const range = document.createRange();
    range.selectNodeContents(node); const rect = range.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (page.viewportSize().width === 390) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}
for (const [engine, type] of Object.entries(reproduce ? { chromium } : { chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of reproduce ? [1280] : [1280, 390]) for (const portal of reproduce ? ['learner'] : ['learner', 'teacher/plus']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({ engine, width, portal, message: error.message }));
      await context.addInitScript(() => {
        window.__quiet = { words: 0, played: 0, activated: 0 };
        window.addEventListener('klink-word-audio-request', () => window.__quiet.words++);
        window.__nativePlay = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play').value;
        HTMLMediaElement.prototype.play = function () {
          if (this.dataset.klinkSource) window.__quiet.played++;
          setTimeout(() => this.dispatchEvent(new Event('ended')), 25);
          return Promise.resolve();
        };
      });
      await page.goto(base + '/#' + portal);
      await page.locator(portal === 'learner' ? '.cp-home' : '.kpd-lesson-choice').first().waitFor();
      await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
      await page.evaluate(() => {
        const root = document.querySelector('.learner-app, .kpd');
        const box = document.createElement('section'); box.id = 'quiet-fixture';
        box.style.cssText = 'position:fixed;inset:90px 8px auto 8px;padding:12px;background:white;color:black;z-index:99999;font:20px sans-serif;max-height:750px;overflow:auto';
        box.innerHTML = '<button data-case="native"><span>doe</span></button> <button data-case="stopped"><strong>keuken</strong></button> <button data-case="disabled" disabled>keuken</button> <div role="button" tabindex="0" data-case="role">keuken</div> <div role="tab" tabindex="0" data-case="tab">keuken</div> <a href="#" data-case="link">keuken</a> <details><summary data-case="summary">keuken</summary><p>tekst</p></details> <label data-case="label">keuken<input type="checkbox"></label><p data-case="text">keu<em>ken</em></p><button class="cp-inline-word" data-case="listen">keuken</button><p data-case="other">mat</p>';
        for (const control of box.querySelectorAll('[data-case]:not(p)')) control.addEventListener('click', event => {
          window.__quiet.activated++;
          if (control.dataset.case === 'link') event.preventDefault();
          if (control.dataset.case === 'stopped') event.stopPropagation();
        });
        box.querySelector('[data-case="listen"]').addEventListener('click', event => {
          window.dispatchEvent(new CustomEvent('klink-inline-word-request', { detail: { element: event.currentTarget } }));
        });
        root.prepend(box);
      });
      const selector = name => `#quiet-fixture [data-case="${name}"]`;
      await tapWord(page, selector('native'));
      await page.waitForTimeout(200);
      if (reproduce) {
        assert.equal(await page.evaluate(() => window.__quiet.words), 1, 'Reproduce automatic reading of the Doe action button');
        checks.push({ engine, width, portal, reproducedOrdinaryButtonSpeech: true });
        await context.close(); continue;
      }
      assert.equal(await page.evaluate(() => window.__quiet.words), 0, 'Ordinary button text must be silent');
      for (const name of ['stopped', 'disabled', 'role', 'tab', 'link', 'summary', 'label']) {
        await tapWord(page, selector(name));
        await page.waitForTimeout(70);
        assert.equal(await page.evaluate(() => window.__quiet.words), 0, `${name}: no generic speech`);
      }
      assert.equal(await page.evaluate(() => window.__quiet.played), 0, 'No unintended audio playback');
      assert(await page.evaluate(() => window.__quiet.activated >= 7), 'Ordinary button actions must still run');
      await tapWord(page, selector('text'));
      await page.waitForFunction(() => window.__quiet.played === 1);
      assert.equal(await page.evaluate(() => window.__quiet.words), 1, 'Plain text remains audible across inline emphasis');
      for (const method of ['pointer', 'Enter']) {
        const before = await page.evaluate(() => window.__quiet.played);
        if (method === 'pointer') await tapWord(page, selector('listen'));
        else { await page.locator(selector('listen')).focus(); await page.keyboard.press('Enter'); }
        await page.waitForFunction(before => window.__quiet.played === before + 1, before);
        await page.waitForTimeout(60);
        assert.equal(await page.evaluate(() => window.__quiet.played), before + 1, 'Explicit listening plays once');
      }
      await page.locator(selector('native')).focus(); await page.keyboard.press('Alt+w');
      for (let i = 0; i < 8; i++) {
        const selected = await page.evaluate(() => Boolean(window.getSelection()?.anchorNode?.parentElement?.closest('button,a,summary,label,[role="button"],[role="tab"]')));
        assert.equal(selected, false, 'Keyboard word browsing excludes all controls');
        await page.keyboard.press('ArrowRight');
      }
      await page.keyboard.press('Escape');
      const before = await page.evaluate(() => window.__quiet.words);
      await page.locator(selector('native')).focus(); await page.keyboard.press('Enter');
      await page.waitForTimeout(70);
      assert.equal(await page.evaluate(() => window.__quiet.words), before, 'Keyboard action buttons stay silent');
      await page.evaluate(() => {
        HTMLMediaElement.prototype.play = window.__nativePlay;
        window.__nativeWords = [];
        window.addEventListener('klink-audio-source', event => {
          const audio = event.detail, result = { native: audio instanceof HTMLAudioElement, started: false, ended: false };
          window.__nativeWords.push(result);
          audio.addEventListener('playing', () => { result.started = true; });
          audio.addEventListener('ended', () => { result.ended = true; result.duration = audio.duration; });
        });
        document.querySelector('#quiet-fixture [data-case="text"]').textContent = 'help';
      });
      for (const name of ['text', 'listen']) {
        const before = await page.evaluate(() => window.__nativeWords.length);
        await tapWord(page, selector(name));
        await page.waitForFunction(before => window.__nativeWords.length === before + 1 && window.__nativeWords.at(-1).native && window.__nativeWords.at(-1).started && window.__nativeWords.at(-1).ended && window.__nativeWords.at(-1).duration > 0, before);
      }
      checks.push({ engine, width, portal, realTextAndExplicitAudioEnded: true, controlsSilent: true, actionsRetained: true, plainTextAudible: true, explicitListeningOnce: true, keyboardBrowseSkipsControls: true });
      await context.close();
    }
  } finally { await browser.close(); writeFileSync(out + '/checks.json', JSON.stringify({ checks, errors }, null, 2)); }
}
assert.deepEqual(errors, []);
console.log('PASS', checks.length, reproduce ? 'original button-audio reproduction' : 'desktop/touch, learner/teacher control-audio scenarios');
