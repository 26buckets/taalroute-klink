import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const base = JSON.parse(readFileSync('scripts/inzicht/online-config.json')).vars
  .INZICHT_ORIGIN;
const account = () =>
  JSON.parse(readFileSync('.wrangler/inzicht-online-credentials.json')).collega;
const login = (a) =>
  fetch(`${base}/api/inzicht/login`, {
    method: 'POST',
    headers: { origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify(a),
  });
const old = account();
const r = await login(old);
assert.equal(r.status, 200);
const cookie = r.headers.get('set-cookie').split(';')[0];
execFileSync(
  process.execPath,
  ['scripts/inzicht/rotate-staging-account.mjs', 'collega'],
  { stdio: 'pipe' },
);
assert.equal(
  (await fetch(`${base}/api/inzicht/me`, { headers: { cookie } })).status,
  401,
);
assert.equal((await login(old)).status, 401);
const fresh = await login(account());
assert.equal(fresh.status, 200);
const ended = await fetch(`${base}/api/inzicht/logout`, {
  method: 'POST',
  headers: {
    origin: base,
    'Content-Type': 'application/json',
    cookie: fresh.headers.get('set-cookie').split(';')[0],
  },
  body: '{}',
});
assert.equal(ended.status, 200);
writeFileSync(
  'docs/inzicht-20261101/evidence/online-rotation.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      account: 'collega@klink-test.invalid',
      old_password_rejected: true,
      old_session_revoked: true,
      new_password_accepted: true,
    },
    null,
    2,
  ),
);
console.log(
  'Online credential recovery: old password and session rejected; fresh account login passed.',
);
