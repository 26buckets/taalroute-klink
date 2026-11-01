// Test-only account helper. Private factors never enter source, snapshots or reports.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { totp } from '../../lib/inzicht/mfa.ts';
export const origin = JSON.parse(
  readFileSync('scripts/inzicht/online-config.json'),
).vars.INZICHT_ORIGIN;
assert.equal(origin, 'https://klink-inzicht-pr8-staging.nico-554.workers.dev');
const path = '.wrangler/inzicht-online-mfa.json';
export const factors = () =>
  existsSync(path) ? JSON.parse(readFileSync(path)) : {};
export function saveFactor(user, value) {
  const data = factors();
  data[user] = { ...data[user], ...value };
  writeFileSync(path, JSON.stringify(data, null, 2), { mode: 0o600 });
  chmodSync(path, 0o600);
}
export const responseCookie = (r, name) =>
  r.headers
    .getSetCookie()
    .find((s) => s.startsWith(name + '='))
    ?.split(';')[0] ?? '';
export async function nextCode(user) {
  const factor = factors()[user];
  assert(factor?.secret, 'Private authenticator recovery material required');
  const last = factor.last_step ?? -1;
  if (Math.floor(Date.now() / 30000) <= last)
    await new Promise((resolve) =>
      setTimeout(resolve, (last + 1) * 30000 - Date.now() + 150),
    );
  const step = Math.floor(Date.now() / 30000);
  return { code: totp(factor.secret, step), step };
}
export const post = (path, body, cookie = '') =>
  fetch(origin + '/api/inzicht/' + path, {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
export async function passwordLogin(user, account) {
  account ??= JSON.parse(
    readFileSync('.wrangler/inzicht-online-credentials.json'),
  )[user];
  assert.equal(account.email, `${user}@klink-test.invalid`);
  return post('login', account);
}
export async function nativeLogin(user, account) {
  const first = await passwordLogin(user, account);
  if (first.status !== 200) return first;
  const data = await first.json();
  assert(['enroll', 'verify'].includes(data.mfa));
  if (data.mfa === 'enroll')
    saveFactor(user, {
      secret: data.secret,
      last_step: -1,
      recovery_codes: [],
      enrolled: false,
    });
  const { code, step } = await nextCode(user);
  const r = await post(
    'mfa',
    { code },
    responseCookie(first, '__Host-inzicht_mfa'),
  );
  if (r.status === 200) {
    const result = await r.clone().json();
    saveFactor(user, {
      last_step: step,
      enrolled: true,
      ...(result.recovery_codes?.length
        ? { recovery_codes: result.recovery_codes }
        : {}),
    });
  }
  return r;
}
