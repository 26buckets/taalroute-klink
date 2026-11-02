import { chromium, webkit } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import assert from 'node:assert/strict';
import { sourceSpellingReview } from '../lib/source-spelling-review.ts';
const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:19049';
const now = 1800000000000, day = 86400000;
const checks = [], errors = [];
const output = mkdtempSync('/tmp/klink-spelling-browser-');
const index = JSON.parse(readFileSync('data/klink-production-index.json'));
const rows = sourceSpellingReview.exercises.map(e => ({ exercise: e, collection: index.find(r => r.id === 'production:spelling-path:alfa-a:' + (Number(e.sourceExerciseId.slice(-4)) <= 6 ? 'ZSH-A01' : 'ZSH-A02')).id }));
const route = (chapter, activity, collection) => base + '/#learner/chapters/' + chapter + '/' + activity + '/' + encodeURIComponent(collection) + '?level=alfa-a&help=guided';
try {
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch({ headless: true, ...(engine === 'chromium' ? { channel: 'chrome' } : {}) });
    try {
      const page = await browser.newPage({ viewport: { width: engine === 'chromium' ? 390 : 1280, height: 844 } });
      page.on('pageerror', e => errors.push({ engine, message: String(e), url: page.url(), stack: e.stack }));
      await page.addInitScript(now => {
        if (!localStorage.getItem('klink.test.clock')) {
          localStorage.setItem('klink.test.clock', String(now));
          localStorage.setItem('klink.learning-review.v1', '{"old:recall:word":{"due":1,"last":0,"streak":0}}');
          localStorage.setItem('klink.taalroute.content-workflow.v1:retained', '{"draft":"Bewaar dit"}');
        }
        Date.now = () => Number(localStorage.getItem('klink.test.clock'));
        window.played = [];
        HTMLMediaElement.prototype.play = function () { window.played.push(this.dataset.klinkSource || this.getAttribute('src')); setTimeout(() => this.dispatchEvent(new Event('ended')), 20); return Promise.resolve(); };
        HTMLMediaElement.prototype.pause = function () {};
      }, now);
      await page.goto(base + '/#learner'); await page.locator('.learner-app').waitFor();
      for (const { exercise, collection } of rows) {
        await page.goto(base + '/#learner'); await page.locator('.learner-app').waitFor();
        await page.evaluate(({ id, collection }) => localStorage.setItem(`klink.group.v1:chapter:spelling-path:${collection}:spelling-path`, JSON.stringify({ version: 1, exerciseId: id, done: false })), { id: exercise.exerciseId, collection });
        await page.goto(route('spelling', 'spelling-path', collection));
        const task = page.locator(`[data-exercise-id="${exercise.exerciseId}"]`); await task.waitFor();
        const answer = exercise.options.find(x => exercise.answer.correctOptionIds.includes(x.id));
        await task.getByRole('button', { name: answer.label, exact: true }).click();
        assert.equal(await task.getAttribute('data-practice-ready'), 'true');
        const state = await page.evaluate(id => ({ attempt: JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).filter(a => a.exerciseId === id).at(-1), record: JSON.parse(localStorage.getItem('klink.learning-review.v1'))[id] }), exercise.exerciseId);
        assert.equal(state.attempt.helpUsed, false); assert.equal(state.attempt.support, 'none'); assert.equal(state.record.due, now + day);
        checks.push({ engine, sourceId: exercise.sourceExerciseId, pointerAnswerIndependent: true, scheduled: state.record });
      }
      const first = rows[0].exercise, reviewRoute = route('repeat', 'learning-review', sourceSpellingReview.collectionId);
      await page.goto(reviewRoute); assert.equal(await page.locator(`[data-exercise-id="${first.exerciseId}"]`).count(), 0);
      for (const [offset, next] of [[1, 4], [4, 11], [11, 18]]) {
        await page.evaluate(time => localStorage.setItem('klink.test.clock', String(time)), now + offset * day);
        await page.goto(base + '/#learner'); await page.locator('.learner-app').waitFor();
        await page.goto(reviewRoute); const task = page.locator(`[data-exercise-id="${first.exerciseId}"]`); await task.waitFor();
        const answer = first.options.find(x => first.answer.correctOptionIds.includes(x.id));
        await task.getByRole('button', { name: answer.label, exact: true }).focus(); await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(id => JSON.parse(localStorage.getItem('klink.learning-review.v1'))[id].due, first.exerciseId), now + next * day);
        checks.push({ engine, sourceId: first.sourceExerciseId, answeredAtDay: offset, nextDueDay: next, reopened: true });
      }
      await page.reload();
      await page.locator('[data-exercise-id]').first().waitFor();
      const retained = await page.evaluate(() => ({ review: JSON.parse(localStorage.getItem('klink.learning-review.v1')), draft: localStorage.getItem('klink.taalroute.content-workflow.v1:retained') }));
      assert.deepEqual(retained.review['old:recall:word'], { due: 1, last: 0, streak: 0 }); assert.equal(retained.draft, '{"draft":"Bewaar dit"}');
      await page.screenshot({ path: `${output}/${engine}.png`, fullPage: true });
    } finally { await browser.close(); }
  }
} finally { cpSync(output, 'docs/klink10-spelling-review-aa-20261102', { recursive: true }); rmSync(output, { recursive: true }); writeFileSync('docs/klink10-spelling-review-aa-20261102/browser.json', JSON.stringify({ checks, errors, simulatedPlayback: true, actualListening: false }, null, 2) + '\n'); }
assert.equal(errors.length, 0); assert.equal(checks.length, 26);
console.log('26 browser checks: ten source recalls per engine, pointer/keyboard, scheduled revisits, reload and previous storage preserved.');
