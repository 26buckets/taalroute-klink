import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
import {chapterWordRounds} from '../lib/word-rounds.ts';

const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_SPACE_OUTPUT||'outputs/space-mixed-input-20261101/local';
const native=process.env.KLINK_SPACE_NATIVE==='1';
const checks=[],errors=[];
mkdirSync(out,{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})) {
  const browser=await type.launch();
  try {
    for(const viewport of (native?[{width:390,height:844}]:[{width:1280,height:800},{width:320,height:568}])) for(const activity of ['text-question','same-word']) {
      const page=await browser.newPage({viewport,hasTouch:viewport.width<500});
      let phase='open';
      page.setDefaultTimeout(15000);
      page.on('pageerror',e=>errors.push({engine,activity,error:e.message}));
      try {
        await page.addInitScript(({native})=>{
          localStorage.setItem('klink.space.retention','kept');
          window.__spacePlays=[];
          if(native) {
            const play=Reflect.get(HTMLMediaElement.prototype,'play');
            HTMLMediaElement.prototype.play=function(){window.__spacePlays.push(this);return play.call(this);};
          } else window.Audio=class extends EventTarget {
            play(){window.__spacePlays.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),50);return Promise.resolve();}
            pause(){clearTimeout(this.timer);}
          };
        },{native});
        const row=activity==='text-question'
          ?chapterCollections(activity).find(r=>r.id==='klink-teksten-zelf-a1-r01-v1')
          :chapterWordRounds(chapterCollections(activity).find(r=>r.id==='groep-4.alfa-a')).find(r=>r.id.endsWith('~words-2'));
        const exercises=row.contentUrl?JSON.parse(readFileSync('public'+row.contentUrl)).exercises:row.exercises;
        await page.goto(base+'/'+chapterHash({chapter:activity==='text-question'?'texts':'words',activity,collection:row.id,level:row.level,help:'practice'}));
        const root=page.locator('[data-exercise-id]');await root.waitFor();
        const id=()=>root.getAttribute('data-exercise-id');
        const tabTo=async(predicate,arg)=>{
          const trace=[];
          for(let i=0;i<40&&!await page.evaluate(predicate,arg);i++) {
            await page.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');
            trace.push(await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.trim().slice(0,70),aria:document.activeElement?.getAttribute('aria-label')})));
          }
          assert(await page.evaluate(predicate,arg),'Native Tab cannot reach control: '+JSON.stringify(trace));
        };
        const correct=async(index)=>{
          const exercise=exercises[index],option=exercise.options.find(o=>exercise.answer.correctOptionIds.includes(o.id));
          const choice=page.getByRole('button',{name:option.text??option.label,exact:true});
          if(viewport.width<500) await choice.tap(); else await choice.click();
          assert.equal(await root.getAttribute('data-practice-ready'),'true');
        };
        const replay=async(index,label)=>{
          phase=label;
          const count=await page.evaluate(()=>window.__spacePlays.length);
          await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');
          assert.equal(await id(),exercises[index].exerciseId,label+' must replay without advancing');
          await page.waitForFunction(n=>window.__spacePlays.length>n,count);
          assert.equal(await page.evaluate(()=>window.__spacePlays.length),count+1,'Held Space replays once');
          assert.equal(await root.getAttribute('data-practice-ready'),'true','The correct answer remains accepted');
          if(native) {
            await page.waitForFunction(()=>window.__spacePlays.some(a=>!a.paused&&!a.ended));
            await page.waitForFunction(()=>window.__spacePlays.every(a=>a.paused||a.ended),undefined,{timeout:45000});
            await page.waitForFunction(()=>!document.querySelector('[data-practice-previous]')?.disabled);
          }
          else await page.waitForTimeout(100);
        };
        await correct(0);
        await page.keyboard.press('Enter');
        assert.equal(await id(),exercises[1].exerciseId);
        await correct(1);
        await replay(1,'Mouse after Enter');
        await replay(1,'Repeated Space after replay');
        await page.keyboard.press('ArrowRight');
        assert.equal(await id(),exercises[2].exerciseId);
        await page.keyboard.press('ArrowLeft');
        assert.equal(await id(),exercises[1].exerciseId);
        await correct(1);
        await replay(1,'Mouse after both arrows');
        await tabTo(()=>document.activeElement?.matches('[data-practice-next]'));
        await page.keyboard.press('Space');
        assert.equal(await id(),exercises[2].exerciseId);
        // Native keyboard selection still moves focus to Verder for accessible Tab use.
        const option=exercises[2].options.find(o=>exercises[2].answer.correctOptionIds.includes(o.id));
        const label=option.text??option.label;
        await tabTo(label=>document.activeElement?.closest('.cp-choice-grid')&&document.activeElement.textContent.trim()===label,label);
        await page.keyboard.press('Enter');
        assert.equal(await root.getAttribute('data-practice-ready'),'true');
        assert(await page.evaluate(()=>document.activeElement?.matches('[data-practice-next]')),'Keyboard answer keeps accessible focus on Verder');
        await page.keyboard.press('Space');
        assert.equal(await id(),exercises[3].exerciseId);
        assert.equal(await page.evaluate(()=>localStorage.getItem('klink.space.retention')),'kept');
        await page.screenshot({path:out+'/'+engine+'-'+viewport.width+'-'+activity+'.png'});
        checks.push({engine,viewport,activity,nativeAudio:native,mouseAfterEnterReplay:true,mouseAfterArrowsReplay:true,repeatedReplay:true,heldSpaceSafe:true,answerRetained:true,enterAndArrowsRetained:true,explicitTabSpaceNative:true,keyboardAnswerFocusPreserved:true,storagePreserved:true});
      } catch(error) {errors.push({engine,viewport,activity,phase,error:error.message});}
      finally {await page.close();}
    }
  } finally {await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalPhoneTested:false},null,2)+'\n');}
}
assert.deepEqual(errors,[]);
assert.equal(checks.length,native?4:8);
console.log('PASS '+checks.length+' mixed mouse/keyboard/Space flows; original answers, audio and progress preserved.');
