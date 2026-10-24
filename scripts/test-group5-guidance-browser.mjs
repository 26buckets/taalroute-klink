import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18821';
const out = process.env.KLINK_GROUP5_OUTPUT || '../../outputs/klink-groep5-online-20261024/local';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
const pack = packs[3], errors = [], checks = [];
const smoke = process.env.KLINK_GROUP5_SMOKE === '1';
const tail = process.env.KLINK_GROUP5_TAIL === '1';
let steps = 0;
page.on('pageerror', e => errors.push(e.message));
const step = page.locator('.cp-exercise-browser');
try {
 for (const [index, lesson] of pack.lessons.entries()) {
  if (tail && index < 30) continue;
  if (!tail && smoke && !['klink-leesstap-13', 'klink-leesstap-15', 'klink-leesstap-16', 'woord-klink-woord-oor', 'woord-klink-woord-kaak', 'woord-klink-woord-staat', 'woord-klink-woord-strand'].includes(lesson.id)) continue;
  const exercises = exercisesForLesson(pack, lesson);
  await page.goto(base + '/#learner/home');
  await page.locator('.cp-package-grid > button').nth(3).click();
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
      for (const [width,height] of [[320,568],[390,844],[1366,900]]) {
        await page.setViewportSize({width,height});
        const letter = page.getByRole('button', { name: `${letters[1]}, deze ${letters[1].length > 1 ? 'letters' : 'letter'} nu`, exact: true });
        await letter.scrollIntoViewIfNeeded(); assert((await letter.boundingBox()).height >= 48);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `${out}/${word}-hulp-${width}.png` });
      }
      await page.setViewportSize({width:320,height:568});
      for (const letter of letters.slice(1)) await page.getByRole('button', { name: `${letter}, deze ${letter.length > 1 ? 'letters' : 'letter'} nu`, exact: true }).click();
      checks.push(`${word}: wrong letter, retained first letter after Kijk nog eens, three viewports and complete guided build`);
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
  }
  checks.push(`${lesson.id}: all ${exercises.length} steps with real audio, deliberate continuation, error recovery, demos, independent recall and mobile footer`);
  assert.deepEqual(errors, []);
  steps += exercises.length;
  console.log(`PASS ${lesson.id}: ${exercises.length} steps, letter help, resume and continuation`);
 }
 assert.equal(steps, tail ? 6 : smoke ? 59 : 167);
 assert.equal(checks.length, tail ? 6 : smoke ? 25 : 100);
 writeFileSync(`${out}/checks.json`, JSON.stringify({steps,checks,errors,smoke,tail,realAudio:true,physicalPhone:false},null,2));
  console.log(JSON.stringify({checks:checks.length,steps,errors}));
} finally { await browser.close(); }
