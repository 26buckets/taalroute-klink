import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:5196';
const out = process.env.KLINK_MAINTENANCE_OUTPUT || 'outputs/maintenance-review';
const capture = process.argv.includes('--capture-baseline');
const previous = process.env.KLINK_BASELINE_JSON ? JSON.parse(readFileSync(process.env.KLINK_BASELINE_JSON)) : null;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = []; page.on('pageerror', error => errors.push(error.message));
const rows = [];
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/docenten', '/docenten/hoofdstuk-1']) {
      await page.goto(base + route); await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).length), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const geometry = await page.locator('header,main,footer,h1,h2,p,a,button,input,select,img').evaluateAll(elements => elements.filter(element => element.getBoundingClientRect().height > 0).map(element => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100), x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      }));
      if (previous) assert.deepEqual(geometry, previous.find(row => row.width === width && row.route === route).geometry, `${width} ${route}: preserve layout`);
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const violations = scan.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }));
      if (!capture) assert.deepEqual(violations, [], `${width} ${route}: accessibility`);
      if ([1440, 390].includes(width) && route !== '/docenten') await page.screenshot({ path: `${out}/${route === '/' ? 'landing' : 'manual'}-${width}.png`, fullPage: true });
      rows.push({ width, route, geometry, violations });
    }
  }
  if (!capture) {
    const manualChecks = [];
    const chapters = JSON.parse(readFileSync('data/klink-teacher-manual.json'));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const chapter of chapters.slice(1)) {
        await page.goto(base + '/docenten/' + chapter.id); await page.waitForLoadState('networkidle');
        await page.locator('.wiki-article h1').waitFor();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        assert.deepEqual(scan.violations.map(item => item.id), [], `${width} ${chapter.id}`);
        manualChecks.push({ width, chapter: chapter.id, violations: 0 });
      }
    }
    await page.goto(base + '/docenten/onbekend');
    await page.getByRole('heading', { name: 'Onderwerp niet gevonden' }).waitFor();
    await page.getByRole('link', { name: 'overzicht van de handleiding', exact: true }).click();
    await page.waitForURL('**/docenten');
    writeFileSync(`${out}/manual-chapters.json`, JSON.stringify(manualChecks, null, 2));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/docenten/hoofdstuk-1');
    await page.locator('.wiki-pagination a').last().click(); await page.waitForURL('**/docenten/hoofdstuk-2');
    await page.goBack(); await page.waitForURL('**/docenten/hoofdstuk-1');
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('.wiki-mobile-navigation summary').click();
    await page.locator('.wiki-mobile-navigation a[href="/docenten/hoofdstuk-2"]').click();
    await page.waitForURL('**/docenten/hoofdstuk-2');
    assert.equal(await page.locator('.wiki-mobile-navigation').getAttribute('open'), null);
    await page.locator('.manual-back').click(); await page.waitForURL('**/#learner/home');
    await page.locator('.taalroute-header').waitFor();
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/report.json`, JSON.stringify(rows, null, 2));
  console.log(`PASS ${rows.length} responsive layout/accessibility checks; baseline=${capture}; navigation=${!capture}`);
} finally { await browser.close(); }
