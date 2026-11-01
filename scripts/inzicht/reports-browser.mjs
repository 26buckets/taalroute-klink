import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { base, login, logoutSessions } from './browser-auth.mjs';
const out = 'docs/inzicht-20261101/evidence/visual';
mkdirSync(out, { recursive: true });
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await login(page, 'docent');
    await page
      .getByRole('navigation', { name: 'Inzicht', exact: true })
      .waitFor();
    const res = await page.request.get(
      `${base}/api/inzicht/classes?school=school-a`,
    );
    assert.equal(res.status(), 200);
    const classes = await res.json();
    const group = classes.find((c) => c.learners_count > 0);
    assert(group);
    const url = `${base}/inzicht/klassen/${group.id}`;
    await page.goto(`${url}/observeren?school=school-a`);
    await page
      .getByRole('heading', { name: 'Observatie', exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Woord', exact: true }).click();
    await page
      .getByRole('button', { name: 'Nieuwe observatie', exact: true })
      .click();
    const field = page.getByRole('group', {
      name: 'Betekenis tonen',
      exact: true,
    });
    await field
      .getByRole('radio', { name: 'Zonder directe hulp', exact: true })
      .check();
    await page
      .getByRole('status')
      .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
      .waitFor();
    await page
      .getByLabel('Niveaudoel van de taak (geen cursistniveau)', {
        exact: true,
      })
      .selectOption('Alfa A');
    await page
      .getByRole('status')
      .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
      .waitFor();
    await page
      .getByLabel('Afnameconditie / vergelijkbare taakreeks', { exact: true })
      .fill('Browserproef identieke taak');
    await page
      .getByRole('status')
      .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
      .waitFor();
    await page
      .getByRole('group', { name: 'Nazeggen', exact: true })
      .getByRole('radio', { name: 'Met hulp of model', exact: true })
      .check();
    await page
      .getByRole('status')
      .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
      .waitFor();
    await page
      .getByRole('group', { name: 'Klanken aanwijzen', exact: true })
      .getByRole('radio', { name: 'Niet waargenomen', exact: true })
      .check();
    await page
      .getByRole('status')
      .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
      .waitFor();
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const a = await new AxeBuilder({ page })
        .include('.ki-source-observation')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      assert.deepEqual(
        a.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await page.screenshot({
        path: `${out}/${engine}-source-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Download observatie (PDF)', exact: true })
      .click();
    const download = await downloadPromise;
    await download.saveAs(`${out}/${engine}-observatie.pdf`);
    // Simulate a committed save whose response is lost, then retry the same request.
    let lost = false;
    const intercept = async (route) => {
      if (!lost && route.request().method() === 'POST') {
        lost = true;
        const response = await route.fetch();
        assert.equal(response.status(), 201);
        await route.abort('failed');
      } else await route.continue();
    };
    await page.route(
      '**/api/inzicht/source-observations?school=school-a',
      intercept,
    );
    await page
      .getByLabel('Opmerking', { exact: true })
      .fill('Antwoordverliesproef, fictief.');
    await page
      .getByRole('status')
      .filter({ hasText: 'Niet opgeslagen:' })
      .waitFor();
    const beforeNavigation = page.url();
    await page.getByRole('link', { name: 'Rapportages', exact: true }).click();
    assert.equal(page.url(), beforeNavigation);
    assert.equal(
      await page.evaluate(() =>
        window.dispatchEvent(
          new Event('inzicht:before-navigation', { cancelable: true }),
        ),
      ),
      false,
    );
    await page.getByRole('button', { name: 'Nu bewaren', exact: true }).click();
    await page
      .getByRole('status')
      .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
      .waitFor();
    await page.unroute(
      '**/api/inzicht/source-observations?school=school-a',
      intercept,
    );
    for (const mode of ['Zin', 'Tekst']) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page
        .getByRole('button', { name: 'Nieuwe observatie', exact: true })
        .click();
      await page
        .getByRole('group', { name: 'Kijken', exact: true })
        .getByRole('radio', { name: 'Zonder directe hulp', exact: true })
        .check();
      await page
        .getByRole('status')
        .filter({ hasText: 'Opgeslagen in Klink Inzicht' })
        .waitFor();
      const pdf = page.waitForEvent('download');
      await page
        .getByRole('button', { name: 'Download observatie (PDF)', exact: true })
        .click();
      await (await pdf).saveAs(`${out}/${engine}-${mode.toLowerCase()}.pdf`);
    }
    await page.getByRole('button', { name: 'Woord', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Woord', exact: true }).click();
    await field
      .getByRole('radio', { name: 'Zonder directe hulp', exact: true })
      .waitFor();
    assert(
      await field
        .getByRole('radio', { name: 'Zonder directe hulp', exact: true })
        .isChecked(),
    );
    await page.getByRole('link', { name: 'Rapportages', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Individuele groei', exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: /revisie/ })
      .first()
      .click();
    await page
      .getByRole('heading', {
        name: 'Observatie en correctiehistorie',
        exact: true,
      })
      .waitFor();
    assert(
      (await page.getByText('Niet ingevuld', { exact: false }).count()) > 0,
    );
    await page
      .getByRole('button', { name: 'Details sluiten', exact: true })
      .click();
    await page.getByLabel('Tijdas', { exact: true }).selectOption('hours');
    await page
      .getByText('Werkelijk gevolgde lesuren registreren en corrigeren', {
        exact: true,
      })
      .click();
    await page
      .getByLabel('Einde gevolgde bijeenkomst', { exact: true })
      .fill('2026-11-01T08:00');
    await page
      .getByLabel('Werkelijk gevolgde minuten', { exact: true })
      .fill('75');
    await page
      .getByLabel('Bron of reden van correctie', { exact: true })
      .fill('Synthetische aanwezigheidsproef');
    await page
      .getByRole('button', { name: 'Lesminuten bewaren', exact: true })
      .click();
    await page
      .getByText(/75 minuten · revisie 1/)
      .first()
      .waitFor({ state: 'attached' });
    await page
      .getByRole('button', { name: 'Groepsontwikkeling', exact: true })
      .click();
    await page
      .getByText(/minder dan 5 cursisten/)
      .first()
      .waitFor();
    await page
      .getByRole('button', { name: 'Landelijke vergelijking', exact: true })
      .click();
    await page
      .getByText(
        'Landelijke gemiddelden, percentielen en normbanden: niet beschikbaar.',
        { exact: true },
      )
      .waitFor();
    for (const level of ['Alfa A', 'Alfa B', 'Alfa C', 'A1', 'A2', 'B1'])
      await page
        .getByLabel('Niveau voor doeloriëntatie', { exact: true })
        .selectOption(level);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      const a = await new AxeBuilder({ page })
        .include('.ki-reports')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      assert.deepEqual(
        a.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      await page.screenshot({
        path: `${out}/${engine}-national-${width}.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole('button', { name: 'Individuele groei', exact: true })
      .click();
    await page
      .getByRole('img', { name: /Totale observatieverdeling/ })
      .waitFor();
    await page.screenshot({
      path: `${out}/${engine}-individual-320.png`,
      fullPage: true,
    });
    const a = await new AxeBuilder({ page })
      .include('.ki-reports')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    assert.deepEqual(
      a.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => {
        document.documentElement.dataset.theme = 'dark';
        document.documentElement.classList.add('dark');
      });
      const a = await new AxeBuilder({ page })
        .include('.ki-reports')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      assert.deepEqual(
        a.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      await page.screenshot({
        path: `${out}/${engine}-individual-${width}-dark.png`,
        fullPage: true,
      });
    }
    assert.deepEqual(errors, []);
    results.push({ engine, pass: true });
  } finally {
    await browser.close();
  }
}
await logoutSessions();
writeFileSync(
  `${out}/browser.json`,
  JSON.stringify({ base, results }, null, 2),
);
console.log(results);
