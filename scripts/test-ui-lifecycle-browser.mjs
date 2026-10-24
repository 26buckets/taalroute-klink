import assert from 'node:assert/strict';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
import { readFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const rendererSource = readFileSync(new URL('../components/product/package-exercise-browser.tsx', import.meta.url), 'utf8');
const linkedSource = rendererSource.split('function LinkedQuestionSurface(')[1].split('\nfunction ')[0];
assert(linkedSource.includes('if (!linked || !findAudioSource(exercise))'));
assert(linkedSource.includes('Vraag je docent om hulp.'));
assert(!linkedSource.includes("onFinish('bekeken', true)"));
const routeSource = rendererSource.split('function RouteSurface(')[1].split('\nfunction ')[0];
assert(!routeSource.includes('<strong>{task.exerciseId}</strong>'));
assert(!routeSource.includes('<small>{task.componentId}</small>'));
assert(routeSource.includes('Oefening {index + 1}'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], writes = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/api/')) writes.push(request.url()); });
await page.addInitScript(() => {
  window.__mediaAudit = { audios: [], stoppedTracks: 0, recorderCreations: 0, pendingTimers: [], clearedTimers: [] };
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; window.__mediaAudit.audios.push(this); }
    play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 80); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: () => new Promise(resolve => {
    window.__resolveMicrophone = () => resolve({ getTracks: () => [{ stop: () => { window.__mediaAudit.stoppedTracks++; } }] });
  }) });
  window.MediaRecorder = class { constructor() { window.__mediaAudit.recorderCreations++; } };
  const originalSet = window.setTimeout.bind(window), originalClear = window.clearTimeout.bind(window);
  window.setTimeout = (callback, delay, ...args) => {
    const id = originalSet(callback, delay === 550 ? 5000 : delay, ...args);
    if (delay === 550) window.__mediaAudit.pendingTimers.push(id);
    return id;
  };
  window.clearTimeout = id => { window.__mediaAudit.clearedTimers.push(id); originalClear(id); };
});
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const stopped = () => page.evaluate(() => window.__mediaAudit.audios.every(audio => audio.paused));
const exerciseId = () => page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
async function openFirst() {
  await page.goto(`${base}/#learner/home`);
  await page.locator('.cp-home .cp-package-grid > button').first().click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
}
async function family(name) {
  const back = page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first();
  if (await back.count()) await back.click();
  const id = { Typ: 'copy', Schrijf: 'write', 'Wat hoort bij elkaar?': 'match', 'Zoek twee dezelfde': 'memory', 'Zeg na': 'speak', 'Kijk en luister': 'meet' }[name];
  await page.locator(`[data-activity="${id}"]`).click();
  const pause = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true });
  if (await pause.count()) await pause.click();
}
const groupExercise = id => groupActivities.flatMap(activity => groupExercises(packs[0], activity.id)).find(item => item.exerciseId === id);
try {
  await openFirst();
  await page.locator('.cp-start-lesson').nth(1).click();
  const guided = exercisesForLesson(packs[0], packs[0].lessons[1]);
  assert.equal(await page.getByRole('button', { name: 'Volgende oefening', exact: true }).count(), 0);
  assert(await page.locator('.cp-exercise-workspace aside button').evaluateAll(buttons => buttons.every(button => !button.disabled)));
  for (const exercise of guided) {
    await answerActivity(page, exercise);
    await page.waitForFunction(() => window.__mediaAudit.audios.every(audio => audio.paused));
  }
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  console.log('PASS guided sequence, one-click choices, wrong/correct, undo relocks, focus/status, audio stops');
  await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click(); await page.locator('.cp-step-scope select').selectOption('');
  await family('Typ');
  const typeId = await exerciseId();
  const typeExercise = groupExercise(typeId);
  await page.locator('.cp-text-entry input').fill(typeExercise.fields[0].acceptedAnswers[0]);
  await page.getByRole('button', { name: 'Controleer', exact: true }).click();
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('right')));
  await page.locator('.cp-text-entry input').fill('fout');
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('idle')));
  await page.getByRole('button', { name: 'Controleer', exact: true }).click();
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('wrong')));
  await family('Schrijf');
  await page.locator('.cp-text-entry input').fill(await page.locator('.cp-trace-model strong').innerText());
  await page.getByRole('button', { name: 'Ik heb geschreven', exact: true }).click();
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('right')));
  await page.locator('.cp-text-entry input').fill('fout');
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('idle')));
  await family('Wat hoort bij elkaar?');
  const matchId = await exerciseId();
  const matching = groupExercise(matchId);
  await page.locator('.cp-match-board > div').nth(0).locator('button').first().click();
  const wrongTarget = matching.targets.findIndex(target => target.id !== matching.answer.mapping[matching.sources[0].id]);
  await page.locator('.cp-match-board > div').nth(1).locator('button').nth(wrongTarget).click();
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('wrong')));
  for (let i = 0; i < matching.sources.length; i++) {
    await page.locator('.cp-match-board > div').nth(0).locator('button').nth(i).click();
    const targetIndex = matching.targets.findIndex(target => target.id === matching.answer.mapping[matching.sources[i].id]);
    await page.locator('.cp-match-board > div').nth(1).locator('button').nth(targetIndex).click();
  }
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('right')));
  assert(await page.locator('.cp-match-board > div').nth(0).locator('button').first().isDisabled());
  console.log('PASS typing/writing reset feedback; matching preserves correct pairs and permits recovery');
  await family('Zoek twee dezelfde');
  const memoryId = await exerciseId();
  const memory = groupExercise(memoryId);
  const first = memory.items[0];
  const pair = memory.items.findIndex(item => item.itemId !== first.itemId && item.pairKey === first.pairKey);
  await page.locator('.cp-memory-grid button').nth(0).click();
  await page.locator('.cp-memory-grid button').nth(pair).click();
  await family('Typ');
  assert(await page.evaluate(() => window.__mediaAudit.pendingTimers.length > 0 && window.__mediaAudit.pendingTimers.every(id => window.__mediaAudit.clearedTimers.includes(id))));
  console.log('PASS memory timer cancelled when leaving exercise');
  await family('Zeg na');
  await page.getByRole('button', { name: 'Neem op', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Even wachten', exact: true }).isDisabled());
  await family('Typ');
  await page.evaluate(() => window.__resolveMicrophone());
  await page.waitForFunction(() => window.__mediaAudit.stoppedTracks > 0);
  assert.equal(await page.evaluate(() => window.__mediaAudit.recorderCreations), 0);
  console.log('PASS late microphone grant stops tracks without starting recorder');
  await family('Kijk en luister');
  await page.locator('.cp-model-content').click();
  assert.equal(await stopped(), false);
  await page.getByRole('button', { name: 'Woorden', exact: true }).first().click();
  assert(await stopped());
  await page.getByRole('button', { name: 'Luister naar mat', exact: true }).click();
  assert.equal(await stopped(), false);
  await page.getByRole('button', { name: 'Afsluiten', exact: true }).click();
  assert(await stopped());
  assert.equal(await page.evaluate(() => sessionStorage.getItem('klink.instructies.v1')), null);
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
  console.log('PASS main navigation and exit stop audio; no API writes or browser errors');
} finally {
  await browser.close();
}
