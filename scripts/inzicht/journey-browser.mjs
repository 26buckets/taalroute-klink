import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium, webkit, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { base, online, login } from './browser-auth.mjs';

assert(online, 'Only the isolated synthetic staging is allowed');
const out = 'docs/inzicht-20261101/evidence/journey';
mkdirSync(out, { recursive: true });
const run = new Date().toISOString().replace(/[:.]/g, '-');
const results = [];
const button = (page, name) => page.getByRole('button', { name, exact: true });
const field = (page, name) => page.getByLabel(name, { exact: true });
async function get(page, path, status = 200) {
  const response = await page.request.get(
    `${base}/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=school-a`,
  );
  assert.equal(response.status(), status, path);
  return response.json();
}
async function saveResponse(page, path, action) {
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === `/api/inzicht/${path}` &&
      r.request().method() === 'POST',
  );
  await action();
  const r = await response;
  assert(r.ok(), `${path}: ${r.status()}`);
  return r.json();
}
async function loseResponse(page, path, action) {
  const match = (url) => url.pathname === `/api/inzicht/${path}`;
  let stored;
  await page.route(
    match,
    async (route) => {
      const response = await route.fetch();
      assert(response.ok(), `${path}: initial commit failed`);
      stored = await response.json();
      await route.abort('failed');
    },
    { times: 1 },
  );
  await action();
  await expect(page.getByRole('alert').filter({ hasText: /./ })).toBeVisible();
  assert(stored);
  return stored;
}
async function logout(page) {
  await saveResponse(page, 'logout', () => button(page, 'Afmelden').click());
  await field(page, 'E-mailadres').waitFor();
}

