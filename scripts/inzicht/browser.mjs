import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { base, online, login } from './browser-auth.mjs';
const out = `docs/inzicht-20261101/evidence/${online ? 'online' : 'local'}`;
mkdirSync(out, { recursive: true });
const results = [];
for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page, 'docent');
  await page
    .getByRole('navigation', { name: 'Inzicht', exact: true })
    .waitFor();
  await page.getByRole('link', { name: 'Nieuwe klas', exact: true }).click();
  await page
    .getByLabel('Klasnaam', { exact: true })
    .fill(`Browserproef ${engine}`);
  await page.getByRole('button', { name: 'Klas bewaren', exact: true }).click();
  await page
    .getByRole('heading', { name: `Browserproef ${engine}`, exact: true })
    .waitFor();
  const classUrl = page.url().replace(/\?.*$/, '');
  for (const name of ['Yara', 'Timo', 'Zehra']) {
    await page
      .getByRole('link', { name: 'Cursist toevoegen', exact: true })
      .click();
    await page.getByLabel('Naam', { exact: true }).fill(`${name} (fictief)`);
    await page
      .getByRole('button', { name: 'Cursist bewaren', exact: true })
      .click();
    await page
      .getByRole('heading', { name: `${name} (fictief)`, exact: true })
      .waitFor();
  }
  await page
    .getByRole('link', { name: 'Observeren', exact: true })
    .last()
    .click();
  await page.getByRole('link', { name: 'Algemene vaardigheidsobservatie', exact: true }).click();
  await page
    .getByLabel('Concrete taaksituatie', { exact: true })
    .fill('Kiest een woord uit vier kaarten');
  await page
    .getByLabel('Waargenomen resultaat', { exact: true })
    .selectOption('partial');
  await page
    .getByLabel('Zelfstandigheid', { exact: true })
    .selectOption('hint');
  await page
    .getByRole('button', { name: 'Observatie bewaren', exact: true })
    .click();
  await page
    .getByRole('heading', {
      name: 'Kiest een woord uit vier kaarten',
      exact: true,
    })
    .waitFor();
  await page.reload();
  await page
    .getByRole('heading', {
      name: 'Kiest een woord uit vier kaarten',
      exact: true,
    })
    .waitFor();
  await page
    .getByRole('link', { name: 'Corrigeren met reden', exact: true })
    .click();
  await page
    .getByLabel('Concrete taaksituatie', { exact: true })
    .fill('Kiest na één hint het juiste woord');
  await page
    .getByLabel('Reden voor correctie', { exact: true })
    .fill('Taak nauwkeuriger beschreven');
  await page
    .getByRole('button', { name: 'Observatie bewaren', exact: true })
    .click();
  await page
    .getByRole('heading', {
      name: 'Kiest na één hint het juiste woord',
      exact: true,
    })
    .waitFor();
  await page
    .getByRole('navigation', { name: 'Klas', exact: true })
    .getByRole('link', { name: 'Vaardigheden', exact: true })
    .click();
  await page.getByRole('table').waitFor();
  assert(
    (await page.getByRole('status').allTextContents()).some((x) =>
      x.includes('verwerking'),
    ),
  );
  await page
    .getByRole('button', { name: 'Voortgang bijwerken', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Voortgang bijwerken', exact: true })
    .waitFor({ state: 'detached' });
  const evidenceLink = page.getByRole('link', {
    name: /Zehra.*Letter en klank/,
  });
  await evidenceLink.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Waarom?', exact: true }).waitFor();
  await page
    .getByRole('link', { name: 'Terug naar de matrix', exact: true })
    .click();
  await page.getByRole('table').waitFor();
  await page.screenshot({
    path: `${out}/${engine}-matrix-desktop.png`,
    fullPage: true,
  });
  for (const width of [768, 360, 320]) {
    await page.setViewportSize({ width, height: 950 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `page reflow ${engine}/${width}`,
    );
    await page.screenshot({
      path: `${out}/${engine}-matrix-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page
    .getByRole('navigation', { name: 'Klas', exact: true })
    .getByRole('link', { name: 'Toegang', exact: true })
    .click();
  await page.getByRole('checkbox', { name: 'Alfa B', exact: true }).uncheck();
  await page
    .getByRole('button', {
      name: 'Bekijk impact en cursistaanbod',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: 'Toegang bevestigen', exact: true })
    .click();
  await page.getByText('Toegang opgeslagen.', { exact: true }).waitFor();
  await page
    .getByRole('navigation', { name: 'Klas', exact: true })
    .getByRole('link', { name: 'Opdrachten', exact: true })
    .click();
  await page
    .getByLabel('1. Selecteer oefening', { exact: true })
    .selectOption('word-mat');
  await page
    .getByRole('checkbox', { name: 'Yara (fictief)', exact: true })
    .check();
  await page
    .getByLabel('Instructie voor de cursist', { exact: true })
    .fill('Kies hetzelfde woord.');
  await page
    .getByRole('button', { name: '4. Bekijk cursistvoorbeeld', exact: true })
    .click();
  await page
    .getByRole('button', { name: '5. Opdracht bevestigen', exact: true })
    .click();
  await page.getByText('Opdracht bewaard.', { exact: true }).waitFor();
  await page.goto(`${classUrl}/advies?school=school-a`);
  await page
    .getByRole('button', { name: 'Voorstel bekijken', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Leskeuze goedkeuren', exact: true })
    .waitFor();
  assert(
    (await page.locator('.ki-preview').first().innerText()).includes(
      'Gemeten 0 van 3',
    ),
  );
  await page
    .getByLabel('Mijn leskeuze / aanpassing', { exact: true })
    .fill('Eerst de ontbrekende metingen verzamelen.');
  await page
    .getByRole('button', { name: 'Leskeuze goedkeuren', exact: true })
    .click();
  await page
    .getByText(
      'Leskeuze bewaard. Er zijn geen opdrachten automatisch uitgegeven.',
      { exact: true },
    )
    .waitFor();
  await page.screenshot({
    path: `${out}/${engine}-advice-desktop.png`,
    fullPage: true,
  });
  await page
    .getByLabel('Actieve school', { exact: true })
    .selectOption('school-b');
  await page.getByRole('heading', { name: 'Vandaag', exact: true }).waitFor();
  assert(
    !(await page.locator('.ki-app').innerText()).includes(
      `Browserproef ${engine}`,
    ),
  );
  const stored = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  assert(
    ![...stored.local, ...stored.session].some((k) => k.includes('inzicht')),
    'No learner data cached in browser storage',
  );
  results.push({
    engine,
    teacherFlow: 'passed',
    reflow: [1366, 768, 360, 320],
    schoolSwitch: 'passed',
    browserStorage: 'no inzicht keys',
    pageErrors: errors,
  });
  assert.deepEqual(errors, []);
  await context.close();
  await browser.close();
}
writeFileSync(
  `${out}/browser-results.json`,
  JSON.stringify(
    {
      base,
      at: new Date().toISOString(),
      results,
      humanAssistiveReview: 'OPEN',
    },
    null,
    2,
  ),
);
console.log(
  'Two engines: teacher flow, storage, corrections, matrix, policy, assignment, advice, reflow and school isolation passed.',
);
