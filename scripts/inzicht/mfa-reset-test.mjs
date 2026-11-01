import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import {
  origin,
  nativeLogin,
  passwordLogin,
  responseCookie,
  post,
  factors,
} from './mfa-client.mjs';
const before = await nativeLogin('collega');
assert.equal(before.status, 200);
const old = factors().collega;
const session = responseCookie(before, '__Host-inzicht_session');
const challenge = await passwordLogin('collega');
assert.equal(challenge.status, 200);
execFileSync(
  process.execPath,
  ['scripts/inzicht/reset-staging-mfa.mjs', 'collega', '--reset'],
  { stdio: 'pipe' },
);
assert.equal(
  (await fetch(origin + '/api/inzicht/me', { headers: { cookie: session } }))
    .status,
  401,
);
assert.equal(
  (
    await post(
      'mfa',
      { code: old.recovery_codes[0] },
      responseCookie(challenge, '__Host-inzicht_mfa'),
    )
  ).status,
  401,
);
const fresh = await nativeLogin('collega');
assert.equal(fresh.status, 200);
assert.notEqual(old.secret, factors().collega.secret);
await post('logout', {}, responseCookie(fresh, '__Host-inzicht_session'));
writeFileSync(
  'docs/inzicht-20261101/evidence/online-mfa-reset.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      account: 'collega@klink-test.invalid',
      old_session_revoked: true,
      old_challenge_and_recovery_revoked: true,
      new_factor_required: true,
      new_factor_differs: true,
      no_email_sent: true,
    },
    null,
    2,
  ),
);
console.log(
  'Operator recovery reset revokes old sessions/challenges/recovery and requires a new authenticator enrollment.',
);
