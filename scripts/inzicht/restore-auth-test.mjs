import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { restore, snapshot } from './portable.mjs';
import { sqlite } from './sqlite.mjs';
import { passwordHash } from '../../lib/inzicht/auth.ts';
import { totp } from '../../lib/inzicht/mfa.ts';
import { handleInzicht } from '../../lib/inzicht/service.ts';
const bundle = JSON.parse(readFileSync('.wrangler/mfa-recovery/snapshot.json'));
const dir = mkdtempSync('.wrangler/mfa-recovery/auth-reissue-');
const path = `${dir}/restored.sqlite`;
const restored = await restore(bundle, path);
restored.close();
const db = sqlite(path);
assert.equal(
  db.connection
    .prepare(
      "SELECT COUNT(*) n FROM users WHERE auth_subject NOT LIKE 'synthetic:%'",
    )
    .get().n,
  0,
);
for (const table of [
  'inzicht_credentials',
  'inzicht_sessions',
  'inzicht_mfa',
  'inzicht_mfa_recovery',
  'inzicht_mfa_sessions',
])
  assert.equal(
    db.connection.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,
    0,
  );
const users = db.connection
  .prepare('SELECT id FROM users ORDER BY id')
  .all()
  .map((x) => x.id);
assert.deepEqual(users, [
  'beheerder',
  'collega',
  'cursist',
  'docent',
  'registrar',
  'support',
]);
const accounts = {};
for (const user of users) {
  accounts[user] = randomBytes(24).toString('base64url');
  db.connection
    .prepare('INSERT INTO inzicht_credentials VALUES (?,?,?,?)')
    .run(
      user,
      `${user}@klink-test.invalid`,
      await passwordHash(accounts[user]),
      new Date().toISOString(),
    );
}
const origin = 'https://klink-inzicht-pr8-staging.nico-554.workers.dev',
  encryptionKey = randomBytes(32).toString('hex');
const request = (path, body, cookie = '') =>
  handleInzicht(
    new Request(origin + '/api/inzicht/' + path, {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json', cookie },
      body: JSON.stringify(body),
    }),
    {
      INZICHT_DB: db,
      INZICHT_MODE: 'synthetic-online',
      INZICHT_ORIGIN: origin,
      INZICHT_MFA_KEY: encryptionKey,
    },
  );
for (const user of users) {
  const first = await request('login', {
    email: `${user}@klink-test.invalid`,
    password: accounts[user],
  });
  assert.equal(first.status, 200);
  const data = await first.json();
  assert.equal(data.mfa, 'enroll');
  const cookie = first.headers
    .getSetCookie()
    .find((x) => x.startsWith('__Host-inzicht_mfa='));
  const r = await request('mfa', { code: totp(data.secret) }, cookie);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).recovery_codes.length, 8);
}
assert.equal((await snapshot(db.connection)).checksum, bundle.checksum);
db.connection.close();
writeFileSync(
  'docs/inzicht-20261101/evidence/mfa-restore-auth.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      six_restored_fictional_accounts: true,
      old_credentials_sessions_and_factors_absent: true,
      new_passwords_and_new_mfa_enrollment_required: true,
      education_snapshot_unchanged: true,
      scope:
        'Actual application auth handlers against a new local SQLite restore; no live binding changed',
    },
    null,
    2,
  ),
);
console.log(
  'Six restored fictional identities require fresh credentials and authenticator enrollment; education checksum unchanged.',
);
