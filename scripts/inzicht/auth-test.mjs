import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sqlite } from './sqlite.mjs';
import { fixtures } from './fixtures.mjs';
import { passwordHash, passwordMatches } from '../../lib/inzicht/auth.ts';
import { handleInzicht, processPending } from '../../lib/inzicht/service.ts';
import { hash } from '../../lib/inzicht/rules.ts';
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
      },
    );
  const login = () =>
    request('login', { email: 'docent@klink-test.invalid', password });
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
  const cookie = r.headers.get('set-cookie');
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
  let cookie = (await s.login()).headers.get('set-cookie');
  assert.equal((await s.request('logout', {}, cookie)).status, 200);
  assert.equal((await s.request('me', undefined, cookie)).status, 401);
  cookie = (await s.login()).headers.get('set-cookie');
  s.db.exec("UPDATE inzicht_sessions SET expires_at='2020-01-01'");
  assert.equal((await s.request('me', undefined, cookie)).status, 401);
  cookie = (await s.login()).headers.get('set-cookie');
  s.db.exec("UPDATE users SET status='disabled' WHERE id='docent'");
  assert.equal((await s.request('me', undefined, cookie)).status, 401);
});
test('scheduled outbox retries safely and removes only expired limits and sessions', async () => {
  const s = await setup();
  const cookie = (await s.login()).headers.get('set-cookie');
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
  config.assets = { binding: 'ASSETS', run_worker_first: true };
  checkStaging(config);
  for (const change of [
    { name: 'taalroute-klink' },
    { routes: [{ pattern: 'klink.taalroute.nl', custom_domain: true }] },
    {
      d1_databases: [
        { binding: 'DB', database_id: '0e67ae90-83e1-4506-af60-287a40bf08ef' },
      ],
    },
    { services: [{ service: 'lexicon' }] },
    { assets: { run_worker_first: false } },
  ])
    assert.throws(() => checkStaging({ ...config, ...change }));
});
