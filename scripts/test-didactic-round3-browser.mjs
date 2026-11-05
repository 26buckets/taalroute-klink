import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_DIDACTIC_OUTPUT || 'outputs/didactic-review-round3-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
const pass = message => { checks.push(message); console.log('PASS', message); };
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    dataset = {};
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 30); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const forward = () => page.locator('.cp-exercise-feedback').getByRole('button', { name: /Verder|Ronde afronden/ });
async function open(chapter, activity, collection, exercise) {
  await page.goto(`${base}/${chapterHash({ chapter, activity, collection: collection.id, level: 'all' })}`);
  if (exercise) await page.evaluate(({ key, id }) => localStorage.setItem(key, JSON.stringify({ version: 1, exerciseId: id, done: false })), { key: `klink.group.v1:chapter:${activity}:${collection.id}:${activity}`, id: exercise.exerciseId });
  await page.reload();
  await page.locator('.is-mixed-round').waitFor();
}
try {
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(`${base}/#teacher/overview`); await page.reload();
    const entry = page.getByRole('button', { name: 'Kies een leesstap en bekijk de docenthulp', exact: true });
    await entry.waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert((await entry.boundingBox()).height >= 48);
    await entry.click();
    const plan = page.locator('[data-teacher-practice-plan]');
    await page.keyboard.press('Tab');
    await plan.locator('summary').focus();
    assert(await plan.locator('summary').evaluate(el => { const style = getComputedStyle(el); return style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2; }));
    await page.keyboard.press('Enter');
    assert.equal(await plan.getAttribute('open'), '');
    assert((await plan.innerText()).includes('Deze stap heeft één woord'));
    assert((await plan.innerText()).includes('mat'));
    assert.equal(await plan.locator('ol > li').count(), 5);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.cp-coverage-filters select').nth(1).selectOption({ index: 1 });
    assert((await plan.innerText()).includes('tas'));
    assert(!(await plan.innerText()).includes('Deze stap heeft één woord'));
    await plan.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/teacher-${width}.png` });
  }
  pass('Teacher route, lesson-specific guidance, single-word guard and keyboard disclosure work at three widths');
  await page.setViewportSize({ width: 1366, height: 950 });
  const sound = chapterCollections('sound-path')[0];
  await open('sounds', 'sound-path', sound);
  assert.equal(await page.locator('[data-model-unit]').innerText(), sound.exercises[0].modelUnits[sound.exercises[0].modelFocus]);
  await page.screenshot({ path: `${out}/sound-model.png` });
  await forward().click();
  assert.equal(await page.locator('[data-model-unit]').count(), 0);
  pass('Sound target is marked in the example, never in the answer trial');
  const grammar = chapterCollections('grammar-path').find(item => item.id.includes('grammar-we'));
  const item = grammar.exercises.find(item => item.mode === 'learning-choice');
  await open('grammar', 'grammar-path', grammar, item);
  const wrong = item.options.find(option => !item.answer.correctOptionIds.includes(option.id));
  await page.locator('.cp-learning-task .cp-choice-grid').getByRole('button', { name: wrong.label, exact: true }).click();
  assert(!/luister/i.test(await page.locator('.cp-exercise-feedback').innerText()));
  await page.getByRole('button', { name: 'Voorbeeld', exact: true }).click();
  assert((await page.locator('.cp-source-text').innerText()).includes(item.helpWord));
  pass('Grammar retry points to available visual example, not a missing listening button');
  const text = chapterCollections('text-question')[0];
  await open('texts', 'text-question', text);
  const question = text.exercises[0];
  const choices = page.locator('.cp-extended-option > button:first-child');
  const right = question.options.findIndex(option => question.answer.correctOptionIds.includes(option.id));
  await choices.nth(right).click();
  assert(await forward().isEnabled());
  assert(await choices.evaluateAll(nodes => nodes.every(node => node.disabled)));
  await choices.nth((right + 1) % question.options.length).evaluate(button => button.click());
  assert.equal(await choices.nth(right).getAttribute('aria-pressed'), 'true');
  assert(await page.getByRole('button', {name:'Luister naar de tekst',exact:true}).first().isEnabled());
  await page.getByRole('button', {name:'Luister naar de tekst',exact:true}).first().click();
  await forward().click();
  pass('Correct answer stays selected; replay and Continue remain available');
  await page.goto(`${base}/#learner/home`);
  assert.equal(await page.locator('[data-teacher-practice-plan]').count(), 0);
  assert.deepEqual(errors, []);
  pass('No teacher planning text added to learner home; no browser errors');
} finally {
  writeFileSync(`${out}/browser-checks.json`, JSON.stringify({ base, checks, errors, checkedAt: new Date().toISOString(), audio: 'Playback mocked for interaction tests; audio files unchanged.' }, null, 2));
  await browser.close();
}
