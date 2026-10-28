import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, webkit } from 'playwright';
import { newCode, codeHash } from '../lib/teaching-server.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18928';
assert(
  ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
  'Only local test accounts',
);
const out = process.env.KLINK_DOCENT_OUTPUT ?? '../workspace-checks';
mkdirSync(out, { recursive: true });
const temp = mkdtempSync(join(tmpdir(), 'klink-teaching-test-'));
const teacherId = randomUUID(),
  teacherCode = newCode('teacher');
function sql(query) {
  const file = join(temp, 'fixture.sql');
  writeFileSync(file, query, { mode: 0o600 });
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--local',
      '--persist-to',
      resolve('.wrangler/state'),
      '--config',
      'dist/server/wrangler.json',
      '--file',
      file,
    ],
    { stdio: 'pipe' },
  );
}
sql(
  `INSERT INTO teaching_teachers VALUES ('${teacherId}','Testdocent','${await codeHash(teacherCode)}');`,
);
const checks = [],
  errors = [];
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: { 'cf-connecting-ip': teacherId },
  }),
  page = await context.newPage();
page.on('pageerror', (e) => errors.push(e.message));
const pass = (s) => {
  checks.push(s);
  console.log('PASS', s);
};
const post = (context, role, data) =>
  context.request.post(`${base}/api/teaching?role=${role}`, {
    headers: { origin: base },
    data,
  });
