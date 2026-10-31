import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = process.env.KLINK_URL || 'http://127.0.0.1:18981',
  out = process.env.KLINK_DOCENT_OUTPUT || 'outputs/docent-vormgeving-20261031';
fs.mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const size of [
      { width: 1366, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ]) {
      const page = await browser.newPage({ viewport: size });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + '/#learner/home');
      await page.getByLabel('Menu', { exact: true }).click();
      assert.equal(
        await page.getByRole('link', { name: /Oefenoverzicht/ }).count(),
        0,
      );
      await page
        .getByRole('link', { name: 'Klink+docent', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Les openen: mat', exact: true })
        .waitFor();
      assert.equal(await page.locator('.staff-account').count(), 0);
      assert.equal(await page.locator('.kpd-brand').count(), 1);
      await page.locator('.kpd-lesson-choice img').first().evaluate(async (e) => {
        await e.decode();
      });
      await page.screenshot({
        path: `${out}/${engine}-${size.width}-entry.png`,
      });
      await page
        .getByRole('button', { name: 'Werkbladen', exact: true })
        .click();
      await page.locator('label:has(input[name="route"][value="c"])').click();
      assert.equal(
        await page
          .getByRole('button', { name: 'Les openen: mat', exact: true })
          .count(),
        0,
      );
      await page.getByRole('button', { name: 'Lessen', exact: true }).click();
      await page
        .getByRole('button', { name: 'Les openen: mat', exact: true })
        .click();
      await page.locator('[data-classroom="active"]').waitFor();
      assert.equal(await page.locator('.kpd-phases').isVisible(), false);
      assert(await page.locator('.kpd-big-word').isVisible());
      assert.equal(await page.getByRole('button', { name: 'Foto groter', exact: true }).count(), 0);
      await page.screenshot({
        path: `${out}/${engine}-${size.width}-board.png`,
        fullPage: true,
      });
      for (let round = 0; round < 3; round++) {
        await page.locator('.kpd-rounds button').nth(round).click();
        for (let phase = 0; phase < 8; phase++) {
          await page
            .getByRole('button', { name: 'Kies onderdeel', exact: true })
            .click();
          await page.locator('.kpd-phases button').nth(phase).click();
          assert.equal(await page.locator('.kpd-phases').isVisible(), false);
          assert(
            (await page.locator('.kpd-position').innerText()).includes(
              `${phase + 1} van 8`,
            ),
          );
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            `horizontal overflow ${engine} ${size.width} ${round}/${phase}`,
          );
          if (size.width >= 900) {
            const footer = await page.locator('.kpd-footer').boundingBox();
            assert(
              footer.y + footer.height <= size.height + 2,
              `footer clipped ${engine} ${size.width} ${round}/${phase}`,
            );
          }
        }
      }
      await page.locator('.kpd-rounds button').nth(0).click();
      await page
        .getByRole('button', { name: 'Kies onderdeel', exact: true })
        .click();
      await page.locator('.kpd-phases button').nth(3).click();
      await page.getByRole('button', { name: 'Leg m', exact: true }).click();
      const saved = await page.evaluate(() =>
        sessionStorage.getItem('klink.docent.les.v1'),
      );
      await page
        .getByRole('button', { name: 'Hulpmiddelen', exact: true })
        .click();
      for (const name of [
        'Klankbord',
        'Leesplank',
        'Woordbord',
        'Spiegelbord',
        'Schrijfbord',
      ]) {
        await page
          .locator('.kpd-tools')
          .getByRole('button', { name, exact: true })
          .click();
        await page.getByRole('dialog').waitFor();
        await page
          .getByRole('button', { name: 'Terug naar de les', exact: true })
          .click();
        assert.equal(
          await page.evaluate(() =>
            sessionStorage.getItem('klink.docent.les.v1'),
          ),
          saved,
        );
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.kpd-tools').isVisible(), false);
      await page.reload();
      await page.locator('[data-tile-slot="0"]').waitFor();
      assert.equal(await page.locator('[data-tile-slot="0"]').innerText(), 'm');
      await page.getByRole('button', { name: 'Pauze', exact: true }).click();
      assert.equal(await page.locator('.kpd-board').isVisible(), false);
      await page
        .getByRole('button', { name: 'Verder met de les', exact: true })
        .click();
      assert(await page.locator('.kpd-board').isVisible());
      await page
        .getByRole('button', { name: 'Lesoverzicht', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Les openen: mat', exact: true })
        .waitFor();
      checks.push({
        engine,
        ...size,
        phases: 24,
        tools: 5,
        statePreserved: true,
        pause: true,
        menu: true,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
assert.deepEqual(errors, []);
fs.writeFileSync(
  out + '/checks.json',
  JSON.stringify({ checks, errors }, null, 2),
);
console.log(
  'PASS',
  checks.length,
  'classroom journeys, 192 phase views, 40 tools, state/reload, pause, entry and removed menu link',
);
