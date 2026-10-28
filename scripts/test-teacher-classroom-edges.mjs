import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18928';
const out = process.env.KLINK_DOCENT_OUTPUT ?? '../classroom-checks';
const checks = [];
const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  ],
});
async function start(page) {
  await page.goto(base + '/#teacher/plus');
  await page.getByRole('button', { name: 'Les openen', exact: true }).click();
  await page.locator('[data-classroom="active"]').waitFor();
}
async function safe(page) {
  assert(
    !/Alfa\s*[ABC]|\bSteun\b|\bBasis\b|\bPlus\b|docentnotities/i.test(
      await page.locator('body').innerText(),
    ),
  );
}
try {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 960 },
    permissions: ['camera'],
  });
  const page = await context.newPage();
  await start(page);
  await page.getByRole('button', { name: '4 Bouwen', exact: true }).click();
  const cdp = await context.newCDPSession(page);
  async function drag(letter, slot) {
    const source = await page
      .getByRole('button', { name: `Leg ${letter}`, exact: true })
      .boundingBox();
    const target = await page
      .locator(`[data-tile-slot="${slot}"]`)
      .boundingBox();
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: source.x + source.width / 2, y: source.y + source.height / 2 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: target.x + target.width / 2, y: target.y + target.height / 2 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  }
  await drag('t', 0);
  await drag('m', 2);
  assert.equal(await page.locator('[data-tile-slot="0"]').innerText(), 't');
  assert.equal(await page.locator('[data-tile-slot="2"]').innerText(), 'm');
  await page.getByRole('button', { name: 'Kijk na', exact: true }).tap();
  await page
    .getByText('Kijk naar de eerste klank. Probeer de letters opnieuw.', {
      exact: true,
    })
    .waitFor();
  await page.getByRole('button', { name: 'Opnieuw', exact: true }).tap();
  assert.equal((await page.locator('.kpd-slots').innerText()).trim(), '');
  const letter = page.getByRole('button', { name: 'Leg m', exact: true });
  await letter.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-tile-slot="0"]').innerText(), 'm');
  checks.push(
    'native touch drag to distinct slots, wrong-order hint, local reset, keyboard placement',
  );
  await page
    .getByRole('button', { name: 'Toon oplossing', exact: true })
    .click();
  assert.equal(
    (await page.locator('.kpd-slots').innerText()).replace(/\s/g, ''),
    'mat',
  );
  await page
    .getByRole('button', { name: 'Oplossing verbergen', exact: true })
    .click();
  assert.equal(
    (await page.locator('.kpd-slots').innerText()).replace(/\s/g, ''),
    'm',
  );
  checks.push(
    'solution fills the three slots; hiding restores the original partial work',
  );
  const mirror = page.getByRole('button', { name: 'Spiegelbord', exact: true });
  await mirror.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Camera aan', exact: true }).click();
  await page.getByRole('button', { name: 'Camera uit', exact: true }).waitFor();
  await page.evaluate(
    () =>
      (window.testCameraTracks = document
        .querySelector('video[aria-label="Spiegelbeeld van de camera"]')
        .srcObject.getTracks()),
  );
  assert(
    await page.evaluate(() =>
      window.testCameraTracks.every((t) => t.readyState === 'live'),
    ),
  );
  await page.keyboard.press('Escape');
  assert(
    await page.evaluate(() =>
      window.testCameraTracks.every((t) => t.readyState === 'ended'),
    ),
  );
  assert(await mirror.evaluate((el) => el === document.activeElement));
  checks.push(
    'camera consent, synthetic stream starts, Escape stops all tracks and returns focus',
  );
  for (const zoom of [1, 1.25, 1.5]) {
    await page.evaluate(
      (value) => (document.documentElement.style.zoom = String(value)),
      zoom,
    );
    await page.getByRole('button', { name: '1 Kijken', exact: true }).click();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await safe(page);
  }
  checks.push('100/125/150% CSS zoom at 1280x960, no horizontal clipping');
  await context.setOffline(true);
  await page.getByRole('button', { name: '4 Bouwen', exact: true }).click();
  await page.getByRole('button', { name: 'Leg a', exact: true }).click();
  assert.equal(await page.locator('[data-tile-slot="1"]').innerText(), 'a');
  await safe(page);
  checks.push('loaded lesson continues offline without losing tiles');
  await context.close();
  const damaged = await browser.newContext();
  const bad = await damaged.newPage();
  await bad.addInitScript(() =>
    sessionStorage.setItem('klink.docent.les.v1', '{}'),
  );
  await bad.goto(base + '/#teacher');
  await bad.locator('[data-classroom="active"]').waitFor();
  await safe(bad);
  checks.push('damaged saved object fails closed even on teacher route');
  await damaged.close();
  const blocked = await browser.newContext();
  const bp = await blocked.newPage();
  await bp.addInitScript(() => {
    // Originals are called below with their original receiver.
    /* oxlint-disable typescript/unbound-method */
    const originalGet = Storage.prototype.getItem,
      originalSet = Storage.prototype.setItem;
    /* oxlint-enable typescript/unbound-method */
    Storage.prototype.getItem = function (k) {
      if (k === 'klink.docent.les.v1') throw Error('blocked');
      return originalGet.call(this, k);
    };
    Storage.prototype.setItem = function (k, v) {
      if (k === 'klink.docent.les.v1') throw Error('blocked');
      return originalSet.call(this, k, v);
    };
  });
  await start(bp);
  await bp.evaluate(() => (location.hash = '#teacher'));
  await bp.waitForFunction(() => location.hash === '#teacher/plus');
  await safe(bp);
  await bp.reload();
  await bp
    .getByRole('button', {
      name: 'Les openen',
      exact: true,
    })
    .waitFor();
  await safe(bp);
  checks.push(
    'blocked storage keeps active session protected; reload returns neutral gate',
  );
  await blocked.close();
  const failed = await browser.newContext();
  const fp = await failed.newPage();
  await fp.route('**/package-audio/taalroute/klink-woord-mat.wav', (r) =>
    r.abort(),
  );
  await start(fp);
  await fp.getByRole('button', { name: '2 Luisteren', exact: true }).click();
  await fp.locator('.kpd-stage .kpd-missing').waitFor();
  assert(await fp.locator('.kpd-stage button:has(.kpd-missing)').isDisabled());
  await safe(fp);
  checks.push(
    'failed whole-word media disables its control; lesson remains usable',
  );
  await failed.close();
} finally {
  await browser.close();
}
mkdirSync(out, { recursive: true });
writeFileSync(
  out + '/edge-checks.json',
  JSON.stringify(
    { checks, physicalHardware: false, zoom: 'CSS zoom simulation' },
    null,
    2,
  ) + '\n',
);
console.log(`PASS ${checks.length} edge scenarios`);
