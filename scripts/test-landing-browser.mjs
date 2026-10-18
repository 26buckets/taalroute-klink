import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:5196';
const out = process.env.KLINK_LANDING_OUTPUT || 'outputs/landing-publication-20261017';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await page.getByRole('heading', { name: 'Klink jij ook?', exact: true }).waitFor();
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${width}`);
    assert.equal(await page.locator('h1').count(), 1);
    assert(await page.evaluate(() => document.querySelector('.entry-appbar').getBoundingClientRect().bottom <= document.querySelector('.entry-layout').getBoundingClientRect().top), `Header overlaps hero at ${width}`);
    assert.equal(await page.locator('.landing-brand').count(), 0, 'The duplicate logo below the top header is removed');
    const headerLogo = page.locator('.taalroute-header .header-klink-logo');
    const logo = await headerLogo.evaluate(image => {
      const box = image.getBoundingClientRect();
      const header = image.closest('header').getBoundingClientRect();
      return { width: box.width, ratio: box.width / box.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, inside: box.top >= header.top && box.bottom <= header.bottom };
    });
    assert.equal(Math.round(logo.width), width <= 440 ? 65 : 78, 'Keep the existing compact header width');
    assert(Math.abs(logo.ratio - 770 / 340) < 0.01, 'Complete logo with tagline retains its rendered proportions');
    // Responsive srcset density correction rounds natural dimensions to whole pixels.
    assert(Math.abs(logo.naturalWidth - logo.naturalHeight * 770 / 340) <= 770 / 340 + 1, 'Complete asset retains its intrinsic proportions within pixel rounding');
    assert(logo.inside, 'The complete logo fits inside the top header');
    assert(await page.locator('.landing-publisher').innerText() === 'Een leermiddel van');
    assert.equal(await page.locator('.landing-publisher img').getAttribute('alt'), 'Taalroute');
    assert(await page.locator('.landing-alfa').evaluate(element => !!element.closest('footer')));
    assert(await page.locator('.landing-start').evaluate(element => element.getBoundingClientRect().height >= 48));
    await page.screenshot({ path: `${out}/Klink-startpagina-${width}.png`, fullPage: true });
    if (width === 1440) await page.screenshot({ path: `${out}/Klink-startpagina-scherm.png` });
  }
  await page.getByRole('link', { name: 'Voor begeleiders', exact: true }).click();
  await page.getByText('Bekijk de mogelijkheden', { exact: true }).click();
  assert(await page.locator('details').getAttribute('open') !== null);
  await page.getByRole('button', { name: 'Open de oefeningen', exact: true }).click();
  await page.locator('.learner-login').waitFor();
  assert(await page.evaluate(() => scrollY < 10));
  await page.getByRole('button', { name: 'Terug', exact: true }).click();
  await page.getByRole('button', { name: 'Open je lessen', exact: true }).click();
  await page.locator('.learner-login').waitFor();
  await page.getByRole('textbox').first().fill('FOUT');
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await page.getByRole('textbox').first().fill('ALFA1');
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.locator('.cp-home').waitFor();
  assert.equal(await page.locator('.cp-package-grid > button').count(), 15);
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Naar de docentomgeving', exact: true }).click();
  await page.locator('.staff-app').waitFor();
  assert(page.url().endsWith('#teacher'));
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/landing-${base.startsWith('https') ? 'live' : 'local'}.json`, JSON.stringify({ base, widths: [1440, 1024, 768, 390, 320], heading: 'Klink jij ook?', publisher: 'Een leermiddel van Taalroute', alfabetaPlacement: 'footer', learner: 'invalid code, valid code and 15 sections checked', teacher: 'existing environment opens', therapists: 'details and exercise entry checked', errors }, null, 2));
  console.log('PASS landing: five widths, Taalroute publisher, Alfabeta footer, learner and teacher entrances.');
} finally { await browser.close(); }
