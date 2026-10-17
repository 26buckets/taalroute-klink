import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { learnerListName } from '../lib/learner-copy.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
try {
  await page.goto(`${base}/#learner/home`);
  await page.locator('.cp-home').waitFor();
  assert.equal(await page.locator('.cp-home .cp-package-grid > button').count(), packs.length, 'Every list is on the start page');
  const internal = /Eerste verbindingen|Verdere verbindingen|onbeklemtoonde|medeklinkerletters|leesvoorwaarden|kernwoorden|Lessenreeks/;
  assert(!internal.test(await page.locator('.learner-main').innerText()));
  let lessons = 0;
  for (let index = 0; index < packs.length; index++) {
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Lessen', exact: true }).click();
    const card = page.locator('.cp-package-grid > button').nth(index);
    assert((await card.getAttribute('aria-label')).includes(`${packs[index].lessons.length} lessen`));
    assert(!/\d+ lessen|\d+ woorden/.test(await card.innerText()), 'Cards show the title and one action, not inventory counts');
    await card.click();
    assert.equal(await page.locator('.cp-player-bar strong').innerText(), learnerListName(packs[index]));
    assert.equal(await page.locator('.cp-start-lesson').count(), packs[index].lessons.length);
    lessons += packs[index].lessons.length;
    assert(!internal.test(await page.locator('.learner-main').innerText()));
  }
  assert.equal(lessons, packs.reduce((sum, pack) => sum + pack.lessons.length, 0));
  console.log(`PASS All ${packs.length} lists and ${lessons} lesson routes are visible and reachable with simple learner labels`);
} finally { await browser.close(); }
