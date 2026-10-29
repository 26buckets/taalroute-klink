import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pilotBlocks } from '../lib/alfa-c-practice.ts';
const out = 'outputs/alfa-c-proefblokken-20261026',
  url =
    (process.env.KLINK_URL ?? 'http://127.0.0.1:18856') + '/#learner/alfa-c';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [],
  checks = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      play() {
        this.timer = setTimeout(
          () => this.dispatchEvent(new Event('ended')),
          15,
        );
        return Promise.resolve();
      }
      pause() {
        clearTimeout(this.timer);
      }
    };
  });
  await page.goto(url);
  await page.locator('[data-pilot-block]').first().waitFor();
  await page.evaluate(() => {
    localStorage.setItem('klink.taalroute.attempts.v1', '[{"sentinel":true}]');
    localStorage.setItem(
      'klink.learning-review.v1',
      '{"sentinel":{"due":100}}',
    );
  });
  const positions = [];
  for (const block of pilotBlocks) {
    await page.locator(`[data-pilot-block="${block.id}"]`).click();
    for (const [i, s] of block.steps.entries()) {
      await page.locator(`[data-pilot-step="${s.id}"]`).waitFor();
      assert(
        await page
          .getByRole('button', { name: 'Verder', exact: true })
          .isDisabled(),
      );
      if (
        await page.getByRole('button', { name: 'Nu jij', exact: true }).count()
      )
        await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
      await page.getByRole('button', { name: 'Luister', exact: true }).click();
      await page
        .getByRole('button', { name: 'Luister', exact: true })
        .waitFor();
      await page.waitForFunction(() => !document.querySelector('.pilot-tools button')?.disabled);
      if (await page.getByRole('button', {name: 'Naar de opdracht', exact: true}).count()) await page.getByRole('button', {name: 'Naar de opdracht', exact: true}).click();
      if (s.exercise.options) {
        const opts = s.exercise.options;
        const right = opts.findIndex((o) =>
          s.exercise.answer.correctOptionIds.includes(o.id),
        );
        const buttons = page.locator('.cp-choice-grid > button');
        if (i === 3) {
          await buttons.nth((right + 1) % opts.length).click();
          assert(
            await page
              .getByRole('button', { name: 'Verder', exact: true })
              .isDisabled(),
          );
          assert(
            (await page.locator('.pilot-footer').innerText()).includes(s.errorFeedback),
          );
        }
        await buttons.nth(right).click();
      }
      if (s.exercise.tiles)
        for (const id of s.exercise.answer.targetTileIds) {
          const tile = s.exercise.tiles.find((t) => t.id === id);
          await page
            .locator('.cp-tile-bank')
            .getByRole('button', { name: tile.token, exact: true })
            .click();
        }
      await page.getByRole('button', { name: 'Verder', exact: true }).waitFor();
      await page.waitForFunction(() => { const next = document.querySelector('.pilot-footer button'); return next && !next.disabled; });
      assert(
        await page
          .getByRole('button', { name: 'Verder', exact: true })
          .isEnabled(),
        s.id,
      );
      const box = await page.locator('.pilot-player').boundingBox();
      positions.push({
        step: s.id,
        x: Math.round(box.x),
        y: Math.round(box.y),
      });
      if (i === 8)
        await page.screenshot({ path: `${out}/${block.id}-zin.png` });
      await page.getByRole('button', { name: 'Verder', exact: true }).click();
    }
    await page
      .getByRole('heading', { name: 'Goed geoefend', exact: true })
      .waitFor();
    assert(
      await page
        .getByRole('button', {
          name: 'Oefen de lastige opdrachten',
          exact: true,
        })
        .count(),
    );
    checks.push({ block: block.id, completed: 12, wrongAnswerStays: true });
    await page
      .getByRole('button', { name: 'Kies een ander blok', exact: true })
      .click();
  }
  assert(
    positions.every((p) => p.x === positions[0].x && p.y === positions[0].y),
    JSON.stringify(positions),
  );
  await page.locator('[data-pilot-block="winkel"]').click();
  await page
    .getByRole('button', { name: 'Oefen de lastige opdrachten', exact: true })
    .click();
  await page.locator('[data-pilot-step]').waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Nu jij', exact: true }).count(),
    0,
    'review does not show answer automatically',
  );
  await page.goto(url);
  await page.locator('[data-pilot-block="bus"]').click();
  await page.getByRole('heading', { name: 'Goed geoefend' }).waitFor();
  await page.getByRole('button', { name: 'Het hele blok opnieuw' }).click();
  await page.locator('[data-pilot-step="pilot-alfa-c:bus:1"]').waitFor();
  await page.getByRole('button', { name: 'Luister', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.pilot-tools button')?.disabled);
  await page.getByRole('button', {name: 'Naar de opdracht', exact: true}).click();
  await page.waitForFunction(() => !document.querySelector('.pilot-footer button').disabled);
  await page.getByRole('button', { name: 'Verder', exact: true }).click();
  await page.reload();
  await page.locator('[data-pilot-step="pilot-alfa-c:bus:2"]').waitFor();
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem('klink.taalroute.attempts.v1'),
    ),
    '[{"sentinel":true}]',
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem('klink.learning-review.v1')),
    '{"sentinel":{"due":100}}',
  );
  for (const width of [1366, 390, 320])
    for (const collapsed of [false, true]) {
      await page.setViewportSize({ width: 1366, height: 900 });
      const current = await page
        .locator('.learner-app')
        .evaluate((e) => e.classList.contains('is-collapsed'));
      if (current !== collapsed)
        await page
          .getByRole('button', {
            name: collapsed ? 'Menu inklappen' : 'Menu uitklappen',
            exact: true,
          })
          .click();
      await page.setViewportSize({ width, height: 900 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await page
        .getByRole('button', { name: 'Verder', exact: true })
        .scrollIntoViewIfNeeded();
      assert(
        await page
          .getByRole('button', { name: 'Verder', exact: true })
          .isVisible(),
      );
      await page.screenshot({
        path: `${out}/scherm-${width}-${collapsed}.png`,
      });
      checks.push({ width, collapsed, scroll: true });
    }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + '/browser-checks.json',
    JSON.stringify(
      {
        checks,
        positions,
        errors,
        progressIsolated: true,
        refreshResumes: true,
        audio: 'simulated for navigation tests',
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS 36 steps, incorrect answers, completion, tailored repeat, refresh, isolated storage and 6 layouts.',
  );
} finally {
  await browser.close();
}
