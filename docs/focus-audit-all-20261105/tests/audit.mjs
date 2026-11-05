import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
const {chromium,webkit}=createRequire(process.cwd()+'/package.json')('playwright');
const base=process.env.FOCUS_BASE||'http://127.0.0.1:19128',out=process.env.FOCUS_OUT||'../klink-focus-audit-evidence-20261105/results';mkdirSync(out,{recursive:true});
const scenarios=[
 ['entry','/','.landing-start'],['login','/','.landing-start',async p=>p.locator('.landing-start').click()],
 ['home','/#learner/home','.learner-app'],['words','/#learner/words','.word-library-page'],['review','/#learner/review','.learner-app'],['packages','/#learner/packages','.learner-app'],['sounds','/#learner/sounds','.cp-sound-play'],
 ['teacher','/#teacher/plus','.kpd-lesson-choice'],['lesson','/#teacher/plus?lesson=mat','[data-classroom="active"]'],
 ['lesson-menu','/#teacher/plus?lesson=mat','[data-classroom="active"]',async p=>p.getByRole('button',{name:'Kies onderdeel',exact:true}).click()],
 ['worksheets','/#teacher/materials','.kpd-worksheet-grid'],['worksheet','/#teacher/materials?lesson=mat&round=a','.kpd-worksheet-previews'],
 ['manual','/docenten','.wiki-heading'],['manual-chapter','/docenten/hoofdstuk-1','.wiki-article'],
 ['settings','/#learner/home','.learner-app',async p=>p.locator('.hdr001-menu-trigger:visible').click()],
 ['apps','/#teacher/plus','.kpd-lesson-choice',async p=>p.locator('.tr-app-chooser:visible > summary').click()],
];
const previous=existsSync(out+'/checks.json')?JSON.parse(readFileSync(out+'/checks.json')):{checks:[],errors:[]};if(previous.errors.length)writeFileSync(out+'/initial-selector-diagnostics.json',JSON.stringify(previous.errors,null,2));const checks=previous.checks,errors=[];
function save(){writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors},null,2));}
const style=el=>{const s=getComputedStyle(el);return {active:document.activeElement===el,visible:el.matches(':focus-visible'),outline:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor,shadow:s.boxShadow,decoration:s.textDecorationLine,border:s.borderColor,background:s.backgroundColor};};
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{for(const width of [1366,390])for(const theme of ['light','dark'])for(const[name,path,ready,setup]of scenarios){
  if(checks.some(r=>r.engine===engine&&r.width===width&&r.theme===theme&&r.name===name))continue;
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'}),p=await context.newPage();p.setDefaultTimeout(12000);
  await p.addInitScript(theme=>localStorage.setItem('taalroute-klink-appearance-v1',theme),theme);
  try{
   await p.goto(base+path,{waitUntil:'domcontentloaded'});await p.locator(ready).first().waitFor();await p.locator('.klink-opening-loader').waitFor({state:'detached'});if(setup)await setup(p);await p.evaluate(()=>document.fonts.ready);
   await p.waitForTimeout(150);
   const record={engine,width,theme,name,path,controls:[],tab:[]};
   // Exercise real Tab traversal separately from the per-style keyboard/pointer comparison.
   await p.evaluate(()=>document.activeElement?.blur());for(let i=0;i<6;i++){await p.keyboard.press('Tab');record.tab.push(await p.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return{tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,50),outline:s.outlineStyle,width:s.outlineWidth,decoration:s.textDecorationLine,focusVisible:e.matches(':focus-visible')};}));}
   await p.evaluate(()=>{document.activeElement?.blur();window.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();},true);});
   const selectors=await p.locator('button,a[href],summary,input,select,textarea,[tabindex="0"]').evaluateAll(els=>{const seen=new Set();return els.filter(e=>e.checkVisibility()&&!e.disabled&&e.tabIndex>=0&&!e.closest('[inert]')).filter(e=>{const k=[e.tagName,e.className,e.type,e.getAttribute('aria-current'),e.getAttribute('aria-pressed')].join('|');if(seen.has(k))return false;seen.add(k);return true;}).map((e,i)=>{e.dataset.focusAudit=String(i);return i;});});
   for(const i of selectors){const el=p.locator(`[data-focus-audit="${i}"]`);if(!await el.isVisible())continue;await el.scrollIntoViewIfNeeded();await p.mouse.move(0,0);await el.evaluate(e=>e.blur());const idle=await el.evaluate(style);
    await p.keyboard.press('Tab');await el.focus();const keyboard=await el.evaluate(style);
    await el.evaluate(e=>e.blur());const box=await el.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();const pointer=await el.evaluate(style);await p.mouse.up();
    const meta=await el.evaluate(e=>({tag:e.tagName,type:e.type,class:e.className,text:(e.textContent||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim().slice(0,70)}));
    record.controls.push({...meta,idle,keyboard,pointer});
   }
   await p.evaluate(()=>document.activeElement?.blur());await p.mouse.move(0,0);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:`${out}/${engine}-${width}-${theme}-${name}.png`,animations:'disabled'});checks.push(record);save();console.log('CHECK',engine,width,theme,name,record.controls.length);
  }catch(e){errors.push({engine,width,theme,name,message:e.message});save();console.log('ERROR',engine,width,theme,name,e.message.split('\n')[0]);}finally{await context.close();}
 }}finally{await browser.close();}
}
assert.equal(errors.length,0,'Inspect failed screen checks');console.log('COMPLETE',checks.length,'screens');
