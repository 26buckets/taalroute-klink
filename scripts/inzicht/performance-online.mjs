import assert from 'node:assert/strict';
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
run(['--file', '.wrangler/performance-seed.sql']);
try {
  const cookie = await apiCookie('docent'),
    measurements = [];
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
        threshold_ms: 2000,
        all_under_threshold: measurements.every((m) => m.elapsed_ms < 2000),
        scope:
          'Full network API response from this Mac; not cold-start guarantee, simultaneous school benchmark or whole-browser render SLO.',
      },
      null,
      2,
    ),
  );
  assert(measurements.every((m) => m.elapsed_ms < 2000));
  console.log(
    'Remote D1 30 × 100 matrix with 3000 TRAIN events: all five complete network responses below 2 seconds.',
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
