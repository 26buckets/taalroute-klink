import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { sqlite } from './sqlite.mjs';
import { fixtures } from './fixtures.mjs';
import { passwordHash, passwordMatches } from '../../lib/inzicht/auth.ts';
import { handleInzicht, processPending } from '../../lib/inzicht/service.ts';
import { hash } from '../../lib/inzicht/rules.ts';
import { seal } from '../../lib/inzicht/mfa.ts';
const mfaKey = 'a'.repeat(64);
const mfaSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const origin = 'https://klink-inzicht-pr8-staging.nico-554.workers.dev';
const password = 'Fictieve-wachtwoord-test-alleen-2026';
const encoded = await passwordHash(password);
async function setup() {
  const db = sqlite();
  for (const f of readdirSync('db/migrations/inzicht').sort())
    db.exec(readFileSync(`db/migrations/inzicht/${f}`, 'utf8'));
  db.exec((await fixtures()).sql);
  db.exec('DELETE FROM inzicht_sessions');
  db.connection
    .prepare('INSERT INTO inzicht_credentials VALUES (?,?,?,?)')
    .run(
      'docent',
      'docent@klink-test.invalid',
      encoded,
      new Date().toISOString(),
    );
  db.connection
    .prepare('INSERT INTO inzicht_mfa VALUES (?,?,?,?)')
    .run(
      'docent',
      seal(mfaSecret, 'docent', mfaKey),
      -1,
      new Date().toISOString(),
    );
  const recovery = Array.from({ length: 8 }, (_, i) =>
    (i + 1).toString(16).padStart(32, '0'),
  );
  for (const code of recovery)
    db.connection
      .prepare('INSERT INTO inzicht_mfa_recovery VALUES (?,?,NULL)')
      .run('docent', await hash(`docent:${code}`));
  const request = (path, body, cookie = '', extra = {}) =>
    handleInzicht(
      new Request(`${origin}/api/inzicht/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          origin,
          'Content-Type': 'application/json',
          cookie,
          'CF-Connecting-IP': '192.0.2.1',
          'Idempotency-Key': crypto.randomUUID(),
          ...extra,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      {
        INZICHT_MODE: 'synthetic-online',
        INZICHT_DB: db,
        INZICHT_ORIGIN: origin,
        INZICHT_MFA_KEY: mfaKey,
      },
    );
  const login = async () => {
    const first = await request('login', {
      email: 'docent@klink-test.invalid',
      password,
    });
    if (first.status !== 200) return first;
    const cookie = first.headers
      .getSetCookie()
      .find((s) => s.startsWith('__Host-inzicht_mfa='));
    return request('mfa', { code: recovery.shift() }, cookie);
  };
  return { db, request, login };
}
test('salted scrypt rejects wrong, oversized and malformed credentials', async () => {
  assert(await passwordMatches(password, encoded));
  assert.notEqual(encoded, await passwordHash(password));
  for (const bad of ['incorrect', 'x'.repeat(201)])
    assert.equal(await passwordMatches(bad, encoded), false);
  assert.equal(await passwordMatches(password, 'malformed'), false);
});
test('online login creates only hashed server session and a secure host cookie', async () => {
  const s = await setup();
  const r = await s.login();
  assert.equal(r.status, 200);
  const cookie = r.headers
    .getSetCookie()
    .find((s) => s.startsWith('__Host-inzicht_session='));
  assert.match(
    cookie,
    /^__Host-inzicht_session=[a-f0-9]{64}; HttpOnly; SameSite=Strict; Path=\/; Max-Age=28800; Secure$/,
  );
  const token = cookie.split(';')[0].split('=')[1];
  assert(
    s.db.connection
      .prepare('SELECT * FROM inzicht_sessions WHERE token_hash=?')
      .get(await hash(token)),
  );
  assert.equal((await s.request('me', undefined, cookie)).status, 200);
  assert.equal(
    (await s.request('me', undefined, `inzicht_session=${token}`)).status,
    401,
  );
  assert.equal((await s.request('session', { token })).status, 404);
  assert.equal((await s.request('me')).status, 401);
});
test('incorrect and unknown account use identical errors; attempts are bounded', async () => {
  const s = await setup();
  const bad = await s.request('login', {
    email: 'docent@klink-test.invalid',
    password: 'wrong',
  });
  const unknown = await s.request('login', {
    email: 'unknown@klink-test.invalid',
    password: 'wrong',
  });
  assert.equal(bad.status, 401);
  assert.deepEqual(await bad.json(), await unknown.json());
  for (let i = 0; i < 9; i++)
    assert.equal(
      (
        await s.request('login', {
          email: 'docent@klink-test.invalid',
          password: 'wrong',
        })
      ).status,
      401,
    );
  assert.equal((await s.login()).status, 429);
});
test('host, scheme, origin, disabled account and local token are refused online', async () => {
  const s = await setup();
  assert.equal(
    (
      await s.request(
        'login',
        { email: 'docent@klink-test.invalid', password },
        '',
        { origin: 'https://evil.invalid' },
      )
    ).status,
    403,
  );
  for (const host of [
    'https://klink.taalroute.nl',
    'http://klink-inzicht-pr8-staging.nico-554.workers.dev',
  ])
    assert.equal(
      (
        await handleInzicht(new Request(`${host}/api/inzicht/me`), {
          INZICHT_DB: s.db,
          INZICHT_MODE: 'synthetic-online',
          INZICHT_ORIGIN: origin,
        })
      ).status,
      404,
    );
  s.db.exec("UPDATE users SET status='disabled' WHERE id='docent'");
  assert.equal((await s.login()).status, 401);
});
test('logout revokes server session; expiry and user revocation apply immediately', async () => {
  const s = await setup();
  let cookie = (await s.login()).headers
    .getSetCookie()
    .find((s) => s.startsWith('__Host-inzicht_session='));
  assert.equal((await s.request('logout', {}, cookie)).status, 200);
  assert.equal((await s.request('me', undefined, cookie)).status, 401);
  cookie = (await s.login()).headers
    .getSetCookie()
    .find((s) => s.startsWith('__Host-inzicht_session='));
  s.db.exec("UPDATE inzicht_sessions SET expires_at='2020-01-01'");
  assert.equal((await s.request('me', undefined, cookie)).status, 401);
  cookie = (await s.login()).headers
    .getSetCookie()
    .find((s) => s.startsWith('__Host-inzicht_session='));
  s.db.exec("UPDATE users SET status='disabled' WHERE id='docent'");
  assert.equal((await s.request('me', undefined, cookie)).status, 401);
});
test('scheduled outbox retries safely and removes only expired limits and sessions', async () => {
  const s = await setup();
  const cookie = (await s.login()).headers
    .getSetCookie()
    .find((s) => s.startsWith('__Host-inzicht_session='));
  const r = await s.request(
    'observations?school=school-a',
    {
      class_id: 'school-a:klas',
      learner_id: 'school-a:leerling-1',
      skill_id: 'woordbeeld',
      situation: 'Fictieve oefening',
      outcome: 'partial',
      independence: 'hint',
      observed_at: new Date().toISOString(),
    },
    cookie,
  );
  assert.equal(r.status, 201, await r.text());
  s.db.exec(
    "INSERT INTO inzicht_rate_limits VALUES ('old:1',1),('login-ip:hash:1',1)",
  );
  await processPending(s.db);
  await processPending(s.db);
  assert.equal(
    s.db.connection
      .prepare("SELECT COUNT(*) n FROM outbox_events WHERE status<>'processed'")
      .get().n,
    0,
  );
  assert.equal(
    s.db.connection.prepare('SELECT COUNT(*) n FROM mastery_snapshots').get().n,
    1,
  );
  assert.equal(
    s.db.connection
      .prepare(
        "SELECT COUNT(*) n FROM inzicht_rate_limits WHERE bucket IN ('old:1','login-ip:hash:1')",
      )
      .get().n,
    0,
  );
  assert.equal((await s.request('me', undefined, cookie)).status, 200);
});

test('deployment guard rejects production names, bindings, routes and unprotected asset handling', async () => {
  const { checkStaging } = await import('./deploy-staging.mjs');
  const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
  config.assets = {
    binding: 'ASSETS',
    run_worker_first: ['/', '/inzicht', '/inzicht/*', '/api/*'],
  };
  checkStaging(config);
  for (const change of [
    { name: 'taalroute-klink' },
    { vars: { ...config.vars, INZICHT_MFA_KEY: 'never-in-config' } },
    { routes: [{ pattern: 'klink.taalroute.nl', custom_domain: true }] },
    {
      d1_databases: [
        { binding: 'DB', database_id: '0e67ae90-83e1-4506-af60-287a40bf08ef' },
      ],
    },
    { services: [{ service: 'lexicon' }] },
    { assets: { run_worker_first: false } },
    { assets: { binding: 'ASSETS', run_worker_first: ['/inzicht/*'] } },
  ])
    assert.throws(() => checkStaging({ ...config, ...change }));
});

// A separate process prevents a missing Worker global from affecting the test runner.
test('password and MFA work without an implicit global Buffer', () => {
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import { passwordHash, passwordMatches } from './lib/inzicht/auth.ts';
    import { totp, seal, unseal } from './lib/inzicht/mfa.ts';
    delete globalThis.Buffer;
    const password = 'synthetic-buffer-regression';
    assert(await passwordMatches(password, await passwordHash(password)));
    assert.equal(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1), '287082');
    const key = 'a'.repeat(64);
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const encrypted = seal(secret, 'test-user', key);
    assert.equal(unseal(encrypted, 'test-user', key), secret);
  `,
    ],
    { stdio: 'pipe' },
  );
});

