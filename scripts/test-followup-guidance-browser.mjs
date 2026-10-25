import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18836';
const out = process.env.KLINK_FOLLOWUP_OUTPUT || '../../outputs/klink-vervolg-online-20261025/local';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
const allLessons = packs.slice(9, 14).flatMap(pack => pack.lessons.map((lesson, index) => ({ pack, lesson, index })));
assert.equal(allLessons.length, 78);
const errors = [], checks = [], covered = [];
const smokeIds = ['appelsap', 'huiskamer', 'borstels', 'zingen', 'brillen', 'sokken', 'kassa', 'ramen', 'koekjes', 'tomaten'].map(word => `woord-klink-woord-${word}`);
const smoke = process.env.KLINK_FOLLOWUP_SMOKE === '1';
const part = Number(process.env.KLINK_FOLLOWUP_PART || 0);
assert([0, 1, 2, 3, 4].includes(part));
assert(!(smoke && part));
const selected = allLessons.filter(({ lesson }, i) => smoke ? smokeIds.includes(lesson.id) : part === 0 || i % 4 === part - 1);
let steps = 0;
page.on('pageerror', e => errors.push(e.message));
const step = page.locator('.cp-exercise-browser');
try {
 for (const { pack, lesson, index } of selected) {
  const exercises = exercisesForLesson(pack, lesson);
  await page.goto(base + `/#learner/package/${pack.id}`);
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-start-lesson').nth(index).click();
  await page.getByRole('button', { name: 'Andere oefening', exact: true }).click();
  await page.locator('.cp-exercise-menu-options').getByRole('button', { name: 'Nog een keer', exact: true }).click();
  for (const e of exercises.filter(e => e.phase === 'recall')) await answerActivity(page, e);
  assert.equal(await step.getAttribute('data-exercise-id'), exercises[0].exerciseId);
  assert.equal(await step.locator('output strong').innerText(), 'Eerst deze oefening');
  checks.push('Forward jump returns to unfinished first exercise with explanation');
  await page.reload();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Ga verder', exact: true }).click();
  for (const e of exercises) {
    if (e.mode === 'word-dictation') {
      assert.equal(await page.locator('.cp-letter-demo, .cp-letter-model').count(), 0, 'Dictation never reveals a model letter');
      assert.equal(await page.getByRole('button', { name: 'Kijk nog eens', exact: true }).count(), 0);
    }
    if (e.mode === 'word-build') {
      assert(typeof e.exampleWord === 'string');
      const word = String(e.exampleWord);
      assert(await page.locator('.cp-letter-demo').evaluate(el => {
        const stage = el.closest('.cp-exercise-stage').getBoundingClientRect();
        return [...el.querySelectorAll('span')].every(item => {
          const box = item.getBoundingClientRect();
          return box.x >= stage.x && box.right <= stage.right && (item.matches('.cp-demo-source') || item.scrollWidth <= item.clientWidth + 1);
        });
      }), 'Every demonstration slot and its text fit inside the exercise');
      await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
      const letters = e.answer.targetTileIds.map(id => e.tiles.find(tile => tile.id === id).token);
      if (letters.length === 1) {
        await page.getByRole('button', { name: 'Kijk nog eens', exact: true }).click();
        await page.getByLabel(`Voorbeeld: tik op ${letters[0]}. Die letters komen in vak 1.`, { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
        for (const [width,height] of [[320,568],[390,844],[1366,900]]) {
          await page.setViewportSize({width,height});
          const letter = page.getByRole('button', { name: `${letters[0]}, begin hier`, exact: true });
          await letter.scrollIntoViewIfNeeded(); assert((await letter.boundingBox()).height >= 48);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await page.screenshot({ path: `${out}/${lesson.id}-${word}-hulp-${width}.png` });
        }
        await page.setViewportSize({width:320,height:568});
        await page.getByRole('button', { name: `${letters[0]}, begin hier`, exact: true }).click();
        await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
        assert(await page.locator('.cp-exercise-feedback > button').isDisabled());
        await page.getByRole('button', { name: `${letters[0]}, begin hier`, exact: true }).click();
      } else {
      await page.locator('.cp-tile-bank').getByRole('button', { name: letters[1], exact: true }).first().click();
      assert.equal(await page.getByRole('button', { name: `Plek 1, leeg, voorbeeld: ${letters[0]}`, exact: true }).count(), 1);
      const otherFirst = e.tiles.findIndex(tile => tile.token === letters[0] && tile.id !== e.answer.targetTileIds[0]);
      if (otherFirst >= 0) await page.locator('.cp-tile-bank button').nth(otherFirst).click();
      else await page.getByRole('button', { name: `${letters[0]}, begin hier`, exact: true }).click();
      await page.getByRole('button', { name: 'Kijk nog eens', exact: true }).click();
      await page.getByLabel(`Voorbeeld: tik op ${letters[1]}. ${letters[1].length > 1 ? 'Die letters komen' : 'Die letter komt'} in vak 2.`, { exact: true }).waitFor();
      assert(await page.locator('.cp-letter-demo').evaluate(el => {
        const stage = el.closest('.cp-exercise-stage').getBoundingClientRect();
        return [...el.querySelectorAll('span')].every(item => {
          const box = item.getBoundingClientRect();
          return box.x >= stage.x && box.right <= stage.right && (item.matches('.cp-demo-source') || item.scrollWidth <= item.clientWidth + 1);
        });
      }), 'Every demonstration slot and its text fit inside the exercise');
      await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: `Plek 1: ${letters[0]}, weghalen`, exact: true }).count(), 1);
      assert(await page.locator('.cp-first-letter-guide').evaluate(el => {
        const stage = el.closest('.cp-exercise-stage').getBoundingClientRect();
        return [el.querySelector('.cp-letter-model').closest('button'), el.querySelector('.cp-first-tile')].every(item => {
          const box = item.getBoundingClientRect(); return box.top >= stage.top && box.bottom <= stage.bottom;
        });
      }), 'Active target slot and letter button are both visible on a small screen');
      for (const [width,height] of [[320,568],[390,844],[1366,900]]) {
        await page.setViewportSize({width,height});
        const letter = page.getByRole('button', { name: `${letters[1]}, deze ${letters[1].length > 1 ? 'letters' : 'letter'} nu`, exact: true });
        await letter.scrollIntoViewIfNeeded(); assert((await letter.boundingBox()).height >= 48);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `${out}/${lesson.id}-${word}-hulp-${width}.png` });
      }
      await page.setViewportSize({width:320,height:568});
      for (const letter of letters.slice(1)) {
        const active = page.getByRole('button', { name: `${letter}, deze ${letter.length > 1 ? 'letters' : 'letter'} nu`, exact: true });
        assert(await active.evaluate(el => { const r = document.createRange(); r.selectNodeContents(el.firstChild); const t = r.getBoundingClientRect(), b = el.getBoundingClientRect(); return t.left >= b.left && t.right <= b.right; }), 'The entire letter combination fits inside its button');
        if (letter.length >= 3) {
          await page.getByRole('button', { name: 'Kijk nog eens', exact: true }).click();
          assert(await page.locator('.cp-demo-source').evaluate(el => { const r = document.createRange(); r.selectNodeContents(el.firstChild); const t = r.getBoundingClientRect(), b = el.getBoundingClientRect(); return t.left >= b.left && t.right <= b.right; }), 'The repeated example fits the entire combination');
          await page.screenshot({ path: `${out}/${lesson.id}-${letter}-voorbeeld-320.png` });
          await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
        }
        await active.click();
      }
      }
      checks.push(`${word}: ${letters.length === 1 ? "single combination, repeat demo and undo/retry" : "wrong letter and retained first letter after Kijk nog eens"}, three viewports and complete guided build`);
    } else await answerActivity(page, e, { advance: false, checkFocus: false });
    await page.waitForTimeout(1200);
    assert.equal(await step.getAttribute('data-exercise-id'), e.exerciseId);
    assert.equal(await page.getByRole('button', { name: /Automatisch verder/ }).count(), 0);
    const next = page.locator('.cp-exercise-feedback > button'); await next.scrollIntoViewIfNeeded();
    const box = await next.boundingBox(), nav = await page.getByRole('navigation', { name: 'Cursistnavigatie' }).boundingBox();
    assert(box.height >= 48 && box.y + box.height <= nav.y + 1);
    await next.click();
  }
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  await page.screenshot({path:`${out}/${lesson.id}-afgerond-320.png`});
  if (index < pack.lessons.length - 1) {
    await page.getByRole('button', { name: 'Volgende les', exact: true }).click();
    assert.equal(await step.getAttribute('data-exercise-id'), exercisesForLesson(pack, pack.lessons[index + 1])[0].exerciseId);
  } else {
    await page.getByRole('button', { name: 'Alle lessen', exact: true }).click();
    assert.equal(await page.locator('.cp-start-lesson').count(), pack.lessons.length);
  }
  checks.push(`${lesson.id}: all ${exercises.length} steps with real audio, deliberate continuation, error recovery, demos, independent recall and mobile footer`);
  assert.deepEqual(errors, []);
  covered.push({ packageId: pack.id, lessonId: lesson.id, steps: exercises.length });
  steps += exercises.length;
  console.log(`PASS ${lesson.id}: ${exercises.length} steps, letter help, resume and continuation`);
 }
 assert.equal(steps, selected.reduce((n, { pack, lesson }) => n + exercisesForLesson(pack, lesson).length, 0));
 assert.equal(covered.length, selected.length);
 assert.equal(checks.length, selected.length * 3);
 writeFileSync(`${out}/checks.json`, JSON.stringify({steps,checks,covered,errors,smoke,part,realAudio:true,physicalPhone:false},null,2));
  console.log(JSON.stringify({checks:checks.length,steps,errors}));
} finally { await browser.close(); }
