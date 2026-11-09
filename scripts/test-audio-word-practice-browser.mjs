import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { productionIndex } from '../lib/production-practice.ts';
import { chapterHash } from '../lib/practice-chapters.ts';
import { collectionProgressId, roundProgressPrefix } from '../lib/round-progress.ts';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18855';
const out = 'docs/audio-words-20261030'; mkdirSync(out, { recursive: true });
const rows = productionIndex.filter(row => row.id.startsWith('audio-words:'));
const selected = [...new Map(rows.map(row => [`${row.activity}:${row.level}`, row])).values()];
const data = row => JSON.parse(readFileSync(`public${row.url}`)).exercises;
const location = row => ({ chapter: 'words', activity: row.activity, level: row.level, help: 'practice', collection: row.id });
const url = row => base + '/' + chapterHash(location(row));
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
    page.on('pageerror', error => errors.push(`${engine}: ${error.message}`));
    await page.addInitScript(() => {
      window.__played = [];
      window.Audio = class extends EventTarget {
        constructor(src) { super(); this.src = src; this.paused = true; }
        play() { this.paused = false; window.__played.push(this.src); this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 40); return Promise.resolve(); }
        pause() { clearTimeout(this.timer); this.paused = true; }
      };
    });
    if (engine === 'chromium') {
      for (const row of rows) {
        await page.goto(url(row));
        await page.locator(`[data-exercise-id="${data(row)[0].exerciseId}"]`).waitFor();
      }
      checks.push({ engine, allCollectionsOpened: rows.length });
    }
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 950 });
      for (const row of selected) {
        await page.goto(base + '/' + chapterHash({ chapter: 'words', level: row.level, help: 'practice' }));
        const activity = page.locator(`[data-chapter-activity="${row.activity}"]`);
        await activity.waitFor(); assert(await activity.isEnabled()); await activity.click();
        // The selected list may be behind the existing "more" paging control; deep links preserve that list.
        await page.goto(url(row));
        const exercises = data(row);
        await page.locator('[data-exercise-id]').waitFor();
        await page.evaluate(() => localStorage.setItem('klink.previous-progress-test', 'keep'));
        if (width !== 390) {
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          checks.push({ engine, width, activity: row.activity, level: row.level, opens: true });
          continue;
        }
        // Start a fresh round for the complete narrow-screen interaction check.
        await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.includes('audio-words:')) localStorage.removeItem(key); });
        await page.reload();
        for (const [index, e] of exercises.entries()) {
          await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
          if (index === 1) { await page.reload(); await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor(); }
          const pause = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true });
          if (await pause.count()) await pause.click();
          if (index === 0) {
            await page.getByRole('button', { name: /^Luister naar de opdracht(?:$|:)/ }).click();
            assert((await page.evaluate(() => window.__played)).some(src => src.includes('KLINK-INS-f30ca4bc7abf')));
          }
          if (row.activity === 'listen') {
            const options = page.locator('.cp-choice-grid button');
            // The shared player can already have played the stimulus automatically.
            assert(await options.first().isDisabled() || (await page.evaluate(() => window.__played)).includes(e.prompt.audio.src));
            await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
            const correct = e.options.findIndex(option => option.id === e.answer.correctOptionIds[0]);
            if (index === 0) {
              await options.nth((correct + 1) % e.options.length).click();
              assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Luister opnieuw'));
            }
            await page.locator('.cp-choice-grid button:not(:disabled)').first().waitFor();
            await options.nth(correct).focus(); await page.keyboard.press('Enter');
          } else {
            const sources = page.locator('.cp-match-board > div').nth(0).locator('button');
            const targets = page.locator('.cp-match-board > div').nth(1).locator('button');
            assert(await targets.first().isDisabled(), 'Matching requires selecting and hearing a source');
            for (const [position, source] of e.sources.entries()) {
              await sources.nth(position).focus(); await page.keyboard.press('Enter');
              const target = e.targets.findIndex(item => item.id === e.answer.mapping[source.id]);
              if (index === 0 && position === 0) {
                await targets.nth((target + 1) % e.targets.length).click();
                assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Luister opnieuw'));
              }
              await targets.nth(target).click();
            }
          }
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          if (index === 0) await page.screenshot({ path: `${out}/${engine}-${row.activity}-${row.level}-mobile.png` });
          await page.locator('.cp-exercise-feedback').getByRole('button', { name: /^(Verder|Ronde afronden|Klaar)$/ }).click();
        }
        const key = roundProgressPrefix + collectionProgressId(row.activity, row.id, row.url);
        const progress = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
        assert.equal(progress.done.length, exercises.length);
        await page.goto(base + '/' + chapterHash({ ...location(row), collection: undefined }));
        // This chosen final list is revealed by the shared list navigation.
        await page.locator('.cp-chapter-collections').waitFor();
        const card = page.locator(`[data-collection="${row.id}"]`);
        while (!await card.count()) { const more = page.getByRole('button', { name: /Meer/ }); assert(await more.count()); await more.click(); }
        assert((await card.getAttribute('class')).includes('is-complete'));
        assert.equal(await page.evaluate(() => localStorage.getItem('klink.previous-progress-test')), 'keep');
        checks.push({ engine, width, activity: row.activity, level: row.level, complete: exercises.length, resume: true, keyboard: true, wrongAnswer: true });
      }
    }
    const audioSamples = new Set(selected.flatMap(row => {
      const e = data(row)[0];
      return [e.instructionAudio.src, e.prompt?.audio?.src ?? e.sources[0].audio.src];
    }));
    for (const src of audioSamples) {
      const duration = await page.evaluate(async src => {
        const context = new AudioContext();
        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error('Audio unavailable');
          return (await context.decodeAudioData(await response.arrayBuffer())).duration;
        } finally { await context.close(); }
      }, src);
      assert(duration > 0.2);
    }
    checks.push({ engine, nativeAudioDecoded: audioSamples.size });
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(`${out}/browser-check.json`, JSON.stringify({ checks, errors, mockedInteractionAudio: true, localOnly: true }, null, 2));
console.log(`PASS ${checks.length} browser checks in Chromium and WebKit.`);
