import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { collectionProgressId, roundProgressPrefix } from '../lib/round-progress.ts';
import { groupSessionKey } from '../lib/group-practice.ts';
import { writingAnswerKey } from '../lib/writing-answer.ts';

const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:19105';
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/storage-preservation';
const row = chapterCollections('copy').find(item => item.contentUrl && item.level === 'alfa-c' && item.id.includes('KSW-'));
assert(row);
const exercises = JSON.parse(readFileSync('public' + row.contentUrl)).exercises;
assert(exercises.length > 2);
const route = base + '/' + chapterHash({ chapter: 'writing', activity: 'copy', collection: row.id, level: row.level, help: row.help });
const progressId = collectionProgressId('copy', row.id, row.contentUrl);
const progressKey = roundProgressPrefix + progressId;
const sessionKey = groupSessionKey('chapter:copy:' + row.id, 'copy', progressId);
const checks = [], errors = [];
const input = page => page.getByRole('textbox', { name: 'Jouw antwoord', exact: true });
const check = page => page.getByRole('button', { name: 'Controleer', exact: true });
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), key);
const waitAnswer = (page, key, field, value) => page.waitForFunction(({ key, field, value }) => JSON.parse(localStorage.getItem(key) ?? 'null')?.[field] === value, { key, field, value });
function mockAudio() {
  window.Audio = class extends EventTarget {
    constructor() { super(); this.dataset = {}; }
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 10); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
}
async function open(context) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await page.waitForFunction(() => document.querySelector('.cp-text-entry input')?.disabled === false);
  return page;
}

mkdirSync(out, { recursive: true });
try {
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch();
    try {
      const context = await browser.newContext();
      await context.addInitScript(mockAudio);
      const a = await open(context), b = await open(context), key = writingAnswerKey(exercises[0].writingSourceId ?? exercises[0].exerciseId);
      await input(a).fill('Eerste antwoord uit A'); await check(a).click();
      await waitAnswer(a, key, 'first', 'Eerste antwoord uit A');
      await input(b).fill('Concept uit ouder tabblad B');
      await waitAnswer(b, key, 'draft', 'Concept uit ouder tabblad B');
      assert.equal((await stored(b, key)).last, 'Eerste antwoord uit A');
      await check(b).click(); await waitAnswer(b, key, 'last', 'Concept uit ouder tabblad B');
      await input(a).fill('Nieuw concept uit A');
      await waitAnswer(a, key, 'draft', 'Nieuw concept uit A');
      assert.equal((await stored(a, key)).first, 'Eerste antwoord uit A');
      assert.equal((await stored(a, key)).last, 'Concept uit ouder tabblad B');

      // Hold the real browser lock while another tab submits, then release it.
      await a.evaluate(key => { void navigator.locks.request(key, () => new Promise(resolve => { window.releaseWritingLock = resolve; })); }, key);
      await a.waitForFunction(() => Boolean(window.releaseWritingLock));
      await input(b).fill('Antwoord na vergrendeling'); await check(b).click();
      assert(await input(b).isDisabled());
      assert.equal((await stored(a, key)).last, 'Concept uit ouder tabblad B');
      await a.evaluate(() => window.releaseWritingLock());
      await waitAnswer(b, key, 'last', 'Antwoord na vergrendeling');
      await b.reload(); await b.waitForFunction(() => document.querySelector('.cp-text-entry input')?.disabled === false);
      assert.equal(await input(b).inputValue(), 'Antwoord na vergrendeling');
      assert.equal((await stored(b, key)).first, 'Eerste antwoord uit A');
      await b.evaluate(key => {
        const set = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem').value;
        Storage.prototype.setItem = function (name, value) {
          if (name === key) throw new DOMException('Test quota', 'QuotaExceededError');
          return set.call(this, name, value);
        };
        window.restoreWritingStorage = () => { Storage.prototype.setItem = set; };
      }, key);
      await input(b).fill('Ingestuurd tijdens opslagfout'); await check(b).click();
      await b.getByText('Je antwoord is alleen in dit scherm bewaard. Opslaan op dit apparaat lukt nu niet.', { exact: true }).waitFor();
      assert.equal((await stored(b, key)).last, 'Antwoord na vergrendeling');
      await b.evaluate(() => window.restoreWritingStorage());
      await input(b).fill('Nieuw concept na herstel');
      await waitAnswer(b, key, 'draft', 'Nieuw concept na herstel');
      assert.equal((await stored(b, key)).last, 'Ingestuurd tijdens opslagfout');
      assert.equal((await stored(b, key)).first, 'Eerste antwoord uit A');
      checks.push({ engine, staleTabs: true, realLock: true, reload: true });
      await context.close();

      for (const change of ['grow', 'shrink']) {
        const context = await browser.newContext();
        await context.addInitScript(mockAudio);
        await context.addInitScript(({ progressKey, sessionKey, total, done, exerciseId }) => {
          if (sessionStorage.getItem('storage-preservation-seeded')) return;
          localStorage.setItem(progressKey, JSON.stringify({ version: 1, total, done }));
          localStorage.setItem(sessionKey, JSON.stringify({ version: 1, exerciseId, done: false }));
          sessionStorage.setItem('storage-preservation-seeded', 'true');
        }, { progressKey, sessionKey, total: exercises.length + (change === 'grow' ? -1 : 1), done: [exercises[0].exerciseId, ...(change === 'shrink' ? ['removed-source-task'] : [])], exerciseId: exercises[1].exerciseId });
        const page = await open(context);
        await page.locator(`[data-exercise-id="${exercises[1].exerciseId}"]`).waitFor();
        await input(page).fill(exercises[1].fields[0].acceptedAnswers[0]); await check(page).click();
        await page.waitForFunction(({ key, id }) => JSON.parse(localStorage.getItem(key) ?? 'null')?.done.includes(id), { key: progressKey, id: exercises[1].exerciseId });
        assert.deepEqual(await stored(page, progressKey), { version: 1, total: exercises.length, done: [exercises[0].exerciseId, exercises[1].exerciseId] });
        await page.reload();
        await page.locator('[data-exercise-id]').waitFor();
        assert.equal((await stored(page, progressKey)).done.length, 2);
        checks.push({ engine, change, existingCompletionKept: true, removedIdsExcluded: true });
        await context.close();
      }
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
  assert.equal(checks.length, 6);
} finally { writeFileSync(out + '/checks.json', JSON.stringify({ base, simulatedAudio: true, checks, errors }, null, 2) + '\n'); }
console.log('PASS: two browsers preserve answers across tabs, serialize actual writes, and retain progress through changed round sizes.');
