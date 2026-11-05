import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const repo=process.cwd(),require=createRequire(repo+'/package.json'),{chromium,webkit}=require('playwright');
const {chapterHash}=await import(pathToFileURL(repo+'/lib/practice-chapters.ts'));
const bank=JSON.parse(readFileSync('docs/speaking-a1-repeat-20261105/source-bank.json'));
const row=JSON.parse(readFileSync('docs/speaking-a1-repeat-20261105/manifest.json')).row;
const route='/'+chapterHash({chapter:'speaking',activity:'speak',collection:row.id,level:'a1',help:'practice'});
const out='../focus-checks/postflight/focus';mkdirSync(out,{recursive:true});const checks=[],errors=[];
const focusStyle=locator=>locator.evaluate(el=>({outline:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth,visible:el.matches(':focus-visible'),active:document.activeElement===el}));
try {
 for(const[engine,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  try { for(const width of [390,1366])for(const theme of ['light','dark']){
   const geometry=[],styles=[];
   for(const[label,base]of [['before','http://127.0.0.1:19128'],['after','https://klink.taalroute.nl']]){
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'}),page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(theme=>{localStorage.setItem('taalroute-klink-appearance-v1',theme);window.focusTestEnded=false;window.addEventListener('klink-audio-source',e=>e.detail.addEventListener('ended',()=>{window.focusTestEnded=true;}));},theme);
    await page.goto(base+route);const heading=page.locator('.cp-exercise-info-heading');await heading.waitFor();await page.evaluate(()=>document.fonts.ready);
    assert.equal((await focusStyle(heading)).active,true,'Task heading retains actual automatic focus');
    geometry.push(await page.locator('.cp-exercise-info-heading,.cp-task-card,.cp-exercise-stage').evaluateAll(nodes=>nodes.map(el=>({text:el.textContent,rect:el.getBoundingClientRect().toJSON()}))));
    styles.push(await focusStyle(heading));await page.screenshot({path:`${out}/${engine}-${width}-${theme}-${label}.png`,fullPage:true});
    if(label==='after'){
     assert.equal(styles.at(-1).outline,'none');
     await page.keyboard.press('Tab');const keyboard=await focusStyle(page.locator(':focus'));assert(keyboard.visible);assert.notEqual(keyboard.outline,'none');assert.notEqual(keyboard.width,'0px');
     const help=page.getByRole('button',{name:'Help',exact:true}),helpElement=await help.elementHandle();await help.click();const pointer=await focusStyle(helpElement);assert.equal(pointer.outline,'none');
     await page.getByRole('button',{name:'Luister naar '+bank.exercises[0].exampleWord,exact:true}).first().click();await page.waitForFunction(()=>window.focusTestEnded);await page.getByRole('button',{name:'Klaar',exact:true}).click();await page.locator('[data-practice-next]').click();await page.locator('[data-exercise-id="SPK-A1-ZHW-02"]').waitFor();assert.equal((await focusStyle(heading)).outline,'none');assert.equal((await focusStyle(heading)).active,true);
     checks.push({engine,width,theme,headingFocusPreserved:true,automaticOutlineRemoved:true,pointerOutlineRemoved:true,keyboardOutlinePreserved:true,nextExerciseFocusPreserved:true,before:styles[0],after:styles[1]});
    }
    await context.close();
   }
   assert.deepEqual(geometry[0],geometry[1],'Unchanged content and layout');
  }} finally {await browser.close();}
 }
 assert.equal(checks.length,8);assert.deepEqual(errors,[]);console.log('PASS 8 browser/viewport/theme cases: auto-focus, click, Tab, next task, identical content and geometry.');
} finally {writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2)+'\n');}
