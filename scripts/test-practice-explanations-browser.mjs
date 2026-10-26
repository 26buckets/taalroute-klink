import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_EXPLANATION_OUTPUT || 'outputs/practice-explanations';
mkdirSync(out, { recursive: true });
const names = ['Kijken', 'Herkennen', 'Namaken', 'Zelf maken', 'Gebruiken', 'Herhalen'];
const checks = [];
for (const engine of (process.env.KLINK_TEST_ENGINES || 'chromium,webkit,firefox').split(',')) {
  const browser = await engines[engine].launch(engine === 'firefox' && process.env.FIREFOX_PATH ? { executablePath: process.env.FIREFOX_PATH } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    for (const width of [1366, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 600 ? 740 : 950 });
      await page.goto(`${base}/#learner/home`);
      const cards = page.locator('.cp-practice-line-overview li > button');
      await cards.first().waitFor();
      assert.equal(await cards.count(), 6);
      await page.evaluate(() => localStorage.setItem('klink.explanation-preservation-check', 'keep'));
      const storage = await page.evaluate(() => JSON.stringify(localStorage));
      const url = page.url();
      for (const [index, name] of names.entries()) {
        const card = cards.nth(index);
        await card.scrollIntoViewIfNeeded();
        await card.focus();
        const position = await card.boundingBox();
        await page.keyboard.press(index % 2 ? 'Space' : 'Enter');
        const dialog = page.getByRole('dialog');
        await dialog.waitFor();
        await dialog.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
        assert.equal(await dialog.getAttribute('aria-modal'), 'true');
        assert.equal(await dialog.getByRole('heading').textContent(), name);
        const frame = page.frameLocator('.cp-practice-explanation iframe');
        await frame.locator('#scene svg').waitFor();
        assert.equal(await frame.locator('#title').textContent(), name);
        assert.equal(await frame.locator('#scene').getAttribute('data-time'), '0');
        if (index === 0) {
          for (const key of ['Tab', 'Shift+Tab']) {
            for (let n = 0; n < 12; n++) {
              await page.keyboard.press(key);
              assert(await page.evaluate(() => Boolean(document.activeElement.closest('[role="dialog"]'))), 'keyboard focus stays in the explanation');
            }
          }
        }
        assert(await frame.locator('#scene').evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const box = await dialog.boundingBox();
        assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1);
        assert(box.y + box.height <= page.viewportSize().height + 1);
        await frame.locator('#still').check();
        for (let n = 0; n < 3; n++) await frame.locator('#next').click();
        assert.equal(await frame.locator('#frame').textContent(), '4 / 4');
        assert(await frame.locator('#next').isDisabled());
        assert.equal(await frame.locator('#hand').evaluate(el => getComputedStyle(el).fill), 'rgb(201, 221, 210)');
        if (engine === 'chromium' && width === 1366) await dialog.screenshot({ path: `${out}/step-${index + 1}.png` });
        if (engine === 'chromium' && width === 390 && index === 2) {
          await frame.locator('#previous').click(); await frame.locator('#previous').click();
          await page.screenshot({ path: `${out}/mobile-hand.png` });
        }
        const closedBox = await dialog.boundingBox();
        const summary = frame.locator('.description summary');
        const scrollHeight = await frame.locator('body').evaluate(() => document.documentElement.scrollHeight);
        await summary.focus(); await page.keyboard.press('Enter');
        await frame.locator('#playback[inert]').waitFor({ state: 'attached' });
        const words = frame.locator('#description');
        const wordBox = await words.boundingBox(), summaryBox = await summary.boundingBox();
        const playbackBox = await frame.locator('.manual').boundingBox();
        assert(wordBox.y + wordBox.height <= summaryBox.y + 1, 'words open above the disclosure');
        assert(wordBox.y < playbackBox.y && wordBox.y + wordBox.height > playbackBox.y + playbackBox.height, 'words cover the playback buttons');
        assert.deepEqual(await dialog.boundingBox(), closedBox, 'opening words does not resize the popup');
        assert.equal(await frame.locator('body').evaluate(() => document.documentElement.scrollHeight), scrollHeight, 'opening words does not extend the page');
        await page.keyboard.press('Tab');
        assert(await words.evaluate(el => el === document.activeElement));
        await page.keyboard.press('Tab');
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Uitleg sluiten');
        await page.keyboard.press('Shift+Tab');
        assert(await words.evaluate(el => el === document.activeElement));
        if (engine === 'chromium' && [1366, 390].includes(width) && index === 2) await page.screenshot({ path: `${out}/words-${width}.png` });
        await summary.click();
        await frame.locator('#playback[inert]').waitFor({ state: 'detached' });
        // Only the matching embedded document may request a close.
        await page.evaluate(() => window.postMessage('klink:close-explanation', location.origin));
        assert(await dialog.isVisible());
        if (index % 2) {
          await frame.locator('#previous').focus(); await page.keyboard.press('Escape');
        } else await dialog.getByRole('button', { name: 'Uitleg sluiten' }).click();
        await dialog.waitFor({ state: 'detached' });
        assert(await card.evaluate(el => el === document.activeElement));
        assert.equal(page.url(), url);
        assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), storage);
        assert.deepEqual(await card.boundingBox(), position, 'closing restores the same position');
      }
      checks.push(`${engine} ${width}: six steps, upward words overlay, inert controls, light green hand, keyboard, Escape, focus, unchanged layout and storage`);
    }
    await page.setViewportSize({ width: 1366, height: 950 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.cp-practice-line-overview li > button').nth(1).click();
    const frame = page.frameLocator('.cp-practice-explanation iframe');
    await frame.locator('#scene svg').waitFor();
    assert(await frame.locator('#still').isChecked());
    assert(await frame.locator('.controls').isHidden());
    await frame.locator('#still').uncheck(); await frame.locator('#play').click();
    await frame.locator('#scene').evaluate(el => new Promise(resolve => {
      const observer = new MutationObserver(() => { if (Number(el.dataset.time) > 500) { observer.disconnect(); resolve(); } });
      observer.observe(el, { attributes: true, attributeFilter: ['data-time'] });
    }));
    await frame.locator('.description summary').click();
    await frame.locator('#playback[inert]').waitFor({ state: 'attached' });
    assert(await frame.locator('#pause').isDisabled());
    await frame.locator('.description summary').click();
    const paused = await frame.locator('#scene').getAttribute('data-time');
    await page.waitForTimeout(150);
    assert.equal(await frame.locator('#scene').getAttribute('data-time'), paused);
    await frame.locator('#replay').click();
    assert(Number(await frame.locator('#scene').getAttribute('data-time')) < Number(paused));
    await frame.locator('#play').waitFor({ state: 'visible' });
    await page.waitForTimeout(9300);
    assert.equal(await frame.locator('#scene').getAttribute('data-time'), '9000');
    assert(await frame.locator('#pause').isDisabled());
    await page.getByRole('button', { name: 'Uitleg sluiten' }).click();
    assert.equal(await page.locator('.cp-practice-explanation iframe').count(), 0);
    assert.deepEqual(errors, []);
    checks.push(`${engine}: reduced motion, play/pause/replay, 9 second stop, iframe removed on close, no script errors`);
  } finally { await browser.close(); }
}
writeFileSync(`${out}/checks.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), checks }, null, 2));
console.log(checks.join('\n'));
