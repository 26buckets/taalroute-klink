import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { functionalAudio, functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
const base=process.env.KLINK_URL??'http://127.0.0.1:18868';
const out=process.env.KLINK_FUNCTIONEEL_OUTPUT??'outputs/alfa-c-functioneel';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],choiceChecks=[];
async function checkChoices(page, player, step, engine, viewport) {
  const group=player.getByRole('group',{name:step.instruction,exact:true});
  assert(await group.isVisible(), 'Concrete task labels the answer group: '+step.id);
  assert.equal(await group.locator('legend').innerText(),step.instruction);
  assert.equal(await group.locator(':scope > p').innerText(),'Kies één antwoord.');
  const buttons=group.getByRole('button');assert.equal(await buttons.count(),3);
  const styles=await buttons.evaluateAll(items=>items.map(button=>{
    const css=getComputedStyle(button),circle=getComputedStyle(button,'::before'),box=button.getBoundingClientRect();
    return {border:parseFloat(css.borderTopWidth),borderColor:css.borderTopColor,background:css.backgroundColor,height:box.height,width:box.width,circle:parseFloat(circle.width),pressed:button.getAttribute('aria-pressed')};
  }));
  assert(styles.every(s=>s.border>=1&&s.borderColor!=='rgba(0, 0, 0, 0)'&&s.background!=='rgba(0, 0, 0, 0)'&&s.height>=56&&s.width>0&&s.circle>=24&&s.pressed==='false'),'All three look selectable before an answer: '+step.id);
  await group.scrollIntoViewIfNeeded();
  if(viewport==='desktop'||step.number===2)await page.screenshot({path:`${out}/${engine}-${step.id}-${viewport}-choices.png`});
  choiceChecks.push({engine,task:step.id,viewport,concreteInstruction:true,threeVisibleControls:true});
}
for(const [name,engine] of Object.entries({chromium,webkit})) {
  const browser=await engine.launch();
  try {
    const page=await browser.newPage({viewport:{width:1366,height:900}});page.setDefaultTimeout(15000);
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.playedAudio=[];
      window.Audio=class extends EventTarget {
        play(){window.playedAudio.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),15);return Promise.resolve();}
        pause(){clearTimeout(this.timer);}
      };
    });
    const idle=()=>page.waitForFunction(()=>!document.querySelector('.functional-player .pilot-tools button')?.disabled);
    await page.goto(base+'/#learner/alfa-c');await page.locator('[data-functional-block]').first().waitFor();
    assert.equal(await page.locator('[data-functional-block]').count(),6);assert.equal(await page.locator('[data-pilot-block]').count(),3);
    const sentinel='{"version":1,"positions":{"winkel":7},"records":{}}';
    await page.evaluate(v=>{localStorage.setItem('klink.preview.alfa-c.v1',v);localStorage.setItem('klink.taalroute.attempts.v1','[{"sentinel":true}]');},sentinel);
    for(const block of functionalBlocks) {
      await page.locator(`[data-functional-block="${block.id}"]`).click();
      for(const step of block.steps) {
        const player=page.locator(`[data-functional-step="${step.id}"]`);await player.waitFor();
        const next=page.getByRole('button',{name:'Verder',exact:true});
        assert.equal(await player.getByRole('heading',{level:2}).innerText(),step.screen);
        if(step.closed) {
          assert((await player.innerText()).includes('Deze opdracht komt later.'));
          assert.equal(await player.locator('.functional-source').count(),0);assert(await next.isEnabled());
        } else {
          assert(await next.isDisabled());assert((await player.innerText()).includes(step.instruction));
          await player.getByRole('button',{name:'Luister',exact:true}).click();await idle();assert.equal(await page.evaluate(()=>window.playedAudio.at(-1)),functionalAudio('guide',step.instruction));
          if(step.exampleVisible){await player.getByRole('button',{name:'Voorbeeld',exact:true}).click();await idle();
            if(step.exampleHandwriting){assert(await player.locator('.functional-handwriting').isVisible());}else assert((await player.innerText()).includes(step.exampleVisible));
            assert(await next.isDisabled());await player.locator('.functional-source').getByRole('button',{name:'Nu jij',exact:true}).click();}
          await player.getByRole('button',{name:'Help',exact:true}).click();await idle();assert.equal(await player.locator('.pilot-help p').innerText(),step.helpVisible);assert.equal(await page.evaluate(()=>window.playedAudio.at(-1)),functionalAudio('guide',step.helpVisible));await player.getByRole('button',{name:'Help',exact:true}).click();
          if(step.kind==='choice') {
            await checkChoices(page,player,step,name,'desktop');
            const wrong=step.options.find(o=>o.id!==step.correctOptionId),right=step.options.find(o=>o.id===step.correctOptionId);
            await player.getByRole('button',{name:wrong.text,exact:true}).focus();await page.keyboard.press('Enter');await idle();assert.equal(await player.getByRole('button',{name:wrong.text,exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await player.locator('output').innerText(),step.retryVisible);assert(await next.isDisabled());
            await player.getByRole('button',{name:right.text,exact:true}).click();await idle();assert.equal(await player.locator('output').innerText(),'Dat klopt.');
          } else {
            assert.equal(await player.getByRole('textbox').count(),0);
            if(step.dictationTexts.length){
              assert(await player.getByRole('button',{name:'Ik ben klaar',exact:true}).isDisabled());
              for(const [n,text] of step.dictationTexts.entries()){
                assert(!(await player.innerText()).includes(text),'Dictation target remains hidden');
                const label=step.dictationTexts.length>1?`Luister ${n+1}`:(step.id.endsWith('formulier-08')?'Luister naar het nummer':'Luister naar de zin');
                await player.getByRole('button',{name:label,exact:true}).click();await idle();assert.equal(await page.evaluate(()=>window.playedAudio.at(-1)),functionalAudio('target',text));
              }
            }
            await player.getByRole('button',{name:'Ik ben klaar',exact:true}).click();await idle();assert(!(await player.locator('output').innerText()).includes('Dat klopt.'));
            await player.getByRole('button',{name:'Nog eens',exact:true}).click();await idle();assert.equal(await player.locator('.pilot-help p').innerText(),step.retryVisible);assert(await next.isDisabled());
            await player.getByRole('button',{name:'Ik ben klaar',exact:true}).click();await idle();
          }
        }
        assert(await next.isEnabled());await next.click();
        await page.waitForFunction(id=>!document.querySelector(`[data-functional-step="${id}"]`),step.id);
        const data=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),functionalStorageKey);
        assert.equal(data.positions[block.id],step.number);
        if(step.closed)assert(!data.records[step.id]);
        else {assert(data.records[step.id]?.helpUsed);assert.equal(data.records[step.id].assessment,step.kind==='choice'?'answer':'participation');if(step.kind!=='choice')assert.equal(data.records[step.id].correct,undefined);}
        checks.push({engine:name,task:step.id,closed:step.closed});
        if(step.number===6){await page.reload();await page.locator(`[data-functional-step="${block.steps[6].id}"]`).waitFor();}
      }
      await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
      await page.getByRole('link',{name:'Kies een ander blok'}).click();await page.locator('[data-functional-block]').first().waitFor();
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('klink.preview.alfa-c.v1')),sentinel);
    assert.equal(await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1')),'[{"sentinel":true}]');
    await page.setViewportSize({width:320,height:568});
    for(const block of functionalBlocks)for(const step of block.steps) {
      await page.evaluate(({key,id,n})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[id]:n},records:{}})),{key:functionalStorageKey,id:block.id,n:step.number-1});
      await page.goto(base+`/#learner/alfa-c/${block.id}`);await page.reload();
      await page.locator(`[data-functional-step="${step.id}"]`).waitFor();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow: '+step.id);
      const sizes=await page.locator('.functional-player button').evaluateAll(a=>a.filter(x=>x.getBoundingClientRect().height).map(x=>({label:x.textContent,h:x.getBoundingClientRect().height})));
      assert(sizes.every(x=>x.h>=44),'Touch targets: '+JSON.stringify(sizes));
      if(step.kind==='choice')await checkChoices(page,page.locator('[data-functional-step]'),step,name,'mobile');
      if(step.number===1)await page.screenshot({path:`${out}/${name}-${block.id}-mobile.png`,fullPage:true});
    }
    await page.goto(base+'/alfa-c/antwoordbladen.html');assert.equal(await page.locator('.sheet').count(),9);
    for(const block of functionalBlocks)assert.equal(await page.locator(`#${block.id}`).count(),1);
    if(name==='chromium')await page.pdf({path:`${out}/antwoordbladen.pdf`,preferCSSPageSize:true,printBackground:true});
    // A blocked browser store must not prevent reading or exercising.
    const denied=await browser.newPage();await denied.addInitScript(()=>{Object.defineProperty(Storage.prototype,'getItem',{value(){throw Error('Storage denied');}});Object.defineProperty(Storage.prototype,'setItem',{value(){throw Error('Storage denied');}});});
    await denied.goto(base+'/#learner/alfa-c/lijst');await denied.locator('[data-functional-step]').waitFor();assert((await denied.getByRole('alert').innerText()).includes('Bewaren lukt niet'));await denied.close();
  } finally {await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/report.json`,JSON.stringify({steps:checks,narrowScreens:144,choiceChecks,storagePreserved:true,errors},null,2));console.log(JSON.stringify({steps:checks.length,narrowScreens:144,choiceChecks:choiceChecks.length,errors}));
