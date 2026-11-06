import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { taalroutePackages } from '../lib/taalroute-packages.ts';
import { groupExercises, groupSessionKey } from '../lib/group-practice.ts';
const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:18996';
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/exercise-flow-20261106';
mkdirSync(out, { recursive: true });
const checks = [], errors = [], media = new Map();
const pack = taalroutePackages.find(p => p.id === 'groep-1');
export async function useLiveMedia(page) {
  if (!process.env.KLINK_TEST_LIVE_MEDIA) return;
  await page.route(base + '/**', async route => {
    const u = new URL(route.request().url());
    if (!/^\/(package-|compact-images|opening-loader|taalroute-menu|audio|images|app-covers|fonts)/.test(u.pathname)) return route.continue();
    const key = u.pathname + u.search;
    if (!media.has(key)) media.set(key, (async () => {
      const r = await page.request.get('https://klink.taalroute.nl' + key);
      assert.equal(r.status(), 200, key);
      return { body: await r.body(), contentType: r.headers()['content-type'] };
    })());
    await route.fulfill(await media.get(key));
  });
}
function fakeAudio() {
  window.Audio = class extends EventTarget {
    dataset = {}; paused = true;
    constructor(src) { super(); this.src = src; }
    play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 10); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
}
async function open(page, activity) {
  await page.goto(base + '/#learner/package/groep-1');
  await page.locator('.cp-tabs').getByRole('button', {name:'Oefenen met deze woorden',exact:true}).click();
  await page.locator(`[data-activity="${activity}"]`).click();
  await page.locator('.cp-exercise-stage').waitFor();
  await page.waitForTimeout(120);
}
for (const [engine, type] of Object.entries({chromium, webkit})) {
  const browser = await type.launch(engine === 'chromium' ? {channel:'chrome'} : {});
  try {
    for (const [width,height] of [[1600,730],[1366,600],[390,844],[320,568]]) for (const activity of ['meet','same-word','write-letter']) {
      const page = await browser.newPage({viewport:{width,height},colorScheme:width===1366?'dark':'light'});
      page.on('pageerror', e=>errors.push(e.message));
      await useLiveMedia(page);
      await page.addInitScript(fakeAudio);
      const model = groupExercises(pack,'meet').find(e=>e.text?.primary==='mat');
      await page.addInitScript(({key,id})=>{
        if (sessionStorage.getItem('flow-test-seeded')) return;
        sessionStorage.setItem('flow-test-seeded','true');
        if (!localStorage.getItem('klink.taalroute.attempts.v1')) localStorage.setItem('klink.taalroute.attempts.v1','[{"existing":true}]');
        if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));
      },{key:groupSessionKey(pack.id,'meet'),id:model.exerciseId});
      await open(page,activity);
      const root=page.locator('.cp-exercise-browser[data-exercise-id]');
      const id=await root.getAttribute('data-exercise-id');
      if(activity==='meet') {
        const photo=page.locator('[data-view-toggle="photo"]');
        if(await photo.getAttribute('aria-pressed')==='true')await photo.click();
        assert(await page.locator('.cp-model-content img').evaluate(e=>e.getBoundingClientRect().height===0),'Hidden model photo releases its space');
      }
      const layout=await page.evaluate(()=>{
        const stage=document.querySelector('.cp-exercise-stage'),main=document.querySelector('.learner-main');
        return {stageHeight:stage.clientHeight,stageOverflow:stage.scrollHeight>stage.clientHeight+2,overflow:getComputedStyle(stage).overflowY,horizontal:main.scrollWidth>main.clientWidth+1,contentBottom:stage.getBoundingClientRect().bottom};
      });
      assert(!layout.horizontal,`${engine} ${width} ${activity} horizontal overflow`);
      assert.equal(layout.overflow,'visible');
      assert(!layout.stageOverflow,`${engine} ${width} ${activity} stage clipped`);
      if(width>=1000)assert(layout.contentBottom<=height,`${activity} fits a laptop`);
      if(activity==='write-letter') {
        const input=page.locator('.cp-short-answer input'),button=page.locator('[data-inline-check]');
        await input.fill('');
        assert(await input.evaluate(e=>document.activeElement===e));
        const a=await input.boundingBox(),b=await button.boundingBox();
        assert(Math.abs(a.y+a.height-b.y-b.height)<3,'Check stays beside the field');
        assert(b.x>=a.x+a.width,'Button follows the input');
      }
      await page.locator('.learner-main').evaluate(e=>e.scrollTop=0);
      await page.screenshot({path:`${out}/${engine}-${activity}-${width}.png`});
      if(activity==='write-letter') {
        const input=page.locator('.cp-short-answer input');
        const ex=groupExercises(pack,activity).find(e=>e.exerciseId===id);
        await input.fill('zz');await input.press('Enter');
        await page.waitForTimeout(800);
        assert.equal(await root.getAttribute('data-exercise-id'),id,'Wrong answer does not advance');
        await input.press('Space');assert.equal(await input.inputValue(),'zz ','Space remains text');
        await input.fill(ex.target);await input.press('Enter');
        await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.dataset.exerciseId!==id,id);
        await page.waitForFunction(()=>document.activeElement?.matches('.cp-short-answer input'));
        await page.locator('[data-practice-automatic]').click();
        const secondId=await root.getAttribute('data-exercise-id');
        const second=groupExercises(pack,activity).find(e=>e.exerciseId===secondId);
        await page.locator('.cp-short-answer input').fill(second.target);
        await page.locator('.cp-short-answer input').press('Enter');
        await page.locator('[data-inline-next]').waitFor();
        await page.waitForTimeout(800);assert.equal(await root.getAttribute('data-exercise-id'),secondId,'Pause respected');
        await page.locator('[data-inline-next]').focus();await page.keyboard.press('Space');
        await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.dataset.exerciseId!==id,secondId);
      } else if(activity==='same-word') {
        const ex=groupExercises(pack,activity).find(e=>e.exerciseId===id);
        const correct=ex.options.findIndex(o=>ex.answer.correctOptionIds.includes(o.id));
        const buttons=page.locator('.cp-choice-grid > button');
        await buttons.nth((correct+1)%ex.options.length).click();
        await page.waitForTimeout(800);assert.equal(await root.getAttribute('data-exercise-id'),id);
        await buttons.nth(correct).focus();await page.keyboard.press('Enter');
        await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.dataset.exerciseId!==id,id);
      } else {
        await page.locator('.cp-exercise-feedback [data-practice-next]').focus();await page.keyboard.press('Enter');
        await page.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.dataset.exerciseId!==id,id);
      }
      const stored=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('attempt')||k.startsWith('klink.group.'))));
      await page.reload();await page.locator('.cp-tabs').waitFor();
      await page.locator('.cp-tabs').getByRole('button',{name:'Oefenen met deze woorden',exact:true}).click();
      await page.locator(`[data-activity="${activity}"]`).click();
      for(const [k,v] of Object.entries(stored))assert.deepEqual(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),k)),JSON.parse(v),'Reload preserves '+k);
      await page.getByRole('button',{name:'Alle oefeningen',exact:true}).first().click();
      assert(await page.locator('.cp-tabs').isVisible());
      checks.push({engine,width,height,activity,...layout,controls:true,progress:true});
      console.log('PASS',engine,width,activity);
      await page.unrouteAll({behavior:'wait'});await page.close();
    }
  } finally {await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2));}
}
assert.deepEqual(errors,[]);
