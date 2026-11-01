import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {
  base,
  online,
  login,
  apiCookie,
  logoutSessions,
} from './browser-auth.mjs';
const out = `docs/inzicht-20261101/evidence/${online ? 'online' : 'local'}`;
mkdirSync(out, { recursive: true });
const results = [];
async function call(path, body, user = 'docent') {
  const r = await fetch(
    `${base}/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=school-a`,
    {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        cookie: await apiCookie(user),
        origin: base,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  const data = await r.json();
  assert(r.ok, JSON.stringify(data));
  return data;
}
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const registry = await call('registrar', undefined, 'registrar');
  for (const link of registry.links)
    await call('unlink', { link_id: link.id }, 'registrar');
  const group = await call('classes', {
    name: `Accountproef ${engine}`,
    start_level: 'Alfa A',
  });
  const learner = await call(`classes/${group.id}/learners`, {
    name: `Noor ${engine} (fictief)`,
  });
  await call(`classes/${group.id}/assignments`, {
    content_id: 'word-mat',
    learner_ids: [learner.id],
    starts_at: new Date(Date.now() - 1000).toISOString(),
    instructions: 'Kies hetzelfde woord.',
  });
  const browser = await type.launch();
  const registrar = await (
    await browser.newContext({ viewport: { width: 1280, height: 900 } })
  ).newPage();
  await login(registrar, 'registrar');
  await registrar
    .getByLabel('Voorlopig schoolprofiel')
    .selectOption(learner.id);
  await registrar
    .getByLabel('Bedoeld schoolaccount')
    .selectOption('school-a:cursist');
  await registrar.getByRole('checkbox').check();
  await registrar
    .getByRole('button', { name: 'Eenmalige uitnodiging maken', exact: true })
    .click();
  const invite = registrar.getByLabel('Testuitnodiging');
  await invite.waitFor();
  const token = await invite.inputValue();
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 900 } })
  ).newPage();
  await login(page, 'cursist');
  await page.getByLabel('Eenmalige testuitnodiging').fill(token);
  await page
    .getByRole('button', { name: 'Schoolprofiel koppelen', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Oefening openen', exact: true })
    .click();
  await page.waitForURL((url) => url.pathname === '/inzicht/oefenen');
  await page.reload();
  await page.getByRole('button', { name: 'mat', exact: true }).click();
  await page
    .getByText('Goed. Je oefenpoging is bewaard.', { exact: true })
    .waitFor();
  await page
    .getByRole('button', { name: 'Terug naar mijn opdrachten', exact: true })
    .click();
  await page.waitForURL((url) => url.pathname === '/inzicht');
  await page.reload();
  await page
    .getByText(
      '1 pogingen voor deze school bewaard. Dit is geen niveaucertificaat.',
      { exact: true },
    )
    .waitFor();
  await page.screenshot({
    path: `${out}/${engine}-learner.png`,
    fullPage: true,
  });
  const a11y = [];
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 900 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    const a = await new AxeBuilder({ page })
      .include('.ki-app')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    a11y.push({
      width,
      violations: a.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    });
  }
  const teacher = await (await browser.newContext()).newPage();
  await login(teacher, 'docent');
  await teacher.goto(
    `${base}/inzicht/klassen/${group.id}/matrix?school=school-a`,
  );
  await teacher.getByRole('table').waitFor();
  await teacher.emulateMedia({ colorScheme: 'dark' });
  await teacher.setViewportSize({ width: 360, height: 900 });
  await teacher.screenshot({
    path: `${out}/${engine}-matrix-dark.png`,
    fullPage: true,
  });
  const a = await new AxeBuilder({ page: teacher })
    .include('.ki-app')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  a11y.push({
    screen: 'matrix',
    violations: a.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  });
  // Network loss must not claim success or discard a filled observation.
  await teacher.goto(
    `${base}/inzicht/klassen/${group.id}/observeren?school=school-a&general=1`,
  );
  await teacher
    .getByLabel('Concrete taaksituatie', { exact: true })
    .fill('Netwerkproef');
  await teacher.route('**/api/inzicht/observations?**', (route) =>
    route.abort(),
  );
  await teacher
    .getByRole('button', { name: 'Observatie bewaren', exact: true })
    .click();
  await teacher.getByRole('alert').waitFor();
  assert.equal(
    await teacher
      .getByLabel('Concrete taaksituatie', { exact: true })
      .inputValue(),
    'Netwerkproef',
  );
  assert(
    !(await teacher
      .getByText('Opgeslagen als observatie', { exact: false })
      .count()),
  );
  await teacher.unroute('**/api/inzicht/observations?**');
  await teacher
    .getByRole('button', { name: 'Observatie bewaren', exact: true })
    .click();
  await teacher
    .getByRole('heading', { name: 'Netwerkproef', exact: true })
    .waitFor();
  results.push({
    engine,
    linkAndPractice: 'passed',
    reloadPersistence: 'passed',
    offlineRetry: 'passed',
    a11y,
  });
  writeFileSync(
    `${out}/student-browser-results.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        results,
        humanScreenReaderReview: 'OPEN',
      },
      null,
      2,
    ),
  );
  assert(
    a11y.every((a) => !a.violations.length),
    JSON.stringify(a11y),
  );
  await browser.close();
}
console.log(
  'Student/registrar, school exercise storage, network loss/retry and automated accessibility passed in two engines.',
);

await logoutSessions();
