// Verify every moved lookup through the current players, including resumed lessons.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { dailyBlocks, dailyStorageKey } from '../lib/alfa-c-dagelijks.ts';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
import { dailyAudio, functionalAudio } from '../lib/alfa-c-audio.ts';
const base = process.env.KLINK_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_AUDIO_OUTPUT || 'docs/eight-seconds-20261105/audio-browser';
mkdirSync(out, { recursive: true });
const rows = [], errors = [];
assert.equal(dailyAudio('missing'), '');
assert.equal(functionalAudio('guide', 'missing'), undefined);
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.heard = [];
      window.Audio = class extends EventTarget {
        currentTime = 0;
        dataset = {};
        playbackRate = 1;
        play() { window.heard.push(this.src); this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 20); return Promise.resolve(); }
        pause() { clearTimeout(this.timer); }
      };
    });
    await page.goto(base + '/#learner');
    for (const [kind, blocks, key] of [['daily', dailyBlocks, dailyStorageKey], ['functional', functionalBlocks, functionalStorageKey]]) {
      for (const block of blocks) for (const [index, step] of block.steps.entries()) {
        await page.evaluate(({ key, id, index }) => localStorage.setItem(key, JSON.stringify({ version: 1, positions: { [id]: index }, records: {} })), { key, id: block.id, index });
        await page.goto(base + '/#learner/alfa-c/' + block.id);
        await page.reload();
        const player = page.locator(`[data-${kind}-step="${step.id}"]`);
        await player.waitFor().catch(async error => { writeFileSync(out + '/failure.json', JSON.stringify({ engine, kind, id: step.id, url: page.url(), text: await page.locator('body').innerText(), heard: await page.evaluate(() => window.heard), errors }, null, 2)); throw error; });
        const explanation = kind === 'daily' ? dailyAudio(step.audio.I) : functionalAudio('guide', step.instruction);
        assert(explanation);
        await player.getByRole('button', { name: 'Luister naar de uitleg', exact: true }).click();
        await page.waitForFunction(src => window.heard.includes(src), explanation);
        await player.getByRole('button', { name: 'Naar de opdracht', exact: true }).click();
        const source = player.getByRole('button', { name: 'Luister naar de tekst', exact: true });
        if (await source.count()) {
          const documents = kind === 'daily' ? [] : step.presentation.filter(item => !['previousResponse', 'audioOnly'].includes(item.kind));
          const expected = kind === 'daily' ? dailyAudio(step.audio.O) : functionalAudio('target', documents.at(-1).text);
          assert(expected);
          await source.click();
          await page.waitForFunction(src => window.heard.includes(src), expected);
        }
        assert.equal(await player.getByRole('alert').count(), 0);
        rows.push({ engine, kind, step: step.id, restoredPosition: index, explanation: true, source: Boolean(await source.count()) });
      }
    }
  } finally { await browser.close(); writeFileSync(out + '/checks.json', JSON.stringify({ rows, errors }, null, 2) + '\n'); }
}
assert.equal(rows.length, 2 * [...dailyBlocks, ...functionalBlocks].reduce((n, block) => n + block.steps.length, 0));
assert.deepEqual(errors, []);
console.log(`PASS ${rows.length} resumed daily/functional audio cases in Chromium and WebKit`);
