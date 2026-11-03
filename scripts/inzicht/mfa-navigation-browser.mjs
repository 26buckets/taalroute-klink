import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { base, login, online } from './browser-auth.mjs';
assert(online);
const out = process.env.KLINK_MFA_RESULT;
assert(out);
const rows = [],
  errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const b = await type.launch();
  try {
    for (const width of [1280, 390]) {
      const c = await b.newContext({ viewport: { width, height: 900 } }),
        p = await c.newPage();
      p.setDefaultTimeout(45000);
      const timings = [];
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('response', (r) => {
        const path = new URL(r.url()).pathname;
        if (
          [
            '/api/inzicht/login',
            '/api/inzicht/mfa',
            '/api/inzicht/me',
          ].includes(path)
        ) {
          const t = r.request().timing();
          timings.push({
            path,
            status: r.status(),
            responseMs: t.responseStart - t.requestStart,
            ray: r.headers()['cf-ray'],
          });
        }
      });
      await login(p, width === 1280 ? 'docent' : 'collega');
      assert.equal(
        timings.filter((x) => x.path === '/api/inzicht/mfa' && x.status === 200)
          .length,
        1,
      );
      await p.reload();
      await p.getByLabel('Actieve school', { exact: true }).waitFor();
      const other = await p.request.get(
        base + '/api/inzicht/classes/school-b:klas?school=school-a',
      );
      assert.equal(other.status(), 404);
      await p.getByRole('button', { name: 'Afmelden', exact: true }).click();
      await p.getByLabel('Wachtwoord', { exact: true }).waitFor();
      assert.equal(
        (await p.request.get(base + '/api/inzicht/me')).status(),
        401,
      );
      rows.push({
        engine,
        width,
        login: true,
        mfa: true,
        reload: true,
        tenantIsolation: true,
        logout: true,
        timings,
      });
      await c.close();
    }
  } finally {
    await b.close();
    writeFileSync(out, JSON.stringify({ base, rows, errors }, null, 2) + '\n');
  }
}
assert.equal(rows.length, 4);
assert.deepEqual(errors, []);
console.log('PASS four actual MFA, reload, tenant and logout journeys');
