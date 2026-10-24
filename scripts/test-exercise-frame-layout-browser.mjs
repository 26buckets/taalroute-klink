import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import {
  chapterCollections,
  chapterHash,
  practiceChapters,
} from '../lib/practice-chapters.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18843';
const out =
  process.env.KLINK_FRAMES_OUTPUT || 'outputs/exercise-frames-20261024/browser';
mkdirSync(out, { recursive: true });
const code = await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{ExerciseSurface}from'./components/product/package-exercise-browser';window.mount=(exercise,speaking)=>{window.root??=createRoot(document.querySelector('.learner-main'));window.root.render(<ExerciseSurface exercise={exercise} pack={{words:[],exercises:[]}} onAudio={async()=>true} onFinish={()=>{}} onReset={()=>{}} onHelp={()=>{}} canAnswer={false} answeredCorrectly={false} onOpenExercise={()=>{}} guided={false} speakingOptionId={speaking}/>);}`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  alias: {
    'next/image': process.cwd() + '/node_modules/vinext/dist/shims/image.js',
  },
  format: 'iife',
  write: false,
  jsx: 'automatic',
  define: { 'process.env': '{}', 'process.env.NODE_ENV': '"production"' },
});

const b = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const [width, height] of [
    [1280, 800],
    [844, 390],
    [390, 844],
    [320, 568],
  ])
    for (const collapsed of width > 820 ? [false, true] : [false])
      for (const activity of [
        'read',
        'listen',
        'hear-word',
        'same-word',
        'word-bingo',
        'image-bingo',
        'memory',
        'cards',
        'sound-compare',
        'verb-choice',
        'text-question',
      ]) {
        const p = await b.newPage({ viewport: { width, height } });
        p.setDefaultTimeout(12000);
        await p.addInitScript(() => {
          window.Audio = class extends EventTarget {
            play() {
              this.t = setTimeout(
                () => this.dispatchEvent(new Event('ended')),
                20,
              );
              return Promise.resolve();
            }
            pause() {
              clearTimeout(this.t);
            }
          };
        });
        const c =
            (['word-bingo', 'memory', 'cards'].includes(activity)
              ? chapterCollections(activity).find(
                  (c) => c.id === 'groep-10.alfa-b',
                )
              : undefined) ?? chapterCollections(activity)[0],
          e = c.exercises[0],
          chapter = practiceChapters.find((x) =>
            x.activities.includes(activity),
          ).id;
        await p.goto(
          base +
            '/' +
            chapterHash({
              chapter,
              activity,
              collection: c.id,
              level: c.level,
            }),
        );
        await p.locator('[data-exercise-id]').waitFor();
        const pause = p.getByRole('button', {
          name: 'Automatisch verder pauzeren',
          exact: true,
        });
        if (await pause.count()) await pause.click();
        const toggle = p.locator('.cp-nav-toggle');
        if (
          width > 820 &&
          ((await toggle.getAttribute('aria-expanded')) === 'false') !==
            collapsed
        )
          await toggle.click();
        if (activity === 'verb-choice')
          await p
            .getByRole('button', { name: 'Kies een woord', exact: true })
            .click();
        const selector =
          '.cp-choice-grid > button,.cp-choice-grid > .cp-extended-option > button:first-child,.cp-board-grid > button,.cp-memory-grid > button,.cp-flash-card';
        await p.locator(selector).first().waitFor();
        await p.evaluate(() => document.fonts.ready);
        for (const img of await p.locator(selector).locator('img').all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate((i) => i.decode().catch(() => {}));
        }
        await p.waitForTimeout(100);
        const measure = () =>
          p.locator(selector).evaluateAll((es) =>
            es.map((e) => {
              let scroll = 0;
              for (let a = e.parentElement; a; a = a.parentElement)
                scroll += a.scrollTop;
              const r = e.getBoundingClientRect();
              return { x: r.x, y: r.y + scroll, w: r.width, h: r.height };
            }),
          );
        const initial = await measure();
        const phases = [];
        assert(
          initial.every(
            (r) =>
              Math.abs(r.h - initial[0].h) < 1 &&
              Math.abs(r.w - initial[0].w) < 1,
          ),
          `${activity} ${width}: equal frames`,
        );
        if (activity === 'cards') {
          await p.locator('.cp-flash-card').click();
          phases.push({ name: 'flipped', rects: await measure() });
        } else if (activity === 'memory') {
          for (let i = 0; i < 2; i++) {
            await p.locator('.cp-memory-grid > button').nth(i).click();
            phases.push({ name: 'opened-' + i, rects: await measure() });
          }
          await p.waitForTimeout(600);
          phases.push({ name: 'resolved', rects: await measure() });
        } else {
          const idx = activity.includes('bingo')
            ? e.cells.findIndex((x) => x.cellId === e.answer.correctCellId)
            : e.options.findIndex((x) =>
                e.answer.correctOptionIds.includes(x.id),
              );
          await p.locator(selector).nth(idx).click();
          phases.push({ name: 'correct', rects: await measure() });
        }
        for (const text of await p.locator(selector).locator('strong').all()) {
          if (activity === 'word-bingo')
            assert.equal(
              await text.evaluate((e) => e.getClientRects().length),
              1,
              'Keep bingo words whole',
            );
          const r = await text.boundingBox(),
            parent = await text.locator('..').boundingBox();
          assert(
            r.x >= parent.x - 1 && r.x + r.width <= parent.x + parent.width + 1,
            `${activity}: readable word`,
          );
        }
        const next = p.locator('.cp-exercise-feedback > button');
        if (await next.count()) {
          await next.scrollIntoViewIfNeeded();
          assert(
            await next.evaluate((e) => {
              const r = e.getBoundingClientRect();
              return e.contains(
                document.elementFromPoint(
                  r.x + r.width / 2,
                  r.y + r.height / 2,
                ),
              );
            }),
            `${activity}: reachable footer`,
          );
        }
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        const changes = phases.filter(
          (x) => JSON.stringify(x.rects) !== JSON.stringify(initial),
        );
        results.push({
          activity,
          width,
          height,
          collapsed,
          initial,
          phases,
          changed: changes.length > 0,
        });
        console.log(
          activity,
          width,
          changes.length ? 'CHANGED' : 'stable',
          initial.map((x) => Math.round(x.h)),
          changes.map((x) => x.rects.map((y) => Math.round(y.h))),
        );
        assert.equal(
          changes.length,
          0,
          `${activity} ${width}: frames must stay still`,
        );
        if (width === 320)
          await p.screenshot({ path: `${out}/${activity}-${width}.png` });
        await p.close();
      }
  const spoken = chapterCollections('understand')
    .flatMap((c) => c.exercises)
    .find((e) => e.options?.some((o) => o.audio));
  for (const width of [1280, 390, 320]) {
    const p = await b.newPage({ viewport: { width, height: 844 } });
    await p.goto(base + '/#learner/home');
    await p.locator('.learner-main').waitFor();
    await p.addScriptTag({ content: code.outputFiles[0].text });
    let initial;
    for (const speaking of ['', ...spoken.options.map((o) => o.id), '']) {
      await p.evaluate(({ e, speaking }) => window.mount(e, speaking), {
        e: spoken,
        speaking,
      });
      await p.locator('.cp-choice-grid strong').first().waitFor();
      await p.evaluate(() => new Promise(requestAnimationFrame));
      const rects = await p
        .locator('.cp-choice-grid button,.cp-choice-grid strong')
        .evaluateAll((es) =>
          es.map((e) => {
            const r = e.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          }),
        );
      if (!initial) initial = rects;
      else
        assert.deepEqual(
          rects,
          initial,
          'Spoken answer words and frames must stay still',
        );
      const visible = await p
        .locator('.cp-option-audio')
        .evaluateAll(
          (es) =>
            es.filter((e) => getComputedStyle(e).visibility === 'visible')
              .length,
        );
      assert.equal(visible, speaking ? 1 : 0);
    }
    results.push({ activity: 'spoken-answer', width, states: 4, stable: true });
    await p.close();
  }
  writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2));
} finally {
  await b.close();
}
