import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { base, online, login } from './browser-auth.mjs';
assert(online);
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const page = await browser.newPage();
  await login(page, 'docent');
  await page.getByRole('link', { name: 'Nieuwe klas', exact: true }).click();
  await page.waitForURL((u) => u.pathname.includes('nieuw'));
  await page.getByRole('button', { name: 'Afmelden', exact: true }).click();
  await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  await page.goBack();
  try {
    await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  } catch (e) {
    console.log(
      engine,
      page.url(),
      (await page.locator('body').innerText()).slice(0, 1000),
    );
    throw e;
  }
  assert.equal(
    await page.getByLabel('Actieve school', { exact: true }).count(),
    0,
  );
  assert.equal(
    (await page.request.get(base + '/api/inzicht/me')).status(),
    401,
  );
  await page.goForward();
  await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  await page.reload();
  await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  await login(page, 'beheerder');
  assert.equal(
    (
      await page.request.get(base + '/api/inzicht/classes?school=school-a')
    ).status(),
    403,
  );
  const stored = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  assert(
    ![...stored.local, ...stored.session].some((k) => k.includes('inzicht')),
  );
  await page.getByRole('button', { name: 'Afmelden', exact: true }).click();
  await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  results.push({
    engine,
    logout_revoked: true,
    back_forward_reload: 'login only',
    next_admin: 'no school dossiers',
    browser_storage: 'no school data',
  });
  await browser.close();
}
writeFileSync(
  'docs/inzicht-20261101/evidence/shared-device.json',
  JSON.stringify(results, null, 2),
);
console.log(
  'Both engines: logout, back/forward/reload and next-account dossier isolation passed.',
);
