import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { base, online, login } from './browser-auth.mjs';
assert(online);
const result = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__kiInjected = 0;
  });
  await login(page, 'docent');
  await page.getByRole('link', { name: 'Nieuwe klas', exact: true }).click();
  await page
    .getByLabel('Klasnaam', { exact: true })
    .fill(`Tekstcontrole ${engine} ${Date.now()}`);
  await page.getByRole('button', { name: 'Klas bewaren', exact: true }).click();
  await page
    .getByRole('link', { name: 'Cursist toevoegen', exact: true })
    .waitFor();
  const group = new URL(page.url()).pathname.split('/')[3];
  await page
    .getByRole('link', { name: 'Cursist toevoegen', exact: true })
    .click();
  const name = '=HYPERLINK("https://example.invalid","Fictief")';
  await page.getByLabel('Naam', { exact: true }).fill(name);
  await page
    .getByRole('button', { name: 'Cursist bewaren', exact: true })
    .click();
  await page.getByRole('heading', { name, exact: true }).waitFor();
  await page
    .getByRole('link', { name: 'Observeren', exact: true })
    .last()
    .click();
  const situation = '<img src=x onerror="window.__kiInjected=1">';
  const note =
    '<script>window.__kiInjected=2</script> =HYPERLINK("https://example.invalid")';
  await page.getByRole('link', { name: 'Algemene vaardigheidsobservatie', exact: true }).click();
  await page
    .getByLabel('Concrete taaksituatie', { exact: true })
    .fill(situation);
  await page.getByText('Meer details', { exact: true }).click();
  await page
    .getByLabel('Didactische opmerking (optioneel)', { exact: true })
    .fill(note);
  await page
    .getByRole('button', { name: 'Observatie bewaren', exact: true })
    .click();
  await page.getByRole('heading', { name: situation, exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: situation, exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__kiInjected), 0);
  assert.equal(await page.locator('.ki-app img[src="x"]').count(), 0);
  assert.equal(await page.locator('.ki-app script').count(), 0);
  const csv = await page.request.get(
    `${base}/api/inzicht/classes/${group}/export?school=school-a`,
  );
  assert.equal(csv.status(), 200);
  assert.match(csv.headers()['content-disposition'], /^attachment/);
  assert((await csv.text()).includes('"\'=HYPERLINK'));
  const report = await page.request.get(
    `${base}/api/inzicht/classes/${group}/report?school=school-a`,
  );
  assert.equal(report.status(), 200);
  assert.match(report.headers()['content-type'], /application\/json/);
  assert.match(report.headers()['content-disposition'], /^attachment/);
  const data = await report.json();
  assert(data.revisions.some((r) => JSON.parse(r.payload).note === note));
  assert(!JSON.stringify(data).includes('password_hash'));
  await page.getByRole('button', { name: 'Afmelden', exact: true }).click();
  await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  result.push({
    engine,
    stored_html_rendered_as_text: true,
    no_script_or_handler_execution: true,
    csv_formula_prefixed: true,
    json_attachment_preserves_original: true,
  });
  await browser.close();
}
writeFileSync(
  'docs/inzicht-20261101/evidence/security-browser.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      results: result,
      scope:
        'Targeted stored HTML/script/CSV cases, not an independent penetration test',
    },
    null,
    2,
  ),
);
console.log(
  'Two browsers: stored HTML/script remains text after reload; CSV formula and JSON report exports are safe for the tested payloads.',
);
