import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dailyBlocks, dailyStorageKey } from '../lib/alfa-c-dagelijks.ts';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18880';
const out = process.env.KLINK_WORKSPACE_OUTPUT ?? '/tmp/klink-workspace-review';
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [], failures = [];
for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.Audio = class extends EventTarget { play() { this.t = setTimeout(() => this.dispatchEvent(new Event('ended')), 10); return Promise.resolve(); } pause() { clearTimeout(this.t); } }; });
    await page.goto(base + '/#learner/alfa-c');
    for (const [kind, blocks, key] of /** @type {const} */ ([['daily', dailyBlocks, dailyStorageKey], ['functional', functionalBlocks, functionalStorageKey]])) {
      for (const block of blocks) for (const [index, step] of block.steps.entries()) {
        await page.evaluate(({ key, block, index }) => localStorage.setItem(key, JSON.stringify({ version: 1, positions: { [block]: index }, records: {} })), { key, block: block.id, index });
        await page.goto(base + `/#learner/alfa-c/${block.id}`); await page.reload();
        const player = page.locator(`[data-${kind}-step="${step.id}"]`); await player.waitFor();
        for (const view of ['task', 'example', 'help']) {
          const control = player.getByRole('button', { name: view === 'example' ? 'Voorbeeld' : 'Help', exact: true });
          if (view !== 'task') { if (!await control.count()) continue; await control.click(); }
          const overflow = await player.evaluate(root => {
            const stage = root.querySelector('.cp-exercise-stage').getBoundingClientRect();
            const main = document.querySelector('.learner-main');
            return [...root.querySelectorAll('.ac-document-paper, .ac-task-context, .ac-answer-panel p, .ac-answer-panel button, .ac-source-panel button, .ac-handwriting, .pilot-footer, .ac-materials')].filter(el => el.getBoundingClientRect().height).map(el => ({ tag: el.className, text: el.textContent.slice(0, 90), rect: el.getBoundingClientRect().toJSON() })).filter(el => el.rect.bottom > innerHeight + 1 || (el.tag !== 'pilot-footer' && el.rect.bottom > stage.bottom + 1) || el.rect.top < stage.top - 1 || el.rect.right > innerWidth + 1).concat(main.scrollHeight > main.clientHeight + 2 ? [{ tag: 'main scroll', height: main.scrollHeight, available: main.clientHeight }] : []);
          });
          if (overflow.length) failures.push({ engine, id: step.id, view, overflow });
          checks.push({ engine, id: step.id, view, fit: !overflow.length });
          if (index === 0 && view === 'task') await page.screenshot({ path: `${out}/${engine}-${block.id}.png` });
        }
      }
    }
  } finally { await browser.close(); }
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors, failures }, null, 2));
assert.deepEqual(errors, []); assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 12)));
console.log(`PASS ${checks.length} document/task/help/example desktop views in two browsers at 1366x768.`);
