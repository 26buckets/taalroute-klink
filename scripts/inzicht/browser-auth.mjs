import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export const base = process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:18841';
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
export const online = base === config.vars.INZICHT_ORIGIN;
assert(
  online || /^http:\/\/127\.0\.0\.1:\d+$/.test(base),
  'Only the exact isolated staging or localhost may receive test credentials',
);
const credentials = JSON.parse(
  readFileSync(
    online
      ? '.wrangler/inzicht-online-credentials.json'
      : '.wrangler/inzicht-credentials.json',
  ),
);
const sessions = new Map();
export async function login(page, user) {
  await page.goto(`${base}/inzicht`);
  if (online) {
    await page
      .getByLabel('E-mailadres', { exact: true })
      .fill(credentials[user].email);
    await page
      .getByLabel('Wachtwoord', { exact: true })
      .fill(credentials[user].password);
  } else
    await page
      .getByLabel('Testtoegang', { exact: true })
      .fill(credentials[user]);
  await page.getByRole('button', { name: 'Openen', exact: true }).click();
  await page.getByLabel('Actieve school', { exact: true }).waitFor();
}
export async function apiCookie(user) {
  if (!online) return `inzicht_session=${credentials[user]}`;
  if (!sessions.has(user)) {
    const r = await fetch(`${base}/api/inzicht/login`, {
      method: 'POST',
      headers: { origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials[user]),
      redirect: 'error',
    });
    assert.equal(r.status, 200, 'Staging account login failed');
    sessions.set(user, r.headers.get('set-cookie').split(';')[0]);
  }
  return sessions.get(user);
}
export async function logoutSessions() {
  for (const cookie of sessions.values()) {
    const r = await fetch(`${base}/api/inzicht/logout`, {
      method: 'POST',
      headers: { origin: base, 'Content-Type': 'application/json', cookie },
      body: '{}',
      redirect: 'error',
    });
    assert.equal(r.status, 200);
  }
}
