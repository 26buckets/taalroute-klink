import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18928';
const out = process.env.KLINK_DOCENT_OUTPUT ?? '../routes-checks';
mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
async function privacy(page, label) {
  assert(
    !/Alfa\s*[ABC]|Voorkennis|Leerroute|Boekdoel|docentnotities/.test(
      await page.locator('body').innerText(),
    ),
    label,
  );
  assert.equal(
    await page.locator('input[name="route"],input[name="variant"]').count(),
    0,
    label,
  );
  checks.push(label);
}
for (const engine of [
  { name: 'chromium', type: chromium, options: { channel: 'chrome' } },
  { name: 'webkit', type: webkit, options: {} },
]) {
  const browser = await engine.type.launch(engine.options);
  try {
    for (const route of ['a', 'b', 'c'])
      for (const support of ['support', 'basic', 'extend']) {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
          }),
          page = await context.newPage();
        page.on('pageerror', (e) =>
          errors.push({
            engine: engine.name,
            route,
            support,
            error: e.message,
          }),
        );
        await page.goto(base + '/#teacher/plus');
        await page
          .getByRole('button', {
            name: 'Mijn scherm wordt niet gedeeld',
            exact: true,
          })
          .click();
        await page.locator(`input[name="route"][value="${route}"]`).check();
        await page.locator(`input[name="variant"][value="${support}"]`).check();
        if (route !== 'a') {
          assert(
            await page
              .getByRole('button', { name: /^Start de les$|^Les openen$/ })
              .isDisabled(),
          );
          await page
            .getByRole('checkbox', { name: /Ik heb deze woorden/ })
            .check();
        }
        await page
          .getByRole('button', { name: /^Start de les$|^Les openen$/ })
          .click();
        await page.locator('[data-classroom="active"]').waitFor();
        assert.equal(
          await page.locator('h1 .kpd-brand img').getAttribute('src'),
          '/taalroute-menu/klink.svg',
        );
        for (let phase = 0; phase < 8; phase++) {
          await page.locator('.kpd-phases button').nth(phase).click();
          await privacy(
            page,
            `${engine.name}/${route}/${support}/phase ${phase + 1}`,
          );
          if (route !== 'a' && [0, 1, 3, 4, 6, 7].includes(phase)) {
            const show = page.getByRole('button', {
              name: 'Tekst tonen',
              exact: true,
            });
            if (await show.count()) await show.click();
          }
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            'horizontal clipping',
          );
          assert(
            await page.evaluate(
              () => document.documentElement.scrollHeight <= innerHeight + 1,
            ),
            `${route}/${support}/${phase}: scrolling`,
          );
          const geometry = await page.locator('.kpd-stage').evaluate((el) => ({
            box: el.getBoundingClientRect().toJSON(),
            children: [
              ...el.querySelectorAll('button,textarea,.kpd-route-text'),
            ]
              .filter((x) => x.getClientRects().length)
              .map((x) => x.getBoundingClientRect().toJSON()),
          }));
          assert(
            geometry.children.every(
              (r) =>
                r.top >= geometry.box.top &&
                r.bottom <= geometry.box.bottom + 1,
            ),
            `${route}/${support}/${phase}: content outside stage`,
          );
          if (
            engine.name === 'chromium' &&
            support === 'basic' &&
            ((route === 'a' && phase === 0) ||
              (route === 'b' && phase === 3) ||
              (route === 'c' && phase === 5))
          ) {
            await page.waitForTimeout(250);
            await page.screenshot({
              path: `${out}/route-${route}.png`,
              fullPage: true,
            });
          }
        }
        if (route !== 'a') {
          await page.locator('.kpd-phases button').nth(3).click();
          await page
            .getByRole('button', { name: 'Opnieuw', exact: true })
            .click();
          const bank = page.locator('.kpd-word-cards');
          const answer =
            route === 'b'
              ? ['De', 'mat', 'ligt', 'bij', 'de', 'deur.']
              : ['De mat is nat.', 'Leg hem buiten.'];
          await bank
            .getByRole('button', { name: answer.at(-1), exact: true })
            .click();
          await page
            .getByRole('button', { name: 'Kijk na', exact: true })
            .click();
          assert(
            !(await page.locator('.kpd-route-feedback').innerText()).startsWith(
              'Ja,',
            ),
          );
          await page
            .getByRole('button', { name: 'Opnieuw', exact: true })
            .click();
          await bank
            .getByRole('button', { name: answer[0], exact: true })
            .click();
          const order = await page.evaluate(
            () =>
              JSON.parse(sessionStorage.getItem('klink.docent.les.v1')).order,
          );
          for (const tool of [
            'Klankbord',
            'Leesplank',
            'Woordbord',
            'Spiegelbord',
            'Schrijfbord',
          ]) {
            await page.getByRole('button', { name: tool, exact: true }).click();
            await privacy(page, `${engine.name}/${route}/${support}/${tool}`);
            await page.keyboard.press('Escape');
            assert.deepEqual(
              await page.evaluate(
                () =>
                  JSON.parse(sessionStorage.getItem('klink.docent.les.v1'))
                    .order,
              ),
              order,
            );
          }
          for (const part of answer.slice(1))
            await bank.getByRole('button', { name: part, exact: true }).click();
          await page
            .getByRole('button', { name: 'Kijk na', exact: true })
            .click();
          assert(
            (await page.locator('.kpd-route-feedback').innerText()).startsWith(
              'Ja,',
            ),
          );
          await page.reload();
          await page.locator('[data-classroom="active"]').waitFor();
          assert.equal(
            await page.locator('.kpd-sentence-slots button').count(),
            answer.length,
          );
          await privacy(page, `${engine.name}/${route}/${support}/restore`);
          const before = await page.evaluate(
            () =>
              JSON.parse(sessionStorage.getItem('klink.docent.les.v1')).route,
          );
          await page
            .getByRole('button', { name: 'Andere hulp', exact: true })
            .click();
          assert.equal(
            await page.evaluate(
              () =>
                JSON.parse(sessionStorage.getItem('klink.docent.les.v1')).route,
            ),
            before,
          );
          if (route === 'c') {
            await page.locator('.kpd-phases button').nth(5).click();
            await page
              .getByRole('textbox', {
                name: 'Schrijf een kort antwoord.',
                exact: true,
              })
              .fill('De mat ligt buiten.');
            await page
              .getByRole('button', {
                name: 'Bespreek het antwoord',
                exact: true,
              })
              .click();
            await page
              .getByText(
                'Is duidelijk waar de mat nu ligt? Lees je antwoord terug.',
                { exact: true },
              )
              .waitFor();
            await page
              .getByRole('button', { name: 'Woordbord', exact: true })
              .click();
            await page.keyboard.press('Escape');
            assert.equal(
              await page
                .getByRole('textbox', {
                  name: 'Schrijf een kort antwoord.',
                  exact: true,
                })
                .inputValue(),
              'De mat ligt buiten.',
            );
            assert(
              !(
                await page.evaluate(() =>
                  JSON.stringify([
                    Object.values(sessionStorage),
                    Object.values(localStorage),
                  ]),
                )
              ).includes('De mat ligt buiten.'),
            );
            checks.push(
              `${engine.name}/${route}/${support}/response memory only and preserved through tool`,
            );
          }
        }
        if (engine.name === 'chromium' && support === 'basic') {
          await page
            .getByRole('button', { name: 'Les sluiten', exact: true })
            .click();
          await page
            .getByRole('button', {
              name: 'Delen is gestopt · voorbereiding openen',
              exact: true,
            })
            .click();
          await page
            .getByText('Werkbladen voorbereiden', { exact: true })
            .click();
          for (const [kind, name] of [
            ['worksheet', 'werkblad'],
            ['letters', 'kaartjes'],
            ['observation', 'docentobservatie'],
          ]) {
            await page
              .getByRole('combobox', { name: 'Materiaal', exact: true })
              .selectOption(kind);
            await page.evaluate(() => {
              document.title = 'DE MAT';
              document
                .querySelectorAll('img')
                .forEach((i) => (i.loading = 'eager'));
            });
            await page
              .locator('.kpd-print-page img')
              .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
            await page.pdf({
              path: `${out}/${name}-alfa-${route}.pdf`,
              preferCSSPageSize: true,
              printBackground: true,
              displayHeaderFooter: false,
            });
          }
        }
        await context.close();
      }
  } finally {
    await browser.close();
  }
}
writeFileSync(
  out + '/routes-browser.json',
  JSON.stringify(
    { checks, errors, physicalHardware: false, humanReview: false },
    null,
    2,
  ) + '\n',
);
assert.equal(errors.length, 0, JSON.stringify(errors));
console.log(`PASS ${checks.length} route checks`);
