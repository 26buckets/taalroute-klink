import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { worksheets } from '../lib/teacher-worksheets.ts';
const base = process.env.KLINK_URL || 'http://127.0.0.1:18981';
const out = process.env.KLINK_DOCENT_OUTPUT || 'outputs/werkbladen-koppeling-20261031';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.setDefaultTimeout(15000);
      await page.emulateMedia({reducedMotion:'reduce'});
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/#teacher/materials');
      await page.locator('.kpd-worksheet-grid').waitFor();
      assert.equal(await page.locator('.kpd-worksheet-lesson').count(), worksheets.length);
      await page.screenshot({ path: `${out}/${engine}-${width}-dashboard.png`, fullPage: true });
      for (const lesson of worksheets) {
        console.log('Checking', engine, width, lesson.id);
        await page.getByRole('link', { name: `${lesson.title} · Werkblad`, exact: true }).click();
        for (const round of ['a', 'b', 'c']) {
          const sheet = lesson.rounds[round];
          await page.getByRole('link', { name: `${sheet.title} · ${sheet.level}`, exact: true }).click();
          await page.waitForFunction(pdf => document.querySelector('.kpd-worksheet-actions a[download]')?.getAttribute('href') === pdf, sheet.pdf);
          await page.waitForFunction(() => {
            const images = [...document.querySelectorAll('.kpd-worksheet-previews img')];
            return images.length === 2 && images.every(img => img.complete && img.naturalWidth > 0);
          }, null, { timeout: 15000 });
          assert.equal(await page.locator('.kpd-worksheet-previews img').count(), 2);
          assert.equal(await page.getByRole('link', { name: 'Downloaden', exact: true }).getAttribute('href'), sheet.pdf);
          if (engine === 'chromium' && width === 1440) {
            const response = await page.request.get(base + sheet.pdf);
            assert.equal(response.status(), 200); assert((await response.body()).equals(readFileSync('public' + sheet.pdf)));
          }
          await page.getByText('Antwoorden voor de docent', { exact: true }).click();
          assert.equal(await page.locator('.kpd-answers-print li').count(), 10);
          const text = (await page.locator('.kpd-answers-print').innerText()).replace(/\s+/g,' ');
          for (const answer of sheet.answers) assert(text.includes(answer.answer.replace(/\s+/g,' ')),`${lesson.id}/${round}/${answer.number}`);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          await page.reload();
          await page.locator('.kpd-worksheet-rounds [aria-current]').waitFor();
          assert.equal(await page.locator('.kpd-worksheet-rounds [aria-current]').innerText(), `${sheet.title} · ${sheet.level}`);
          checks.push({ engine, width, lesson: lesson.id, round });
        }
        // Open this exact lesson, preserve the built word, round and phase when visiting its worksheet.
        await page.getByRole('link', { name: `${lesson.title} · Digibordles`, exact: true }).click();
        await page.locator('[data-classroom="active"]').waitFor();
        assert.equal(await page.locator('.kpd-big-word').innerText(), lesson.id);
        await page.getByRole('button', { name: 'Kies onderdeel', exact: true }).click();
        await page.locator('.kpd-phases button').nth(3).click();
        await page.locator('.kpd-tiles button:not(:disabled)').filter({hasText: new RegExp('^'+lesson.id[0]+'$')}).first().click();
        const before = await page.evaluate(() => sessionStorage.getItem('klink.docent.les.v1'));
        const board = await page.locator('.kpd-stage').boundingBox();
        await page.getByRole('button', { name: 'Werkblad', exact: true }).click();
        await page.locator('.kpd-worksheet-previews').waitFor();
        assert((await page.locator('.kpd-worksheet-heading h3').innerText()).startsWith(lesson.title));
        assert.equal(await page.locator('.kpd-worksheet-rounds [aria-current]').innerText(), 'Woord · Alfa A');
        await page.getByRole('link', { name: 'Tekst · Alfa C', exact: true }).click();
        assert.equal(await page.evaluate(() => sessionStorage.getItem('klink.docent.les.v1')), before);
        await page.getByRole('link', { name: 'Terug naar de les', exact: true }).click();
        await page.locator('.kpd-stage').waitFor();
        assert.equal(await page.locator('[data-tile-slot="0"]').innerText(), lesson.id[0]);
        assert.deepEqual(await page.locator('.kpd-stage').boundingBox(), board);
        // B and C also link straight to the matching worksheet; reloading keeps the return route.
        for (const [index, label] of [[1, 'Zin · Alfa B'], [2, 'Tekst · Alfa C']]) {
          await page.locator('.kpd-rounds button').nth(index).click();
          await page.getByRole('button', { name: 'Werkblad', exact: true }).click();
          await page.locator('.kpd-worksheet-rounds [aria-current]').waitFor();
          assert.equal(await page.locator('.kpd-worksheet-rounds [aria-current]').innerText(), label);
          await page.reload();
          await page.getByRole('link', { name: 'Terug naar de les', exact: true }).click();
          await page.locator('.kpd-rounds [aria-current]').waitFor();
          assert((await page.locator('.kpd-rounds [aria-current]').innerText()).includes(index === 1 ? 'Zin' : 'Tekst'));
        }
        await page.getByRole('button', { name: 'Lesoverzicht', exact: true }).click();
        await page.getByRole('button', { name: 'Werkbladen', exact: true }).click();
        await page.locator('.kpd-worksheet-grid').waitFor();
      }
      // Broken links return a usable overview; dark mode and narrow screens keep all controls visible.
      await page.goto(base + '/#teacher/materials?lesson=unknown&round=no');
      await page.locator('.kpd-worksheet-grid').waitFor();
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await page.getByRole('link', { name: 'Mat · Werkblad', exact: true }).click();
      await page.locator('.kpd-worksheet-previews').waitFor();
      await page.locator('.kpd-worksheet-previews img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await page.screenshot({ path: `${out}/${engine}-${width}-sheet-dark.png`, fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/browser-checks.json', JSON.stringify({ checks, errors }, null, 2));
console.log('PASS', checks.length, `worksheet views; ${worksheets.length*4} lesson returns, direct B/C links and reload; Chromium/WebKit desktop/mobile`);
