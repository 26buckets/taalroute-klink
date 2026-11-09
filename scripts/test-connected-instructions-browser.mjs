import assert from 'node:assert/strict';
import { openGroupActivity } from './browser-route-helpers.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { groupInstructionNeeds, groupExercises } from '../lib/group-practice.ts';
import { extendedInstructionNeeds } from '../lib/extended-practice.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';
const needs = [...groupInstructionNeeds, ...extendedInstructionNeeds];
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__played = [];
  sessionStorage.removeItem('klink.instructies.v1');
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; }
    play() { window.__played.push(this.src); this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 15); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
try {
  for (const need of needs) for (const mode of need.activities) {
    let count = 0;
    for (const pack of packs) for (const exercise of groupExercises(pack, mode)) {
      assert.equal(exercise.instructionAudio?.audioId, need.id);
      assert.equal(exercise.instructionAudio?.src, `/package-audio/instructions/${need.id}.wav`);
      count++;
    }
    assert(count > 0, `${mode}: no actual exercise`);
    const index = packs.findIndex(pack => groupExercises(pack, mode).length);
    await page.goto(`${process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830'}/#learner/home`);
    await page.reload();
    await page.locator('.cp-package-grid > button').nth(index).click();
    await openGroupActivity(page, mode);
    const src = `/package-audio/instructions/${need.id}.wav`;
    await page.locator('.cp-exercise-record-head h3').waitFor();
    const first = groupExercises(packs[index], mode)[0];
    if (first.requiresAudio) await page.waitForFunction(() => window.__played.length > 0);
    await page.waitForTimeout(150);
    assert.equal(await page.getByRole('button', { name: /^Luister naar de opdracht(?:$|:)/ }).count(), 0);
    const played = await page.evaluate(() => window.__played);
    assert(!played.includes(src)); assert(played.every(source => !isWithdrawnAudio(source)));
    checks.push({ id: need.id, mode, exercises: count, instructionWithdrawn: true, taskAudioRetained: first.requiresAudio ? played.length > 0 : true });
  }
  assert.deepEqual(errors, []);
  mkdirSync('outputs/instruction-connections-20261017', { recursive: true });
  writeFileSync('outputs/instruction-connections-20261017/browser-checks.json', JSON.stringify({ checks, boundary: 'Audio event ordering and connections tested; actual files verified separately. No human listening claim.' }, null, 2));
  console.log(`${needs.length} instruction recordings withdrawn across ${checks.length} activity types; task content retained.`);
} finally { await browser.close(); }
