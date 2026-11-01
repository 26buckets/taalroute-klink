import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { base, online, apiCookie, logoutSessions } from './browser-auth.mjs';
assert(online);
const cookie = await apiCookie('cursist');
async function state() {
  const r = await fetch(`${base}/api/inzicht/my-school?school=school-a`, {
    headers: { cookie },
  });
  assert.equal(r.status, 200);
  return r.json();
}
const before = await state();
const assignment = before.assignments[0];
assert(assignment, 'Run the synthetic journey first');
const url = `${base}/inzicht/oefenen?school=school-a&class=${assignment.group_id}&content=${assignment.content_version_id}&assignment=${assignment.id}`;
const results = [];
try {
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    console.log('Testing player retry:', engine);
    const browser = await type.launch();
    try {
      const context = await browser.newContext();
      await context.addCookies([
        {
          name: '__Host-inzicht_session',
          value: cookie.split('=')[1],
          url: base,
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
        },
      ]);
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      let blocked = 0;
      await page.route('**/package-exercise-browser-*.js', async (route) => {
        blocked++;
        await route.abort('failed');
      });
      await page.goto(url);
      await page
        .getByRole('alert')
        .filter({ hasText: 'Oefening laden is niet gelukt.' })
        .waitFor();
      assert(blocked > 0);
      assert(
        await page
          .getByRole('button', {
            name: 'Terug naar mijn opdrachten',
            exact: true,
          })
          .isVisible(),
      );
      await page.unroute('**/package-exercise-browser-*.js');
      await page
        .getByRole('button', { name: 'Opnieuw openen', exact: true })
        .click();
      try {
        await page.getByRole('button', { name: 'mat', exact: true }).waitFor();
      } catch (error) {
        console.log(engine, await page.locator('main').innerText());
        throw error;
      }
      assert.equal(
        await page
          .getByRole('alert')
          .filter({ hasText: 'Oefening laden is niet gelukt.' })
          .count(),
        0,
      );
      assert.deepEqual(
        (await state()).attempts,
        before.attempts,
        'Loading and retry cannot create attempts',
      );
      results.push({
        engine,
        failed_download_visible: true,
        back_available: true,
        full_reload_recovers: true,
        attempts_unchanged: true,
      });
    } finally {
      await browser.close();
    }
  }
} finally {
  await logoutSessions();
}
writeFileSync(
  'docs/inzicht-20261101/evidence/speed/player-loading.json',
  JSON.stringify(results, null, 2),
);
console.log(
  'Both browsers recover a failed player download without writing an attempt.',
);
