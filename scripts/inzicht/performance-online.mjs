import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { checkOnlineBudget } from './online-budget.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { hash } from '../../lib/inzicht/rules.ts';
import { base, online, apiCookie, logoutSessions } from './browser-auth.mjs';
assert(online);
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(
  config.d1_databases[0].database_id,
  '95f1de18-0c61-46ca-b2af-5ee36543f67f',
);
checkOnlineBudget();
const args = [
  'd1',
  'execute',
  'INZICHT_DB',
  '--remote',
  '--config',
  'scripts/inzicht/online-config.json',
];
const run = (extra) =>
  execFileSync('node_modules/.bin/wrangler', [...args, ...extra], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
const query = (sql) => JSON.parse(run(['--command', sql, '--json']))[0].results;
const org = 'synthetic-performance-pr8';
assert.equal(
  query(`SELECT COUNT(*) n FROM organizations WHERE id='${org}'`)[0].n,
  0,
);
const skills = query('SELECT id FROM skill_definitions').map((x) => x.id);
assert.equal(skills.length, 3);
const at = new Date().toISOString(),
  sql = [];
const quote = (v) =>
  typeof v === 'number'
    ? String(v)
    : v === null
      ? 'NULL'
      : `'${String(v).replaceAll("'", "''")}'`;
const insert = (table, values) =>
  sql.push(`INSERT INTO ${table} VALUES (${values.map(quote).join(',')});`);
insert('organizations', [
  org,
  'Tijdelijke fictieve schaalproef',
  'active',
  '["Alfa A"]',
  1,
]);
insert('memberships', [org + ':docent', org, 'docent', 'active', 'teacher', 1]);
insert('groups', [
  org + ':klas',
  org,
  'Schaalproef 30 × 100',
  'Alfa A',
  'Tijdelijke belastingproef',
  'active',
  1,
  at,
]);
insert('group_teachers', [org, org + ':klas', org + ':docent']);
for (let i = 3; i < 100; i++) {
  const id = `perf-pr8-${i}`;
  skills.push(id);
  insert('skill_definitions', [
    id,
    `Fictief testpunt ${i}`,
    'test',
    'Alfa A',
    'test',
    JSON.stringify({
      version: 'test',
      minimum_items: 5,
      pass_ratio: 0.8,
      stale_days: null,
    }),
    0,
  ]);
}
for (let i = 0; i < 30; i++) {
  const learner = `${org}:leerling-${i}`;
  insert('school_learners', [
    learner,
    org,
    `Schaalproef ${i + 1} (fictief)`,
    org + ':docent',
    at,
  ]);
  insert('group_memberships', [
    org,
    org + ':klas',
    learner,
    'active',
    at,
    null,
  ]);
  for (const skill of skills) {
    const id = `${learner}:${skill}`,
      payload = JSON.stringify({
        id,
        relation: 'TRAIN',
        identity_valid: true,
        source_valid: true,
        occurred_at: at,
        independence: 'hint',
        independent: false,
        feedback_reused: false,
        correct: 0,
        total: 1,
        day: at.slice(0, 10),
        session_id: id,
        item_set: id,
        transfer: false,
      });
    insert('evidence_events', [
      id,
      org,
      org + ':klas',
      learner,
      skill,
      'assessment',
      id,
      1,
      payload,
      await hash(JSON.parse(payload)),
      at,
    ]);
  }
}
writeFileSync('.wrangler/performance-seed.sql', sql.join('\n'));
const cleanup =
  [
    'evidence_events',
    'group_memberships',
    'school_learners',
    'group_teachers',
    'groups',
    'memberships',
  ]
    .map((t) => `DELETE FROM ${t} WHERE organization_id='${org}';`)
    .join('\n') +
  `\nDELETE FROM organizations WHERE id='${org}';\nDELETE FROM skill_definitions WHERE id LIKE 'perf-pr8-%';`;
writeFileSync('.wrangler/performance-cleanup.sql', cleanup);
try {
  run(['--file', '.wrangler/performance-seed.sql']);
  const cookie = await apiCookie('docent'),
    measurements = [];
  const browserMeasurements = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const r = await fetch(
      `${base}/api/inzicht/classes/${org}:klas/matrix?school=${org}`,
      { headers: { cookie }, cache: 'no-store' },
    );
    assert.equal(r.status, 200);
    const data = await r.json(),
      elapsed_ms = Math.round(performance.now() - start);
    assert.equal(data.rows.length, 30);
    assert.equal(data.skills.length, 100);
    assert(data.rows.every((row) => Object.keys(row.cells).length === 100));
    measurements.push({ run: i + 1, elapsed_ms });
  }
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch();
    try {
      for (let run = 1; run <= 3; run++) {
        const context = await browser.newContext({
          viewport: { width: 1366, height: 1000 },
        });
        await context.addCookies([
          {
            name: '__Host-inzicht_session',
            value: cookie.split('=')[1],
            url: base,
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
          },
        ]);
        const page = await context.newPage();
        const prefetched = [];
        page.on('request', (request) => {
          const url = new URL(request.url());
          if (
            url.pathname.startsWith('/inzicht/') &&
            url.searchParams.has('_rsc')
          )
            prefetched.push(url.pathname);
        });
        const matrixApiPaths = [];
        page.on('request', (request) => {
          const path = new URL(request.url()).pathname;
          if (path.startsWith('/api/inzicht/')) matrixApiPaths.push(path);
        });
        const start = performance.now();
        const document = await page.goto(
          `${base}/inzicht/klassen/${org}:klas/matrix?school=${org}`,
        );
        assert.equal(document.headers()['cache-control'], 'no-store, private');
        await page.locator('.ki-table tbody tr').last().waitFor();
        assert.equal(await page.locator('.ki-table tbody tr').count(), 30);
        assert.equal(await page.locator('.ki-table thead th').count(), 21);
        const elapsed_ms = Math.round(performance.now() - start);
        assert.deepEqual(
          matrixApiPaths.sort(),
          ['/api/inzicht/me', `/api/inzicht/classes/${org}:klas/matrix`].sort(),
          'Matrix needs only identity and its own authorized data',
        );
        assert.equal(
          prefetched.length,
          0,
          'Matrix opening must not prefetch dossiers',
        );
        for (let i = 0; i < 4; i++)
          await page
            .getByRole('button', { name: 'Volgende leerdoelen', exact: true })
            .click();
        assert(
          await page
            .getByRole('button', { name: 'Volgende leerdoelen', exact: true })
            .isDisabled(),
        );
        assert.equal(await page.locator('.ki-table tbody tr').count(), 30);
        assert.equal(await page.locator('.ki-table thead th').count(), 21);
        await page
          .getByRole('link', { name: /bekijk bewijs/ })
          .first()
          .click();
        await page
          .getByRole('link', { name: 'Terug naar de matrix', exact: true })
          .waitFor();
        const timing = await page.evaluate(() => ({
          navigation: performance
            .getEntriesByType('navigation')
            .map((e) => e.toJSON()),
          resources: performance
            .getEntriesByType('resource')
            .map((e) => e.toJSON()),
        }));
        assert(
          !timing.resources.some((r) =>
            new URL(r.name).pathname.includes('/package-exercise-browser-'),
          ),
          'Teacher matrix must not load the exercise player',
        );
        browserMeasurements.push({
          engine,
          run,
          elapsed_ms,
          timing,
          fresh_browser_cache: true,
          all_five_skill_pages: true,
          evidence_link: true,
        });
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
  writeFileSync(
    'docs/inzicht-20261101/evidence/online-performance.json',
    JSON.stringify(
      {
        at,
        origin: base,
        learners: 30,
        skills: 100,
        train_evidence_events: 3000,
        measurements,
        browser_measurements: browserMeasurements,
        threshold_ms: 2000,
        all_under_threshold: [...measurements, ...browserMeasurements].every(
          (m) => m.elapsed_ms < 2000,
        ),
        scope:
          'Full network API and fresh browser-context navigation until 30 learner rows and 20 visible skill columns render, with all five skill pages and evidence navigation checked. MFA completed before the timer. No simultaneous-school or forced Worker cold-start guarantee.',
      },
      null,
      2,
    ),
  );
  assert(
    [...measurements, ...browserMeasurements].every((m) => m.elapsed_ms < 2000),
  );
  console.log(
    'Remote D1 30 × 100 matrix with 3000 TRAIN events: all five network responses and six browser renders below 2 seconds.',
  );
} finally {
  run(['--file', '.wrangler/performance-cleanup.sql']);
  await logoutSessions();
  assert.equal(
    query(`SELECT COUNT(*) n FROM organizations WHERE id='${org}'`)[0].n,
    0,
  );
  assert.equal(query('SELECT COUNT(*) n FROM skill_definitions')[0].n, 3);
}
