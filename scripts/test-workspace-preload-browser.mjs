import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { workspacePreloads } from './build-workspace-preload.mjs';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_PRELOAD_OUTPUT || 'docs/opening-current-20261106/preload-browser';
mkdirSync(out, { recursive: true });
const paths = workspacePreloads(JSON.parse(readFileSync('dist/client/.vite/manifest.json')));
const rows = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const [hash, selector, blocked] of [
      ['', '.landing-start', false], ['#learner', '.cp-home', false],
      ['#teacher/plus', '.kpd-lesson-choice', false], ['#learner', '.cp-home', true],
    ]) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      if (blocked) await page.route('**/workspace-preload.js', route => route.abort());
      await page.goto(base + '/' + hash, { waitUntil: 'networkidle' });
      await page.locator(selector).first().waitFor();
      const snapshot = () => page.evaluate(() => ({ links: [...document.querySelectorAll('link[rel="modulepreload"]')].map(link => new URL(link.href).pathname), resources: performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, bytes: r.transferSize })) }));
      const cold = await snapshot();
      if (!hash) assert(!cold.resources.some(r => /(?:route-settings|learner-app|staff-apps|practice-source-bank|practice-word-bank)-/.test(r.path)));
      if (hash === '#learner') assert(!cold.resources.some(r => /(?:staff-apps|learner-rounds|teacher-classroom)-/.test(r.path)));
      if (!hash.startsWith('#learner')) assert(!cold.resources.some(r => r.path === '/workspace-preload.js'), 'No extra request outside the learner workspace');
      if (hash.startsWith('#learner') && !blocked) for (const path of paths.learner) {
        assert(cold.links.includes(path), `${engine}: ${path} preloaded`);
        assert.equal(cold.resources.filter(r => r.path === path).length, 1, 'No duplicate module fetch');
      }
      if (!blocked && hash) {
        await page.goto('about:blank');
        await page.goto(base + '/' + hash, { waitUntil: 'networkidle' });
        await page.locator(selector).first().waitFor();
      }
      rows.push({ engine, hash, blocked, cold, warm: !blocked && hash ? await snapshot() : null });
      await context.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({ rows, errors }, null, 2));
console.log(`PASS ${rows.length} landing/workspace/failure cases, with warm visits in both engines`);
