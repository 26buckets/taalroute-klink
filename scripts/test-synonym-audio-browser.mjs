import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18887';
const clips = JSON.parse(readFileSync('docs/synonyms-20261030/audio.json'));
const checks = [];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/#learner/home'); await page.locator('.cp-home').waitFor();
    for (const clip of clips) {
      const duration = await page.evaluate(async src => {
        const response = await fetch(src); if (!response.ok) throw Error(src);
        const context = new AudioContext(), decoded = await context.decodeAudioData(await response.arrayBuffer());
        await context.close(); window.synonymClip = new Audio(src); await window.synonymClip.play(); return decoded.duration;
      }, clip.src);
      assert(Math.abs(duration - clip.duration) < .15, clip.word);
      await page.waitForFunction(() => window.synonymClip.currentTime > .15);
      await page.evaluate(() => window.synonymClip.pause());
      checks.push({ engine: engine.name(), id: clip.id, word: clip.word, duration, nativePlayback: true });
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}
writeFileSync(`docs/synonyms-20261030/audio-browser${base.startsWith('https') ? '-live' : ''}.json`, JSON.stringify(checks, null, 2) + '\n');
console.log(`PASS ${checks.length} native audio checks: all 68 new clips in Chromium and WebKit.`);
