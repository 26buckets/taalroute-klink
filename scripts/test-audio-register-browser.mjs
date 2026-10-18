import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const requests = [],
  errors = [],
  checks = [];
const out = 'outputs/content-audio-register-20261017';
mkdirSync(out, { recursive: true });
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => {
  if (request.url().includes('/content-register/'))
    requests.push(request.url());
});
const pass = (message) => {
  checks.push(message);
  console.log('PASS', message);
};
await page.addInitScript(() => {
  window.__played = [];
  window.Audio = class extends EventTarget {
    play() {
      window.__played.push(this.src);
      setTimeout(() => this.dispatchEvent(new Event('ended')), 30);
      return Promise.resolve();
    }
    pause() {}
  };
});
try {
  await page.goto(`${base}/#learner/home`);
  await page.locator('.cp-home').waitFor();
  assert.equal(await page.locator('[data-audio-register]').count(), 0);
  assert.equal(requests.length, 0);
  assert.equal(
    await page.locator('.cp-home .cp-package-grid > button').count(),
    15,
  );
  pass(
    'Learner home and all 15 sections preserved; no audio inventory downloaded by learners',
  );
  await page.goto(`${base}/#teacher`);
  await page.locator('.staff-nav').getByRole('button', { name: 'Oefenen', exact: true }).click();
  await page.getByText('Volledige inhoudslijn: van ontwerp naar app', { exact: true }).click();
  assert.equal(await page.locator('[data-learning-areas] tbody tr').count(), 14);
  assert.equal(await page.locator('[data-content-coverage] tbody tr').count(), 26);
  await page
    .locator('.staff-nav')
    .getByRole('button', { name: 'Media', exact: true })
    .click();
  const matrix = page.locator('[data-audio-register]');
  await matrix
    .getByRole('status')
    .filter({ hasText: 'regels gevonden' })
    .waitFor();
  assert.equal(await matrix.locator('tbody tr').count(), 40);
  assert(!requests.some((url) => url.endsWith('/planned.json')));
  await matrix.getByLabel('Audio', { exact: true }).selectOption('missing');
  assert.equal(await matrix.locator('tbody tr').count(), 40);
  assert((await matrix.getByRole('status').innerText()).includes(String(JSON.parse(readFileSync('public/content-register/summary.json')).active.missing)));
  assert.equal(await matrix.locator('tbody button:not(:disabled)').count(), 0);
  await matrix.getByLabel('Audio', { exact: true }).selectOption('parked');
  assert.equal(await matrix.locator('tbody tr').count(), JSON.parse(readFileSync('public/content-register/summary.json')).active.parked);
  assert((await matrix.locator('tbody').innerText()).includes('klink-klank-t'));
  assert.equal(await matrix.locator('tbody button:not(:disabled)').count(), 0);
  pass(
    'All 12 domains shown; missing audio and parked short t never pretend to play',
  );
  await matrix.getByLabel('Audio', { exact: true }).selectOption('all');
  await matrix.getByLabel('Zoek tekst of audio-ID').fill('klink-woord-mat');
  assert.equal(await matrix.locator('tbody tr').count(), 1);
  await matrix.locator('tbody button').click();
  await page.waitForFunction(() => window.__played.length === 1);
  assert(
    (await page.evaluate(() => window.__played[0])).startsWith(
      '/package-audio/',
    ),
  );
  await matrix.getByLabel('Zoek tekst of audio-ID').fill('');
  await matrix.getByLabel('Onderdeel', { exact: true }).selectOption('groep-1');
  assert(
    (await matrix.getByRole('status').innerText()).includes('regels gevonden'),
  );
  pass(
    'Word playback uses the existing recording; search and section filter work',
  );
  await matrix.getByLabel('Omvang').selectOption('planned');
  await matrix
    .getByRole('status')
    .filter({ hasText: '22473 regels' })
    .waitFor();
  assert(requests.some((url) => url.endsWith('/planned.json')));
  assert.equal(
    await matrix.getByLabel('Onderdeel', { exact: true }).count(),
    0,
  );
  assert(
    (await matrix.locator('tbody').innerText()).includes('Nog niet geplaatst'),
  );
  const first = await matrix
    .locator('tbody tr')
    .first()
    .getAttribute('data-audio-id');
  await matrix
    .getByRole('button', { name: 'Volgende pagina', exact: true })
    .click();
  assert.notEqual(
    await matrix.locator('tbody tr').first().getAttribute('data-audio-id'),
    first,
  );
  await matrix.getByLabel('Zoek tekst of audio-ID').fill('zzznietbestaand');
  assert.equal(await matrix.locator('tbody tr').count(), 0);
  assert(
    await matrix
      .getByRole('button', { name: 'Volgende pagina', exact: true })
      .isDisabled(),
  );
  pass(
    'Prepared-script inventory loads on demand, remains unplaced and supports bounded pagination',
  );
  await matrix.getByLabel('Omvang').selectOption('active');
  await matrix.getByLabel('Zoek tekst of audio-ID').fill('');
  await matrix.getByRole('status').filter({ hasText: `${JSON.parse(readFileSync('public/content-register/summary.json')).active.total} regels` }).waitFor();
  await matrix.getByLabel('Audio', { exact: true }).selectOption('parked');
  const instructions = JSON.parse(readFileSync('data/klink-audio-candidates.json')).items;
  for (const item of instructions) {
    await matrix.getByLabel('Zoek tekst of audio-ID').fill(item.id);
    const row = matrix.locator(`tbody tr[data-audio-id="${item.id}"]`);
    assert.equal(await row.count(), 1);
    assert(await row.getByRole('button').isDisabled());
  }
  pass(`${instructions.length} instruction recordings are retained but withdrawn from playback on the owner's request`);
  await matrix.getByLabel('Zoek tekst of audio-ID').fill('');
  await matrix.getByLabel('Audio', { exact: true }).selectOption('all');
  for (const width of [1366, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await matrix.scrollIntoViewIfNeeded();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `No page overflow at ${width}`,
    );
    await page.screenshot({ path: `${out}/matrix-${width}.png` });
  }
  await matrix.getByLabel('Zoek tekst of audio-ID').focus();
  await page.keyboard.type('klink-klank-t');
  let reachedDownload = false;
  for (let tab = 0; tab < 4 && !reachedDownload; tab++) {
    await page.keyboard.press('Tab');
    reachedDownload = await page.evaluate(() => document.activeElement.matches('a[download]'));
  }
  assert(reachedDownload, 'Keyboard can pass the scrollable table and disabled audio controls to reach download');
  assert(!/drive\.google|docs\.google|diglin/i.test(await matrix.innerText()));
  pass(
    'Desktop, tablet, phone and keyboard work; no source links in the interface',
  );
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(
    `${out}/browser-check.json`,
    JSON.stringify({ checks, errors }, null, 2),
  );
  await browser.close();
}
