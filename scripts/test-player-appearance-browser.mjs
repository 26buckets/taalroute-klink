import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';

const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:19105';
const baseline = process.env.KLINK_BASELINE_URL || 'http://127.0.0.1:19106';
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/player-appearance';
const copy = chapterCollections('copy').find(row => row.contentUrl && row.level === 'alfa-c' && row.id.includes('KSW-'));
assert(copy);
const routes = {
  copy: '/' + chapterHash({ chapter: 'writing', activity: 'copy', collection: copy.id, level: copy.level, help: copy.help }),
  dictation: '/#learner/chapters/writing/paper-dictation/route-delen.alfa-b~words-2?level=alfa-b&help=practice',
};
for (const activity of ['meet', 'read', 'cards', 'build-model']) {
  const row = chapterCollections(activity).find(item => item.exercises.length);
  assert(row, activity);
  routes[activity] = '/' + chapterHash({ chapter: activity === 'build-model' ? 'spelling' : 'words', activity, collection: row.id, level: row.level });
}
const checks = [], errors = [];
mkdirSync(out, { recursive: true });
try {
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch();
    try {
      for (const [name, route] of Object.entries(routes)) for (const width of [1366, 390]) for (const theme of ['light', 'dark']) {
        const captures = [];
        for (const [label, host] of [['before', baseline], ['after', base]]) {
          const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' });
          try {
            await context.addInitScript(theme => {
              localStorage.setItem('taalroute-klink-appearance-v1', theme);
              window.Audio = class extends EventTarget {
                constructor() { super(); this.dataset = {}; }
                play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 10); return Promise.resolve(); }
                pause() { clearTimeout(this.timer); }
              };
            }, theme);
            const page = await context.newPage();
            page.on('pageerror', error => errors.push({ engine, name, label, message: error.message }));
            await page.goto(host + route);
            await page.locator('.cp-task-card').waitFor();
            if (name === 'copy' || name === 'dictation') await page.waitForFunction(() => !document.querySelector('.cp-text-entry input')?.disabled);
            await page.waitForFunction(() => [...document.querySelectorAll('.cp-task-card img')].every(image => image.complete && image.naturalWidth > 0));
            await page.evaluate(() => document.fonts.ready);
            await page.keyboard.press('Tab');
            await page.locator('.cp-exercise-record-head h3').focus();
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const filename = `${engine}-${name}-${width}-${theme}-${label}.png`;
            const png = await page.screenshot({ path: out + '/' + filename, animations: 'disabled' });
            const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const geometry = await page.locator('.learner-app, .cp-task-card, .cp-text-entry input, [data-practice-next]').evaluateAll(elements => elements.map(element => { const {x,y,width,height} = element.getBoundingClientRect(); return {x,y,width,height}; }));
            const text = await page.locator('.learner-app').innerText();
            captures.push({ data, info, filename, geometry, text });
          } finally { await context.close(); }
        }
        assert.equal(captures[0].data.length, captures[1].data.length);
        assert.deepEqual(captures[0].geometry, captures[1].geometry);
        assert.equal(captures[0].text, captures[1].text);
        let changedPixels = 0, significantPixels = 0;
        for (let index = 0; index < captures[0].data.length; index += 4) {
          if (!captures[0].data.subarray(index, index + 4).equals(captures[1].data.subarray(index, index + 4))) changedPixels++;
          if ([0,1,2,3].some(channel => Math.abs(captures[0].data[index + channel] - captures[1].data[index + channel]) > 2)) significantPixels++;
        }
        checks.push({ engine, name, width, theme, changedPixels, significantPixels, channelRoundingTolerance: 2, screenshots: captures.map(c => c.filename) });
        assert.equal(significantPixels, 0, `${engine} ${name} ${width} ${theme}: appearance changed`);
        console.log('PASS', engine, name, width, theme, 'same text and geometry; pixel channels within rounding tolerance');
      }
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
  assert.equal(checks.length, 48);
} finally { writeFileSync(out + '/checks.json', JSON.stringify({ base, baseline, simulatedAudio: true, checks, errors }, null, 2) + '\n'); }
