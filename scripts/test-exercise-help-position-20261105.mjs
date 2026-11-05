import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const base = process.env.KLINK_HELP_BASE || 'http://127.0.0.1:19158';
const evidence = process.env.KLINK_HELP_EVIDENCE;
const checks = [];
const routes = {
  help: '/#learner/chapters/spelling/build/groep-1.alfa-a?level=alfa-a&help=practice',
  en: '/#learner/chapters/words/meet/groep-3.alfa-a~words-1?level=alfa-a&help=practice',
};
const enId = 'groep-3:group:meet:woord-klink-woord-en:klink-woord-en:model';
if (evidence) mkdirSync(evidence, { recursive: true });

for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const [width, height] of [[320, 640], [390, 780], [430, 844], [1280, 900]]) {
      const mobile = width < 600;
      const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const open = name => page.getByRole('button', { name, exact: true });
      try {
        await page.goto(base + routes.help);
        const stage = page.locator('.cp-exercise-stage').first();
        const bar = stage.locator(':scope > .cp-exercise-tools');
        const button = bar.getByRole('button', { name: 'Help', exact: true });
        await button.waitFor();
        assert.equal(await open('Help').count(), 1);
        await stage.evaluate(el => { el.scrollTop = 0; });
        const listen = await bar.locator('.cp-listen-slot').boundingBox();
        const photo = await bar.locator('[data-view-toggle="photo"]').boundingBox();
        const text = await bar.locator('[data-view-toggle="text"]').boundingBox();
        const first = await button.boundingBox();
        assert(listen.x < photo.x && photo.x < text.x && text.x < first.x);
        assert(first.width >= 44 && first.height >= 44 && first.x + first.width <= width && first.y >= 0 && first.y + first.height <= height);
        const scrolled = await stage.evaluate(el => { el.scrollTop = el.scrollHeight; return el.scrollTop; });
        const last = await button.boundingBox();
        if (mobile) assert(scrolled >= 30, 'The actual exercise must scroll');
        assert(Math.abs(first.y - last.y) <= 14, 'Help must stay with the top row');
        assert(last.y >= 0 && last.y + last.height <= height);
        await button.click();
        const close = button;
        const panel = bar.locator('.cp-exercise-help-panel');
        assert.equal(await close.getAttribute('aria-expanded'), 'true');
        assert.equal(await close.getAttribute('aria-controls'), await panel.getAttribute('id'));
        assert.equal(await panel.locator('strong').innerText(), 'map');
        const box = await close.boundingBox();
        const photoOpen = await bar.locator('[data-view-toggle="photo"]').boundingBox();
        assert(photoOpen.x < box.x && Math.abs(photoOpen.y - box.y) < 12 && box.x + box.width <= width);
        assert.equal(box.x, first.x, 'Help stays in the same place while open');
        if (evidence && width === 390) await page.screenshot({ path: evidence + '/' + engine + '-help-open.png', animations: 'disabled' });
        await close.click();
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await panel.count(), 0);

        await page.goto(base + routes.en);
        await page.locator('[data-exercise-id*="klink-woord-pen:model"]').waitFor();
        assert.equal(await page.locator('.cp-model-content small').innerText(), 'de pen');
        await page.evaluate(exerciseId => {
          const key = Object.keys(localStorage).find(k => k.startsWith('klink.group.v1:') && k.endsWith(':meet'));
          if (!key) throw Error('No round position found');
          localStorage.setItem(key, JSON.stringify({ version: 1, done: false, exerciseId }));
        }, enId);
        await page.reload();
        await page.locator('[data-exercise-id="' + enId + '"]').waitFor();
        const model = page.locator('.cp-model-content');
        assert.equal(await model.locator('strong').innerText(), 'appel en peer');
        assert.equal(await model.locator('img').getAttribute('alt'), 'appel en peer');
        await model.locator('img').evaluate(img => img.decode());
        assert.equal(await open('Luister naar en').count(), 2);
        await open('Foto verbergen').click();
        assert.equal(await model.locator('strong').innerText(), 'en');
        await open('Foto tonen').click();
        assert.equal(await model.locator('strong').innerText(), 'appel en peer');
        if (evidence && width === 390) await page.screenshot({ path: evidence + '/' + engine + '-appel-en-peer.png', animations: 'disabled' });
        assert.deepEqual(errors, []);
        checks.push({ engine, width, height, scrolled, helpStayedVisible: true, openAndClosePreserved: true, enWithPhoto: true, enWithoutPhoto: true });
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
}
if (evidence) writeFileSync(evidence + '/browser.json', JSON.stringify({ base, physicalPhone: false, checks }, null, 2) + '\n');
console.log('PASS', checks.length, 'Chromium/WebKit screen and behavior checks');
