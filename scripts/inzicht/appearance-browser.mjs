import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';
import { base, online } from './browser-auth.mjs';
assert(online);
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const page = await browser.newPage();
  for (const width of [1366, 360])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/inzicht`);
      await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
      await page.evaluate((dark) => {
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', dark);
      }, dark);
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll('header img')).length > 5 &&
          Array.from(document.querySelectorAll('header img')).every(
            (i) => i.complete && i.naturalWidth > 0,
          ),
      );
      const images = await page.locator('header img').evaluateAll((els) =>
        els.map((i) => ({
          source: new URL(i.currentSrc).pathname,
          width: i.naturalWidth,
        })),
      );
      await page.locator('summary[aria-label="Menu"]').click();
      const inzicht = page.getByRole('link', {
        name: 'Klink Inzicht',
        exact: true,
      });
      assert.equal(
        await inzicht.getAttribute('href'),
        'https://inzicht.taalroute.nl/',
      );
      await inzicht.focus();
      assert(await inzicht.evaluate((el) => el === document.activeElement));
      await page.locator('summary[aria-label="Menu"]').click();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert(!overflow);
      await page.screenshot({
        path: `docs/inzicht-20261101/evidence/online/${engine}-login-${width}-${dark ? 'dark' : 'light'}.png`,
        fullPage: true,
      });
      results.push({
        engine,
        width,
        dark,
        all_header_logos_loaded: true,
        no_horizontal_page_overflow: true,
        inzicht_menu_destination_and_keyboard: true,
        images,
      });
    }
  await page.goto(`${base}/inzicht#teacher/plus`);
  await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  assert.equal(
    await page.getByText('Direct kiezen', { exact: true }).count(),
    0,
  );
  // The existing material link opens the real Klink app; do not modify or exercise production.
  await page.locator('summary[aria-label="Menu"]').click();
  await page.route('https://klink.taalroute.nl/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<p>Productiebestemming alleen gecontroleerd.</p>',
    }),
  );
  await page.getByRole('link', { name: 'Klink+docent', exact: true }).click();
  await page.waitForURL('https://klink.taalroute.nl/#teacher/plus');
  await browser.close();
}
writeFileSync(
  'docs/inzicht-20261101/evidence/appearance-browser.json',
  JSON.stringify(results, null, 2),
);
console.log(
  'Both engines: all original header logos, desktop/mobile, light/dark, no page overflow, isolated hash route and correct material destination passed.',
);
