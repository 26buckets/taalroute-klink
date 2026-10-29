import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pilotBlocks, pilotStorageKey } from '../lib/alfa-c-practice.ts';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const checks = [];
try {
  const p = await browser.newPage({ viewport: { width: 320, height: 900 } });
  p.setDefaultTimeout(10000);
  await p.goto(
    (process.env.KLINK_URL ?? 'http://127.0.0.1:18856') + '/#learner/chapters/alfa-c-words/sequence?level=alfa-c&help=practice',
  );
  await p.locator('[data-pilot-block]').first().waitFor();
  for (const block of pilotBlocks)
    for (const [i, s] of block.steps.entries()) {
      await p.evaluate(
        ({ key, id, i }) =>
          localStorage.setItem(
            key,
            JSON.stringify({ version: 1, positions: { [id]: i }, records: {} }),
          ),
        { key: pilotStorageKey, id: block.id, i },
      );
      await p.goto(
        (process.env.KLINK_URL ?? 'http://127.0.0.1:18856') +
          '/#learner/chapters/alfa-c-words/sequence?level=alfa-c&help=practice',
      );
      await p.reload();
      await p.locator(`[data-pilot-block="${block.id}"]`).click();
      await p.locator(`[data-pilot-step="${s.id}"]`).waitFor();
      if (await p.getByRole('button', { name: 'Nu jij', exact: true }).count())
        await p.getByRole('button', { name: 'Nu jij', exact: true }).click();
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        s.id,
      );
      const box = await p.locator('.pilot-player').boundingBox();
      checks.push({ step: s.id, x: Math.round(box.x), y: Math.round(box.y) });
      await p
        .getByRole('button', { name: 'Verder', exact: true })
        .scrollIntoViewIfNeeded();
      const next = await p
        .getByRole('button', { name: 'Verder', exact: true })
        .boundingBox();
      assert(
        next.y >= 60 && next.y + next.height <= 832,
        JSON.stringify({ step: s.id, next }),
      );
      if (s.id === 'pilot-alfa-c:bus:2') {
        const article = await p.locator('.cp-word-article').boundingBox();
        const sounds = await p.locator('.cp-word-sounds summary').boundingBox();
        assert(
          article.y + article.height <= sounds.y,
          'article must not overlap sound help',
        );
      }
    }
  assert(checks.every((c) => c.x === checks[0].x && c.y === checks[0].y));
  await p.setViewportSize({ width: 1366, height: 900 });
  for (const name of ['Start', 'Lessen', 'Woorden', 'Herhalen']) {
    await p
      .locator('.learner-nav')
      .getByRole('button', { name, exact: true })
      .click();
    assert((await p.locator('.learner-main').innerText()).length > 20);
  }
  fs.writeFileSync(
    'outputs/alfa-c-proefblokken-20261026/layout-checks.json',
    JSON.stringify(
      {
        checks,
        allFootersReachable: true,
        modelAndSoundHelpDoNotOverlap: true,
        normalNavigation: ['Start', 'Lessen', 'Woorden', 'Herhalen'],
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS 36 narrow layouts, aligned top edge, scrolling and existing navigation.',
  );
} finally {
  await browser.close();
}
