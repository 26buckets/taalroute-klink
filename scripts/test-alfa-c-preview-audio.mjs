import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pilotBlocks } from '../lib/alfa-c-practice.ts';
const out = 'outputs/alfa-c-proefblokken-20261026',
  url =
    (process.env.KLINK_URL ?? 'http://127.0.0.1:18856') + '/#learner/alfa-c';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const p = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  p.setDefaultTimeout(15000);
  const requests = [];
  p.on('request', (r) => {
    if (/\.(wav|mp3)(\?|$)/.test(r.url())) requests.push(r.url());
  });
  await p.goto(url);
  await p.locator('[data-pilot-block]').first().waitFor();
  await p.screenshot({ path: out + '/overzicht.png' });
  for (const b of pilotBlocks) {
    await p.locator(`[data-pilot-block="${b.id}"]`).click();
    await p.getByRole('button', { name: 'Luister', exact: true }).click();
    await p.waitForFunction(
      () => !document.querySelector('.pilot-footer button').disabled,
      {},
      { timeout: 30000 },
    );
    assert(
      await p.getByRole('button', { name: 'Verder', exact: true }).isEnabled(),
    );
    await p.waitForFunction(() =>
      [...document.querySelectorAll('.pilot-player img')].every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
    );
    await p.screenshot({ path: out + '/' + b.id + '-start.png' });
    await p
      .getByRole('button', { name: 'Andere oefening', exact: true })
      .click();
  }
  assert(
    !requests.some((r) => r.includes('/instructions/')),
    'withdrawn instructions must remain off',
  );
  const fail = await browser.newPage();
  await fail.addInitScript(() => {
    window.audioFail = true;
    window.Audio = class extends EventTarget {
      play() {
        this.timer = setTimeout(
          () =>
            this.dispatchEvent(new Event(window.audioFail ? 'error' : 'ended')),
          15,
        );
        return Promise.resolve();
      }
      pause() {
        clearTimeout(this.timer);
      }
    };
  });
  await fail.goto(url);
  await fail.locator('[data-pilot-block="winkel"]').click();
  await fail.getByRole('button', { name: 'Luister', exact: true }).click();
  await fail.getByRole('alert').waitFor();
  assert(
    await fail
      .getByRole('button', { name: 'Verder', exact: true })
      .isDisabled(),
  );
  await fail.evaluate(() => (window.audioFail = false));
  await fail.getByRole('button', { name: 'Luister', exact: true }).click();
  await fail.waitForFunction(
    () => !document.querySelector('.pilot-footer button').disabled,
  );
  await fail.close();
  fs.writeFileSync(
    out + '/audio-checks.json',
    JSON.stringify(
      {
        nativePlayback: pilotBlocks.map((b) => b.words[0]),
        requests,
        withdrawnInstructionsRequested: false,
        errorRetryPassed: true,
        humanListeningReview: false,
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS actual word playback, withdrawn instructions respected, audio-error retry.',
  );
} finally {
  await browser.close();
}
