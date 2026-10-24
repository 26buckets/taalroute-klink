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
    await page.getByRole('heading', { name: 'Stap voor stap Nederlands leren', exact: true }).waitFor();
    await page.locator('img').evaluateAll(images => Promise.all(images.filter(image => image.checkVisibility()).map(image => image.decode())));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${width}`);
    assert.equal(await page.locator('h1').count(), 1);
    const photo = await page.locator('.entry-visual').boundingBox();
    if (width > 700) assert(Math.abs(photo.width / photo.height - 541 / 350) < .01, `Photo keeps its approved proportions at ${width}`);
    assert(await page.evaluate(() => document.querySelector('.taalroute-header').getBoundingClientRect().bottom <= document.querySelector('.entry-layout').getBoundingClientRect().top), `Header overlaps hero at ${width}`);
    assert.equal(await page.locator('.landing-brand').count(), 0, 'The duplicate logo below the top header is removed');
    const headerLogo = page.locator('.taalroute-header .header-klink-logo');
    const logo = await headerLogo.evaluate(image => {
      const box = image.getBoundingClientRect();
      const header = image.closest('header').getBoundingClientRect();
      return { width: box.width, ratio: box.width / box.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, inside: box.top >= header.top && box.bottom <= header.bottom };
    });
    assert.equal(Math.round(logo.width), width <= 440 ? 55 : 66, 'Use the approved smaller header width');
    assert(Math.abs(logo.ratio - 770 / 340) < 0.01, 'Complete logo with tagline retains its rendered proportions');
    // Responsive srcset density correction rounds natural dimensions to whole pixels.
    assert(Math.abs(logo.naturalWidth - logo.naturalHeight * 770 / 340) <= 770 / 340 + 1, 'Complete asset retains its intrinsic proportions within pixel rounding');
    assert(logo.inside, 'The complete logo fits inside the top header');
    assert(await page.locator('.landing-publisher').innerText() === 'Een leermiddel van');
    assert.equal(await page.locator('.landing-publisher img').getAttribute('alt'), 'Taalroute');
    assert(await page.locator('.landing-alfa').evaluate(element => !!element.closest('footer')));
    assert(await page.locator('.landing-publisher').evaluate(element => !!element.closest('footer')));
    assert.equal(await page.getByRole('heading', { name: 'Onderdeel van Alfabeta+', exact: true }).count(), 1);
    assert.equal(await page.getByRole('heading', { name: 'Oefenen binnen de Z-route', exact: true }).count(), 1);
    const footerAlignment = await page.evaluate(() => {
      const a = document.querySelector('.landing-alfa img').getBoundingClientRect();
      const b = document.querySelector('.landing-publisher img').getBoundingClientRect();
      return { centers: Math.abs(a.y + a.height / 2 - b.y - b.height / 2), separated: a.right < b.left };
    });
    assert(footerAlignment.centers < 1 && footerAlignment.separated, `Footer logos align on one row at ${width}`);
    const placement = await page.evaluate(() => {
      const hero = document.querySelector('.entry-layout').getBoundingClientRect();
      const header = document.querySelector('.taalroute-header').getBoundingClientRect();
      const footer = document.querySelector('.landing-footer').getBoundingClientRect();
      const publisher = document.querySelector('.landing-publisher').getBoundingClientRect();
      return { gap: hero.top - header.bottom, center: hero.x + hero.width / 2, width: innerWidth, publisherBelow: publisher.top >= footer.top && publisher.top > hero.bottom };
    });
    assert(placement.gap >= 12 && placement.gap <= 24, `Hero sits directly below header at ${width}`);
    assert(Math.abs(placement.center - placement.width / 2) < 1, `Hero remains centered at ${width}`);
    assert(placement.publisherBelow, `Publisher belongs at the bottom at ${width}`);

    assert(await page.locator('.landing-start').evaluate(element => element.getBoundingClientRect().height >= 48));
    await page.screenshot({ path: `${out}/Klink-startpagina-${width}.png`, fullPage: true });
    if (width === 1440) await page.screenshot({ path: `${out}/Klink-startpagina-scherm.png` });
  }
  assert.equal(await page.getByRole('link', { name: 'Voor begeleiders', exact: true }).count(), 0);
  await page.getByText('Gebruik en aanschaf', { exact: true }).click();
  assert(await page.locator('.landing-professional-card').nth(1).locator('details').getAttribute('open') !== null);
  assert.equal(await page.getByRole('link', { name: 'Neem contact op met Taalroute' }).getAttribute('href'), 'mailto:info@taalroute.nl?subject=Gebruik%20en%20aanschaf%20van%20Klink');
  await page.getByRole('link', { name: 'Lees over Klink', exact: true }).click();
  await page.getByRole('heading', { name: 'Het idee achter Klink', exact: true }).waitFor();
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.getByText('Gebruik en aanschaf', { exact: true }).click();
  await page.getByRole('button', { name: 'Probeer de oefeningen', exact: true }).click();
  await page.locator('.learner-login').waitFor();
  assert(await page.evaluate(() => scrollY < 10));
  await page.getByRole('button', { name: 'Terug', exact: true }).click();
  await page.getByRole('button', { name: 'Start met oefenen', exact: true }).click();
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
  await page.getByText('Voor docenten en begeleiders', { exact: true }).click();
  await page.getByRole('link', { name: 'Bekijk hoe Klink werkt', exact: true }).click();
  await page.getByRole('heading', { name: 'Docentenhandleiding', exact: true }).waitFor();
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.getByText('Voor docenten en begeleiders', { exact: true }).click();
  await page.getByRole('button', { name: 'Open je omgeving', exact: true }).click();
  await page.locator('.staff-app').waitFor();
  assert(page.url().endsWith('#teacher'));
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/landing-${base.startsWith('https') ? 'live' : 'local'}.json`, JSON.stringify({ base, widths: [1440, 1024, 768, 390, 320], heading: 'Stap voor stap Nederlands leren', publisher: 'Een leermiddel van Taalroute', publisherPlacement: 'footer', hero: 'higher and centered', alfabetaPlacement: 'footer', learner: 'invalid code, valid code and 15 sections checked', teacher: 'manual and existing environment open', organizations: 'explanation, trial entry and contact destination checked; no email sent', errors }, null, 2));
  console.log('PASS landing: five widths, Taalroute publisher, Alfabeta footer, learner and teacher entrances.');
} finally { await browser.close(); }
