import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18928';
const out = process.env.KLINK_DOCENT_OUTPUT ?? '../direct-checks';
mkdirSync(out, { recursive: true });
const checks = [];
for (const { name, engine, options } of [
  { name: 'chrome', engine: chromium, options: { channel: 'chrome' } },
  { name: 'webkit', engine: webkit, options: {} },
]) {
  const browser = await engine.launch(options);
  try {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + '/#teacher/materials');
      const saved = await page.evaluate(() =>
        sessionStorage.getItem('klink.docent.les.v1'),
      );
      await page.locator('label:has(input[name="route"][value="c"])').click();
      await page.locator('label:has(input[name="variant"][value="extend"])').click();
      assert.equal(
        await page
          .getByRole('button', { name: 'Les openen', exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem('klink.docent.les.v1'),
        ),
        saved,
      );
      await page.goto(base + '/#teacher/plus');
      assert.equal(await page.locator('input,textarea,select').count(), 0);
      assert(
        !/voorbereid|Alfa|lesplan/i.test(
          await page.locator('main').innerText(),
        ),
      );
      await page
        .getByRole('button', { name: 'Les openen', exact: true })
        .click();
      assert.equal(
        await page.locator('.kpd-rounds [aria-current]').innerText(),
        'Stap 1 · Woord',
      );
      assert.equal(
        await page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem('klink.docent.les.v1')).variant,
        ),
        'basic',
      );
      await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();await page.getByRole('button', { name: '4 Bouwen', exact: true }).click();
      await page.getByRole('button', { name: 'Leg m', exact: true }).click();
      await page.locator('.kpd-rounds button').nth(1).click();
      await page.locator('.kpd-rounds button').nth(0).click();
      assert.equal(await page.locator('[data-tile-slot="0"]').innerText(), 'm');
      await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();
      await page.locator('.kpd-phases button').last().click();
      await page
        .getByRole('button', { name: 'Verder met zin', exact: true })
        .click();
      assert.equal(
        await page.locator('.kpd-rounds [aria-current]').innerText(),
        'Stap 2 · Zin',
      );
      assert(
        (
          await page.locator('.kpd-phases [aria-current]').innerText()
        ).startsWith('1'),
      );
      await page.getByRole('button', { name: 'Vorige', exact: true }).click();
      assert.equal(
        await page.locator('.kpd-rounds [aria-current]').innerText(),
        'Stap 1 · Woord',
      );
      await page
        .getByRole('button', { name: 'Verder met zin', exact: true })
        .click();
      await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();
      await page.locator('.kpd-phases button').last().click();
      await page
        .getByRole('button', { name: 'Verder met tekst', exact: true })
        .click();
      assert.equal(
        await page.locator('.kpd-rounds [aria-current]').innerText(),
        'Stap 3 · Tekst',
      );
      for (let phase = 0; phase < 8; phase++) {
        await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();
      await page.locator('.kpd-phases button').nth(phase).click();
        const reveal = page.getByRole('button', {
          name: phase === 6 ? 'Voorbeeldzin tonen' : 'Tekst tonen',
          exact: true,
        });
        if (await reveal.count()) await reveal.click();
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (viewport.width >= 900) {
          assert(
            await page.evaluate(
              () => document.documentElement.scrollHeight <= innerHeight,
            ),
            `C phase ${phase} scrolls at ${viewport.width}`,
          );
          assert(
            await page.locator('.kpd-stage').evaluate((el) => {
              const stage = el.getBoundingClientRect();
              return [...el.querySelectorAll('button,textarea,p')]
                .filter((x) => x.getClientRects().length)
                .every((x) => {
                  const r = x.getBoundingClientRect();
                  return r.top >= stage.top && r.bottom <= stage.bottom + 1;
                });
            }),
            `C phase ${phase} outside stage at ${viewport.width}`,
          );
        }
      }
      await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();await page.getByRole('button', { name: '4 Bouwen', exact: true }).click();
      assert.equal(await page.locator('.kpd-word-cards button').count(), 7);
      for (const word of ['Ik', 'veeg', 'mijn', 'voeten', 'op', 'de', 'mat.'])
        await page
          .locator('.kpd-word-cards')
          .getByRole('button', { name: word, exact: true })
          .click();
      await page.getByRole('button', { name: 'Kijk na', exact: true }).click();
      assert(
        (await page.locator('.kpd-route-feedback').innerText()).startsWith(
          'Ja,',
        ),
      );
      await page.locator('.kpd-rounds button').nth(1).click();
      await page.locator('.kpd-rounds button').nth(2).click();
      assert.equal(await page.locator('.kpd-sentence-slots button').count(), 7);
      await page.evaluate(() => {
        location.hash = '#teacher/materials';
      });
      await page.waitForFunction(() => location.hash === '#teacher/plus');
      assert.equal(await page.locator('input[name="route"]').count(), 0);
      await page.reload();
      await page.locator('[data-classroom="active"]').waitFor();
      assert.equal(await page.locator('.kpd-sentence-slots button').count(), 7);
      assert(
        !/Alfa|Voorkennis|Lesbezoekkader|Boekdoel/.test(
          await page.locator('main').innerText(),
        ),
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (viewport.width >= 900)
        assert(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
        );
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${out}/${name}-${viewport.width}-tekst.png`,
        fullPage: true,
      });
      await page.getByRole('button', { name: 'Hulpmiddelen', exact: true }).click();
      await page
        .getByRole('button', { name: 'Schrijfbord', exact: true })
        .click();
      await page
        .getByRole('textbox', { name: 'Of typ op het bord' })
        .fill('oude notitie');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();
      await page.locator('.kpd-phases button').last().click();
      await page
        .getByRole('button', { name: 'Les afronden', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Les openen', exact: true })
        .waitFor();
      assert.equal(await page.locator('input,textarea,select').count(), 0);
      await page
        .getByRole('button', { name: 'Les openen', exact: true })
        .click();
      assert.equal(
        await page.locator('.kpd-rounds [aria-current]').innerText(),
        'Stap 1 · Woord',
      );
      await page.getByRole('button', { name: 'Hulpmiddelen', exact: true }).click();
      await page
        .getByRole('button', { name: 'Schrijfbord', exact: true })
        .click();
      assert.equal(
        await page
          .getByRole('textbox', { name: 'Of typ op het bord' })
          .inputValue(),
        '',
      );
      await page.keyboard.press('Escape');
      await page
        .getByRole('button', { name: 'Lesoverzicht', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Les openen', exact: true })
        .waitFor();
      await page.getByRole('button', { name: 'Terug naar Klink', exact: true }).click();
      await page.locator('.hdr001-menu-trigger').click();
      await page.getByRole('link', { name: 'Klink+docent', exact: true }).click();
      await page.getByRole('button', { name: 'Les openen', exact: true }).click();
      await page.getByRole('button', { name: 'Lesoverzicht', exact: true }).click();
      await page.locator('.klink-header-beta').waitFor();
      assert.equal(await page.locator('[data-classroom="active"]').count(), 0);
      assert.deepEqual(errors, []);
      checks.push({
        browser: name,
        viewport,
        directStart: true,
        independentMaterials: true,
        threeRounds: true,
        messageBuild: true,
        resume: true,
        neutralClose: true,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
writeFileSync(out + '/direct-board.json', JSON.stringify(checks, null, 2));
console.log(`PASS ${checks.length} complete direct-board journeys`);