test('D1 daily capacity failures stay private and provide a bounded retry time', async () => {
  const response = await handleInzicht(
    new Request(origin + '/api/inzicht/me', {
      headers: { cookie: '__Host-inzicht_session=' + 'a'.repeat(64) },
    }),
    {
      INZICHT_MODE: 'synthetic-online',
      INZICHT_ORIGIN: origin,
      INZICHT_DB: {
        prepare() {
          throw new Error(
            'D1_ERROR: database exceeded its daily write limit; secret-field',
          );
        },
      },
    },
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  assert(Number(response.headers.get('retry-after')) > 0);
  assert(Number(response.headers.get('retry-after')) <= 86400);
  assert(!(await response.text()).includes('secret-field'));
});

test('remote scale tests reserve a shared account-wide D1 write budget', async () => {
  const { assertBenchmarkBudget } = await import('./online-budget.mjs');
  assert.equal(
    assertBenchmarkBudget([
      { rows_written_24h: 1000 },
      { rows_written_24h: 2000 },
    ]),
    3000,
  );
  for (const values of [
    [],
    [{}],
    [{ rows_written_24h: -1 }],
    [{ rows_written_24h: 25000 }, { rows_written_24h: 25000 }],
  ])
    assert.throws(() => assertBenchmarkBudget(values));
});
