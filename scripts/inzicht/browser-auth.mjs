import {
  nextCode,
  nativeLogin,
  saveFactor,
  responseCookie,
} from './mfa-client.mjs';
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
  if (online) {
    await page
      .getByLabel('Authenticatorcode of herstelcode', { exact: true })
      .waitFor();
    const enrolling =
      (await page.getByLabel('Instelsleutel', { exact: true }).count()) > 0;
    if (enrolling)
      saveFactor(user, {
        secret: await page
          .getByLabel('Instelsleutel', { exact: true })
          .inputValue(),
        last_step: -1,
        recovery_codes: [],
        enrolled: false,
      });
    const { code, step } = await nextCode(user);
    await page
      .getByLabel('Authenticatorcode of herstelcode', { exact: true })
      .fill(code);
    const response = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/inzicht/mfa',
    );
    await page
      .getByRole('button', { name: 'Aanmelding bevestigen', exact: true })
      .click();
    assert.equal(
      (await response).status(),
      200,
      'Authenticator confirmation failed',
    );
    saveFactor(user, { last_step: step, enrolled: true });
    const recovery = page.getByLabel('Herstelcodes', { exact: true });
    if (enrolling) {
      await recovery.waitFor();
      saveFactor(user, {
        recovery_codes: (await recovery.inputValue()).split('\n'),
      });
      await page
        .getByRole('button', {
          name: 'Ik heb de herstelcodes bewaard',
          exact: true,
        })
        .click();
    }
  }

  await page.getByLabel('Actieve school', { exact: true }).waitFor();
}
export async function apiCookie(user) {
  if (!online) return `inzicht_session=${credentials[user]}`;
  if (!sessions.has(user)) {
    const r = await nativeLogin(user);
    assert.equal(r.status, 200, 'Staging account login failed');
    sessions.set(user, responseCookie(r, '__Host-inzicht_session'));
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
