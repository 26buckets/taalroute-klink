import {
  nativeLogin,
  passwordLogin,
  responseCookie,
  post,
} from './mfa-client.mjs';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const { vars } = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
const base = vars.INZICHT_ORIGIN;
const checks = [];
for (const [path, status] of [
  ['/inzicht', 200],
  ['/api/inzicht/me', 401],
  ['/api/inzicht/classes?school=school-a', 401],
  ['/api/inzicht/session', 404],
  ['/docenten', 404],
  ['/api/attempts', 404],
  ['/_headers', 404],
  ['/.env', 404],
]) {
  const r = await fetch(base + path, { redirect: 'manual' });
  assert.equal(r.status, status, `${path}: ${await r.text()}`);
  checks.push({ path, status: r.status });
}
for (const path of [
  '/taalroute-menu/appearance.js',
  '/taalroute-menu/klink-brand.svg',
]) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(
    r.headers.get('content-security-policy'),
    /frame-ancestors 'none'/,
  );
  checks.push({ path, status: r.status, asset_security_headers: true });
}
const first = await passwordLogin('docent');
assert.equal(first.status, 200);
const preauth = responseCookie(first, '__Host-inzicht_mfa');
assert.equal(
  (await fetch(base + '/api/inzicht/me', { headers: { cookie: preauth } }))
    .status,
  401,
);
await post('mfa/cancel', {}, preauth);
const r = await nativeLogin('docent');
assert.equal(r.status, 200, await r.text());
const cookie = responseCookie(r, '__Host-inzicht_session');
assert.match(r.headers.get('set-cookie'), /HttpOnly/);
assert.match(r.headers.get('set-cookie'), /Secure/);
assert.match(r.headers.get('set-cookie'), /SameSite=Strict/);
const me = await fetch(base + '/api/inzicht/me', { headers: { cookie } });
assert.equal(me.status, 200);
assert.equal(me.headers.get('cache-control'), 'no-store, private');
assert.equal((await me.json()).user, 'docent');
const signedInPage = await fetch(base + '/inzicht', { headers: { cookie } });
assert.equal(signedInPage.headers.get('cache-control'), 'no-store, private');
assert(
  !/school-a/.test(await signedInPage.text()),
  'The initial HTML must not embed school records',
);
const signedOutPage = await fetch(base + '/inzicht');
assert.equal(signedOutPage.headers.get('cache-control'), 'no-store, private');
assert(
  !/school-a/.test(await signedOutPage.text()),
  'Anonymous HTML must not reuse the authenticated account',
);
const cross = await fetch(
  base + '/api/inzicht/classes/school-b:klas?school=school-a',
  { headers: { cookie } },
);
assert.equal(cross.status, 404);
const csrf = await fetch(base + '/api/inzicht/classes?school=school-a', {
  method: 'POST',
  headers: {
    cookie,
    origin: 'https://evil.invalid',
    'Content-Type': 'application/json',
  },
  body: '{}',
});
assert.equal(csrf.status, 403);
const logout = await fetch(base + '/api/inzicht/logout', {
  method: 'POST',
  headers: { cookie, origin: base, 'Content-Type': 'application/json' },
  body: '{}',
});
assert.equal(logout.status, 200);
assert.equal(
  (await fetch(base + '/api/inzicht/me', { headers: { cookie } })).status,
  401,
);
writeFileSync(
  'docs/inzicht-20261101/evidence/online-probe.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      origin: base,
      checks,
      real_password_login: true,
      mfa_required: true,
      password_only_denied: true,
      secure_cookie: true,
      tenant_isolation: true,
      csrf: true,
      server_logout: true,
    },
    null,
    2,
  ),
);
console.log(
  'Online: public login only, real password login, secure cookie, tenant denial, CSRF and revoked logout passed.',
);
