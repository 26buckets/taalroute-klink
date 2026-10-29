import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  teacherTasks,
  teacherStorageKey,
  emptyTeacherStore,
  startSession,
  appendEvent,
} from '../lib/alfa-c-docent.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18885',
  out = process.env.KLINK_DOCENT_OUTPUT ?? '/tmp/klink-docent-review';
fs.mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
const now = new Date().toISOString(),
  prep = (t) => ({
    learner: 'TEST-NOT-REAL',
    meeting: 'test-meeting',
    lesson: 'Testfixture only',
    preparedMeeting: 'test-previous',
    preparedAt: new Date(Date.now() - 90000000).toISOString(),
    timezone: 'Europe/Amsterdam',
    evidence: 'Synthetic test fixture, no real learner claim',
    checks: t.preparation.map(() => true),
    exposure: 'Test model history',
    interveningActivity: 'Test activity',
    paperPresent: true,
  });
function fixture(t) {
  let s = emptyTeacherStore();
  if (t.kind === 'check') {
    const d = teacherTasks.find((t) => t.kind === 'dictation');
    s = startSession(s, d, prep(d), now);
    const id = s.sessions[0].id;
    s = appendEvent(s, id, {
      type: 'audio',
      stage: 0,
      at: now,
      src: d.stages[0].audio[0],
    });
    s = appendEvent(s, id, {
      type: 'first',
      stage: 0,
      at: now,
      text: 'Test handwriting transcript',
      paperRef: 'Synthetic paper fixture',
    });
  }
  return startSession(s, t, prep(t), now);
}
async function resume(page, t) {
  await page.goto(base + '/#learner/alfa-c/docent-' + t.group);
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: teacherStorageKey, data: fixture(t) },
  );
  await page.reload();
  await page.getByLabel('Cursistcode', { exact: true }).fill('TEST-NOT-REAL');
  await page.getByLabel('Echte bijeenkomst / lescode').fill('test-meeting');
  await page.getByLabel('Boekdoel en lesplan').fill('Testfixture only');
  await page.getByRole('button', { name: t.title, exact: true }).click();
  await page.getByRole('button', { name: 'Open cursistscherm' }).click();
  await page.locator('[data-teacher-task]').waitFor();
}
async function play(page, name) {
  await page.getByRole('button', { name, exact: true }).click();
  await page.waitForFunction(
    () => !document.querySelector('.ac-docent-toolbar button')?.disabled,
  );
  assert.equal(await page.getByRole('alert').count(), 0);
}
async function review(page, stage) {
  await page
    .getByRole('button', { name: 'Docentregistratie', exact: true })
    .click();
  for (const c of stage.criteria)
    await page
      .getByLabel(c, { exact: true })
      .selectOption('niet beoordeelbaar');
  for (const input of await page
    .getByLabel('Concrete waarneming / reden', { exact: true })
    .all())
    await input.fill('Synthetic test only');
  await page
    .getByLabel('Vervolg en volgende echte bijeenkomst')
    .fill('Synthetic next meeting');
  await page
    .getByRole('button', { name: 'Bewaar beoordeling', exact: true })
    .click();
}
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const browser = await launcher.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    const selected =
      engine === 'chromium'
        ? teacherTasks
        : teacherTasks
            .filter((t) => ['grammar', 'check', 'recall'].includes(t.kind))
            .filter((t, i, a) => a.findIndex((x) => x.kind === t.kind) === i);
    for (const t of selected) {
      console.log(engine, t.id);
      await resume(page, t);
      assert.equal(await page.locator('.ac-docent-private').count(), 0);
      for (let at = 0; at < t.stages.length; at++) {
        const stage = t.stages[at];
        assert.equal(
          await page
            .getByRole('button', { name: 'Voorbeeld', exact: true })
            .count(),
          0,
        );
        if (!stage.audioRequired)
          assert.equal(
            await page
              .getByRole('button', { name: 'Voorbeeld horen', exact: true })
              .count(),
            0,
          );
        if (stage.audioRequired)
          for (let i = 0; i < stage.audio.length; i++)
            await play(
              page,
              stage.audio.length > 1 ? `Luister ${i + 1}` : 'Luister',
            );
        if (t.kind === 'recall') {
          for (const id of t.order)
            await page
              .locator('.ac-docent-tiles button')
              .filter({ hasText: t.tokens[id] })
              .first()
              .press('Enter');
          await page.getByRole('button', { name: 'Bewaar mijn zin' }).click();
        } else {
          await page
            .getByRole('button', { name: 'Docentregistratie', exact: true })
            .click();
          await page
            .getByRole('textbox', { name: 'Eerste reactie (letterlijke docenttranscriptie of geobserveerde handeling)', exact: true })
            .fill('Synthetic first response');
          if (['correct', 'word', 'dictation', 'check'].includes(t.kind)) {
            await page.getByLabel('Op papier gewerkt (extra)').check();
            await page
              .getByLabel('Verwijzing naar het bewaarde papier')
              .fill('Synthetic paper');
            await page
              .getByLabel(
                'Het echte papier is bewaard; de eerste versie blijft ongewijzigd.',
              )
              .check();
          }
          await page
            .getByRole('button', { name: 'Bewaar eerste reactie', exact: true })
            .click();
        }
        assert.equal(
          await page
            .getByRole('button', { name: 'Voorbeeld', exact: true })
            .count(),
          1,
        );
        await review(page, stage);
        if (
          await page.evaluate(
            () =>
              document.querySelector('.learner-main').scrollHeight >
              document.querySelector('.learner-main').clientHeight + 2,
          )
        ) {
          await page.screenshot({
            path: out + '/overflow.png',
            fullPage: true,
          });
          throw Error(t.id + ' stage ' + at + ' before model overflow');
        }
        await page
          .getByRole('button', { name: 'Voorbeeld', exact: true })
          .click();
        await page.getByLabel('Voorbeeld', { exact: true }).waitFor();
        if (at === 0 && t.kind === 'grammar')
          await play(page, 'Voorbeeld horen');
        const sizes = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          mainOverflow:
            document.querySelector('.learner-main').scrollHeight >
            document.querySelector('.learner-main').clientHeight + 2,
          inner: [...document.querySelectorAll('.ac-docent-learner')].some(
            (e) => e.scrollHeight > e.clientHeight + 2,
          ),
        }));
        assert(
          !sizes.overflow && !sizes.inner && !sizes.mainOverflow,
          t.id + JSON.stringify(sizes),
        );
        await page
          .getByRole('button', { name: 'Terug naar opdracht', exact: true })
          .click();
        assert.equal(
          await page.getByLabel('Voorbeeld', { exact: true }).count(),
          0,
        );
        checks.push({
          engine,
          id: t.id,
          stage: at,
          firstSaved: true,
          teacherReview: true,
          modelAfterFirst: true,
          layout: sizes,
        });
        if (at < t.stages.length - 1)
          await page
            .getByRole('button', { name: 'Verder', exact: true })
            .click();
      }
      const stored = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        teacherStorageKey,
      );
      const s = stored.sessions.find((s) => s.taskId === t.id);
      assert.equal(
        s.events.filter((e) => e.type === 'first').length,
        t.stages.length,
      );
      await page.reload();
      await page
        .getByLabel('Cursistcode', { exact: true })
        .fill('TEST-NOT-REAL');
      await page.getByLabel('Echte bijeenkomst / lescode').fill('test-meeting');
      await page.getByLabel('Boekdoel en lesplan').fill('Testfixture only');
      await page.getByRole('button', { name: t.title, exact: true }).click();
      await page.getByRole('button', { name: 'Open cursistscherm' }).click();
      assert.equal(
        await page
          .getByRole('button', { name: 'Voorbeeld', exact: true })
          .count(),
        1,
      );
    }
    const failureTask = teacherTasks.find((t) => t.kind === 'word');
    await resume(page, failureTask);
    await page.route('**' + failureTask.stages[0].audio[0], (r) => r.abort());
    await page.getByRole('button', { name: 'Luister', exact: true }).click();
    await page.getByRole('alert').waitFor();
    await page
      .getByRole('button', { name: 'Docentregistratie', exact: true })
      .click();
    assert(
      await page
        .getByRole('button', { name: 'Bewaar eerste reactie', exact: true })
        .isDisabled(),
    );
    await page.unroute('**' + failureTask.stages[0].audio[0]);
    checks.push({ engine, audioFailureBlocksFirst: true });
    await page.evaluate((key) => {
      localStorage.setItem(key, '{bad');
      localStorage.setItem('klink.taalroute.attempts.v1', 'SENTINEL');
    }, teacherStorageKey);
    await page.reload();
    await page.getByRole('alert').waitFor();
    assert.equal(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        teacherStorageKey,
      ),
      '{bad',
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem('klink.taalroute.attempts.v1'),
      ),
      'SENTINEL',
    );
    checks.push({
      engine,
      corruptStorePreserved: true,
      oldStoragePreserved: true,
    });
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      teacherStorageKey,
    );
    await page.reload();
    const clips = JSON.parse(
      fs.readFileSync('data/klink-alfa-c-docent-audio.json'),
    ).clips;
    const decoded = await page.evaluate(async (clips) => {
      const ctx = new AudioContext();
      try {
        const rows = [];
        for (const c of clips) {
          const r = await fetch(c.src);
          if (!r.ok) throw Error(c.src);
          const audio = await ctx.decodeAudioData(await r.arrayBuffer());
          if (audio.duration < 0.1) throw Error('Invalid');
          rows.push({ src: c.src, duration: audio.duration });
        }
        return rows;
      } finally {
        await ctx.close();
      }
    }, clips);
    assert.equal(decoded.length, 33);
    checks.push({ engine, nativeDecoded: decoded });
    for (const width of [390, 768, 1366]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
      await resume(page, teacherTasks[4]);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await page.screenshot({
        path: out + `/${engine}-${width}.png`,
        fullPage: true,
      });
      checks.push({ engine, width, responsive: true });
    }
  } finally {
    await browser.close();
  }
}
assert.deepEqual(errors, []);
fs.writeFileSync(
  out + '/checks.json',
  JSON.stringify({ checks, errors, realLearnerTrial: false }, null, 2),
);
console.log('PASS', checks.length, 'teacher browser checks');