for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const errors = [];
  async function openPage(viewport) {
    const page = await (await browser.newContext({ viewport })).newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', (e) => errors.push(e.message));
    return page;
  }
  let teacher = await openPage({ width: 1366, height: 1000 });
  const registrar = await openPage({ width: 1280, height: 900 });
  let student = await openPage({ width: 390, height: 844 });
  const result = { engine, run, steps: [] };
  const passed = (step) => {
    result.steps.push(step);
    console.log(`${engine}: ${step}`);
  };
  try {
    await login(teacher, 'docent');
    await teacher
      .getByRole('link', { name: 'Nieuwe klas', exact: true })
      .click();
    const className = `Doorloop ${engine} ${run}`;
    await field(teacher, 'Klasnaam').fill(className);
    await button(teacher, 'Klas bewaren').click();
    await teacher
      .getByRole('heading', { name: className, exact: true })
      .waitFor();
    const classUrl = teacher.url().replace(/\?.*$/, '');
    const group = new URL(classUrl).pathname.split('/').at(-1);
    result.group = group;
    const names = [
      `Fenna ${engine} ${run} (fictief)`,
      `Omar ${engine} ${run} (fictief)`,
    ];
    const learners = [];
    for (const name of names) {
      await teacher
        .getByRole('link', { name: 'Cursist toevoegen', exact: true })
        .click();
      await field(teacher, 'Naam').fill(name);
      await button(teacher, 'Cursist bewaren').click();
      await teacher.getByRole('heading', { name, exact: true }).waitFor();
      learners.push(new URL(teacher.url()).pathname.split('/').at(-1));
    }
    result.learners = learners;
    passed('MFA login, class and two provisional learners through UI');

    await teacher.goto(
      `${classUrl}/observeren?school=school-a&learner=${learners[0]}`,
    );
    await field(teacher, 'Vaardigheid').selectOption('woordbeeld');
    await field(teacher, 'Concrete taaksituatie').fill(
      'Kiest mat uit vier woordkaarten',
    );
    await field(teacher, 'Waargenomen resultaat').selectOption('partial');
    await field(teacher, 'Zelfstandigheid').selectOption('hint');
    let lost = false;
    await teacher.route(
      '**/api/inzicht/observations?**',
      async (route) => {
        const response = await route.fetch();
        assert(response.ok());
        lost = true;
        await route.abort('failed');
      },
      { times: 1 },
    );
    await button(teacher, 'Observatie bewaren').click();
    await expect(teacher.getByRole('alert')).not.toBeEmpty();
    assert(lost);
    assert.equal(
      await field(teacher, 'Concrete taaksituatie').inputValue(),
      'Kiest mat uit vier woordkaarten',
    );
    await button(teacher, 'Observatie bewaren').click();
    await teacher
      .getByRole('heading', {
        name: 'Kiest mat uit vier woordkaarten',
        exact: true,
      })
      .waitFor();
    let profile = await get(teacher, `learners/${learners[0]}?class=${group}`);
    assert.equal(profile.observations.length, 1);
    assert.equal(profile.history.length, 1);
    await teacher
      .getByRole('link', { name: 'Corrigeren met reden', exact: true })
      .click();
    await field(teacher, 'Concrete taaksituatie').fill(
      'Kiest mat na één aanwijzing',
    );
    await field(teacher, 'Reden voor correctie').fill(
      'De gegeven aanwijzing ontbrak in de eerste beschrijving',
    );
    await button(teacher, 'Observatie bewaren').click();
    await teacher
      .getByRole('heading', {
        name: 'Kiest mat na één aanwijzing',
        exact: true,
      })
      .waitFor();
    await teacher.reload();
    await teacher
      .getByText('Volledige correctiehistorie', { exact: true })
      .click();
    await expect(teacher.locator('details[open]')).toContainText(
      'Kiest mat uit vier woordkaarten',
    );
    await expect(teacher.locator('details[open]')).toContainText(
      'De gegeven aanwijzing ontbrak',
    );
    profile = await get(teacher, `learners/${learners[0]}?class=${group}`);
    assert.equal(profile.observations.length, 1);
    assert.equal(profile.history.length, 2);
    await teacher.screenshot({
      path: `${out}/${engine}-history.png`,
      fullPage: true,
    });
    passed(
      'Lost save response retried exactly once; correction and both historical versions persist',
    );

    await login(registrar, 'registrar');
    // Only the reusable fictitious student account is moved, without deleting its old profile/history.
    const roster = await get(registrar, 'registrar');
    const old = roster.links.find(
      (l) => l.membership_id === 'school-a:cursist',
    );
    if (old) {
      const oldName = roster.learners.find(
        (l) => l.id === old.learner_id,
      ).display_name;
      const unlink = () =>
        registrar
          .locator('.ki-actions')
          .filter({ hasText: oldName })
          .getByRole('button', {
            name: 'Ontkoppelen; historie behouden',
            exact: true,
          })
          .click();
      const storedUnlink = await loseResponse(registrar, 'unlink', unlink);
      assert.deepEqual(
        await saveResponse(registrar, 'unlink', unlink),
        storedUnlink,
      );
      await expect(
        registrar.locator('.ki-actions').filter({ hasText: oldName }),
      ).toHaveCount(0);
    }
    await registrar
      .getByLabel('Voorlopig schoolprofiel')
      .selectOption(learners[0]);
    await registrar
      .getByLabel('Bedoeld schoolaccount')
      .selectOption('school-a:cursist');
    await registrar.getByRole('checkbox').check();
    await button(registrar, 'Eenmalige uitnodiging maken').click();
    await registrar.getByLabel('Testuitnodiging').waitFor();
    const invite = await registrar.getByLabel('Testuitnodiging').inputValue();
    await login(student, 'cursist');
    await field(student, 'Eenmalige testuitnodiging').fill(invite);
    const linked = await loseResponse(student, 'accept-invite', () =>
      button(student, 'Schoolprofiel koppelen').click(),
    );
    assert.deepEqual(
      await saveResponse(student, 'accept-invite', () =>
        button(student, 'Schoolprofiel koppelen').click(),
      ),
      linked,
    );
    await student
      .getByRole('heading', { name: 'Mijn opdrachten', exact: true })
      .waitFor();
    assert.equal((await get(student, 'my-school')).classes[0].id, group);
    await get(student, `learners/${learners[1]}?class=${group}`, 403);
    await get(registrar, `classes/${group}/report`, 403);
    passed(
      'Registrar identity confirmation and student acceptance; role boundaries enforced',
    );

    await teacher.goto(`${classUrl}/toegang?school=school-a`);
    await field(teacher, 'Oefenmodus').selectOption('assigned');
    await button(teacher, 'Bekijk impact en cursistaanbod').click();
    const policyResult = await loseResponse(
      teacher,
      `classes/${group}/policy`,
      () => button(teacher, 'Toegang bevestigen').click(),
    );
    assert.deepEqual(
      await saveResponse(teacher, `classes/${group}/policy`, () =>
        button(teacher, 'Toegang bevestigen').click(),
      ),
      policyResult,
    );
    await teacher.getByText('Toegang opgeslagen.', { exact: true }).waitFor();
    await teacher.goto(`${classUrl}/opdrachten?school=school-a`);
    await field(teacher, '1. Selecteer oefening').selectOption('word-mat');
    await field(teacher, names[0]).check();
    await field(teacher, 'Instructie voor de cursist').fill(
      'Kies hetzelfde woord. Alleen voor Fenna.',
    );
    await button(teacher, '4. Bekijk cursistvoorbeeld').click();
    assert.equal(
      (await get(teacher, `classes/${group}/assignments`)).length,
      0,
    );
    await button(teacher, '5. Opdracht bevestigen').click();
    await teacher.getByText('Opdracht bewaard.', { exact: true }).waitFor();
    let report = await get(teacher, `classes/${group}/report`);
    assert.equal(report.assignments.length, 1);
    assert.equal(report.assignments[0].learner_id, learners[0]);
    await student.reload();
    await expect(
      student.getByText('Kies hetzelfde woord. Alleen voor Fenna.', {
        exact: true,
      }),
    ).toBeVisible();
    assert.equal((await get(student, 'my-school')).free_practice.length, 0);
    await button(student, 'Oefening openen').click();
    await student.waitForURL((u) => u.pathname === '/inzicht/oefenen');
    await student.reload();
    // Server commits the attempt, then its response is lost. Retrying must not duplicate it.
    await student.route('**/api/inzicht/school-practice?**', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      const response = await route.fetch();
      assert(response.ok());
      await route.abort('failed');
      await student.unroute('**/api/inzicht/school-practice?**');
    });
    await button(student, 'mat').click();
    await expect(
      student.getByRole('alert').filter({ hasText: /./ }),
    ).toBeVisible();
    await button(student, 'mat').click();
    await student
      .getByText('Goed. Je oefenpoging is bewaard.', { exact: true })
      .waitFor();
    await button(student, 'Terug naar mijn opdrachten').click();
    await student.waitForURL((u) => u.pathname === '/inzicht');
    await student.reload();
    await student.getByText('Geoefend', { exact: true }).waitFor();
    report = await get(teacher, `classes/${group}/report`);
    assert.equal(report.attempts.length, 1);
    assert.equal(report.assignments[0].learner_status, 'finished');
    await student.screenshot({
      path: `${out}/${engine}-student.png`,
      fullPage: true,
    });
    passed(
      'Teacher-confirmed individual assignment, mobile exercise, lost response retry, exactly one persisted attempt',
    );

    await teacher.goto(`${classUrl}/matrix?school=school-a`);
    await teacher.getByRole('table').waitFor();
    const refresh = button(teacher, 'Voortgang bijwerken');
    if (await refresh.count()) {
      await refresh.click();
      await refresh.waitFor({ state: 'detached' });
    }
    const matrix = await get(teacher, `classes/${group}/matrix`);
    assert.equal(matrix.rows.length, 2);
    for (const row of matrix.rows)
      for (const cell of Object.values(row.cells))
        assert.equal(cell.measured, false);
    const word = teacher.getByRole('link', {
      name: new RegExp(`^Fenna .*Woordbeeld`),
    });
    await word.click();
    await teacher
      .getByRole('heading', { name: 'Waarom?', exact: true })
      .waitFor();
    const evidence = await get(
      teacher,
      `evidence?class=${group}&learner=${learners[0]}&skill=woordbeeld`,
    );
    assert(evidence.events.length >= 3);
    assert(evidence.events.every((e) => e.relation === 'TRAIN'));
    assert.equal(evidence.mastery.measured, false);
    await teacher.screenshot({
      path: `${out}/${engine}-evidence.png`,
      fullPage: true,
    });
    passed(
      'Matrix links to individual history; observations and successful practice do not become mastery',
    );

    await teacher.goto(`${classUrl}/advies?school=school-a`);
    const preview = await saveResponse(
      teacher,
      `classes/${group}/recommendations`,
      () => button(teacher, 'Voorstel bekijken').click(),
    );
    const second = await saveResponse(
      teacher,
      `classes/${group}/recommendations`,
      () => button(teacher, 'Voorstel bekijken').click(),
    );
    assert.deepEqual(preview.suggestions, second.suggestions);
    assert.equal(
      (await get(teacher, `classes/${group}/assignments`)).length,
      1,
    );
    await field(teacher, 'Mijn leskeuze / aanpassing').fill(
      'Eerst individueel controleren; oefenresultaat is geen meetbewijs.',
    );
    const storedApproval = await loseResponse(
      teacher,
      `plans/${second.id}`,
      () => button(teacher, 'Leskeuze goedkeuren').click(),
    );
    const approval = await saveResponse(teacher, `plans/${second.id}`, () =>
      button(teacher, 'Leskeuze goedkeuren').click(),
    );
    result.approved_plan = approval;
    assert.deepEqual(approval, storedApproval);
    await teacher
      .getByText(
        'Leskeuze bewaard. Er zijn geen opdrachten automatisch uitgegeven.',
        { exact: true },
      )
      .waitFor();
    assert.equal(
      (await get(teacher, `classes/${group}/assignments`)).length,
      1,
    );
    passed(
      'Deterministic advice repeated unchanged; explicit teacher approval creates no unsolicited assignments',
    );

    for (const [page, screen] of [
      [teacher, 'teacher'],
      [student, 'student'],
    ]) {
      const axe = await new AxeBuilder({ page })
        .include('.ki-app')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
        screen,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    await logout(student);
    await student.context().close();
    student = await openPage({ width: 390, height: 844 });
    await login(student, 'cursist');
    await student.getByText('Geoefend', { exact: true }).waitFor();
    assert.equal((await get(student, 'my-school')).attempts.length, 1);
    await logout(teacher);
    await teacher.context().close();
    teacher = await openPage({ width: 1366, height: 1000 });
    await login(teacher, 'docent');
    report = await get(teacher, `classes/${group}/report`);
    assert.equal(report.revisions.length, 2);
    assert.equal(report.attempts.length, 1);
    assert.equal(report.learners.length, 2);
    result.report = report;
    await field(teacher, 'Actieve school').selectOption('school-b');
    await teacher.waitForURL(
      (url) => url.searchParams.get('school') === 'school-b',
    );
    await teacher
      .getByRole('heading', { name: 'Vandaag', exact: true })
      .waitFor();
    await expect(teacher.locator('.ki-app')).not.toContainText(className);
    const forbidden = await teacher.request.get(
      `${base}/api/inzicht/classes/${group}/report?school=school-b`,
    );
    assert.equal(forbidden.status(), 404);
    assert.deepEqual(errors, []);
    passed(
      'Fresh MFA sessions retain history and completed assignment; school isolation and automated accessibility checks',
    );
    for (const page of [teacher, registrar, student]) await logout(page);
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.error = String(error);
    result.alerts = await registrar.getByRole('alert').allTextContents();
    result.page_errors = errors;
    throw error;
  } finally {
    results.push(result);
    writeFileSync(
      `${out}/results.json`,
      JSON.stringify(
        {
          at: new Date().toISOString(),
          staging: base,
          synthetic_only: true,
          results,
        },
        null,
        2,
      ) + '\n',
    );
    await browser.close();
  }
}

