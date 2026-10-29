import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pilotStorageKey } from '../lib/alfa-c-practice.ts';
import { progressKey } from '../lib/learner-progress.ts';
import { taalroutePackages } from '../lib/taalroute-packages.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18856',
  out =
    process.env.KLINK_ALFAC_OUTPUT ?? 'outputs/alfa-c-proefblokken-20261026',
  checks = [];
fs.mkdirSync(out, { recursive: true });
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 900 },
    });
    page.setDefaultTimeout(15000);
    const pack = taalroutePackages.find(
        (p) => p.lessons[0]?.guidedExerciseIds?.length,
      ),
      lesson = pack.lessons[0];
    const original = JSON.stringify({
      completed: [],
      position: {
        packageId: pack.id,
        lessonId: lesson.id,
        exerciseId: lesson.guidedExerciseIds[0],
      },
    });
    await page.addInitScript(
      ({ key, value }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      },
      { key: progressKey, value: original },
    );
    await page.goto(base + '/#learner/chapters');
    await page.getByRole('button', { name: /Zelf oefenen.*Je oefent/ }).click();
    await page.getByRole('button', { name: 'Alfa C', exact: true }).click();
    await page.locator('[data-alfa-c-category="words"]').waitFor();
    assert.equal(await page.locator('[data-alfa-c-category]').count(), 3);
    assert.equal(await page.getByLabel('Alfa C docentopdrachten').getByRole('link').count(), 5);
    assert.equal(await page.locator('[data-chapter]').count(), 0);
    assert(
      await page
        .getByRole('button', { name: 'Alfa C', exact: true })
        .isEnabled(),
    );
    await page.locator('[data-alfa-c-category="words"]').click();
    await page.locator('[data-chapter-activity="sequence"]').click();
    await page.locator('[data-pilot-block]').first().focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-pilot-step="pilot-alfa-c:winkel:1"]').waitFor();
    assert.equal(
      await page.locator('.learner-nav [aria-current="page"]').innerText(),
      'Oefenen',
    );
    for (const [width, height] of [
      [1366, 900],
      [768, 1024],
      [390, 844],
      [320, 480],
      [667, 375],
    ]) {
      await page.setViewportSize({ width, height });
      for (const step of [3, 5, 6, 8, 9]) {
        await page.evaluate(
          ({ key, step }) =>
            localStorage.setItem(
              key,
              JSON.stringify({
                version: 1,
                positions: { winkel: step },
                records: {},
              }),
            ),
          { key: pilotStorageKey, step },
        );
        await page.reload();
        await page
          .locator(`[data-pilot-step="pilot-alfa-c:winkel:${step + 1}"]`)
          .waitFor();
        const model = page.getByRole('button', { name: 'Nu jij', exact: true });
        if (await model.count()) {
          await model.scrollIntoViewIfNeeded();
          assert(await model.isVisible());
          await model.focus();
          await page.keyboard.press('Enter');
        }
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        const next = page.getByRole('button', { name: 'Verder', exact: true });
        await next.scrollIntoViewIfNeeded();
        const box = await next.boundingBox();
        assert(box.y >= 0 && box.y + box.height <= height);
        checks.push({ engine: name, width, height, step: step + 1 });
      }
    }
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), progressKey),
      original,
    );
    await page.setViewportSize({ width: 1366, height: 900 });
    await page
      .getByRole('button', { name: 'Andere opdracht', exact: true })
      .click();
    await page.locator('[data-pilot-block]').first().waitFor();
    await page.locator('.cp-context-header .text-back').click();
    await page.locator('[data-chapter-activity="sequence"]').waitFor();
    await page.locator('.cp-context-header .text-back').click();
    await page.locator('[data-alfa-c-category]').first().waitFor();
    assert(page.url().includes('level=alfa-c'));
    assert(page.url().includes('help=practice'));
    await page.screenshot({ path: out + `/online-ingang-${name}.png` });
    await page
      .getByRole('button', { name: 'Met je docent', exact: true })
      .click();
    assert.equal(await page.locator('.pilot-block-cards').count(), 0);
    assert.equal(await page.locator('[data-alfa-c-category]').count(), 3);
    assert.equal(await page.getByLabel('Alfa C docentopdrachten').getByRole('link').count(), 5);
    assert.equal(await page.locator('[data-chapter]').count(), 8);
    assert.equal(await page.locator('[data-chapter]:not([disabled])').count(), 8);
    await page.goto(base + '/docenten/hoofdstuk-2');
    await page
      .getByRole('heading', { name: 'Drie korte Alfa C-blokken' })
      .waitFor();
  } finally {
    await browser.close();
  }
}
fs.writeFileSync(
  out + '/integration-checks.json',
  JSON.stringify(
    {
      checks,
      oldProgressPreserved: true,
      keyboard: true,
      teacherManual: true,
      consistentCategoryMenu: true,
      availableGuidedChapters: 8,
    },
    null,
    2,
  ),
);
console.log(
  'PASS normal entry, keyboard, existing progress, teacher route and 50 compact layouts in two browsers.',
);
