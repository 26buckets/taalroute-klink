import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_CARD_AUDIO_OUTPUT || 'outputs/card-titles-native-audio-20261101';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1366, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        window.__cardAudio = [];
        window.addEventListener('klink-audio-source', e => { window.__cardAudio.push(e.detail); });
      });
      for (const kind of ['word', 'sound']) {
        await page.goto(`${base}/#learner/${kind === 'word' ? 'words' : 'sounds'}`);
        if (kind === 'word') { await page.getByRole('searchbox').fill('mat'); await page.getByRole('button', { name: 'Luister naar mat', exact: true }).first().click(); }
        else await page.locator('.cp-sound-play').first().click();
        await page.waitForFunction(() => window.__cardAudio.some(a => a instanceof HTMLAudioElement && !a.error && a.currentTime > .05));
        const played = await page.evaluate(() => window.__cardAudio.filter(a => a.currentTime > .05).map(a => ({ src: a.src, native: a instanceof HTMLAudioElement, currentTime: a.currentTime, duration: a.duration, rate: a.playbackRate, error: Boolean(a.error) })));
        assert(played.length); assert(played.every(a => a.native && !a.error));
        await page.getByRole('button', { name: 'Start', exact: true }).click();
        assert(await page.evaluate(() => window.__cardAudio.every(a => a.paused || a.ended)));
        checks.push({ engine, width, kind, played, stoppedOnNavigation: true });
        await page.evaluate(() => { window.__cardAudio = []; });
      }
      await page.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []); assert.equal(checks.length, 8);
writeFileSync(`${out}/checks.json`, JSON.stringify({ base, checks, errors, humanListeningPerformed: false }, null, 2));
console.log('PASS 8 actual native audio plays and stops on desktop/mobile in both browsers.');
