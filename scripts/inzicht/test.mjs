import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fixtures } from './fixtures.mjs';
import { sqlite } from './sqlite.mjs';
import { handleInzicht } from '../../lib/inzicht/service.ts';
import {
  computeMastery,
  recommendations,
  canonical,
  hash,
  csvCell,
} from '../../lib/inzicht/rules.ts';

const fixture = await fixtures();
const schema = readdirSync('db/migrations/inzicht')
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(`db/migrations/inzicht/${f}`, 'utf8'))
  .join('\n');
function setup() {
  const db = sqlite();
  db.exec(schema);
  db.exec(fixture.sql);
  const request = async (path, body, options = {}) => {
    const {
      user = 'docent',
      org = 'school-a',
      key = crypto.randomUUID(),
      origin = 'http://localhost',
      cookie = true,
      mode = 'synthetic-local',
    } = options;
    const req = new Request(
      `http://localhost/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=${org}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          ...(cookie
            ? { cookie: `inzicht_session=${fixture.credentials[user]}` }
            : {}),
          ...(body === undefined
            ? {}
            : {
                origin,
                'Content-Type': 'application/json',
                'Idempotency-Key': key,
              }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
    const response = await handleInzicht(req, {
      INZICHT_DB: db,
      INZICHT_MODE: mode,
    });
    const data = response.headers.get('content-type')?.includes('json')
      ? await response.json()
      : await response.text();
    return { status: response.status, data, headers: response.headers };
  };
  const count = (table) =>
    Number(db.connection.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
  const observe = (extra = {}, options) =>
    request(
      'observations',
      {
        class_id: 'school-a:klas',
        learner_id: 'school-a:leerling-1',
        skill_id: 'woordbeeld',
        situation: 'Kiest het woord bij de foto',
        outcome: 'partial',
        independence: 'hint',
        observed_at: new Date().toISOString(),
        ...extra,
      },
      options,
    );
  return { db, request, count, observe };
}
const assertStatus = (result, status) =>
  assert.equal(result.status, status, JSON.stringify(result.data));
const skill = {
  id: 'validated-fixture',
  label: 'Uitsluitend synthetische meetnorm',
  measurement_approved: 1,
  rubric: {
    version: 'fixture-1',
    minimum_items: 5,
    pass_ratio: 0.8,
    stale_days: 30,
  },
};
const asOf = '2026-11-01T12:00:00Z';
const event = (n, extra = {}) => ({
  id: `e${n}`,
  occurred_at: `2026-10-${String(20 + n).padStart(2, '0')}T10:00:00Z`,
  day: `2026-10-${String(20 + n).padStart(2, '0')}`,
  session_id: `session-${n}`,
  item_set: `set-${n}`,
  identity_valid: true,
  source_valid: true,
  relation: 'MEASURE',
  rubric_version: 'fixture-1',
  independent: true,
  feedback_reused: false,
  transfer: n > 1,
  independence: 'independent',
  total: 5,
  correct: 4,
  outcome: 'successful',
  ...extra,
});
const state = (events) => computeMastery(skill, events, asOf);

test('KI001/002 class persists, rename conflict, archive preserves observations', async () => {
  const s = setup();
  const c = await s.request('classes', {
    name: 'Nieuwe klas',
    start_level: 'Alfa A',
  });
  assertStatus(c, 201);
  assert((await s.request('classes')).data.some((g) => g.id === c.data.id));
  await s.observe();
  assertStatus(
    await s.request('classes/school-a:klas', {
      name: 'Andere naam',
      status: 'active',
      expected_version: 1,
    }),
    200,
  );
  assertStatus(
    await s.request('classes/school-a:klas', {
      name: 'Stale',
      status: 'active',
      expected_version: 1,
    }),
    409,
  );
  assertStatus(
    await s.request('classes/school-a:klas', {
      name: 'Archief',
      status: 'archived',
      expected_version: 2,
    }),
    200,
  );
  assert.equal(s.count('teacher_observations'), 1);
  assertStatus(await s.observe(), 409);
});
test('KI003/004/061/062 provisional names persist separately and can be observed', async () => {
  const s = setup();
  const a = await s.request('classes/school-a:klas/learners', {
      name: 'Dubbelnaam',
    }),
    b = await s.request('classes/school-a:klas/learners', {
      name: 'Dubbelnaam',
    });
  assertStatus(a, 201);
  assertStatus(b, 201);
  assert.notEqual(a.data.id, b.data.id);
  assertStatus(await s.observe({ learner_id: a.data.id }), 201);
  assert.equal(
    (await s.request(`learners/${a.data.id}?class=school-a:klas`)).data
      .observations.length,
    1,
  );
  assert.equal(s.count('account_links'), 0);
});
test('KI006/007/008/045/046 observations have revisions, invalidated provenance and no automatic mastery', async () => {
  const s = setup();
  const o = await s.observe();
  assertStatus(o, 201);
  assert.equal(o.data.evidence_eligible, false);
  const corrected = await s.request(`observations/${o.data.id}`, {
    class_id: 'school-a:klas',
    learner_id: 'school-a:leerling-1',
    skill_id: 'woordbeeld',
    situation: 'Gecorrigeerde taak',
    outcome: 'successful',
    independence: 'independent',
    observed_at: new Date().toISOString(),
    expected_revision: 1,
    reason: 'Fout in notitie hersteld',
  });
  assertStatus(corrected, 201);
  const e = await s.request(
    'evidence?class=school-a:klas&learner=school-a:leerling-1&skill=woordbeeld',
  );
  assert.equal(e.data.events.length, 2);
  assert.equal(
    e.data.events.find((event) => event.source_revision === 1).revoked,
    true,
  );
  assert.equal(e.data.mastery.status, 'UNKNOWN');
  assert.equal(s.count('observation_revisions'), 2);
  assert(
    !s.db.connection
      .prepare('SELECT * FROM audit_events')
      .all()
      .some((e) => canonical(e).includes('Gecorrigeerde taak')),
  );
});
test('KI011/012/013/014: unknown, one measure, independent transfer pair, same day', () => {
  assert.equal(state([]).status, 'UNKNOWN');
  assert.equal(state([event(1)]).status, 'DEVELOPING');
  assert.equal(state([event(1), event(2)]).status, 'MASTERED');
  assert.equal(
    state([event(1), event(2, { day: event(1).day })]).status,
    'DEVELOPING',
  );
});
test('KI015/016/017: attention, recheck retains prior mastery, revoked event removed', () => {
  assert(state([event(1, { correct: 1 }), event(2, { correct: 2 })]).attention);
  const m = state([event(1), event(2), event(3, { correct: 1 })]);
  assert.equal(m.status, 'MASTERED');
  assert(m.recheck);
  assert.equal(
    state([event(1), event(2, { revoked: true })]).status,
    'DEVELOPING',
  );
});
test('KI010/024/044/066/067: group response, completion, repeated feedback and TRAIN cannot prove mastery', () => {
  for (const changes of [
    { relation: 'TRAIN' },
    { identity_valid: false },
    { source_valid: false },
    { feedback_reused: true },
    { independent: false },
    { rubric_version: 'unknown' },
  ])
    assert.equal(
      state([event(1, changes), event(2, changes)]).status,
      'UNKNOWN',
    );
  assert.equal(
    state([event(1), event(2, { item_set: event(1).item_set })]).status,
    'DEVELOPING',
  );
  assert.equal(
    computeMastery(
      { ...skill, measurement_approved: 0 },
      [event(1), event(2)],
      asOf,
    ).status,
    'UNKNOWN',
  );
});
test('KI018: matrix drill-down contains the exact saved observation event', async () => {
  const s = setup();
  const o = await s.observe();
  const e = await s.request(
    'evidence?class=school-a:klas&learner=school-a:leerling-1&skill=woordbeeld',
  );
  assert.equal(e.data.events[0].source_id, o.data.id);
  assert.equal(e.data.events[0].source_revision, 1);
});
test('KI022/023/027/053: HOLD never appears, cannot be assigned, absent measure match is explicit', async () => {
  const s = setup();
  s.db.exec("UPDATE content_versions SET release_status='hold'");
  assert.equal(
    (await s.request('classes/school-a:klas/catalog')).data.length,
    0,
  );
  assertStatus(
    await s.request('classes/school-a:klas/assignments', {
      content_id: 'word-mat',
      learner_ids: ['school-a:leerling-1'],
      starts_at: asOf,
    }),
    422,
  );
  const p = await s.request('classes/school-a:klas/recommendations', {
    target_date: '2026-11-02',
    schedule_source: 'UNKNOWN',
  });
  assertStatus(p, 201);
  assert(p.data.suggestions.every((x) => x.content_id === null));
});
test('KI025/026/051/064/065: deterministic 60% coverage gate and honest denominators', () => {
  const unknown = state([]),
    attention = state([event(1, { correct: 1 }), event(2, { correct: 1 })]);
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: `l${i}`,
    cells: {
      [skill.id]: i < 3 ? attention : i === 3 ? state([event(1)]) : unknown,
    },
  }));
  const a = recommendations([skill], rows, []);
  assert(!a.some((x) => x.type === 'whole-class'));
  assert(a.some((x) => x.type === 'small-group'));
  assert(a.every((x) => x.measured === 4 && x.active === 12));
  assert.equal(a.find((x) => x.type === 'diagnostic').learner_ids.length, 8);
  assert.deepEqual(a, recommendations([skill], [...rows].reverse(), []));
  rows.forEach((r, i) => {
    r.cells[skill.id] = i < 4 ? attention : i < 8 ? state([event(1)]) : unknown;
  });
  assert(recommendations([skill], rows, []).some((x) => x.rule_id === 'R-070'));
});
test('KI028/050: stale evidence or role change rejects approval without assignment', async () => {
  const s = setup();
  const p = await s.request('classes/school-a:klas/recommendations', {
    target_date: '2026-11-02',
    schedule_source: 'UNKNOWN',
  });
  await s.observe();
  assertStatus(
    await s.request(`plans/${p.data.id}`, {
      action: 'approve',
      confirmed: true,
      assignments: [],
    }),
    409,
  );
  assert.equal(s.count('approved_lesson_plans'), 0);
  s.db.exec("UPDATE memberships SET status='ended' WHERE id='school-a:docent'");
  assertStatus(
    await s.request(`plans/${p.data.id}`, {
      action: 'approve',
      confirmed: true,
    }),
    403,
  );
});
test('KI029: reject and explicit approve never silently issue an assignment', async () => {
  const s = setup();
  let p = await s.request('classes/school-a:klas/recommendations', {
    target_date: '2026-11-02',
    schedule_source: 'TEACHER_SELECTED',
  });
  assertStatus(
    await s.request(`plans/${p.data.id}`, { action: 'reject' }),
    200,
  );
  p = await s.request('classes/school-a:klas/recommendations', {
    target_date: '2026-11-02',
    schedule_source: 'TEACHER_SELECTED',
  });
  assertStatus(
    await s.request(`plans/${p.data.id}`, {
      action: 'approve',
      confirmed: true,
      assignments: [],
      note: 'Eerst observeren',
    }),
    200,
  );
  assert.equal(s.count('assignments'), 0);
  assert.equal(s.count('approved_lesson_plans'), 1);
});
test('KI030/031/034/040/048: tenant, class, admin, support and revoked teacher denied on reads and writes', async () => {
  const s = setup();
  for (const path of [
    'classes/school-b:klas',
    'classes/school-b:klas/matrix',
    'classes/school-b:klas/export',
    'learners/school-b:leerling-1?class=school-a:klas',
  ])
    assertStatus(await s.request(path), 404);
  for (const user of ['collega', 'beheerder', 'support']) {
    const r = await s.request('classes/school-a:klas', undefined, { user });
    assert([403, 404].includes(r.status));
  }
  s.db.exec("UPDATE memberships SET status='ended' WHERE id='school-a:docent'");
  assertStatus(await s.observe(), 403);
});
test('KI032: logout revokes server session and all data responses are no-store', async () => {
  const s = setup();
  const me = await s.request('me');
  assert.equal(me.headers.get('cache-control'), 'no-store, private');
  assertStatus(await s.request('logout', {}), 200);
  assertStatus(await s.request('classes'), 401);
});
test('KI041: self-created class cannot harvest existing school users', async () => {
  const s = setup();
  const c = await s.request('classes', {
    name: 'Mijn klas',
    start_level: 'Alfa A',
  });
  assertStatus(
    await s.request(`classes/${c.data.id}/learners`, {
      name: 'Bestaat al',
      membership_id: 'school-a:cursist',
    }),
    403,
  );
  assertStatus(await s.request('registrar'), 403);
  assertStatus(
    await s.request('invites', {
      learner_id: 'school-a:leerling-1',
      membership_id: 'school-a:cursist',
      identity_checked: true,
    }),
    403,
  );
  assertStatus(
    await s.request(`learners/school-a:leerling-1?class=${c.data.id}`),
    404,
  );
});
test('KI042/063: invite is account-bound, single use; unlink preserves source and closes access', async () => {
  const s = setup();
  await s.observe();
  const i = await s.request(
    'invites',
    {
      learner_id: 'school-a:leerling-1',
      membership_id: 'school-a:cursist',
      identity_checked: true,
    },
    { user: 'registrar' },
  );
  assertStatus(i, 201);
  assertStatus(
    await s.request(
      'accept-invite',
      { token: i.data.token },
      { user: 'cursist', org: 'school-b' },
    ),
    409,
  );
  const link = await s.request(
    'accept-invite',
    { token: i.data.token },
    { user: 'cursist' },
  );
  assertStatus(link, 200);
  assertStatus(
    await s.request(
      'accept-invite',
      { token: i.data.token },
      { user: 'cursist' },
    ),
    409,
  );
  assertStatus(
    await s.request(
      'school-practice?class=school-a:klas&content=word-mat',
      undefined,
      { user: 'cursist' },
    ),
    200,
  );
  assertStatus(
    await s.request('unlink', { link_id: link.data.id }, { user: 'registrar' }),
    200,
  );
  assert.equal(s.count('teacher_observations'), 1);
  assertStatus(
    await s.request(
      'school-practice?class=school-a:klas&content=word-mat',
      undefined,
      { user: 'cursist' },
    ),
    403,
  );
});
test('KI047: HTTP replay is one observation/event/outbox; different body on same key conflicts', async () => {
  const s = setup();
  const body = { observed_at: new Date().toISOString() };
  const a = await s.observe(body, { key: 'repeat' }),
    b = await s.observe(body, { key: 'repeat' });
  assertStatus(a, 201);
  assert.deepEqual(a.data, b.data);
  assert.equal(s.count('teacher_observations'), 1);
  assert.equal(s.count('evidence_events'), 1);
  assert.equal(s.count('outbox_events'), 1);
  assertStatus(
    await s.observe({ ...body, situation: 'Andere inhoud' }, { key: 'repeat' }),
    409,
  );
});
test('KI049/068: tomorrow without timetable never claims a scheduled lesson', async () => {
  const s = setup();
  const p = await s.request('classes/school-a:klas/recommendations', {
    target_date: '2026-11-01',
    schedule_source: 'UNKNOWN',
  });
  assertStatus(p, 201);
  assert.equal(p.data.schedule_source, 'UNKNOWN');
  assert(p.data.warning.includes('Geen bevestigd rooster'));
  assertStatus(
    await s.request('classes/school-a:klas/recommendations', {
      target_date: '2026-11-01',
      schedule_source: 'VERIFIED_TIMETABLE',
    }),
    400,
  );
});
test('KI052: policy requires current impact preview and explicit confirmation', async () => {
  const s = setup();
  const body = {
    allowed_routes: [],
    exercise_mode: 'assigned',
    learner_id: '*',
  };
  assertStatus(await s.request('classes/school-a:klas/policy', body), 409);
  const preview = await s.request('classes/school-a:klas/policy', {
    ...body,
    preview: true,
  });
  assertStatus(preview, 200);
  assertStatus(
    await s.request('classes/school-a:klas/policy', {
      ...body,
      confirmed: true,
      impact_hash: preview.data.impact_hash,
    }),
    200,
  );
  assert.deepEqual(
    (await s.request('classes/school-a:klas/policy')).data.allowed_routes,
    [],
  );
});
test('KI054/070: successful storage is distinct from idempotent mastery processing', async () => {
  const s = setup();
  const o = await s.observe();
  assert.equal(o.data.mastery_refresh_status, 'QUEUED');
  assert.equal(
    (await s.request('classes/school-a:klas/matrix')).data.pending,
    1,
  );
  assertStatus(await s.request('classes/school-a:klas/matrix', {}), 200);
  assert.equal(
    (await s.request('classes/school-a:klas/matrix')).data.pending,
    0,
  );
  await s.request('classes/school-a:klas/matrix', {});
  assert.equal(s.count('mastery_snapshots'), 1);
});
test('KI069: SQL values remain data; spreadsheet formula export escaped', async () => {
  const s = setup();
  await s.request('classes/school-a:klas/learners', {
    name: '=HYPERLINK("x")',
  });
  const r = await s.request('classes/school-a:klas/export');
  assert.equal(r.status, 200);
  assert(r.data.includes("'=HYPERLINK"));
  assert(csvCell('\t=1+1').startsWith('"\''));
  const o = await s.observe({
    note: "<script>alert(1)</script>'; DROP TABLE users;--",
  });
  assertStatus(o, 201);
  assert.equal(s.count('users'), 6);
});
test('Trust boundary: production disabled, unauthenticated denied, CSRF denied, malformed values rejected', async () => {
  const s = setup();
  assertStatus(await s.request('classes', undefined, { mode: undefined }), 200);
  assertStatus(
    await s.request('classes', undefined, { mode: 'production' }),
    404,
  );
  assertStatus(await s.request('classes', undefined, { cookie: false }), 401);
  assertStatus(
    await s.request(
      'classes',
      { name: 'a', start_level: 'Alfa A' },
      { origin: 'https://evil.invalid' },
    ),
    403,
  );
  assertStatus(
    await s.request('classes', { name: 'a', start_level: 'B2' }),
    400,
  );
  assertStatus(await s.observe({ observed_at: 'not-a-date' }), 400);
  assertStatus(await s.observe({ note: 'x'.repeat(1001) }), 400);
});
test('Database itself rejects cross-tenant enrollment and teacher references', () => {
  const s = setup();
  assert.throws(
    () =>
      s.db.exec(
        "INSERT INTO group_memberships VALUES ('school-a','school-a:klas','school-b:leerling-1','active','2026-11-01',NULL)",
      ),
    /FOREIGN KEY/,
  );
  assert.throws(
    () =>
      s.db.exec(
        "INSERT INTO group_teachers VALUES ('school-a','school-a:klas','school-b:collega')",
      ),
    /FOREIGN KEY/,
  );
});
test('KI035: 30 × 100 computed matrix, documented local synthetic timing', async () => {
  const s = setup();
  for (let i = 13; i <= 30; i++)
    s.db.exec(
      `INSERT INTO school_learners VALUES ('perf-${i}','school-a','Fictief ${i}','school-a:docent','2026-11-01');INSERT INTO group_memberships VALUES ('school-a','school-a:klas','perf-${i}','active','2026-11-01',NULL);`,
    );
  for (let i = 3; i < 100; i++)
    s.db.connection
      .prepare('INSERT INTO skill_definitions VALUES (?,?,?,?,?,?,0)')
      .run(
        `perf-${i}`,
        `Testdoel ${i}`,
        'test',
        'Alfa A',
        'draft-1',
        canonical(skill.rubric),
      );
  const t = performance.now();
  const result = await s.request('classes/school-a:klas/matrix');
  const elapsed = performance.now() - t;
  assertStatus(result, 200);
  assert.equal(result.data.rows.length, 30);
  assert.equal(result.data.skills.length, 100);
  assert(elapsed < 2000, `local SQLite matrix ${elapsed}ms`);
  console.log(
    `30x100 SQLite service: ${elapsed.toFixed(1)}ms, no network, warm runtime; not a production SLO`,
  );
});

test('KI002/005/021 school attempts survive reads, reject altered assignment context and revoked policy', async () => {
  const s = setup();
  const invite = await s.request(
    'invites',
    {
      learner_id: 'school-a:leerling-1',
      membership_id: 'school-a:cursist',
      identity_checked: true,
    },
    { user: 'registrar' },
  );
  assertStatus(invite, 201);
  assertStatus(
    await s.request(
      'accept-invite',
      { token: invite.data.token },
      { user: 'cursist' },
    ),
    200,
  );
  const assignment = await s.request('classes/school-a:klas/assignments', {
    content_id: 'word-mat',
    learner_ids: ['school-a:leerling-1'],
    starts_at: new Date(Date.now() - 1000).toISOString(),
    instructions: 'Oefenen',
  });
  assertStatus(assignment, 201);
  const path = `school-practice?class=school-a:klas&content=word-mat&assignment=${assignment.data.id}`;
  const access = await s.request(path, undefined, { user: 'cursist' });
  assertStatus(access, 200);
  const answer =
    access.data.content.metadata.exercise.answer.correctOptionIds[0];
  const key = crypto.randomUUID();
  assertStatus(
    await s.request(path, { answer }, { user: 'cursist', key }),
    201,
  );
  assertStatus(
    await s.request(path, { answer }, { user: 'cursist', key }),
    201,
  );
  assert.equal(s.count('school_attempts'), 1);
  for (const event of s.db.connection
    .prepare('SELECT payload,event_hash FROM evidence_events')
    .all())
    assert.equal(event.event_hash, await hash(JSON.parse(event.payload)));
  assertStatus(
    await s.request(
      path.replace('content=word-mat', 'content=word-man'),
      { answer },
      { user: 'cursist', key },
    ),
    403,
  );
  assert.equal(
    (await s.request('my-school', undefined, { user: 'cursist' })).data.attempts
      .length,
    1,
  );
  assert.equal(
    (
      await s.request('my-school', undefined, {
        user: 'cursist',
        org: 'school-b',
      })
    ).data.attempts.length,
    0,
  );
  assertStatus(
    await s.request('classes/school-a:klas', {
      name: 'Archief',
      status: 'archived',
      expected_version: 1,
    }),
    200,
  );
  assert.equal(
    (await s.request('my-school', undefined, { user: 'cursist' })).data
      .assignments.length,
    0,
  );
  assertStatus(await s.request(path, undefined, { user: 'cursist' }), 403);
  assertStatus(
    await s.request('classes/school-a:klas', {
      name: 'Heropend',
      status: 'active',
      expected_version: 2,
    }),
    200,
  );
  assert.equal(
    (await s.request('my-school', undefined, { user: 'cursist' })).data
      .assignments.length,
    1,
  );
  const policy = {
    learner_id: '*',
    allowed_routes: [],
    exercise_mode: 'assigned',
  };
  const preview = await s.request('classes/school-a:klas/policy', {
    ...policy,
    preview: true,
  });
  assertStatus(
    await s.request('classes/school-a:klas/policy', {
      ...policy,
      confirmed: true,
      impact_hash: preview.data.impact_hash,
    }),
    200,
  );
  assert.equal(
    (await s.request('my-school', undefined, { user: 'cursist' })).data
      .assignments.length,
    0,
  );
  assertStatus(await s.request(path, { answer }, { user: 'cursist' }), 403);
  assert.equal(s.count('school_attempts'), 1);
});

test('KI005/019/020/043: multiple classes, explicit context, individual override, registrar enrollment', async () => {
  const s = setup();
  const i = await s.request(
    'invites',
    {
      learner_id: 'school-a:leerling-1',
      membership_id: 'school-a:cursist',
      identity_checked: true,
    },
    { user: 'registrar' },
  );
  await s.request(
    'accept-invite',
    { token: i.data.token },
    { user: 'cursist' },
  );
  const second = await s.request('classes', {
    name: 'Tweede klas',
    start_level: 'Alfa B',
  });
  const enrollment = {
    class_id: second.data.id,
    learner_id: 'school-a:leerling-1',
    status: 'active',
    confirmed: true,
  };
  assertStatus(await s.request('enrollments', enrollment), 403);
  assertStatus(
    await s.request('enrollments', enrollment, { user: 'registrar' }),
    200,
  );
  assert.equal(
    (await s.request('my-school', undefined, { user: 'cursist' })).data.classes
      .length,
    2,
  );
  const deny = { learner_id: '*', allowed_routes: [], exercise_mode: 'free' };
  const change = async (g, p) => {
    const preview = await s.request(`classes/${g}/policy`, {
      ...p,
      preview: true,
    });
    return s.request(`classes/${g}/policy`, {
      ...p,
      confirmed: true,
      impact_hash: preview.data.impact_hash,
    });
  };
  assertStatus(await change(second.data.id, deny), 200);
  assertStatus(
    await s.request(
      `school-practice?class=${second.data.id}&content=word-mat`,
      undefined,
      { user: 'cursist' },
    ),
    403,
  );
  assertStatus(
    await s.request(
      'school-practice?class=school-a:klas&content=word-mat',
      undefined,
      { user: 'cursist' },
    ),
    200,
  );
  assertStatus(
    await s.request('school-practice?content=word-mat', undefined, {
      user: 'cursist',
    }),
    403,
  );
  assertStatus(
    await change(second.data.id, {
      learner_id: 'school-a:leerling-1',
      allowed_routes: ['Alfa A'],
      exercise_mode: 'free',
    }),
    200,
  );
  assertStatus(
    await s.request(
      `school-practice?class=${second.data.id}&content=word-mat`,
      undefined,
      { user: 'cursist' },
    ),
    200,
  );
  assertStatus(
    await s.request(
      'enrollments',
      { ...enrollment, learner_id: 'school-a:leerling-2' },
      { user: 'registrar' },
    ),
    200,
  );
  assert.deepEqual(
    (
      await s.request(
        `classes/${second.data.id}/policy?learner=school-a:leerling-2`,
      )
    ).data.allowed_routes,
    [],
  );
  assertStatus(
    await s.request(
      'enrollments',
      { ...enrollment, status: 'ended' },
      { user: 'registrar' },
    ),
    200,
  );
  assertStatus(
    await s.request(
      `school-practice?class=${second.data.id}&content=word-mat`,
      undefined,
      { user: 'cursist' },
    ),
    404,
  );
});
