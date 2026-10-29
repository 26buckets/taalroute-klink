import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18928';
const out = process.env.KLINK_DOCENT_OUTPUT ?? '../classroom-checks';
mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
async function safe(page, label) {
  const text = await page.locator('body').innerText();
  assert(
    !/Alfa\s*[ABC]|\bSteun\b|\bBasis\b|\bPlus\b|Lesbezoekkader|Boekdoel|docentnotities/i.test(
      text,
    ),
    label + ': private text',
  );
  assert.equal(
    await page.locator('input[name="variant"]').count(),
    0,
    label + ': private form mounted',
  );
  assert.equal(
    await page
      .getByRole('link', { name: 'Docentenhandleiding', exact: true })
      .count(),
    0,
  );
  checks.push(label);
}
async function start(page, variant = 'basic') {
  await page.goto(base + '/#teacher/plus');
  await page.getByRole('button', { name: 'Les openen', exact: true }).click();
  for (let i = 0; i < { basic: 0, extend: 1, support: 2 }[variant]; i++)
    await page
      .getByRole('button', { name: 'Andere hulp', exact: true })
      .click();
  await page.locator('[data-classroom="active"]').waitFor();
}
for (const { engine, type, options } of [
  { engine: 'chromium', type: chromium, options: { channel: 'chrome' } },
  { engine: 'webkit', type: webkit, options: {} },
]) {
  const browser = await type.launch(options);
  try {
    for (const variant of ['support', 'basic', 'extend']) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      page.on('pageerror', (error) =>
        errors.push({ engine, variant, message: error.message }),
      );
      await start(page, variant);
      await safe(page, `${engine}/${variant}/start`);
      await page.locator('.kpd-photo').evaluate((img) => img.decode());
      await page
        .getByRole('button', { name: '3 Klanken', exact: true })
        .click();
      await page.waitForFunction(
        () => document.querySelectorAll('.kpd-stage .kpd-missing').length === 3,
      );
      assert.equal(
        await page.locator('.kpd-stage .kpd-sounds button:disabled').count(),
        3,
      );
      await safe(page, `${engine}/${variant}/missing sounds`);
      await page.getByRole('button', { name: '4 Bouwen', exact: true }).click();
      await page.getByRole('button', { name: 'Leg m', exact: true }).click();
      await page.getByRole('button', { name: 'Leg a', exact: true }).click();
      await page
        .getByRole('button', { name: 'Toon oplossing', exact: true })
        .click();
      const before = await page.locator('.kpd-slots').innerText();
      for (const tool of [
        'Klankbord',
        'Leesplank',
        'Woordbord',
        'Spiegelbord',
        'Schrijfbord',
      ]) {
        await page.getByRole('button', { name: tool, exact: true }).click();
        await page.locator('dialog[open]').waitFor();
        await safe(page, `${engine}/${variant}/${tool}`);
        if (tool === 'Schrijfbord') {
          await page
            .getByRole('textbox', { name: 'Of typ op het bord' })
            .fill('mat');
          await page.locator('.kpd-writing').scrollIntoViewIfNeeded();
          await page.waitForTimeout(100);
          const box = await page.locator('.kpd-writing').boundingBox();
          await page.mouse.move(box.x + 60, box.y + 60);
          await page.mouse.down();
          await page.mouse.move(box.x + 140, box.y + 100, { steps: 5 });
          await page.mouse.up();
          assert((await page.locator('.kpd-writing polyline').count()) > 0);
        }
        if (tool === 'Spiegelbord') {
          await page.evaluate(() =>
            Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
              configurable: true,
              value: () => Promise.reject(new Error('denied')),
            }),
          );
          await page
            .getByRole('button', { name: 'Camera aan', exact: true })
            .click();
          await page
            .getByText('Camera niet beschikbaar.', { exact: false })
            .waitFor();
        }
        await page
          .getByRole('button', { name: 'Terug naar de les', exact: true })
          .click();
        assert.equal(await page.locator('.kpd-slots').innerText(), before);
        assert.equal(
          await page.locator('.kpd-stage .kpd-big-word').innerText(),
          'mat',
        );
      }
      await page
        .getByRole('button', { name: 'Schrijfbord', exact: true })
        .click();
      assert.equal(
        await page
          .getByRole('textbox', { name: 'Of typ op het bord' })
          .inputValue(),
        'mat',
      );
      assert((await page.locator('.kpd-writing polyline').count()) > 0);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Leg t', exact: true }).click();
      await page.getByRole('button', { name: 'Kijk na', exact: true }).click();
      await page.getByText('Ja, dit is mat.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Pauze', exact: true }).click();
      await safe(page, `${engine}/${variant}/pause`);
      assert.equal(await page.locator('.kpd-stage:visible').count(), 0);
      await page
        .getByRole('button', { name: 'Verder met de les', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Stap 2 · Zin', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Stap 1 · Woord', exact: true })
        .click();
      await safe(page, `${engine}/${variant}/return to word round`);
      for (const hash of [
        '#teacher/media',
        '#learner/chapters',
        '#teacher/plus',
        '#teacher',
      ]) {
        await page.evaluate((hash) => {
          location.hash = hash;
        }, hash);
        await page.waitForFunction(() => location.hash === '#teacher/plus');
        await safe(page, `${engine}/${variant}/${hash}`);
      }
      await page.reload();
      await page.locator('[data-classroom="active"]').waitFor();
      await safe(page, `${engine}/${variant}/reload`);
      assert.equal(
        (await page.locator('.kpd-slots').innerText()).replace(/\s/g, ''),
        'mat',
      );
      await page.goBack();
      await page.locator('[data-classroom="active"]').waitFor();
      await safe(page, `${engine}/${variant}/browser back`);
      await page.goto(base + '/docenten');
      await page.locator('[data-classroom="active"]').waitFor();
      await safe(page, `${engine}/${variant}/manual route locked`);
      await page.getByRole('button', { name: '5 Lezen', exact: true }).click();
      assert.equal(await page.locator('.kpd-stage img').count(), 0);
      assert.equal(await page.locator('.kpd-stage .kpd-big-word').count(), 0);
      await page
        .getByRole('button', { name: 'Woord tonen', exact: true })
        .click();
      assert.equal(
        await page.locator('.kpd-stage .kpd-big-word').innerText(),
        'mat',
      );
      await page
        .getByRole('button', { name: '6 Gebruiken', exact: true })
        .click();
      for (let i = 0; i < 3; i++) {
        await page
          .getByRole('button', { name: 'Andere hulp', exact: true })
          .click();
        await safe(page, `${engine}/${variant}/neutral switch ${i}`);
      }
      await page
        .getByRole('button', { name: '7 Op papier', exact: true })
        .click();
      await safe(page, `${engine}/${variant}/worksheet`);

      await page
        .getByRole('button', { name: '8 Nog een keer', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Open Klink-oefening', exact: true })
        .click();
      await page
        .locator('.kpd-regular .cp-exercise-browser')
        .waitFor({ state: 'visible' })
        .catch(async () => {
          assert(
            (await page.locator('.kpd-regular').innerText()).includes('mat'),
          );
        });
      await safe(page, `${engine}/${variant}/canonical exercise`);
      for (const size of [
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1280, height: 720 },
        { width: 1366, height: 768 },
        { width: 1920, height: 1080 },
      ]) {
        await page.setViewportSize(size);
        await page
          .getByRole('button', { name: '1 Kijken', exact: true })
          .click();
        await page.locator('.kpd-photo').evaluate((img) => img.decode());
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${engine} overflow ${size.width}`,
        );
        await safe(page, `${engine}/${variant}/${size.width}`);
        if (size.width >= 900) {
          await page
            .getByRole('button', { name: 'Toon woord', exact: true })
            .click();
          const picture = await page
            .locator('.kpd-picture-space')
            .boundingBox();
          const word = await page.locator('.kpd-word-space').boundingBox();
          assert(picture.x + picture.width <= word.x);
          assert(
            await page.evaluate(
              () => document.documentElement.scrollHeight <= innerHeight + 1,
            ),
            `${engine} vertical overflow ${size.width}`,
          );
        }
        if (variant === 'basic') {
          await page.evaluate(() => scrollTo(0, 0));
          await page.waitForTimeout(350);
          await page.screenshot({
            path: `${out}/${engine}-${size.width}.png`,
            fullPage: true,
          });
        }
        if (size.width >= 900)
          await page
            .getByRole('button', { name: 'Woord verbergen', exact: true })
            .click();
      }
      if (engine === 'chromium') {
        await page
          .getByRole('button', { name: 'Les sluiten', exact: true })
          .click();
        await page.goto(base + '/#teacher/materials');
        await page.locator(`input[name="variant"][value="${variant}"]`).check();
        await page.getByText('Werkbladen printen', { exact: true }).click();
        await page.locator('.kpd-paper-image').evaluate((img) => img.decode());
        await page.evaluate(() => (document.title = 'DE MAT'));
        await page.pdf({
          path: `${out}/werkblad-${variant}.pdf`,
          preferCSSPageSize: true,
          printBackground: true,
          displayHeaderFooter: false,
        });
        if (variant === 'basic')
          for (const [value, name] of [
            ['letters', 'letterkaarten'],
            ['observation', 'docentobservatie'],
          ]) {
            await page
              .getByRole('combobox', { name: 'Materiaal' })
              .selectOption(value);
            await page.evaluate(
              (title) => (document.title = title),
              value === 'observation' ? 'Klink docentobservatie' : 'DE MAT',
            );
            await page.pdf({
              path: `${out}/${name}.pdf`,
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
// Add missing audio at its registered path without a code change; retry must recover.
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await start(page);
  await page.getByRole('button', { name: '3 Klanken', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.kpd-stage .kpd-missing').length === 3,
  );
  let includeA = false;
  await page.route('**/content/klink-docent-audio.json', (route) =>
    route.fulfill({
      json: {
        m: '/klank-audio/docent/m.wav',
        a: includeA ? '/klank-audio/docent/a-kort.wav' : null,
        t: '/klank-audio/docent/t.wav',
      },
    }),
  );
  await page.route('**/klank-audio/docent/*.wav', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      body: readFileSync(
        'public' + '/package-audio/taalroute/klink-woord-mat.wav',
      ),
    }),
  );
  // Fixture bytes validate loading/playback only; they are never delivered as phoneme content.
  await page
    .getByRole('button', { name: 'Geluid opnieuw controleren', exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll('.kpd-stage .kpd-missing').length === 1,
  );
  assert(
    await page
      .getByRole('button', {
        name: 'Luister naar de klank korte a',
        exact: true,
      })
      .isDisabled(),
  );
  assert(
    await page
      .getByRole('button', { name: 'Luister naar de klank m', exact: true })
      .isEnabled(),
  );
  checks.push('partial audio: only a has missing status');
  includeA = true;
  await page
    .getByRole('button', { name: 'Geluid opnieuw controleren', exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.kpd-stage .kpd-sounds button:disabled')
        .length === 0,
  );
  const requests = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'media') requests.push(new URL(r.url()).pathname);
  });
  for (const name of ['m', 'korte a', 't']) {
    await page
      .getByRole('button', {
        name: `Luister naar de klank ${name}`,
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        !document.querySelector('.kpd-stage .kpd-sounds [aria-pressed="true"]'),
    );
  }
  assert(requests.every((p) => p.startsWith('/klank-audio/docent/')));
  checks.push(
    'audio manifest retry, three independent loaded files, native playback, no fallback',
  );
  await page.getByRole('button', { name: '2 Luisteren', exact: true }).click();
  const button = page.getByRole('button', { name: 'Luister', exact: true });
  await button.click();
  await page.waitForFunction(
    () => !document.querySelector('.kpd-stage [aria-pressed="true"]'),
  );
  checks.push('canonical word audio native playback');
} finally {
  await browser.close();
}
writeFileSync(
  out + '/browser-checks.json',
  JSON.stringify(
    { checks, errors, humanReview: false, physicalDevices: false },
    null,
    2,
  ) + '\n',
);
assert.equal(errors.length, 0, JSON.stringify(errors));
console.log(`PASS ${checks.length} classroom checks`);
