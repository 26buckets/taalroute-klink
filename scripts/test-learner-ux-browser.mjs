import assert from 'node:assert/strict';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson, primaryWordCards } from '../lib/taalroute-packages.ts';
const browsers = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.KLINK_BROWSER || 'chromium';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const out = `outputs/ux-review-20261017${engine === 'chromium' ? '' : `/${engine}`}`;
mkdirSync(out, { recursive: true });
const browser = await browsers[engine].launch({ ...(engine === 'chromium' ? { channel: 'chrome' } : {}), headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__played = [];
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() { this.paused = false; window.__played.push(this.src); this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 25); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
const nav = () => page.getByRole('navigation', { name: 'Cursistnavigatie' });
async function home() { await page.goto(`${base}/#learner/home`); await page.reload(); }
async function free(pack = packs[2]) {
  await home(); await nav().getByRole('button', { name: 'Lessen', exact: true }).click();
  await page.locator('.cp-package-grid > button').nth(packs.indexOf(pack)).click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click(); await page.locator('.cp-step-scope select').selectOption('');
}
async function family(label) {
  const back = page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first();
  if (await back.count()) await back.click();
  const id = { 'Kijk en luister': 'meet', Kies: 'listen', 'Wat hoort bij elkaar?': 'match', 'Leg het woord': 'build-model', Typ: 'copy', 'Zeg na': 'speak', Schrijf: 'write', 'Zoek twee dezelfde': 'memory', 'Draai de kaart': 'cards' }[label];
  await page.locator(`[data-activity="${id}"]`).click();
}
async function geometry(label) {
  await page.waitForTimeout(90);
  if (await page.locator('.is-mixed-round, .is-guided').count()) await page.locator('.cp-exercise-feedback').scrollIntoViewIfNeeded();
  // Scroll the app panel to its end: WebKit's visibility check ignores the fixed bottom navigation.
  if (page.viewportSize().height <= 600) await page.evaluate(async () => {
    const panel = document.querySelector('.learner-main');
    panel.scrollTo({ top: panel.scrollHeight, behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const result = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width }; };
    const head = rect('.cp-exercise-record-head'), stage = rect('.cp-exercise-stage'), footer = rect('.cp-exercise-feedback');
    const button = document.querySelector('.cp-exercise-feedback > button'); const b = button.getBoundingClientRect();
    const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    const text = document.querySelector('.cp-exercise-feedback output').getBoundingClientRect();
    const heading = document.querySelector('.cp-exercise-record-head h3');
    return { head, stage, footer, footerCovered: !button.contains(hit), feedbackWidth: text.width, headingClipped: heading.scrollHeight > heading.clientHeight + 1, overflow: document.documentElement.scrollWidth > innerWidth + 1, height: innerHeight };
  });
  assert(!result.overflow, `${label}: horizontal overflow`);
  for (const select of await page.locator('.cp-family-picker select:visible, .cp-mode-picker select:visible').all()) {
    const height = (await select.boundingBox()).height;
    assert(height >= 48 - 0.01, `${label}: select touch target is too small (${height}px)`);
  }
  assert(!result.headingClipped, `${label}: clipped instruction`);
  assert(result.head.bottom <= result.stage.top + 1, `${label}: header overlaps stage`);
  assert(result.stage.bottom <= result.footer.top + 1, `${label}: stage overlaps feedback`);
  assert(result.stage.height >= 80, `${label}: unusable exercise height ${result.stage.height}`);
  assert(result.feedbackWidth >= 120, `${label}: feedback squeezed to ${result.feedbackWidth}px`);
  assert(result.footer.bottom <= result.height + 1, `${label}: feedback outside viewport ${JSON.stringify(result)}`);
  if (result.footerCovered) {
    await page.screenshot({ path: `${out}/covered-footer.jpg`, type: 'jpeg', quality: 70 });
    console.log(await page.locator('.cp-exercise-feedback > button').evaluate(button => {
      const r = button.getBoundingClientRect();
      return { viewport: [innerWidth, innerHeight], button: r.toJSON(), covering: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.outerHTML };
    }));
  }
  assert(!result.footerCovered, `${label}: next button covered`);
}
try {
  for (const [width, height] of [[1366, 900], [1024, 900], [768, 900], [390, 844], [320, 844], [844, 390], [390, 400]]) {
    await page.setViewportSize({ width, height }); await free();
    assert(await page.locator('.cp-tabs button').evaluateAll(buttons => buttons.every(button => {
      const r = button.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && r.width >= 48 && r.height >= 48;
    })), 'Every package tab is visible and has a usable touch target');
    for (const label of ['Kijk en luister', 'Kies', 'Wat hoort bij elkaar?', 'Leg het woord', 'Typ', 'Zeg na', 'Schrijf', 'Zoek twee dezelfde', 'Draai de kaart']) {
      await family(label); await geometry(`${width} ${label}`);
      if (label === 'Draai de kaart') {
        const card = page.locator('.cp-flash-card'); await card.scrollIntoViewIfNeeded(); const front = await card.boundingBox();
        await card.click(); const back = await card.boundingBox();
        assert(Math.abs(front.height - back.height) < 1, 'Turning a card must not move the surrounding controls');
        assert(Math.abs(back.height - back.width) < 1, 'Word card stays square');
        assert.equal(await page.getByRole('button', { name: 'Afronden', exact: true }).count(), 0, 'One-card exercises use the main next button');
        const listen = page.getByRole('button', { name: 'Luister naar het woord', exact: true });
        if (width === 390 && height === 844) {
          const audio = await listen.boundingBox(), feedback = await page.locator('.cp-exercise-feedback').boundingBox();
          assert(audio.y + audio.height <= feedback.y + 1, 'The card and its listening button fit together on a standard phone');
        }
        await listen.scrollIntoViewIfNeeded(); await listen.click();
        await geometry(`${width} flipped card`);
        if ([1366, 390].includes(width)) await page.screenshot({ path: `${out}/final-card-${width}.jpg`, type: 'jpeg', quality: 72 });
      }
    }
  }
  checks.push('Nine free-practice families at seven viewport sizes including short and landscape: no overlap, fixed square cards, one next action and reachable controls');
  const routes = packs.flatMap(pack => pack.lessons.flatMap(lesson => exercisesForLesson(pack, lesson).map(exercise => ({ pack, lesson, exercise }))));
  for (const [width, height] of [[1366, 900], [768, 900], [390, 844], [320, 568], [844, 390], [390, 400]]) {
    await page.setViewportSize({ width, height });
    for (const mode of ['model', 'same-word', 'heard-word', 'word-build', 'word-dictation', 'word-image-match', 'listen-situation']) {
      const item = routes.filter(item => item.exercise.mode === mode).sort((a, b) => String(b.exercise.exampleWord ?? b.exercise.helpWord ?? b.exercise.text?.primary ?? '').length - String(a.exercise.exampleWord ?? a.exercise.helpWord ?? a.exercise.text?.primary ?? '').length)[0];
      if (!item) continue;
      await page.evaluate(position => localStorage.setItem('klink.taalroute.route.v1', JSON.stringify({ position, completed: [] })), { packageId: item.pack.id, lessonId: item.lesson.id, exerciseId: item.exercise.exerciseId });
      await page.reload(); await nav().getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: 'Ga verder', exact: true }).click();
      await geometry(`${width}x${height} guided ${mode}`);
      assert.equal(await page.locator('.cp-player-bar:visible').count(), 0, 'No duplicate lesson header');
      const input = page.locator('.cp-text-entry input');
      if (await input.count()) { await input.focus(); await geometry(`${width} focused input`); }
      if (width === 390 && height === 844 && mode === 'word-build') await page.screenshot({ path: `${out}/final-guided-mobile.jpg`, type: 'jpeg', quality: 72 });
    }
  }
  checks.push('Seven guided modes across desktop, tablet, narrow, short and landscape viewports; long words and focused inputs stay reachable');
  await page.setViewportSize({ width: 1366, height: 900 }); await free(); await family('Schrijf');
  await page.waitForTimeout(90); await page.evaluate(() => { window.__played = []; });
  await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  const writingId = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
  const writing = groupActivities.flatMap(activity => groupExercises(packs[2], activity.id)).find(item => item.exerciseId === writingId);
  assert((await page.evaluate(() => window.__played)).includes(writing.prompt.audio.src), 'Writing must expose its existing word recording');
  checks.push('Writing exercise exposes the linked word audio');
  await home(); await nav().getByRole('button', { name: 'Woorden', exact: true }).click();
  const filter = page.getByLabel('Kies een onderdeel');
  for (const pack of packs) { await filter.selectOption(pack.id); assert.equal(await page.locator('.cp-global-word-grid article').count(), primaryWordCards.filter(word => word.packageId === pack.id).length); }
  await filter.selectOption('all');
  const save = page.getByRole('button', { name: 'aardappel bewaren', exact: true }); await save.click();
  await filter.selectOption('saved'); assert.equal(await page.locator('.cp-global-word-grid article').count(), 1);
  await page.reload(); await nav().getByRole('button', { name: 'Herhalen', exact: true }).click();
  assert.match(await page.locator('.review-word-list').innerText(), /aardappel/);
  checks.push('All lesson filters and saved words remain accessible, with saved state surviving reload');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/ux-check.json`, JSON.stringify({ base, engine, checks, errors }, null, 2));
  await browser.close();
}
console.log(checks.map(check => `PASS ${check}`).join('\n'));
