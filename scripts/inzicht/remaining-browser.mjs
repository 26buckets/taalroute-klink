import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import {
  base,
  online,
  login,
  apiCookie,
  logoutSessions,
} from './browser-auth.mjs';
assert(online, 'Exercise the deployed synthetic environment');
async function call(path, body, user = 'docent') {
  const r = await fetch(
    `${base}/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=school-a`,
    {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        origin: base,
        'Content-Type': 'application/json',
        cookie: await apiCookie(user),
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  const data = await r.json();
  assert(r.ok, JSON.stringify(data));
  return data;
}
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const roster = await call('registrar', undefined, 'registrar');
  const linked = roster.links.find(
    (l) => l.membership_id === 'school-a:cursist',
  );
  assert(linked);
  const group = await call('classes', {
    name: `Planning ${engine}`,
    start_level: 'Alfa A',
  });
  await call(
    'enrollments',
    {
      class_id: group.id,
      learner_id: linked.learner_id,
      status: 'active',
      confirmed: true,
    },
    'registrar',
  );
  const detail = await call(`classes/${group.id}`);
  const name = detail.learners.find(
    (l) => l.id === linked.learner_id,
  ).display_name;
  const browser = await type.launch();
  const page = await browser.newPage();
  await login(page, 'docent');
  await page.goto(
    `${base}/inzicht/klassen/${group.id}/toegang?school=school-a`,
  );
  await page
    .getByLabel('Voor wie', { exact: true })
    .selectOption(linked.learner_id);
  await page.getByLabel('Oefenmodus', { exact: true }).selectOption('assigned');
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
    .getByRole('button', { name: 'Klasstandaard herstellen', exact: true })
    .click();
  await page
    .getByText(
      'Na bevestiging volgt deze cursist weer de klasstandaard, ook bij latere wijzigingen.',
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole('button', {
      name: 'Bekijk impact en cursistaanbod',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: 'Toegang bevestigen', exact: true })
    .click();
  await page.waitForFunction(
    () => !document.body.innerText.includes('Dit ziet de cursist'),
  );
  assert.equal(
    (await call(`classes/${group.id}/policy?learner=${linked.learner_id}`))
      .exercise_mode,
    'free',
  );
  await page.goto(
    `${base}/inzicht/klassen/${group.id}/opdrachten?school=school-a`,
  );
  await page
    .getByLabel('1. Selecteer oefening', { exact: true })
    .selectOption('word-mat');
  await page.getByLabel(name, { exact: true }).check();
  const day = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page
    .getByLabel('3. Beschikbaar vanaf (leeg is direct)', { exact: true })
    .fill(`${day}T10:00`);
  await page
    .getByLabel('Beschikbaar tot (leeg is zonder einddatum)', { exact: true })
    .fill(`${day}T11:00`);
  await page
    .getByRole('button', { name: '4. Bekijk cursistvoorbeeld', exact: true })
    .click();
  await page
    .getByRole('button', { name: '5. Opdracht bevestigen', exact: true })
    .click();
  await page.getByText('Opdracht bewaard.', { exact: true }).waitFor();
  let assignments = await call(`classes/${group.id}/assignments`);
  assert.equal(assignments.length, 1);
  assert(
    Date.parse(assignments[0].ends_at) > Date.parse(assignments[0].starts_at),
  );
  assert(
    !(await call('my-school', undefined, 'cursist')).assignments.some(
      (a) => a.id === assignments[0].id,
    ),
  );
  await page
    .getByRole('button', { name: 'Opdracht intrekken', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Intrekken bevestigen', exact: true })
    .click();
  await page.getByText('Opdracht ingetrokken.', { exact: true }).waitFor();
  assignments = await call(`classes/${group.id}/assignments`);
  assert.equal(assignments[0].status, 'withdrawn');
  await call('observations', {
    class_id: group.id,
    learner_id: linked.learner_id,
    skill_id: 'woordbeeld',
    situation: 'Fictieve rapportproef',
    outcome: 'partial',
    independence: 'hint',
    observed_at: new Date().toISOString(),
  });
  const report = await call(`classes/${group.id}/report`);
  assert.equal(report.revisions.length, 1);
  assert.equal(report.assignments.length, 1);
  const student = await browser.newPage();
  await login(student, 'cursist');
  await student
    .locator('article')
    .filter({ hasText: `Planning ${engine}` })
    .getByRole('button', { name: 'Vrij oefenen', exact: true })
    .first()
    .click();
  await student.waitForURL((u) => u.pathname === '/inzicht/oefenen');
  await student.getByRole('heading', { name: /Hetzelfde woord:/ }).waitFor();
  const free = await call('my-school', undefined, 'cursist');
  assert(free.free_practice.some((p) => p.group_id === group.id));
  await browser.close();
  results.push({
    engine,
    planning: true,
    withdrawal: true,
    inheritance: true,
    free_practice: true,
    education_report: true,
  });
}
await logoutSessions();
writeFileSync(
  'docs/inzicht-20261101/evidence/remaining-browser.json',
  JSON.stringify(results, null, 2),
);
console.log(
  'Two engines: planned dates, withdrawal, class inheritance, free practice and education report passed.',
);
