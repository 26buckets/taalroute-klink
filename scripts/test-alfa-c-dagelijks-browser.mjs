import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dailyBlocks, dailyStorageKey } from '../lib/alfa-c-dagelijks.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18878';
const out = process.env.KLINK_DAILY_OUTPUT ?? '../daily-browser'; fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.playedAudio = [];
      window.Audio = class extends EventTarget {
        play() { window.playedAudio.push(this.src); this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 10); return Promise.resolve(); }
        pause() { clearTimeout(this.timer); }
      };
    });
    await page.goto(base + '/#learner/alfa-c'); await page.getByRole('link', { name: 'Berichten lezen', exact: true }).click(); await page.locator('[data-daily-block]').first().waitFor();
    assert.equal(await page.locator('[data-daily-block]').count(), 6);
    assert.equal(await page.locator('[data-functional-block]').count(), 0);
    assert.equal(await page.locator('[data-pilot-block]').count(), 0);
    await page.evaluate(() => { localStorage.setItem('klink.taalroute.attempts.v1', '[{"sentinel":true}]'); });
    for (const block of dailyBlocks) {
      await page.goto(base + `/#learner/alfa-c/${block.id}`);
      for (const [index, step] of block.steps.entries()) {
        const player = page.locator(`[data-daily-step="${step.id}"]`); await player.waitFor();
        const idle = () => page.waitForFunction(() => !document.querySelector('[data-daily-step] .pilot-tools button')?.disabled);
        const next = player.getByRole('button', { name: 'Verder', exact: true });
        assert(await next.isDisabled());
        assert.equal(await player.getByRole('heading', { level: 2 }).innerText(), step.instruction);
        const rendered = await player.locator('.ac-document-paper').evaluateAll(papers => papers.map(p => { const c = p.cloneNode(true); c.querySelectorAll('img').forEach(img => img.replaceWith(img.alt)); return c.textContent.replace(/\s+/g, ' ').trim(); }));
        for (const [n, doc] of step.documents.entries()) assert.equal(rendered[n].replace(/\s/g, ''), doc.text.replace(/\s/g, ''), step.id);
        for (const context of step.context) assert((await player.innerText()).includes(context));
        await player.getByRole('button', { name: 'Uitleg', exact: true }).click(); await idle();
        assert.equal(await player.locator('.ac-explanation p').getAttribute('aria-label'), step.speech.I);
        await player.getByRole('button', { name: 'Naar de opdracht', exact: true }).click();
        assert((await page.evaluate(() => window.playedAudio.at(-1))).endsWith(step.audio.I + '.mp3'));
        if (step.interaction === 'keuze') {
          const wrong = step.options.find(o => !o.correct);
          await player.getByRole('button', { name: wrong.text, exact: true }).focus(); await page.keyboard.press('Enter'); await idle();
        } else {
          for (const card of [...step.answerOrder].reverse()) await player.getByRole('button', { name: card, exact: true }).click();
          await idle();
          for (const _ of step.cards) await player.getByRole('button', { name: 'Eén terug', exact: true }).click();
        }
        assert(await next.isDisabled());
        await player.getByRole('button', { name: 'Voorbeeld', exact: true }).click(); await idle();
        assert((await player.locator('.pilot-model').innerText()).includes(step.example)); assert(await next.isDisabled());
        await player.locator('.pilot-model').getByRole('button', { name: 'Nu jij', exact: true }).click();
        await player.getByRole('button', { name: 'Help', exact: true }).click(); await idle();
        assert.equal(await player.locator('.pilot-help p').innerText(), step.speech.H);
        await player.getByRole('button', { name: 'Help', exact: true }).click();
        if (step.interaction === 'keuze') await player.getByRole('button', { name: step.options.find(o => o.correct).text, exact: true }).click();
        else for (const card of step.answerOrder) await player.getByRole('button', { name: card, exact: true }).click();
        await idle(); assert(await next.isEnabled());
        const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), dailyStorageKey), r = saved.records[step.id];
        assert.equal(r.first.correct, false); assert.equal(r.first.support.example, 0); assert.equal(r.last.correct, true); assert.equal(r.attempts, 2); assert.equal(r.support.example, 1); assert.equal(r.support.help, 1);
        if (index === 0) await page.screenshot({ path: `${out}/${name}-${block.id}.png`, fullPage: true });
        await next.click();
        if (index === 5) { await page.reload(); await page.locator(`[data-daily-step="${block.steps[6].id}"]`).waitFor(); }
        checks.push({ engine: name, id: step.id, firstWrongPreserved: true, helpPreserved: true, corrected: true });
      }
      await page.getByRole('heading', { name: 'Goed geoefend' }).waitFor();
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), '[{"sentinel":true}]');
    await page.setViewportSize({ width: 320, height: 568 });
    for (const block of dailyBlocks) for (const [index, step] of block.steps.entries()) {
      await page.evaluate(({ k, b, i }) => { const d = JSON.parse(localStorage.getItem(k)); d.positions[b] = i; localStorage.setItem(k, JSON.stringify(d)); }, { k: dailyStorageKey, b: block.id, i: index });
      await page.goto(base + `/#learner/alfa-c/${block.id}`); await page.reload();
      await page.locator(`[data-daily-step="${step.id}"]`).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), step.id + ' narrow screen');
      const mobilePlayer = page.locator(`[data-daily-step="${step.id}"]`);
      for (const [n, doc] of step.documents.entries()) {
        if (step.documents.length > 1) await mobilePlayer.locator('.ac-document-switch button').nth(n).click();
        const paper = mobilePlayer.locator('.ac-document-slot[data-current="true"] .ac-document-paper');
        assert(await paper.isVisible());
        assert.equal(await paper.evaluate(p => { const c = p.cloneNode(true); c.querySelectorAll('img').forEach(img => img.replaceWith(img.alt)); return c.textContent.replace(/\s/g, ''); }), doc.text.replace(/\s/g, ''));
      }
      await mobilePlayer.getByRole('button', { name: 'Opdracht', exact: true }).click();
      assert(await mobilePlayer.locator('.ac-answer-panel').isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const r = await page.evaluate(({ k, id }) => JSON.parse(localStorage.getItem(k)).records[id], { k: dailyStorageKey, id: step.id });
      assert.equal(r.first.correct, false); assert.equal(r.attempts, 2);
      if (index === 0) await page.screenshot({ path: `${out}/${name}-${block.id}-mobile.png`, fullPage: true });
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []); fs.writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, narrowCases: 144, errors }, null, 2));
console.log('PASS 144 complete attempts and 144 narrow screens; retained first response, support and existing storage.');
