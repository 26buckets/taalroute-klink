import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';

const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_KEYS_OUTPUT||'outputs/answer-arrow-space-20261101/local';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})) {
  const browser=await type.launch();
  try {
    for(const viewport of [{width:1280,height:800},{width:320,height:568}]) for(const activity of ['text-question','content-woordpakketten']) for(const scenario of (activity==='text-question'?['space','arrows','selected-space']:['space','arrows'])) {
      const page=await browser.newPage({viewport,hasTouch:viewport.width===320});
      page.setDefaultTimeout(15000);
      page.on('pageerror',e=>errors.push({engine,activity,error:e.message}));
      try {
        await page.addInitScript(()=>{
          localStorage.setItem('klink.keys.retention','kept');
          window.__keyPlays=0;
          window.Audio=class extends EventTarget {
            play(){window.__keyPlays++;this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();}
            pause(){clearTimeout(this.timer);}
          };
        });
        const row=chapterCollections(activity).find(r=>r.id===(activity==='text-question'?'klink-teksten-zelf-a1-r01-v1':'content:woordpakketten:word-self:b1:b1:choice'));
        const exercises=row.contentUrl?JSON.parse(readFileSync('public'+row.contentUrl)).exercises:row.exercises;
        await page.goto(base+'/'+chapterHash({chapter:activity==='text-question'?'texts':'words',activity,collection:row.id,level:row.level,help:'practice'}));
        const root=page.locator('[data-exercise-id]');
        await root.waitFor();
        const options=page.locator('.cp-choice-grid > button, .cp-choice-grid > .cp-extended-option > button:first-child');
        const correctIndex=e=>(e.contentTask?.options||e.options).findIndex(o=>(e.contentTask?.correctOptionIds||e.answer.correctOptionIds).includes(o.id));
        if(scenario==='selected-space') {
          await options.nth((correctIndex(exercises[0])+1)%exercises[0].options.length).click();
          const beforeWrong=await page.evaluate(()=>({plays:window.__keyPlays,selected:document.querySelector('.cp-choice-grid button[aria-pressed="true"]')?.textContent}));
          await page.keyboard.press('Space');
          await page.waitForTimeout(150);
          const afterWrong=await page.evaluate(()=>({plays:window.__keyPlays,selected:document.querySelector('.cp-choice-grid button[aria-pressed="true"]')?.textContent}));
          assert.equal(afterWrong.plays,beforeWrong.plays+1,'Space on a mouse-selected wrong answer replays the stimulus');
          assert.equal(afterWrong.selected,beforeWrong.selected);
          assert.equal(await root.getAttribute('data-practice-ready'),'false');
          assert.equal(await page.evaluate(()=>localStorage.getItem('klink.keys.retention')),'kept');
          checks.push({engine,viewport,activity,scenario,selectedAnswerAudioReplay:true,spaceKeepsAnswer:true,storagePreserved:true});
          continue;
        }
        await options.nth(correctIndex(exercises[0])).click();
        const initialFocus=await page.evaluate(()=>document.activeElement.tagName);
        if(activity==='text-question') assert.equal(initialFocus,'BODY');
        else assert(['BODY','BUTTON'].includes(initialFocus),'Use the browser’s actual mouse focus');
        if(scenario==='space') {
        const before=await page.evaluate(()=>({plays:window.__keyPlays,y:window.scrollY,selected:document.querySelector('.cp-choice-grid button[aria-pressed="true"]')?.textContent}));
        await page.keyboard.down('Space');
        await page.keyboard.down('Space');
        await page.keyboard.up('Space');
        await page.waitForTimeout(150);
        assert.equal(await root.getAttribute('data-exercise-id'),exercises[0].exerciseId,'Space never advances');
        const after=await page.evaluate(()=>({plays:window.__keyPlays,y:window.scrollY,selected:document.querySelector('.cp-choice-grid button[aria-pressed="true"]')?.textContent}));
        assert.equal(after.selected,before.selected,'Space must retain the mouse-selected answer');
        assert.equal(after.y,before.y,'Space must not scroll the page');
        assert.equal(after.plays-before.plays,activity==='text-question'?1:0,'Space replays available audio once, without inventing audio');
        }
        if(activity==='content-woordpakketten') {
          await page.keyboard.press('ArrowRight');
          assert.equal(await root.getAttribute('data-exercise-id'),exercises[0].exerciseId,'Unconfirmed answer cannot advance');
          await page.keyboard.press('Enter');
        }
        assert.equal(await root.getAttribute('data-practice-ready'),'true');
        await page.keyboard.down('ArrowRight');
        await page.keyboard.down('ArrowRight');
        await page.keyboard.up('ArrowRight');
        await page.waitForTimeout(150);
        assert.equal(await root.getAttribute('data-exercise-id'),exercises[1].exerciseId,'Right advances once from the actual focus');
        await options.nth(correctIndex(exercises[1])).click();
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(150);
        assert.equal(await root.getAttribute('data-exercise-id'),exercises[0].exerciseId,'Left returns after a mouse answer');
        assert.equal(await page.evaluate(()=>localStorage.getItem('klink.keys.retention')),'kept');
        checks.push({engine,viewport,activity,scenario,initialFocus,selectedAnswerAudioReplay:scenario==='space'&&activity==='text-question',spaceKeepsAnswer:scenario==='space',spaceReplaysOnce:scenario==='space'&&activity==='text-question',spaceDoesNotScroll:scenario==='space',arrowsFromActualFocus:true,heldKeySafe:true,unconfirmedCannotAdvance:activity==='content-woordpakketten',storagePreserved:true});
      } catch(error) {errors.push({engine,viewport,activity,scenario,error:error.message});}
      finally {await page.close();}
    }
  } finally {await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalDeviceTested:false},null,2)+'\n');}
}
assert.deepEqual(errors,[]);
assert.equal(checks.length,20);
console.log('PASS 20 mouse-answer/Space/arrows flows in Chromium and WebKit, desktop and 320px.');