async function roster() {
  const r = await context.request.get(`${base}/api/teaching?role=teacher`);
  assert.equal(r.status(), 200);
  return r.json();
}
try {
  await page.goto(base + '/#teacher/activities');
  await page.getByLabel('Docentcode').fill(teacherCode);
  await page.getByRole('button', { name: 'Openen', exact: true }).click();
  await page.getByRole('heading', { name: 'Wat wil je doen?' }).waitFor();
  await page.getByText('Aangemeld als Testdocent', { exact: true }).waitFor();
  for (const width of [1280, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
    const initial = await page.locator('[data-teacher-card]').boundingBox();
    const back = await page
      .getByRole('button', { name: 'Overzicht', exact: true })
      .boundingBox();
    for (const label of [
      'Cursisten en groepen',
      'Opdrachten',
      'Klink+docent',
      'Werkbladen',
    ]) {
      await page
        .getByRole('navigation', { name: 'Docentnavigatie' })
        .getByRole('button', { name: label, exact: true })
        .click();
      await page
        .getByText('Aangemeld als Testdocent', { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole('heading', { name: 'Docentomgeving', exact: true })
          .count(),
        1,
      );
      const card = await page.locator('[data-teacher-card]').boundingBox();
      const currentBack = await page
        .getByRole('button', { name: 'Overzicht', exact: true })
        .boundingBox();
      for (const key of ['x', 'y', 'width'])
        assert(
          Math.abs(card[key] - initial[key]) < 2,
          label + ': same card ' + key,
        );
      if (width > 850)
        assert(
          Math.abs(card.height - initial.height) < 2,
          label + ': same card height',
        );
      for (const key of ['x', 'y'])
        assert(
          Math.abs(currentBack[key] - back[key]) < 2,
          label + ': same overview position',
        );
      assert.equal(await page.locator('main').count(), 1);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (width === 1280)
        await page.screenshot({
          path: join(out, 'frame-' + label.replaceAll(' ', '-') + '.png'),
        });
      await page
        .getByRole('button', { name: 'Overzicht', exact: true })
        .click();
      await page
        .getByRole('heading', { name: 'Wat wil je doen?', exact: true })
        .waitFor();
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  pass(
    'Four teacher options retain one frame and overview position at three widths; identity follows signed-in account',
  );

  assert.equal(
    await page.getByText('Volledige inhoudslijn', { exact: false }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole('link', { name: 'Handleiding in Studio' })
      .getAttribute('href'),
    'https://studio.taalroute.nl/#/apps/klink/handleiding',
  );
  await page.getByRole('button', { name: /Cursisten en groepen Maak/ }).click();
  await page.getByLabel('Nieuwe groep').fill('Maandaggroep');
  await page.getByRole('button', { name: 'Groep maken', exact: true }).click();
  await page.getByLabel('Naam cursist').waitFor();
  const codes = {};
  for (const name of ['Samira', 'Ravi']) {
    await page.getByLabel('Naam cursist').fill(name);
    await page.getByRole('button', { name: 'Cursist toevoegen' }).click();
    await page
      .getByRole('heading', { name: `Oefencode voor ${name}` })
      .waitFor();
    codes[name] = (
      await page.locator('.tw-code strong').innerText()
    ).replaceAll(' ', '');
    assert.match(codes[name], /^\d{16}$/);
    await page.getByRole('button', { name: 'Klaar', exact: true }).click();
  }
  await page.reload();
  await page.getByRole('heading', { name: 'Samira', exact: true }).waitFor();
  pass('Group and two learners persist after reload; access codes shown once');
  const samira = page.locator('.tw-roster article').filter({
    has: page.getByRole('heading', { name: 'Samira', exact: true }),
  });
  await samira.getByRole('button', { name: 'Opdracht klaarzetten' }).click();
  await page.getByRole('checkbox', { name: 'Samira', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('checkbox', { name: 'Ravi', exact: true }).isChecked(),
    false,
  );
  await page
    .getByRole('button', { name: 'Klaarzetten voor 1 cursist', exact: true })
    .click();
  await page.getByText('1 opdracht staat klaar.', { exact: true }).waitFor();
  await page.getByRole('checkbox', { name: 'Hele groep', exact: true }).check();
  await page
    .getByRole('button', { name: 'Klaarzetten voor 2 cursisten', exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll('.tw-roster article').length === 2,
  );
  assert.equal((await roster()).assignments.length, 2);
  await page.screenshot({
    path: join(out, 'assignments-desktop.png'),
    fullPage: true,
  });
  pass(
    'Individual preselection and whole-group assignment reuse the same lesson without duplicates',
  );
  const learner = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    }),
    student = await learner.newPage();
  student.on('pageerror', (e) => errors.push(e.message));
  await student.goto(base + '/opdrachten');
  await student.getByLabel('Mijn oefencode').fill(codes.Samira);
  await student.getByRole('button', { name: 'Openen', exact: true }).click();
  await student.getByText('Samira', { exact: true }).waitFor();
  assert.equal(await student.getByText('Ravi', { exact: true }).count(), 0);
  assert.equal(await student.locator('.tw-home > button').count(), 1);
  assert.equal(
    (await learner.request.get(`${base}/api/teaching?role=teacher`)).status(),
    401,
  );
  await student.reload();
  await student.getByText('Samira', { exact: true }).waitFor();
  await student.locator('.tw-home > button').click();
  await student.locator('.cp-exercise-browser').waitFor();
  writeFileSync(
    join(out, 'player-inspection.txt'),
    await student.locator('main').innerText(),
  );
  await student.screenshot({ path: join(out, 'assigned-player.png') });
  // Complete the canonical mat lesson using the actual controls.
  await student.getByRole('button', { name: 'Verder', exact: true }).click();
  for (let i = 0; i < 2; i++) {
    await student
      .locator('[data-exercise-id]')
      .filter({
        has: student.locator(
          i === 0 ? '.cp-first-letter-guide' : '.cp-build-slots',
        ),
      })
      .waitFor();
    const demo = student.getByRole('button', { name: 'Nu jij', exact: true });
    if (await demo.isVisible()) await demo.click();
    for (const letter of ['m', 'a', 't'])
      await student
        .locator('.cp-tile-bank button')
        .filter({ hasText: new RegExp('^' + letter + '$') })
        .click();
    const advance = student.getByRole('button', {
      name: i === 0 ? 'Verder' : 'Les afronden',
      exact: true,
    });
    if (await advance.isVisible()) await advance.click();
  }
  await student
    .getByRole('button', { name: 'Mijn opdrachten', exact: true })
    .last()
    .click();
  await student.getByText('Nog een keer', { exact: true }).waitFor();
  assert.equal(
    (await roster()).assignments.filter((a) => a.completed_at).length,
    1,
  );
  pass(
    'Learner code opens only own work; canonical mat player completion appears for teacher',
  );
  await page.goto(base + '/#teacher/groups');
  await page.getByRole('heading', { name: 'Samira', exact: true }).waitFor();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Nieuwe oefencode: Samira' }).click();
  await page.getByRole('heading', { name: 'Oefencode voor Samira' }).waitFor();
  const renewed = (
    await page.locator('.tw-code strong').innerText()
  ).replaceAll(' ', '');
  assert.notEqual(renewed, codes.Samira);
  await page.getByRole('button', { name: 'Klaar', exact: true }).click();
  await student.reload();
  await student.getByLabel('Mijn oefencode').waitFor();
  assert.equal(
    (
      await post(learner, 'learner', { action: 'login', code: codes.Samira })
    ).status(),
    401,
  );
  await student.getByLabel('Mijn oefencode').fill(renewed);
  await student.getByRole('button', { name: 'Openen', exact: true }).click();
  await student.getByText('Samira', { exact: true }).waitFor();
  pass(
    'Code reset revokes existing browser session and old code; renewed code retains work',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: join(out, 'groups-mobile.png'),
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await student.setViewportSize({ width: 390, height: 844 });
  await student.screenshot({
    path: join(out, 'learner-mobile.png'),
    fullPage: true,
  });
  assert(
    await student.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await learner.close();
  const wk = await webkit.launch();
  const wc = await wk.newContext({ viewport: { width: 390, height: 844 } });
  const wp = await wc.newPage();
  await wp.goto(base + '/opdrachten');
  await wp.getByLabel('Mijn oefencode').fill(codes.Ravi);
  await wp.getByRole('button', { name: 'Openen', exact: true }).click();
  await wp.getByText('Ravi', { exact: true }).waitFor();
  await wp.getByRole('button', { name: 'Afsluiten', exact: true }).click();
  await wp.getByLabel('Mijn oefencode').waitFor();
  await wp.reload();
  await wp.getByLabel('Mijn oefencode').waitFor();
  await wk.close();
  pass(
    'Desktop and mobile fit; Chrome and WebKit personal login and logout work',
  );
  await page.goto(base + '/');
  await page
    .getByRole('link', { name: 'Mijn opdrachten', exact: true })
    .click();
  await page.getByLabel('Mijn oefencode').waitFor();
  await page.goto(base + '/#learner/home');
  await page.locator('.cp-practice-line-overview').waitFor();
  assert.equal(await page.locator('.cp-practice-line-overview li').count(), 6);
  await page.getByLabel('Menu', { exact: true }).click();
  await page
    .getByRole('link', { name: 'Mijn opdrachten', exact: true })
    .click();
  await page.getByLabel('Mijn oefencode').waitFor();
  assert.deepEqual(errors, []);
  pass(
    'Landing entry opens personal work; existing learner start and six steps remain',
  );
} finally {
  await browser.close();
  sql(
    `DELETE FROM teaching_sessions WHERE person_id='${teacherId}' OR person_id IN (SELECT l.id FROM teaching_learners l JOIN teaching_groups g ON l.group_id=g.id WHERE g.teacher_id='${teacherId}'); DELETE FROM teaching_assignments WHERE learner_id IN (SELECT l.id FROM teaching_learners l JOIN teaching_groups g ON l.group_id=g.id WHERE g.teacher_id='${teacherId}'); DELETE FROM teaching_learners WHERE group_id IN (SELECT id FROM teaching_groups WHERE teacher_id='${teacherId}'); DELETE FROM teaching_groups WHERE teacher_id='${teacherId}'; DELETE FROM teaching_teachers WHERE id='${teacherId}';`,
  );
  rmSync(temp, { recursive: true, force: true });
  writeFileSync(
    join(out, 'teaching-browser-checks.json'),
    JSON.stringify(
      { checks, errors, fixture: 'Fictitious test learners removed after run' },
      null,
      2,
    ),
  );
}