// Verify that the UI confirmations are durable SQL records, each with one approval audit.
const planIds = results.map((result) => result.approved_plan.id);
assert(planIds.every((id) => /^[a-f0-9-]{36}$/.test(id)));
const query = `SELECT p.id,p.payload,p.approved_by,r.group_id,r.status,(SELECT COUNT(*) FROM audit_events a WHERE a.organization_id=p.organization_id AND a.resource_id=p.id AND a.action='recommendation.approve') audit_count FROM approved_lesson_plans p JOIN recommendation_previews r ON r.id=p.preview_id WHERE p.organization_id='school-a' AND p.id IN (${planIds.map((id) => `'${id}'`).join(',')})`;
const rows = JSON.parse(
  execFileSync(
    'node_modules/.bin/wrangler',
    [
      'd1',
      'execute',
      'INZICHT_DB',
      '--remote',
      '--config',
      'scripts/inzicht/online-config.json',
      '--command',
      query,
      '--json',
    ],
    { encoding: 'utf8' },
  ),
)[0].results;
assert.equal(rows.length, 2);
for (const row of rows) {
  assert.equal(row.status, 'approved');
  assert.equal(row.approved_by, 'school-a:docent');
  assert.equal(row.audit_count, 1);
  assert.deepEqual(JSON.parse(row.payload), {
    note: 'Eerst individueel controleren; oefenresultaat is geen meetbewijs.',
    assignments: [],
  });
  assert(
    results.some(
      (r) => r.group === row.group_id && r.approved_plan.id === row.id,
    ),
  );
}
writeFileSync(
  `${out}/database-audit.json`,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      database: '95f1de18-0c61-46ca-b2af-5ee36543f67f',
      rows,
    },
    null,
    2,
  ) + '\n',
);
