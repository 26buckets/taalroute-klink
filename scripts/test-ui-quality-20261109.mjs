import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19215';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/ui-quality-20261109';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const [width, height] of [[1280, 900], [390, 844], [320, 568]]) for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: theme, reducedMotion: 'reduce' });
      page.setDefaultTimeout(25000);
      page.on('pageerror', e => errors.push(e.message));
      const capture = async name => {
        await page.waitForTimeout(150);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ' horizontal overflow');
        if (engine === 'chromium') await page.screenshot({ path: out + '/' + name + '-' + width + '-' + theme + '.png' });
        checks.push({ engine, width, theme, screen: name });
      };
      await page.goto(base + '/#learner/home');
      await page.locator('.cp-home').waitFor();
      assert.equal(await page.locator('.cp-home [data-chapter]').count(), 12);
      await page.evaluate(() => localStorage.setItem('klink.taalroute.attempts.v1', '[{"retained":true}]'));
      await capture('home');
      await page.goto(base + '/#learner/chapters/texts?level=b1&help=practice');
      const forms = page.locator('.cp-chapter-grid [data-chapter-activity]');
      await forms.first().waitFor();
      assert(await forms.first().isEnabled(), 'Available exercise comes first');
      assert(await forms.count() > 1, 'Unavailable forms remain present');
      const order = await forms.evaluateAll(buttons => buttons.map(button => button.disabled));
      assert.deepEqual(order, [...order].sort((a, b) => Number(a) - Number(b)), 'Available forms precede unavailable forms');
      await capture('available-exercises');
      await page.goto(base + '/#learner/words');
      const search = page.getByLabel('Zoek een woord', { exact: true });
      await search.waitFor();
      await page.waitForFunction(() => !document.querySelector('select[aria-label="Niveau"]')?.disabled);
      const details = page.locator('.word-filter-details');
      assert.equal(await details.getAttribute('open'), null);
      assert((await page.locator('.cp-global-word-grid article').first().boundingBox()).y < 460, 'Words visible without a stack of filters');
      await search.fill('mat');
      assert.equal(await page.locator('.cp-global-word-grid article strong').first().innerText(), 'mat');
      await details.locator('summary').click();
      await page.getByLabel('Niveau', { exact: true }).selectOption('a1');
      assert.match(await details.locator('summary').innerText(), /1 gekozen/);
      await details.locator('summary').click();
      assert.equal(await page.getByLabel('Niveau', { exact: true }).inputValue(), 'a1');
      await details.locator('summary').click();
      await page.getByRole('button', { name: 'Wis filters', exact: true }).click();
      assert.equal(await search.inputValue(), 'mat');
      assert.equal(await page.getByLabel('Niveau', { exact: true }).inputValue(), 'all');
      await details.locator('summary').click();
      await capture('word-search');
      const block = functionalBlocks.find(b => b.steps.some(s => s.handwriting));
      const index = block.steps.findIndex(s => s.handwriting);
      await page.evaluate(({ key, id, index }) => localStorage.setItem(key, JSON.stringify({ version: 1, positions: { [id]: index }, records: {} })), { key: functionalStorageKey, id: block.id, index });
      await page.goto(base + '/#learner/alfa-c/' + block.id);
      await page.locator('[data-functional-step="' + block.steps[index].id + '"]').waitFor();
      const before = await page.evaluate(key => localStorage.getItem(key), functionalStorageKey);
      if (width <= 1100) {
        const next = page.getByRole('button', { name: 'Maak de opdracht', exact: true });
        await next.waitFor();
        assert(await next.isEnabled());
        const box = await next.boundingBox();
        assert(box.height >= 44 && box.y + box.height <= height + 1 && box.x + box.width <= width + 1);
        await capture('read-next-step');
        await next.focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('.ac-workspace').getAttribute('data-mobile-view'), 'answer');
        assert(await page.locator('.ac-panel-switch button').last().evaluate(e => e === document.activeElement));
        assert.equal(await page.evaluate(key => localStorage.getItem(key), functionalStorageKey), before, 'Opening task never completes it');
        assert(await page.locator('[data-mobile-continue]').isDisabled(), 'Completion requirement retained');
      }
      await capture('task');
      await page.goto(base + '/#teacher/plus');
      const teacherSearch = page.getByLabel('Zoek een les', { exact: true });
      await teacherSearch.waitFor();
      const count = await page.locator('.kpd-lesson-choice').count();
      assert(count >= 58);
      await teacherSearch.fill(' MAT ');
      assert.equal(await page.locator('.kpd-lesson-choice').count(), 1);
      await capture('teacher-search');
      await page.getByRole('button', { name: 'Les openen: mat', exact: true }).click();
      await page.locator('.kpd-live').waitFor();
      await capture('teacher-lesson');
      if (width <= 600) {
        const footer = await page.locator('.kpd-footer').boundingBox();
        assert(footer.y >= 0 && footer.y + footer.height <= height + 1, 'Lesson navigation visible on mobile');
      }
      await page.getByRole('button', { name: 'Lesoverzicht', exact: true }).click();
      assert.equal(await teacherSearch.inputValue(), ' MAT ', 'Search retained on return');
      await teacherSearch.fill('geen-les-xyz');
      assert.equal(await page.locator('.kpd-lesson-choice').count(), 0);
      await page.getByRole('button', { name: 'Wis zoeken', exact: true }).click();
      assert.equal(await page.locator('.kpd-lesson-choice').count(), count);
      await page.goto(base + '/#teacher/materials');
      await page.getByLabel('Zoek een werkblad', { exact: true }).fill('Mat');
      assert.equal(await page.locator('.kpd-worksheet-lesson').count(), 1);
      await page.getByRole('link', { name: 'Mat · Werkblad', exact: true }).click();
      await page.getByRole('link', { name: 'Alle werkbladen', exact: true }).click();
      assert.equal(await page.getByLabel('Zoek een werkblad', { exact: true }).inputValue(), 'Mat');
      assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), '[{"retained":true}]');
      await page.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({ base, checks, errors }, null, 2));
console.log('PASS', checks.length, 'UI screen checks; search, ordering, keyboard, completion and stored-data checks.');

