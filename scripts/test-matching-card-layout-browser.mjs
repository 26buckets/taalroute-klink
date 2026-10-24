import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18843';
const out = process.env.KLINK_MATCH_OUTPUT || 'outputs/matching-cards-20261024/browser';
mkdirSync(out, { recursive: true });
const pack = packs.find(p => p.id === 'groep-3'), lesson = pack.lessons.find(l => l.id === 'klink-leesstap-07');
const guided = exercisesForLesson(pack, lesson).find(e => e.componentId === 'ALF-CMP-004');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const checks = [], errors = [];
try {
  for (const [width, height] of [[1280,800],[844,390],[390,844],[320,568]]) {
    for (const collapsed of width > 820 ? [false,true] : [false]) {
      for (const activity of ['guided','match','hear-match']) {
        const page = await browser.newPage({ viewport: { width, height } });
        page.setDefaultTimeout(15000);
        console.log('START',activity,width,height,collapsed);
        page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(() => {
          window.Audio = class extends EventTarget {
            play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 20); return Promise.resolve(); }
            pause() { clearTimeout(this.timer); }
          };
        });
        let exercise;
        if (activity === 'guided') {
          exercise = guided;
          await page.goto(`${base}/#learner/home`);
          await page.locator('.learner-main').waitFor();
          await page.evaluate(position => localStorage.setItem('klink.taalroute.route.v1', JSON.stringify({completed:[],position})), {packageId:pack.id,lessonId:lesson.id,exerciseId:exercise.exerciseId});
          await page.reload();
          await page.getByRole('button', {name:'Ga verder',exact:true}).click();
          await page.getByRole('button', {name:'Nu jij',exact:true}).click();
        } else {
          const collection = chapterCollections(activity)[0];
          exercise = collection.exercises[0];
          await page.goto(`${base}/${chapterHash({chapter:'words',activity,collection:collection.id,level:collection.level})}`);
        }
        const board = page.locator('.cp-match-board:not(.cp-match-demo)');
        await board.waitFor();
        const toggle = page.locator('.cp-nav-toggle');
        if (width > 820 && ((await toggle.getAttribute('aria-expanded')) === 'false') !== collapsed) await toggle.click();
        await page.evaluate(() => document.fonts.ready);
        for (const img of await board.locator('img').all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(image => image.decode());
        }
        const geometry = () => board.evaluate(e => {
          const r = e.getBoundingClientRect();
          let scroll = 0; for(let a=e.parentElement; a; a=a.parentElement) scroll += a.scrollTop;
          return [...e.querySelectorAll('button')].map(b => {const q = b.getBoundingClientRect(); return {x:q.x-r.x,y:q.y-r.y,w:q.width,h:q.height,boardTop:r.y+scroll};});
        });
        const initial = await geometry(), n = exercise.sources.length;
        assert.equal(initial.length, n * 2);
        assert(initial.every(r => Math.abs(r.h-initial[0].h)<1 && Math.abs(r.w-initial[0].w)<1), 'All cards must be equal');
        for(let i=0;i<n;i++) assert(Math.abs(initial[i].y-initial[n+i].y)<1, 'Rows must align');
        const source = i => board.locator(':scope > div').nth(0).locator('button').nth(i);
        const target = i => board.locator(':scope > div').nth(1).locator('button').nth(i);
        for(let i=0;i<n;i++) {
          const correct = exercise.targets.findIndex(t => t.id === exercise.answer.mapping[exercise.sources[i].id]);
          await source(i).click();
          await target(correct).waitFor({state:'visible'});
          if (exercise.audioOnlySources) await page.waitForFunction(() => [...document.querySelectorAll('.cp-match-board > div:last-child button')].some(b => !b.disabled));
          assert.deepEqual(await geometry(), initial, 'Selecting/listening must not resize cards');
          if(i===0) {
            await target((correct+1)%n).click();
            assert.deepEqual(await geometry(), initial, 'Wrong answer must not resize cards');
          }
          await target(correct).click();
          assert.deepEqual(await geometry(), initial, 'Check marks must not resize cards');
        }
        assert.equal(await board.locator('[aria-label="Gekoppeld"]').count(), n*2);
        await board.locator('button').last().scrollIntoViewIfNeeded();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1);
        assert.equal(overflow,false,'No horizontal overflow');
        const next = page.getByRole('button',{name:'Verder',exact:true});
        if(await next.count()) {
          await next.scrollIntoViewIfNeeded();
          const r = await next.boundingBox();
          assert(r.y >= 0 && r.y+r.height <= height+1, 'Footer must remain reachable by scrolling');
        }
        await page.screenshot({path:`${out}/${activity}-${width}-${collapsed}.png`});
        checks.push({activity,width,height,collapsed,pairs:n,geometry:initial});
        console.log('PASS',activity,width,height,collapsed);
        await page.close();
      }
    }
  }
  assert.deepEqual(errors,[]);
  writeFileSync(`${out}/checks.json`,JSON.stringify({base,checks,errors,audio:'mocked ended events; real audio separately covered by existing lesson checks'},null,2));
} finally { await browser.close(); }
