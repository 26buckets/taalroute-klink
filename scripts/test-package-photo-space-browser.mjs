import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:18996';
const out = 'outputs/word-practice-space';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
const media = new Map();
for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  const browser = await browserType.launch(engine === 'chromium' ? { channel: 'chrome' } : {});
  try {
    for (const [width, height] of [[1600,730],[1366,768],[1366,600],[390,844],[320,568],[740,390]]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: width === 1366 ? 'dark' : 'light' });
      page.on('pageerror', error => errors.push(error.message));
      // A sparse local checkout can use unchanged live media without copying the media library.
      if (process.env.KLINK_TEST_LIVE_MEDIA) await page.route(base + '/**', async route => {
        const url = new URL(route.request().url());
        if (!/^\/(package-|compact-images|opening-loader|taalroute-menu|audio|images|app-covers|fonts)/.test(url.pathname)) return route.continue();
        const key = url.pathname + url.search;
        if (!media.has(key)) media.set(key, (async () => {
          const r = await page.request.get('https://klink.taalroute.nl' + key);
          assert.equal(r.status(), 200, key);
          return { body: await r.body(), contentType: r.headers()['content-type'] };
        })());
        await route.fulfill(await media.get(key));
      });
      await page.addInitScript(() => {
        localStorage.setItem('klink.taalroute.attempts.v1', '[{"existing":true}]');
        window.Audio = class extends EventTarget {
          dataset = {}; paused = true;
          constructor(src) { super(); this.src = src; }
          play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 30); return Promise.resolve(); }
          pause() { clearTimeout(this.timer); this.paused = true; }
        };
      });
      await page.goto(base + '/#learner/package/groep-1');
      await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click();
      await page.locator('[data-activity="listen"]').click();
      await page.locator('.cp-exercise-stage .cp-choice-grid img').first().waitFor();
      await page.locator('.cp-exercise-stage .cp-choice-grid button').last().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.cp-choice-grid img')].filter(e => e.complete && e.naturalWidth > 0).length === 4).catch(async e => { await page.screenshot({path:out+'/failure.png'}); console.log(await page.locator('.cp-choice-grid').innerHTML()); throw e; });
      await page.locator('.learner-main').evaluate(e => e.scrollTop = 0);
      await page.waitForTimeout(200);
      const metrics = await page.evaluate(() => {
        const stage = document.querySelector('.cp-exercise-stage');
        return {
          photos: [...document.querySelectorAll('.cp-choice-grid img')].map(e => ({ height: e.clientHeight, width: e.clientWidth })),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth || document.querySelector('.learner-main').scrollWidth > document.querySelector('.learner-main').clientWidth,
          innerOverflow: stage.scrollHeight > stage.clientHeight + 2,
        };
      });
      assert(metrics.photos.every(p => p.height >= 120 && p.width >= 100), JSON.stringify({ engine, width, metrics }));
      assert(!metrics.horizontalOverflow, 'No horizontal overflow');
      assert(!metrics.innerOverflow, 'Photo choices fit without an inner scrollbar');
      assert(!await page.locator('.cp-tabs').isVisible(), 'Overview tabs make room during the round');
      // Real wheel input over the answers must reach the outer page, even at the stage boundary.
      await page.locator('.cp-choice-grid').hover();
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(350);
      const reach = await page.locator('.cp-exercise-feedback').evaluate(e => ({ bottom: e.getBoundingClientRect().bottom, limit: document.querySelector('.learner-main').getBoundingClientRect().bottom }));
      assert(reach.bottom <= reach.limit + 1, `Feedback reachable by wheel ${engine} ${width}: ${JSON.stringify(reach)}`);
      await page.locator('.learner-main').evaluate(e => e.scrollTop = 0);
      await page.screenshot({ path: `${out}/${engine}-${width}-${height}.png` });
      await page.getByRole('button', { name: 'Op één blad', exact: true }).click();
      assert(await page.locator('.cp-practice-sheet').isVisible());
      await page.getByRole('button', { name: 'Eén voor één', exact: true }).click();
      await page.locator('.cp-exercise-stage .cp-choice-grid img').first().waitFor();
      await page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first().click();
      assert(await page.locator('.cp-tabs').isVisible(), 'Overview navigation returns');
      await page.locator('.cp-tabs').getByRole('button', { name: 'Woorden', exact: true }).click();
      assert(await page.locator('.cp-word-grid').isVisible());
      assert(await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).some(a => a.existing)), 'Existing progress retained');
      checks.push({engine,width,height,...metrics,wheel:true,sheet:true,back:true,progress:true});
      console.log('PASS', engine, width, height);
      await page.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({checks,errors}, null, 2));
