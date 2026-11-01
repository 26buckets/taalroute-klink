import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sqlite } from './sqlite.mjs';
import { fixtures } from './fixtures.mjs';
import { passwordHash } from '../../lib/inzicht/auth.ts';
import {
  base32,
  totp,
  matchedStep,
  seal,
  unseal,
} from '../../lib/inzicht/mfa.ts';
import { handleInzicht } from '../../lib/inzicht/service.ts';
import { hash } from '../../lib/inzicht/rules.ts';
const origin = 'https://klink-inzicht-pr8-staging.nico-554.workers.dev';
const password = 'Fictief-MFA-testwachtwoord-2026',
  encoded = await passwordHash(password),
  key = 'a'.repeat(64);
const cookie = (r, name) =>
  r.headers
    .getSetCookie()
    .find((s) => s.startsWith(name + '='))
    ?.split(';')[0] ?? '';
async function setup() {
  const db = sqlite();
  for (const name of readdirSync('db/migrations/inzicht').sort())
    db.exec(readFileSync(`db/migrations/inzicht/${name}`, 'utf8'));
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
  const request = (path, body, cookie = '', env = {}) =>
    handleInzicht(
      new Request(`${origin}/api/inzicht/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          origin,
          'Content-Type': 'application/json',
          cookie,
          'CF-Connecting-IP': '192.0.2.44',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      {
        INZICHT_MODE: 'synthetic-online',
        INZICHT_DB: db,
        INZICHT_ORIGIN: origin,
        INZICHT_MFA_KEY: key,
        ...env,
      },
    );
  const begin = async () => {
    const r = await request('login', {
      email: 'docent@klink-test.invalid',
      password,
    });
    assert.equal(r.status, 200, await r.clone().text());
    return { r, cookie: cookie(r, '__Host-inzicht_mfa'), data: await r.json() };
  };
  const enroll = async () => {
    const first = await begin();
    const code = totp(first.data.secret);
    const r = await request('mfa', { code }, first.cookie);
    assert.equal(r.status, 200, await r.clone().text());
    return {
      ...first,
      code,
      r,
      data: await r.json(),
      secret: first.data.secret,
      session: cookie(r, '__Host-inzicht_session'),
    };
  };
  return { db, request, begin, enroll };
}
test('RFC 6238 published SHA-1 vectors and narrow/replay-protected time window', () => {
  const secret = base32(Buffer.from('12345678901234567890'));
  for (const [time, expected] of [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ])
    assert.equal(totp(secret, Math.floor(time / 30), 8), expected);
  const time = 1234567890000,
    step = Math.floor(time / 30000);
  for (const offset of [-1, 0, 1])
    assert.equal(
      matchedStep(secret, totp(secret, step + offset), -1, time),
      step + offset,
    );
  assert.equal(matchedStep(secret, totp(secret, step - 2), -1, time), null);
  assert.equal(matchedStep(secret, totp(secret, step), step, time), null);
  for (const bad of ['', '12345', '1234567', '00000x'])
    assert.equal(matchedStep(secret, bad, -1, time), null);
});
test('factor encryption authenticates user, key and ciphertext; no plaintext at rest', () => {
  const secret = base32(Buffer.alloc(20, 3)),
    cipher = seal(secret, 'docent', key);
  assert.equal(unseal(cipher, 'docent', key), secret);
  assert(!cipher.includes(secret));
  assert.notEqual(cipher, seal(secret, 'docent', key));
  for (const [value, user, k] of [
    [cipher, 'cursist', key],
    [cipher, 'docent', 'b'.repeat(64)],
    [cipher.slice(0, -2) + '00', 'docent', key],
  ])
    assert.throws(() => unseal(value, user, k));
  assert.throws(() => seal(secret, 'docent', undefined));
});
test('password alone has no dossier access; enrollment needs a valid code and returns recovery codes once', async () => {
  const s = await setup(),
    first = await s.begin();
  assert.equal(first.data.mfa, 'enroll');
  assert.match(
    first.r.headers
      .getSetCookie()
      .find((x) => x.startsWith('__Host-inzicht_mfa=')),
    /HttpOnly; Secure; SameSite=Strict; Path=\/; Max-Age=300/,
  );
  assert.equal((await s.request('me', undefined, first.cookie)).status, 401);
  const stored = s.db.connection
    .prepare('SELECT * FROM inzicht_mfa_challenges')
    .get();
  assert(!JSON.stringify(stored).includes(first.data.secret));
  const r = await s.request(
    'mfa',
    { code: totp(first.data.secret) },
    first.cookie,
  );
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.recovery_codes.length, 8);
  assert.equal(new Set(data.recovery_codes).size, 8);
  const session = cookie(r, '__Host-inzicht_session');
  assert.equal((await s.request('me', undefined, session)).status, 200);
  assert.equal(
    (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
      .status,
    401,
  );
  const rows = s.db.connection
    .prepare('SELECT * FROM inzicht_mfa_recovery')
    .all();
  for (const code of data.recovery_codes)
    assert(!JSON.stringify(rows).includes(code));
  const next = await s.begin();
  assert.deepEqual(next.data, { mfa: 'verify' });
  assert.equal((await s.request('me', undefined, next.cookie)).status, 401);
});
test('OTP replay, concurrent confirmation and recovery reuse cannot issue two sessions', async () => {
  const s = await setup(),
    enrolled = await s.enroll();
  let next = await s.begin();
  assert.equal(
    (await s.request('mfa', { code: enrolled.code }, next.cookie)).status,
    401,
  );
  const responses = await Promise.all([
    s.request('mfa', { code: enrolled.data.recovery_codes[0] }, next.cookie),
    s.request('mfa', { code: enrolled.data.recovery_codes[0] }, next.cookie),
  ]);
  assert.deepEqual(
    responses.map((r) => r.status).sort((a, b) => a - b),
    [200, 401],
  );
  next = await s.begin();
  assert.equal(
    (
      await s.request(
        'mfa',
        { code: enrolled.data.recovery_codes[0] },
        next.cookie,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await s.request(
        'mfa',
        { code: enrolled.data.recovery_codes[1] },
        next.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    s.db.connection
      .prepare(
        'SELECT COUNT(*) n FROM inzicht_mfa_recovery WHERE used_at IS NOT NULL',
      )
      .get().n,
    2,
  );
});
test('five attempts, expiry, cancellation and replacement challenge are enforced', async () => {
  const s = await setup();
  let first = await s.begin();
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await s.request('mfa', { code: 'wrong' }, first.cookie)).status,
      401,
    );
  assert.equal(
    (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
      .status,
    401,
  );
  first = await s.begin();
  s.db.exec("UPDATE inzicht_mfa_challenges SET expires_at='2020-01-01'");
  assert.equal(
    (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
      .status,
    401,
  );
  first = await s.begin();
  await s.request('mfa/cancel', {}, first.cookie);
  assert.equal(
    (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
      .status,
    401,
  );
  first = await s.begin();
  await s.begin();
  assert.equal(
    (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
      .status,
    401,
  );
});
test('MFA rate limit persists across fresh password challenges', async () => {
  const s = await setup();
  const first = await s.begin();
  const bucket = `login-mfa:${await hash('docent')}:${Math.floor(Date.now() / 900000)}`;
  s.db.connection
    .prepare('INSERT INTO inzicht_rate_limits VALUES (?,15)')
    .run(bucket);
  assert.equal(
    (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
      .status,
    429,
  );
  const next = await s.begin();
  assert.equal(
    (await s.request('mfa', { code: totp(next.data.secret) }, next.cookie))
      .status,
    429,
  );
});
test('password rotation, user disable, wrong origin, missing secret and factor reset fail closed', async () => {
  for (const change of [
    "UPDATE inzicht_credentials SET password_hash='rotated'",
    "UPDATE users SET status='disabled' WHERE id='docent'",
  ]) {
    const s = await setup(),
      first = await s.begin();
    s.db.exec(change);
    assert.equal(
      (await s.request('mfa', { code: totp(first.data.secret) }, first.cookie))
        .status,
      401,
    );
    assert.equal(
      s.db.connection.prepare('SELECT COUNT(*) n FROM inzicht_sessions').get()
        .n,
      0,
    );
  }
  const s = await setup(),
    first = await s.begin();
  assert.equal(
    (
      await s.request('mfa', { code: totp(first.data.secret) }, first.cookie, {
        INZICHT_MFA_KEY: undefined,
      })
    ).status,
    503,
  );
  const csrf = await handleInzicht(
    new Request(origin + '/api/inzicht/mfa', {
      method: 'POST',
      headers: {
        origin: 'https://evil.invalid',
        'Content-Type': 'application/json',
        cookie: first.cookie,
      },
      body: JSON.stringify({ code: totp(first.data.secret) }),
    }),
    {
      INZICHT_DB: s.db,
      INZICHT_MODE: 'synthetic-online',
      INZICHT_ORIGIN: origin,
      INZICHT_MFA_KEY: key,
    },
  );
  assert.equal(csrf.status, 403);
  const t = await setup();
  await t.enroll();
  const next = await t.begin();
  t.db.exec('DELETE FROM inzicht_mfa');
  assert.equal(
    (await t.request('mfa', { code: '000000' }, next.cookie)).status,
    401,
  );
});
test('failed session transaction preserves recovery code and does not leave partial authentication', async () => {
  const s = await setup(),
    enrolled = await s.enroll(),
    next = await s.begin();
  s.db.exec(
    "CREATE TRIGGER reject_test_session BEFORE INSERT ON inzicht_sessions BEGIN SELECT RAISE(ABORT,'test storage failure'); END;",
  );
  assert.equal(
    (
      await s.request(
        'mfa',
        { code: enrolled.data.recovery_codes[0] },
        next.cookie,
      )
    ).status,
    500,
  );
  assert.equal(
    s.db.connection
      .prepare(
        'SELECT COUNT(*) n FROM inzicht_mfa_recovery WHERE used_at IS NOT NULL',
      )
      .get().n,
    0,
  );
  s.db.exec('DROP TRIGGER reject_test_session');
  assert.equal(
    (
      await s.request(
        'mfa',
        { code: enrolled.data.recovery_codes[0] },
        next.cookie,
      )
    ).status,
    200,
  );
});
test('migration revokes all legacy password-only sessions without deleting education data', async () => {
  const db = sqlite();
  for (const file of readdirSync('db/migrations/inzicht')
    .sort()
    .filter((x) => Number(x.slice(0, 4)) < 4))
    db.exec(readFileSync(`db/migrations/inzicht/${file}`, 'utf8'));
  db.exec((await fixtures()).sql);
  assert(
    db.connection.prepare('SELECT COUNT(*) n FROM inzicht_sessions').get().n >
      0,
  );
  const groups = db.connection.prepare('SELECT * FROM groups').all();
  db.exec(readFileSync('db/migrations/inzicht/0004_mfa.sql', 'utf8'));
  assert.equal(
    db.connection.prepare('SELECT COUNT(*) n FROM inzicht_sessions').get().n,
    0,
  );
  assert.deepEqual(db.connection.prepare('SELECT * FROM groups').all(), groups);
});
test('legacy or fabricated password-only session remains unusable even after MFA enrollment', async () => {
  const s = await setup();
  await s.enroll();
  const legacy = 'f'.repeat(64);
  s.db.connection
    .prepare('INSERT INTO inzicht_sessions VALUES (?,?,?,0)')
    .run(
      await hash(legacy),
      'docent',
      new Date(Date.now() + 3600000).toISOString(),
    );
  assert.equal(
    (await s.request('me', undefined, `__Host-inzicht_session=${legacy}`))
      .status,
    401,
  );
});
test('request bodies are bounded while streaming, including multibyte input and invalid UTF-8', async () => {
  const s = await setup();
  const env = {
    INZICHT_DB: s.db,
    INZICHT_MODE: 'synthetic-online',
    INZICHT_ORIGIN: origin,
    INZICHT_MFA_KEY: key,
  };
  let cancelled = false;
  const body = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(16001));
    },
    cancel() {
      cancelled = true;
    },
  });
  let r = await handleInzicht(
    new Request(origin + '/api/inzicht/login', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json' },
      body,
      duplex: 'half',
    }),
    env,
  );
  assert.equal(r.status, 413);
  assert(cancelled);
  r = await s.request('login', { email: 'x', password: '😀'.repeat(5000) });
  assert.equal(r.status, 413);
  r = await handleInzicht(
    new Request(origin + '/api/inzicht/login', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json' },
      body: new Uint8Array([0xff]),
    }),
    env,
  );
  assert.equal(r.status, 400);
  assert.equal(
    s.db.connection
      .prepare('SELECT COUNT(*) n FROM inzicht_mfa_challenges')
      .get().n,
    0,
  );
});
