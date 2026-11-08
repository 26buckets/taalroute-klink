import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium, webkit} from 'playwright';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19145';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const out = process.env.KLINK_AUDIO_NATIVE_OUTPUT || 'outputs/audio-bundles/checks/native'; mkdirSync(out, {recursive: true});
const manifest = JSON.parse(readFileSync('outputs/audio-bundles/manifest.json'));
const entries = new Map(manifest.entries.map(row => [row.source, row]));
const checks = [], errors = [];
for (const [engine, type] of Object.entries({chromium, webkit})) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) for (const portal of ['learner', 'teacher']) {
      let fixtureSource;
      for (const mode of ['retained', 'bundle-only-fixture']) {
      const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: width === 390, reducedMotion: 'reduce'});
      const page = await context.newPage(), requests = [];
      if (mode === 'bundle-only-fixture') {
        // Model a newly registered bundle-only recording; the real compiled player stays unchanged.
        await page.route('**/shared-ui-*.js', async route => {
          const response = await route.fetch(), body = await response.text(), marker = '"bundledOnly":[]';
          assert.equal(body.split(marker).length, 2, 'Expected exactly one generated delivery registry');
          await route.fulfill({response, body: body.replace(marker, '"bundledOnly":' + JSON.stringify([fixtureSource]))});
        });
        await page.route('**' + fixtureSource, route => route.abort());
      }
      page.on('pageerror', error => errors.push({engine, width, portal, message: error.message}));
      page.on('response', response => { if (response.url().includes('/audio-bundles/')) requests.push({url: response.url(), status: response.status()}); });
      await page.addInitScript(() => {
        window.__bundled = [];
        window.addEventListener('klink-audio-source', event => {
          const audio = event.detail; audio.muted = true;
          const row = {source: audio.dataset.klinkSource, url: audio.src, rate: audio.playbackRate, ended: false};
          window.__bundled.push(row);
          audio.addEventListener('playing', () => {row.rate = audio.playbackRate;}, {once: true});
          audio.addEventListener('ended', () => {row.ended = true; row.duration = audio.duration;}, {once: true});
          void fetch(audio.src).then(r => r.arrayBuffer()).then(bytes => crypto.subtle.digest('SHA-256', bytes)).then(hash => {
            row.sha256 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
          });
        });
      });
      if (portal === 'teacher') {
        await page.goto(base + '/#teacher/plus');
        await page.getByRole('button', {name: 'Les openen: mat', exact: true}).click();
        await page.getByRole('button', {name: 'Volgende', exact: true}).click();
        const listen = page.getByRole('button', {name: 'Luister', exact: true});
        await listen.click();
      } else {
        await page.goto(base + '/#learner/chapters/sentences/sentences/klink-zinnen-zelf-a1-20261031-r1?level=a1&help=practice');
        const sentence = page.getByText('De kok werkt in de keuken.', {exact: true});
        const point = await sentence.evaluate(element => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const at = node.textContent.indexOf('keuken'); if (at < 0) continue;
            const range = document.createRange(); range.setStart(node, at); range.setEnd(node, at + 6);
            const rect = range.getBoundingClientRect(); return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
          }
          throw Error('Word not found');
        });
        if (width === 390) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
      }
      await page.waitForFunction(() => window.__bundled.some(row => row.ended && row.sha256 && row.duration > 0));
      const played = await page.evaluate(() => window.__bundled.find(row => row.ended && row.sha256));
      if (mode === 'retained') assert.equal(new URL(played.url).pathname, played.source, 'Retained audio streams directly without an index round trip');
      else assert(played.url.startsWith('blob:'), 'Bundle-only audio plays without the unavailable loose file');
      assert.equal(played.rate, .85); assert.equal(played.sha256, entries.get(played.source)?.sha256);
      assert.equal(played.sha256, createHash('sha256').update(readFileSync('public' + played.source)).digest('hex'));
      if (mode === 'retained') assert.equal(requests.length, 0, 'Existing audio requires no bundle/index download');
      else assert(requests.some(row => row.url.endsWith('.bin') && row.status === 200));
      await page.screenshot({path: `${out}/${engine}-${width}-${portal}-${mode}.png`});
      checks.push({engine, width, portal, mode, ...played, exactOriginalBytes: true, nativeEnded: true, requests});
      fixtureSource = played.source;
      await context.close();
      }
    }
  } finally { await browser.close(); writeFileSync(out + '/result.json', JSON.stringify({checks, errors}, null, 2)); }
}
assert.deepEqual(errors, []); assert.equal(checks.length, 16);
console.log('PASS 16 direct and bundle-only UI/native playbacks with original bytes, both browsers, desktop/mobile and Klink/+docent');
