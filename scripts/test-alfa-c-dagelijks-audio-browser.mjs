import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { dailyBlocks } from '../lib/alfa-c-dagelijks.ts';
const audio = JSON.parse(fs.readFileSync('data/klink-alfa-c-dagelijks-audio.json'));
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18878';
const out = process.env.KLINK_DAILY_AUDIO_OUTPUT ?? '../daily-audio'; fs.mkdirSync(out, { recursive: true });
const checks = [];
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const browser = await launcher.launch();
  try {
    const page = await browser.newPage(); await page.goto(base + '/#learner/alfa-c');
    for (let at = 0; at < audio.clips.length; at += 15) {
      const result = await page.evaluate(async clips => {
        const context = new AudioContext();
        try {
          const results = [];
          for (const clip of clips) {
            const r = await fetch(clip.src); if (!r.ok) throw Error(clip.src + ': ' + r.status);
            const decoded = await context.decodeAudioData(await r.arrayBuffer());
            if (!(decoded.duration > .35 && decoded.length > 1000)) throw Error(clip.src + ' invalid audio');
            results.push({ id: clip.id, duration: decoded.duration, fullyDecoded: true });
          }
          return results;
        } finally { await context.close(); }
      }, audio.clips.slice(at, at + 15));
      checks.push(...result.map(r => ({ engine, ...r })));
    }
    await page.goto(base + '/#learner/alfa-c/dagelijks-les');
    await page.getByRole('button', { name: 'Luister', exact: true }).click();
    await page.getByRole('button', { name: 'Luister', exact: true }).waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('[data-daily-step] .pilot-tools button')?.disabled, {}, { timeout: 30000 });
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.getByRole('button', { name: 'Luister naar de tekst', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('[data-daily-step] .pilot-tools button')?.disabled, {}, { timeout: 30000 });
    assert.equal(await page.getByRole('alert').count(), 0);
    const step = dailyBlocks[0].steps[0];
    await page.route('**/' + step.audio.I + '.mp3', route => route.abort());
    await page.reload(); await page.getByRole('button', { name: 'Luister', exact: true }).click();
    await page.getByRole('alert').waitFor({ timeout: 30000 });
    assert(await page.getByRole('button', { name: 'Verder', exact: true }).isDisabled());
    await page.unroute('**/' + step.audio.I + '.mp3');
    await page.getByRole('button', { name: 'Luister', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('[data-daily-step] .pilot-tools button')?.disabled, {}, { timeout: 30000 });
    assert.equal(await page.getByRole('alert').count(), 0);
  } finally { await browser.close(); }
}
assert.equal(checks.length, 750);
fs.writeFileSync(out + '/checks.json', JSON.stringify({ checks, nativeInstructionAndTargetPlayback: true, errorRetry: true, humanListeningReview: false }, null, 2));
console.log('PASS 750 full browser decodes, real instruction and target playback, audio failure and retry.');
