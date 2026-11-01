import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {
  origin,
  nextCode,
  saveFactor,
  factors,
  passwordLogin,
  responseCookie,
  post,
} from './mfa-client.mjs';
const accounts = JSON.parse(
  readFileSync('.wrangler/inzicht-online-credentials.json'),
);
const results = [];
for (const { engine, type, user } of [
  { engine: 'chromium', type: chromium, user: 'support' },
  { engine: 'webkit', type: webkit, user: 'collega' },
]) {
  const browser = await type.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const begin = async () => {
    await page.goto(origin + '/inzicht');
    await page
      .getByLabel('E-mailadres', { exact: true })
      .fill(accounts[user].email);
    await page
      .getByLabel('Wachtwoord', { exact: true })
      .fill(accounts[user].password);
    await page.getByRole('button', { name: 'Openen', exact: true }).click();
    await page
      .getByLabel('Authenticatorcode of herstelcode', { exact: true })
      .waitFor();
    assert.equal(
      (await page.request.get(origin + '/api/inzicht/me')).status(),
      401,
    );
    assert.equal(
      await page
        .locator('#ki-login-step')
        .evaluate((el) => el === document.activeElement),
      true,
    );
  };
  const confirm = async (code) => {
    await page
      .getByLabel('Authenticatorcode of herstelcode', { exact: true })
      .fill(code);
    const response = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/inzicht/mfa',
    );
    await page
      .getByRole('button', { name: 'Aanmelding bevestigen', exact: true })
      .click();
    return response;
  };
  const logout = async () => {
    await page.getByRole('button', { name: 'Afmelden', exact: true }).click();
    await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
  };
  await begin();
  const enrollment =
    (await page.getByLabel('Instelsleutel', { exact: true }).count()) > 0;
  if (enrollment)
    saveFactor(user, {
      secret: await page
        .getByLabel('Instelsleutel', { exact: true })
        .inputValue(),
      last_step: -1,
      enrolled: false,
      recovery_codes: [],
    });
  assert.equal((await confirm('invalid')).status(), 401);
  await page.getByRole('alert').waitFor();
  const accessibility = await new AxeBuilder({ page })
    .include('.ki-app')
    .analyze();
  assert.deepEqual(
    accessibility.violations.map((v) => v.id),
    [],
  );
  await page.screenshot({
    path: `docs/inzicht-20261101/evidence/online/${engine}-mfa-mobile.png`,
    fullPage: true,
    mask: [page.getByLabel('Instelsleutel', { exact: true })],
  });
  const first = await nextCode(user);
  assert.equal((await confirm(first.code)).status(), 200);
  saveFactor(user, { last_step: first.step, enrolled: true });
  if (enrollment) {
    await page.getByLabel('Herstelcodes', { exact: true }).waitFor();
    const codes = (
      await page.getByLabel('Herstelcodes', { exact: true }).inputValue()
    ).split('\n');
    assert.equal(codes.length, 8);
    saveFactor(user, { recovery_codes: codes });
    assert.equal(
      await page
        .locator('#ki-login-step')
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .getByRole('button', {
        name: 'Ik heb de herstelcodes bewaard',
        exact: true,
      })
      .click();
  }
  await page.getByLabel('Actieve school', { exact: true }).waitFor();
  const secret = factors()[user].secret;
  assert(!(await page.content()).includes(secret));
  const storage = await page.evaluate(() => ({
    local: Object.fromEntries(
      Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]),
    ),
    session: Object.fromEntries(
      Object.keys(sessionStorage).map((k) => [k, sessionStorage.getItem(k)]),
    ),
  }));
  assert(!JSON.stringify(storage).includes(secret));
  const session = (await page.context().cookies()).find(
    (c) => c.name === '__Host-inzicht_session',
  );
  assert(
    session?.httpOnly && session?.secure && session?.sameSite === 'Strict',
  );
  if (user === 'support') {
    await page.getByRole('region', { name: 'Verwerkingsstatus' }).waitFor();
    assert.equal(
      (
        await page.request.get(origin + '/api/inzicht/classes?school=school-a')
      ).status(),
      403,
    );
  }
  await logout();
  await begin();
  assert.equal(
    await page.getByLabel('Instelsleutel', { exact: true }).count(),
    0,
  );
  const recovery = factors()[user].recovery_codes[0];
  assert(recovery);
  assert.equal((await confirm(recovery)).status(), 200);
  saveFactor(user, { recovery_codes: factors()[user].recovery_codes.slice(1) });
  await page.getByLabel('Actieve school', { exact: true }).waitFor();
  await logout();
  await begin();
  assert.equal((await confirm(recovery)).status(), 401);
  const next = await nextCode(user);
  assert.equal((await confirm(next.code)).status(), 200);
  saveFactor(user, { last_step: next.step });
  await page.getByLabel('Actieve school', { exact: true }).waitFor();
  await logout();
  results.push({
    engine,
    enrollment_tested: enrollment,
    wrong_code_denied: true,
    password_only_denied: true,
    recovery_login: true,
    recovery_reuse_denied: true,
    focus_managed: true,
    automated_axe_violations: 0,
    secret_not_in_browser_storage: true,
    secure_session_cookie: true,
  });
  await browser.close();
}
// Real D1 must also serialize a pair of competing confirmations.
const first = await passwordLogin('support');
assert.equal(first.status, 200);
const challenge = responseCookie(first, '__Host-inzicht_mfa');
const code = await nextCode('support');
const competing = await Promise.all([
  post('mfa', { code: code.code }, challenge),
  post('mfa', { code: code.code }, challenge),
]);
assert.deepEqual(
  competing.map((r) => r.status).sort((a, b) => a - b),
  [200, 401],
);
saveFactor('support', { last_step: code.step });
const winner = competing.find((r) => r.status === 200);
await post('logout', {}, responseCookie(winner, '__Host-inzicht_session'));
writeFileSync(
  'docs/inzicht-20261101/evidence/online-mfa-browser.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      results,
      concurrent_confirmation: 'one accepted, one rejected',
    },
    null,
    2,
  ),
);
console.log(
  'MFA enrollment/login/recovery/replay, actual D1 race, focus and mobile accessibility passed in Chromium and WebKit.',
);
