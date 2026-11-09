import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19215';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = 'outputs/ui-quality-20261109/controls';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: width === 320 ? 568 : 900 }, reducedMotion: 'reduce' });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/#learner/chapters/words/meet/groep-1.alfa-a?level=alfa-a&help=practice');
      const listen = page.locator('.cp-listen-slot [data-practice-listen]').first();
      await listen.waitFor();
      await page.waitForTimeout(200);
      assert(await listen.getByText('Luister', { exact: true }).isVisible());
      for (const button of [listen, ...await page.locator('.cp-view-panel button').all()]) {
        assert(await button.evaluate(e => {
          const r = e.getBoundingClientRect();
          const labels = [...e.querySelectorAll('small, .cp-listen-caption')].map(x => x.getBoundingClientRect());
          return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth + 1 &&
            labels.every(t => t.left >= r.left - 1 && t.right <= r.right + 1 && t.top >= r.top - 1 && t.bottom <= r.bottom + 1);
        }), engine + ' ' + width + ' readable label inside touch target');
      }
      const photo = page.locator('[data-view-toggle="photo"]');
      const before = await photo.getAttribute('aria-pressed');
      await page.keyboard.press('Tab'); await photo.focus();
      const focus = await photo.evaluate(e => ({ active: e === document.activeElement, visible: e.matches(':focus-visible'), outline: getComputedStyle(e).outlineStyle, activeName: document.activeElement?.getAttribute('aria-label') }));
      assert(focus.active && focus.visible && focus.outline !== 'none', JSON.stringify({engine, width, focus}));
      await page.keyboard.press('Enter');
      await page.waitForFunction(before => document.querySelector('[data-view-toggle=photo]').getAttribute('aria-pressed') !== before, before);
      await page.keyboard.press('Enter');
      await page.waitForFunction(before => document.querySelector('[data-view-toggle=photo]').getAttribute('aria-pressed') === before, before);
      if (engine === 'chromium') await page.screenshot({ path: out + '/labels-' + width + '.png' });
      await page.locator('.hdr001-menu summary').focus(); await page.keyboard.press('Enter');
      await page.getByRole('group', { name: 'Kleur van menubalk', exact: true }).waitFor();
      await page.locator('[data-appearance-choice="dark"]').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      if (engine === 'chromium' && width === 390) await page.screenshot({ path: out + '/menu-dark.png' });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.hdr001-menu').getAttribute('open'), null);
      assert(await page.locator('.hdr001-menu summary').evaluate(e => e === document.activeElement));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      checks.push({ engine, width, visibleLabels: true, targets: true, keyboardFocus: true, toggleState: true, menuEscape: true });
      await page.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({ checks, errors }, null, 2));
console.log('PASS', checks.length, 'label, touch-target, focus, toggle and menu checks.');

