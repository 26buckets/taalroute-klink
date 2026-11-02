import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';

const local = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19073';
const baseline = process.env.KLINK_APPEARANCE_BASE || 'https://klink.taalroute.nl';
const out = process.env.KLINK_WORD_APPEARANCE_OUTPUT || '../word-listening-checks/appearance';
mkdirSync(out, { recursive: true });
const inventory = JSON.parse(readFileSync('outputs/goal-audit-20261101/inventory.json'));
const routes = [
  inventory.cases.find(c => c.exercise.mode === 'model').route,
  '/#learner/chapters/sentences/sentences/klink-zinnen-zelf-a1-20261031-r1?level=a1&help=practice',
  inventory.cases.find(c => c.exercise.standardTask?.kind === 'mark').route,
];
const prior = process.env.KLINK_APPEARANCE_RECHECK ? JSON.parse(readFileSync(out+'/checks.json')) : undefined;
const checks = prior ? prior.checks.filter(row=>row.pixelIdentical) : [], errors = [];
const sha = b => createHash('sha256').update(b).digest('hex');
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const viewport of [{width:1366,height:900},{width:390,height:844}]) for (const colorScheme of ['light','dark']) for (const [at,route] of routes.entries()) {
      if(prior && !prior.errors.some(row=>row.engine===engine&&row.viewport.width===viewport.width&&row.colorScheme===colorScheme&&row.route===route)) continue;
      const shots = [], focus = [];
      for (const base of [baseline,local]) {
        const page = await browser.newPage({viewport,colorScheme,hasTouch:viewport.width<700,reducedMotion:'reduce'});
        await page.addInitScript(()=>{
          window.__visualAudio=[];
          window.Audio=class extends EventTarget {
            constructor(src=''){super();this.src=src;this.dataset={};this.currentTime=0;this.duration=NaN;this.readyState=0;this.paused=true;this.ended=false;window.__visualAudio.push(this);}
            getAttribute(name){return name==='src'?this.src:null;}
            play(){return new Promise(()=>{});}
            pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
            finish(){if(this.paused)return;this.paused=true;this.ended=true;this.currentTime=this.duration;this.dispatchEvent(new Event('ended'));}
          };
        });
        page.on('pageerror',e=>errors.push({engine,base,route,error:e.message}));
        await page.goto(base + route);
        await page.locator('[data-exercise-id]').waitFor();
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))); });
        await page.waitForFunction(()=>!document.querySelector('.klink-opening-loader'));
        const pause=page.locator('button:has(svg.lucide-pause)').first();
        if(await pause.count()) await pause.click();
        assert(await page.evaluate(()=>window.__visualAudio.every(audio=>audio.paused&&!audio.ended)),'Network-free fixture remains before playback');
        await page.mouse.click(2,200);
        focus.push(await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.tagName==='H3'?document.activeElement.textContent:''})));
        await page.evaluate(()=>{ if(document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const image = await page.screenshot({animations:'disabled'});
        shots.push(image);
        await page.close();
      }
      const before=await sharp(shots[0]).ensureAlpha().raw().toBuffer(),after=await sharp(shots[1]).ensureAlpha().raw().toBuffer();
      const identical=before.equals(after);
      const entry={engine,viewport,colorScheme,route,pixelIdentical:identical,focus,neutralFocus:true,audioMode:'Consistent network-free pending metadata/play state for appearance; native playing/ended media is checked separately',baselineSha256:sha(shots[0]),currentSha256:sha(shots[1])};
      checks.push(entry);
      if (!identical) {
        const name = `${engine}-${viewport.width}-${colorScheme}-${at}`;
        writeFileSync(out+'/'+name+'-baseline.png',shots[0]);writeFileSync(out+'/'+name+'-current.png',shots[1]);
        errors.push({...entry,error:'Appearance changed'});
      }
      writeFileSync(out+'/checks.json',JSON.stringify({baseline,local,checks,errors},null,2)+'\n');
    }
  } finally { await browser.close(); }
}
console.log({comparisons:checks.length,errors:errors.length});
assert.equal(checks.length,24);assert.deepEqual(errors,[]);
