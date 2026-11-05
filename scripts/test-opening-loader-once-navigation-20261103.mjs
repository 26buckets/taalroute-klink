import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19140';
const out = process.env.KLINK_LOADER_OUTPUT || 'docs/opening-loader-once-20261103/navigation';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) for (const target of ['learner', 'teacher/plus']) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage(); page.setDefaultTimeout(45000);
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => { localStorage.setItem('loader-preservation', 'saved progress'); sessionStorage.setItem('loader-preservation', 'saved lesson'); });
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Start met oefenen', exact: true }).waitFor();
      let release;
      const held = new Promise(resolve => { release = resolve; });
      let requests = 0;
      const chunk = target === 'learner' ? 'practice-workspace' : 'teacher-classroom';
      await page.route('**/*', async route => {
        if (new RegExp('/' + chunk + '[.-].*\\.js(?:\\?|$)').test(route.request().url())) { requests++; await held; }
        await route.continue();
      });
      try {
        await page.evaluate(target => { location.hash = target; }, target);
        const logo = page.locator('.klink-opening-loader img');
        await logo.waitFor();
        assert.equal(await logo.getAttribute('src'), '/opening-loader-v4-20261101/klink-static.svg');
        await logo.evaluate(image => image.decode());
        await page.waitForTimeout(2200);
        assert.equal(await logo.getAttribute('src'), '/opening-loader-v4-20261101/klink-static.svg');
        assert(requests > 0, 'Exercise a real delayed lazy module');
        await logo.screenshot({ path: `${out}/${engine}-${width}-${target.replace('/', '-')}.png` });
        release();
        await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
        await page.getByRole('button').first().waitFor();
        assert.equal(await page.evaluate(() => location.hash), '#' + target);
        assert.equal(await page.evaluate(() => localStorage.getItem('loader-preservation')), 'saved progress');
        assert.equal(await page.evaluate(() => sessionStorage.getItem('loader-preservation')), 'saved lesson');
        checks.push({ engine, width, target, delayedModuleRequests: requests, finalFrameKept: true, opens: true, storagePreserved: true });
      } finally { release(); await context.close(); }
    }
  } finally { await browser.close(); writeFileSync(out + '/checks.json', JSON.stringify({ base, checks, errors }, null, 2) + '\n'); }
}
assert.equal(checks.length, 8); assert.deepEqual(errors, []);
console.log('PASS eight real app navigation flows: later loaders stay on the final image, learner/Docent opens, storage retained');
