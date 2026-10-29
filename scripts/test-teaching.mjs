import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { teachingRequest, newCode, codeHash } from '../lib/teaching-server.ts';
import { teachingCatalog } from '../lib/teaching.ts';

// Execute the actual SQL against SQLite; D1's batch commits or rolls back together.
function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(
    readFileSync(
      new URL('../drizzle/0001_teaching.sql', import.meta.url),
      'utf8',
    ),
  );
  function prepare(query) {
    let values = [];
    return {
      bind(...args) {
        values = args;
        return this;
      },
      async first() {
        return sql.prepare(query).get(...values) ?? null;
      },
      async all() {
        return { results: sql.prepare(query).all(...values) };
      },
      async run() {
        return query.startsWith('SELECT')
          ? { results: sql.prepare(query).all(...values), meta: { changes: 0 } }
          : { meta: sql.prepare(query).run(...values), results: [] };
      },
    };
  }
  return {
    sql,
    prepare,
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        sql.exec('COMMIT');
        return results;
      } catch (e) {
        sql.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
function client(db, role, ip) {
  let cookie = '';
  return async (body, options = {}) => {
    const headers = {
      origin: 'https://klink.test',
      cookie,
      'cf-connecting-ip': ip,
      ...options.headers,
    };
    const response = await teachingRequest(
      new Request(`https://klink.test/api/teaching?role=${role}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        ...(body === undefined
          ? {}
          : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
      }),
      db,
    );
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  };
}
async function teacher(db, id) {
  const code = newCode('teacher');
  db.sql
    .prepare('INSERT INTO teaching_teachers VALUES (?,?,?)')
    .run(id, `Docent ${id}`, await codeHash(code));
  const call = client(db, 'teacher', id);
  const login = await call({ action: 'login', code });
  assert.equal(login.status, 200);
  assert.match(
    login.headers.get('set-cookie'),
    /HttpOnly; SameSite=Strict; Max-Age=28800; Secure/,
  );
  return call;
}
test('codes, owner isolation, complete flow, duplicate assignment and revocation', async () => {
  const db = database();
  const first = await teacher(db, 'one'),
    other = await teacher(db, 'two');
  const group = (await first({ action: 'create-group', name: 'Maandag' })).body
    .id;
  const otherGroup = (await other({ action: 'create-group', name: 'Dinsdag' }))
    .body.id;
  const learner = (
    await first({ action: 'create-learner', groupId: group, name: 'Samira' })
  ).body;
  const second = (
    await first({ action: 'create-learner', groupId: group, name: 'Ravi' })
  ).body;
  const outsider = (
    await other({ action: 'create-learner', groupId: otherGroup, name: 'Noor' })
  ).body;
  assert.match(learner.code, /^\d{16}$/);
  assert.notEqual(learner.code, second.code);
  assert.equal(
    (
      await first({
        action: 'create-learner',
        groupId: otherGroup,
        name: 'Blocked',
      })
    ).status,
    404,
  );
  for (const action of [
    'rename-group',
    'rename-learner',
    'reset-code',
    'assign',
  ])
    assert.equal(
      (
        await other({
          action,
          groupId: group,
          learnerId: learner.id,
          name: 'Blocked',
        })
      ).status,
      404,
    );
  const assignment = {
    action: 'assign',
    groupId: group,
    learnerIds: [learner.id, second.id],
    packageId: teachingCatalog[0].id,
    lessonId: teachingCatalog[0].lessons[0].id,
  };
  assert.equal(
    (await first({ ...assignment, learnerIds: [learner.id, outsider.id] }))
      .status,
    400,
  );
  assert.equal((await first()).body.assignments.length, 0);
  assert.equal(
    (await first({ ...assignment, lessonId: 'not-a-lesson' })).status,
    400,
  );
  assert.equal(
    (await first({ ...assignment, learnerIds: [learner.id, learner.id] }))
      .status,
    400,
  );
  assert.equal((await first(assignment)).body.added, 2);
  assert.equal((await first(assignment)).body.added, 0);
  const roster = (await first()).body;
  assert.equal(roster.learners.length, 2);
  assert.equal(roster.groups.length, 1);
  assert(!JSON.stringify(roster).includes('code'));
  const own = client(db, 'learner', 'learner-one');
  assert.equal(
    (
      await own({
        action: 'login',
        code: learner.code.match(/.{4}/g).join(' - '),
      })
    ).status,
    200,
  );
  const ownList = (await own()).body.assignments;
  assert.equal(ownList.length, 1);
  assert.equal(
    (await own({ action: 'create-group', name: 'Blocked' })).status,
    403,
  );
  const foreign = roster.assignments.find((a) => a.learner_id === second.id);
  assert.equal((await own({ action: 'complete', id: foreign.id })).status, 404);
  assert.equal(
    (await own({ action: 'complete', id: ownList[0].id })).status,
    200,
  );
  const finished = (await own()).body.assignments[0].completed_at;
  await own({ action: 'complete', id: ownList[0].id });
  assert.equal((await own()).body.assignments[0].completed_at, finished);
  assert.equal(
    (await first()).body.assignments.filter((a) => a.completed_at).length,
    1,
  );
  assert.equal((await other()).body.assignments.length, 0);
  await first({ action: 'rename-group', groupId: group, name: 'Woensdag' });
  await first({
    action: 'rename-learner',
    groupId: group,
    learnerId: learner.id,
    name: 'Samira A.',
  });
  assert.equal((await own()).body.person.name, 'Samira A.');
  const reset = await first({
    action: 'reset-code',
    groupId: group,
    learnerId: learner.id,
  });
  assert.equal((await own()).status, 401);
  assert.equal(
    (await own({ action: 'login', code: learner.code })).status,
    401,
  );
  assert.equal(
    (await own({ action: 'login', code: reset.body.code })).status,
    200,
  );
  await own({ action: 'logout' });
  assert.equal((await own()).status, 401);
  await first({ action: 'logout' });
  assert.equal((await first()).status, 401);
  db.sql.close();
});
test('request boundaries, rate limit, expiry, missing role, secrets hashed', async () => {
  const db = database(),
    call = await teacher(db, 'boundary');
  assert.equal(
    (
      await call(
        { action: 'create-group', name: 'X' },
        { headers: { origin: 'https://other.test' } },
      )
    ).status,
    403,
  );
  for (const input of ['{broken', '[]', 'null'])
    assert.equal((await call(input)).status, 400);
  assert.equal((await call(' '.repeat(16001))).status, 413);
  for (const name of ['', ' ', 'a'.repeat(81), 'bad\nname'])
    assert.equal((await call({ action: 'create-group', name })).status, 400);
  const bad = client(db, 'teacher', 'guesser');
  for (let i = 0; i < 20; i++)
    assert.equal((await bad({ action: 'login', code: 'WRONG' })).status, 401);
  assert.equal((await bad({ action: 'login', code: 'WRONG' })).status, 429);
  db.sql.prepare('UPDATE teaching_sessions SET expires_at = 0').run();
  assert.equal((await call()).status, 401);
  const row = db.sql.prepare('SELECT code_hash FROM teaching_teachers').get();
  assert.match(row.code_hash, /^[0-9a-f]{64}$/);
  assert.equal(
    (
      await teachingRequest(
        new Request('https://klink.test/api/teaching?role=admin'),
        db,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await teachingRequest(
        new Request('http://klink.test/api/teaching?role=teacher'),
        db,
      )
    ).status,
    403,
  );
  db.sql.close();
});
