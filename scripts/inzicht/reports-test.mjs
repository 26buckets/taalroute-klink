import {
  buildReport,
  distribution,
  hoursAt,
} from '../../lib/inzicht/reports.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sqlite } from './sqlite.mjs';
import { handleInzicht } from '../../lib/inzicht/service.ts';
import { hash, canonical, ROUTES } from '../../lib/inzicht/rules.ts';
import {
  sourceMaterials,
  sourceCriteria,
} from '../../lib/inzicht/source-observation.ts';

const schema = readdirSync('db/migrations/inzicht')
  .filter((x) => x.endsWith('.sql'))
  .sort()
  .map((x) => readFileSync(`db/migrations/inzicht/${x}`, 'utf8'))
  .join('\n');
async function setup() {
  const db = sqlite();
  db.exec(schema);
  const token = 'a'.repeat(64);
  const t = new Date().toISOString();
  const q = (sql, ...args) => db.connection.prepare(sql).run(...args);
  q(
    'INSERT INTO users VALUES (?,?,?)',
    'teacher',
    'synthetic:teacher',
    'active',
  );
  q(
    'INSERT INTO inzicht_sessions VALUES (?,?,?,?)',
    await hash(token),
    'teacher',
    new Date(Date.now() + 3600000).toISOString(),
    0,
  );
  for (const org of ['school-a', 'school-b']) {
    const teacher = `${org}:teacher`;
    q(
      'INSERT INTO organizations VALUES (?,?,?,?,?)',
      org,
      'Fictieve school',
      'active',
      canonical(ROUTES),
      1,
    );
    q(
      'INSERT INTO memberships VALUES (?,?,?,?,?,?)',
      teacher,
      org,
      'teacher',
      'active',
      'teacher',
      1,
    );
    const gid = `${org}:class`;
    q(
      'INSERT INTO groups VALUES (?,?,?,?,?,?,?,?)',
      gid,
      org,
      'Oefenklas',
      'Alfa A',
      '',
      'active',
      1,
      t,
    );
    q('INSERT INTO group_teachers VALUES (?,?,?)', org, gid, teacher);
    for (const id of ['student-1', 'student-2']) {
      const lid = `${org}:${id}`;
      q(
        'INSERT INTO school_learners VALUES (?,?,?,?,?)',
        lid,
        org,
        `Test ${id}`,
        teacher,
        t,
      );
      q(
        'INSERT INTO group_memberships VALUES (?,?,?,?,?,?)',
        org,
        gid,
        lid,
        'active',
        t,
        null,
      );
    }
  }
  q('DELETE FROM group_teachers WHERE organization_id=?', 'school-b');
  async function call(path, body, options = {}) {
    const req = new Request(
      `http://localhost/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=${options.org ?? 'school-a'}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          cookie: `inzicht_session=${token}`,
          ...(body === undefined
            ? {}
            : {
                origin: 'http://localhost',
                'Content-Type': 'application/json',
                'Idempotency-Key': options.key ?? crypto.randomUUID(),
              }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
    const response = await handleInzicht(req, {
      INZICHT_DB: db,
      INZICHT_MODE: 'synthetic-local',
    });
    return { status: response.status, data: await response.json() };
  }
  return { db, call };
}
function draft(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    class_id: 'school-a:class',
    learner_id: 'school-a:student-1',
    material_id: 'mat',
    mode: 'word',
    values: [0, 1, 2, null, null, null],
    note: 'Toont mat bij de deur',
    next: 'Andere woorden lezen',
    observed_at: new Date().toISOString(),
    expected_revision: 0,
    ...overrides,
  };
}
test('four marks, empty data and absent hours never become zero performance', () => {
  assert.deepEqual(distribution([0, 1, 2, null]), {
    independent: 1,
    supported: 1,
    unobserved: 1,
    empty: 1,
    total: 4,
    assessed: 2,
    coverage: 0.5,
  });
  assert.equal(distribution([]).coverage, null);
  assert.equal(distribution([null, 2]).assessed, 0);
  assert.equal(hoursAt([], 'x', '2026-11-01'), null);
  assert.equal(
    hoursAt(
      [{ learner_id: 'x', attended_at: '2026-10-01', minutes: 0 }],
      'x',
      '2026-11-01',
    ),
    0,
  );
});
test('groups isolate tasks, periods, versions, conditions and levels; equal learner weighting and k threshold', () => {
  const learners = Array.from({ length: 6 }, (_, i) => ({
    id: String(i),
    display_name: 'Fictief',
    started_at: '2026-01-01',
    ended_at: null,
  }));
  const observation = (i, extra = {}) => ({
    id: crypto.randomUUID(),
    learner_id: String(i),
    current_revision: 1,
    author_id: 'teacher',
    payload: {
      source: 'original',
      source_version: 2,
      mode: 'word',
      material_id: 'mat',
      values: [0, 1, 2, null, 0, 1],
      observed_at: '2026-10-20T12:00:00Z',
      level: 'Alfa A',
      condition: 'Gelijke afname',
      ...extra,
    },
  });
  const observations = learners.slice(0, 5).map((_, i) => observation(i));
  const input = { learners, observations, hours: [] };
  let r = buildReport(input, {});
  assert.deepEqual(r.mix, ['Alfa A: 5 cursisten']);
  assert.equal(r.groups[0].n, 5);
  assert.equal(r.groups[0].medianIndependent, 0.5);
  assert.equal(r.groups[0].coverage, 5 / 6);
  assert.equal(r.groups[0].criteria[2].meanIndependent, null);
  input.observations.push(
    observation(0, {
      observed_at: '2026-10-21T12:00:00Z',
      values: [1, 1, 2, null, 1, 1],
    }),
  );
  r = buildReport(input, {});
  assert.equal(r.groups[0].n, 5);
  assert.equal(r.groups[0].criteria[0].meanIndependent, 0.8);
  for (const extra of [
    { mode: 'sentence' },
    { material_id: 'tas' },
    { level: 'Alfa B' },
    { condition: 'Andere afname' },
    { source_version: 3 },
    { observed_at: '2026-09-20T12:00:00Z' },
  ])
    input.observations.push(observation(5, extra));
  input.observations.push(observation(5, { condition: '' }));
  r = buildReport(input, {});
  assert.equal(r.groups.length, 7);
  assert.equal(r.excluded, 1);
  assert.equal(r.groups.filter((g) => g.suppressed).length, 6);
  for (const g of r.groups.filter((g) => g.suppressed)) {
    assert.equal(g.medianIndependent, null);
    assert.equal(g.distribution, null);
  }
  assert.equal(buildReport(input, { minHours: 0 }).points.length, 0);
});
test('history, authorized export, all states and latest corrected reports are school-bound', async () => {
  const { call, db } = await setup();
  const b = draft({ level: 'Alfa A', condition: 'Zelfde taak' });
  assert.equal((await call('source-observations', b)).status, 201);
  assert.equal(
    (
      await call('source-observations', {
        ...b,
        expected_revision: 1,
        values: [null, 2, 1, 0, null, 2],
        reason: 'Registratie gecorrigeerd',
      })
    ).status,
    201,
  );
  let r = await call(
    `source-observations/${b.id}/export?class=${b.class_id}&learner=${b.learner_id}&revision=1`,
  );
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.payload.values, b.values);
  assert.equal(r.data.history.length, 2);
  assert.equal(r.data.observation.learner_name, 'Test student-1');
  r = await call(`visual-reports?class=${b.class_id}&learner=${b.learner_id}`);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.points.length, 1);
  assert.equal(r.data.points[0].current_revision, 2);
  assert.equal(r.data.total.empty, 2);
  assert.equal(r.data.proofs.length, 0);
  for (const path of [
    `source-observations/${b.id}/export?class=school-b:class&learner=school-b:student-1`,
    `visual-reports?class=school-b:class`,
  ])
    assert.equal(
      (await call(path, undefined, { org: 'school-b' })).status,
      404,
    );
  assert.equal(
    (
      await call(
        `source-observations/${b.id}?class=${b.class_id}&learner=school-a:student-2`,
      )
    ).status,
    404,
  );
  assert.equal(
    (await call(`visual-reports?class=${b.class_id}&minHours=NaN`)).status,
    400,
  );
  db.exec(
    "UPDATE memberships SET role='school_admin' WHERE organization_id='school-a'",
  );
  assert.equal((await call(`visual-reports?class=${b.class_id}`)).status, 403);
  assert.equal(
    (
      await call(
        `source-observations/${b.id}/export?class=${b.class_id}&learner=${b.learner_id}`,
      )
    ).status,
    403,
  );
});
test('actual minutes preserve revisions, idempotence, zero corrections and authorization', async () => {
  const { call, db } = await setup();
  const b = {
    id: crypto.randomUUID(),
    class_id: 'school-a:class',
    learner_id: 'school-a:student-1',
    expected_revision: 0,
    attended_at: new Date(Date.now() - 3600000).toISOString(),
    minutes: 90,
    reason: 'Aanwezigheidsregistratie',
  };
  const key = crypto.randomUUID();
  const a = await call('learning-hours', b, { key });
  assert.equal(a.status, 201, JSON.stringify(a.data));
  assert.deepEqual((await call('learning-hours', b, { key })).data, a.data);
  assert.equal(
    (await call('learning-hours', { ...b, minutes: 60 }, { key })).status,
    409,
  );
  assert.equal(
    (
      await call('learning-hours', {
        ...b,
        expected_revision: 1,
        minutes: 0,
        reason: 'Dubbele registratie ingetrokken',
      })
    ).status,
    201,
  );
  assert.equal(
    (await call('learning-hours', { ...b, expected_revision: 1 })).status,
    409,
  );
  const h = await call(
    `learning-hours?class=${b.class_id}&learner=${b.learner_id}`,
  );
  assert.equal(h.data.length, 2);
  assert.equal(h.data[0].minutes, 90);
  assert.equal(h.data[1].minutes, 0);
  const report = await call(`visual-reports?class=${b.class_id}`);
  assert.equal(report.data.hours.length, 1);
  assert.equal(report.data.hours[0].minutes, 0);
  for (const minutes of [-1, 721, 1.5, null])
    assert.equal(
      (await call('learning-hours', { ...b, id: crypto.randomUUID(), minutes }))
        .status,
      400,
    );
  db.exec("DELETE FROM group_teachers WHERE organization_id='school-a'");
  assert.equal(
    (await call('learning-hours', { ...b, id: crypto.randomUUID() })).status,
    404,
  );
});
test(
  'instrument catalog exactly matches the archived original',
  { skip: !process.env.OBSERVATION_ORIGINAL_HTML },
  () => {
    const source = readFileSync(process.env.OBSERVATION_ORIGINAL_HTML, 'utf8');
    const original = JSON.parse(
      source.match(/const materials = (\[.*?\]);/s)[1],
    );
    assert.deepEqual(sourceMaterials, original);
    const word = source.match(/const wordCriteria = (\[.*?\]);/s)[1];
    assert.deepEqual(
      sourceCriteria('word', 'mat'),
      JSON.parse(word.replaceAll("'", '"')),
    );
  },
);
test('schema 7 observations and attendance restore losslessly without credentials', async () => {
  const { snapshot, restore } = await import('./portable.mjs');
  const { mkdtempSync, mkdirSync } = await import('node:fs');
  const { call, db } = await setup();
  const b = draft();
  assert.equal((await call('source-observations', b)).status, 201);
  assert.equal(
    (
      await call('source-observations', {
        ...b,
        expected_revision: 1,
        values: [2, null, 0, 1, null, 2],
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await call('learning-hours', {
        id: crypto.randomUUID(),
        class_id: b.class_id,
        learner_id: b.learner_id,
        expected_revision: 0,
        attended_at: new Date(Date.now() - 1000).toISOString(),
        minutes: 60,
        reason: 'Fictieve aanwezigheidsproef',
      })
    ).status,
    201,
  );
  const bundle = await snapshot(db.connection);
  assert.equal(bundle.schema_version, 7);
  assert.equal(bundle.data.source_observation_revisions.length, 2);
  assert.equal(bundle.data.learning_hour_revisions.length, 1);
  assert(!bundle.data.inzicht_sessions);
  assert(!bundle.data.inzicht_mfa);
  mkdirSync('.wrangler/visual-restore', { recursive: true });
  const dir = mkdtempSync('.wrangler/visual-restore/run-');
  const restored = await restore(bundle, `${dir}/restored.sqlite`);
  assert.deepEqual((await snapshot(restored)).data, bundle.data);
  restored.close();
});
test('no total median across different assessed criteria or a silently changing cohort', () => {
  const learners = Array.from({ length: 6 }, (_, i) => ({
    id: String(i),
    display_name: 'Fictief',
    started_at: '2026-01-01',
    ended_at: null,
  }));
  const observations = Array.from({ length: 6 }, (_, i) => ({
    id: `o${i}`,
    learner_id: String(i),
    payload: {
      source: 's',
      source_version: 2,
      mode: 'word',
      material_id: 'mat',
      level: 'Alfa A',
      condition: 'c',
      observed_at: '2026-09-01',
      values: Array.from({ length: 6 }, (_, j) => (j === i ? 0 : null)),
    },
  }));
  let r = buildReport({ learners, observations, hours: [] }, {});
  assert.equal(r.groups[0].medianIndependent, null);
  assert.equal(r.groups[0].commonCriteria.length, 0);
  observations.push(
    ...observations.slice(0, 5).map((o) => ({
      ...o,
      id: o.id + 'next',
      payload: { ...o.payload, observed_at: '2026-10-01' },
    })),
  );
  r = buildReport({ learners, observations, hours: [] }, {});
  assert.equal(r.groups[1].sameCohortAsPrevious, false);
});

test('backdated observations outside class membership do not inflate group coverage', () => {
  const report = buildReport(
    {
      learners: [
        {
          id: 'x',
          display_name: 'Fictief',
          started_at: '2026-11-01T12:00:00Z',
          ended_at: null,
        },
      ],
      hours: [],
      observations: [
        {
          id: 'o',
          learner_id: 'x',
          current_revision: 1,
          author_id: 'teacher',
          payload: {
            source: 'original',
            source_version: 1,
            mode: 'word',
            material_id: 'mat',
            values: [0, 0, 0, 0, 0, 0],
            observed_at: '2026-10-01T12:00:00Z',
            level: 'Alfa A',
            condition: 'Gelijke afname',
          },
        },
      ],
    },
    {},
  );
  assert.equal(report.points.length, 1);
  assert.equal(report.groups.length, 0);
  assert.equal(report.excluded, 1);
});
