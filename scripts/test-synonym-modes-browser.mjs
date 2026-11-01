import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { synonymCollections, synonymExercises } from '../lib/synonyms.ts';
import { chapterHash } from '../lib/practice-chapters.ts';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18884';
const output = new URL('../../synonym-modes-browser-checks.json', import.meta.url);
const screenshots = new URL('../../../outputs/synoniemen/', import.meta.url);
const checks = [], errors = [];
const url = (collection, activity = 'synonyms') => base + '/' + chapterHash({ chapter: 'words', activity, collection: collection.id, level: collection.level, help: 'practice' });
const choices = page => page.locator('.cp-choice-grid .cp-extended-option > button');

async function verify(page, exercise, activity, wrongFirst = false) {
  await page.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
  assert.equal(await page.locator('.cp-task-card img, .cp-task-card video').count(), 0);
  const next = page.locator('.cp-exercise-feedback > button');
  if (activity === 'cards') {
    const card = page.getByRole('button', { name: 'Toon het synoniem', exact: true });
    assert.equal(await card.innerText(), exercise.cards[0].front.text);
    assert(await next.isDisabled(), 'Reveal the card before marking it practised');
    await card.click();
    await page.waitForFunction(expected => document.querySelector('.cp-card-back[aria-hidden="false"] strong')?.innerText === expected, exercise.cards[0].back.text);
    assert.equal(await page.locator('.cp-card-back[aria-hidden="false"] strong').innerText(), exercise.cards[0].back.text);
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Geoefend'));
    await page.getByRole('button', { name: 'Toon het eerste woord', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('.cp-card-front[aria-hidden="false"] strong')?.innerText === expected, exercise.cards[0].front.text);
    assert.equal(await page.locator('.cp-card-front[aria-hidden="false"] strong').innerText(), exercise.cards[0].front.text);
  } else {
    if (activity === 'hear-match') {
      assert.equal(await page.locator('.cp-synonym-word').count(), 0, 'The spoken source word is hidden');
      await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).waitFor();
      await choices(page).first().waitFor({ state: 'visible' });
      await choices(page).first().evaluate(node => new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => { if (!node.disabled) { clearInterval(timer); resolve(); } else if (Date.now() - start > 15000) { clearInterval(timer); reject(new Error('Audio never unlocked the answers')); } }, 50);
      }));
    } else assert.equal(await page.locator('.cp-synonym-word').innerText(), exercise.prompt.text);
    assert.deepEqual(await choices(page).allTextContents(), exercise.options.map(option => option.label));
    const right = exercise.options.findIndex(option => exercise.answer.correctOptionIds.includes(option.id));
    if (wrongFirst) {
      await choices(page).nth((right + 1) % 4).click();
      await page.locator('.cp-exercise-feedback.wrong').waitFor();
    }
    await choices(page).nth(right).click();
    await page.locator('.cp-exercise-feedback.right').waitFor();
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes(exercise.correctFeedback));
  }
  assert(await next.isEnabled());
}

for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch(engine === 'chromium' ? { channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] } : {});
  try {
    for (const level of ['a1', 'a2', 'b1']) {
      const page = await browser.newPage({ viewport: { width: level === 'b1' ? 390 : 1366, height: 950 } });
      page.on('pageerror', error => errors.push(error.message));
      const collection = synonymCollections.find(item => item.level === level && item.exercises.length > 3);
      await page.goto(url(collection));
      await verify(page, collection.exercises[0], 'synonyms', true);
      await page.locator('.cp-exercise-feedback > button').click();
      const forwardId = collection.exercises[1].exerciseId;
      await page.locator(`[data-exercise-id="${forwardId}"]`).waitFor();
      await page.getByRole('button', { name: 'Wissel woord en synoniem', exact: true }).click();
      await verify(page, synonymExercises(collection.pack, 'synonyms', 1, true)[0], 'synonyms', true);
      await page.reload();
      await verify(page, synonymExercises(collection.pack, 'synonyms', 1, true)[0], 'synonyms');
      assert.equal(await page.getByRole('button', { name: 'Wissel woord en synoniem', exact: true }).getAttribute('aria-pressed'), 'true');
      for (const activity of ['cards', 'hear-match', 'synonyms']) {
        if (activity !== 'synonyms') {
          await page.getByRole('button', { name: 'Andere oefening', exact: true }).click();
          await page.locator(`[data-exercise-choice="${activity}"]`).click();
        } else {
          await page.getByRole('button', { name: 'Andere oefening', exact: true }).click();
          await page.locator('[data-exercise-choice="synonyms"]').click();
        }
        assert(page.url().includes(`/${activity}/${collection.id}`), 'The selected list, level and help survive switching');
        await verify(page, synonymExercises(collection.pack, activity, 1, true)[0], activity, activity === 'hear-match');
        if (activity === 'cards') {
          const review = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.learning-review.v1') ?? '{}'));
          assert(!Object.keys(review).some(id => id.endsWith(':cards')), 'Turning is participation, never an assessed answer');
        }
      }
      await page.getByRole('button', { name: 'Wissel woord en synoniem', exact: true }).click();
      await page.locator(`[data-exercise-id="${forwardId}"]`).waitFor();
      await page.getByRole('button', { name: 'Mix de kaarten', exact: true }).click();
      const mixed = synonymExercises(collection.pack, 'synonyms', 2);
      await verify(page, mixed[0], 'synonyms');
      await page.locator('.cp-exercise-feedback > button').click();
      await page.locator(`[data-exercise-id="${mixed[1].exerciseId}"]`).waitFor();
      await page.reload();
      await page.locator(`[data-exercise-id="${mixed[1].exerciseId}"]`).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert(await page.locator('.cp-synonym-controls button, .cp-choice-grid button').evaluateAll(nodes => nodes.every(node => { const box = node.getBoundingClientRect(); return box.width >= 44 && box.height >= 44; })));
      checks.push({ engine, level, modes: 3, reversed: true, mixed: true, reload: true, forwardPositionRestored: true });
      if (engine === 'chromium' && level === 'b1') {
        await fs.mkdir(screenshots, { recursive: true });
        await page.getByRole('button', { name: 'Andere oefening', exact: true }).click();
        await page.screenshot({ path: new URL('synoniemen-oefenvormen-mobiel.png', screenshots).pathname, fullPage: true });
        await page.locator('[data-exercise-choice="cards"]').click();
        await page.setViewportSize({ width: 1366, height: 950 });
        await page.locator('.cp-flash-card').waitFor();
        await page.screenshot({ path: new URL('synoniemen-draaikaart.png', screenshots).pathname, fullPage: true });
      }
      await page.close();
    }
    if (engine === 'chromium') {
      const page = await browser.newPage(), collection = synonymCollections[0];
      const exercise = synonymExercises(collection.pack, 'hear-match')[0], path = exercise.prompt.audio.src;
      await page.route('**' + path, route => route.fulfill({ status: 404, body: '' }));
      await page.goto(url(collection, 'hear-match'));
      await page.locator('.cp-audio-retry').waitFor();
      assert(await choices(page).first().isDisabled(), 'Failed audio cannot produce a successful listening answer');
      await page.unroute('**' + path);
      await page.getByRole('button', { name: 'Opnieuw luisteren', exact: true }).click();
      await verify(page, exercise, 'hear-match');
      checks.push({ audioFailure: 'answers blocked until successful retry' });
      await page.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
await fs.writeFile(output, JSON.stringify({ checks, errors }, null, 2) + '\n');
console.log(`PASS ${checks.length} synonym mode scenarios across Chromium/WebKit; real audio, reverse, shuffle, reload and mobile.`);
