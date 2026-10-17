import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/card-layout-audio-rate-20261017';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
async function openWords(page, url, role) {
  await page.goto(`${url}/#${role === 'teacher' ? 'teacher' : 'learner/home'}`);
  if (role === 'teacher') await page.locator('.cp-teacher-package-cards button').first().click();
  else await page.locator('.cp-package-grid > button').first().click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Woorden', exact: true }).click();
  await page.locator('.cp-word-grid img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.evaluate(() => document.fonts.ready);
}
async function styles(page) {
  return page.locator('.cp-word-grid article').first().evaluate(card => Object.fromEntries([
    ['.cp-package-word-listen', ['display', 'padding', 'textAlign']],
    ['.cp-word-image', ['aspectRatio', 'padding']],
    ['.cp-word-image img', ['objectFit']],
    ['.cp-word-copy strong', ['fontSize', 'fontWeight', 'lineHeight']],
    ['.cp-listen-label', ['display', 'fontSize', 'padding']],
    ['.cp-save-button', ['width', 'height', 'fontSize', 'borderRadius']],
  ].map(([selector, properties]) => [selector, Object.fromEntries(properties.map(key => [key, getComputedStyle(card.querySelector(selector))[key]]))])));
}
try {
  const live = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await openWords(live, 'https://klink.taalroute.nl', 'learner');
  const baseline = await styles(live);
  await live.screenshot({ path: `${out}/online-reference.jpg`, type: 'jpeg', quality: 70 });
  await live.close();
  for (const role of ['learner', 'teacher']) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await openWords(page, base, role);
    assert.deepEqual(await styles(page), baseline, `${role}: preserve approved live learner-card style`);
    for (const width of [1366, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.locator('.cp-word-grid article').evaluateAll(cards => cards.map(card => {
        const bounds = card.getBoundingClientRect();
        const inside = rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1;
        const nodes = [...card.querySelectorAll('.cp-save-button, .cp-save-button span, .cp-save-button svg, .cp-word-copy, .cp-listen-label svg')];
        const save = card.querySelector('.cp-save-button').getBoundingClientRect();
        return { inside: nodes.every(node => inside(node.getBoundingClientRect())), saveWidth: save.width, saveHeight: save.height, word: card.querySelector('strong').textContent };
      }));
      assert(geometry.every(card => card.inside && card.saveWidth >= 48 && card.saveHeight >= 48), `${role} ${width}: clipped card controls`);
      checks.push({ role, width, cards: geometry.length, matchesOnlineStyle: true, containedControls: true });
      if (width === 1366 || width === 390) await page.screenshot({ path: `${out}/${role}-${width}.jpg`, type: 'jpeg', quality: 70 });
    }
    if (role === 'learner') {
      const save = page.locator('.cp-save-button').first();
      await save.click(); assert.equal(await save.getAttribute('aria-pressed'), 'true');
      await save.click(); assert.equal(await save.getAttribute('aria-pressed'), 'false');
    }
    await page.locator('.cp-tabs').getByRole('button', { name: 'Foto en geluid', exact: true }).click();
    assert.equal(await page.locator('.cp-word-grid .cp-save-button').count(), 0);
    assert(await page.locator('.cp-word-grid .cp-package-word-listen').evaluateAll(buttons => buttons.every(button => getComputedStyle(button).display === 'block' && getComputedStyle(button.querySelector('.cp-listen-label')).display === 'flex')));
    await page.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/card-checks.json`, JSON.stringify({ baseline, checks, errors }, null, 2));
  console.log('Live card style retained; teacher and learner controls fit at four widths; saving still works.');
} finally { await browser.close(); }
