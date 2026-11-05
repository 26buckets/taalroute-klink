import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const require=createRequire(process.cwd()+'/package.json'),{chromium,webkit}=require('playwright');
const {chapterHash}=await import(pathToFileURL(process.cwd()+'/lib/practice-chapters.ts'));
const route=chapterHash({chapter:'speaking',activity:'speak',level:'a1',help:'practice'}),checks=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:900}});await page.goto('http://127.0.0.1:19128/'+route);
  const card=page.locator('.cp-chapter-collection').first();await card.waitFor();await page.keyboard.press('Tab');await card.focus();
  const keyboard=await card.evaluate(e=>({visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle}));assert(keyboard.visible);assert.notEqual(keyboard.outline,'none');
  await page.mouse.click(1,1);await card.scrollIntoViewIfNeeded();const box=await card.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  const pointer=await card.evaluate(e=>getComputedStyle(e).outlineStyle);assert.equal(pointer,'none');await page.mouse.up();checks.push({engine,width,keyboardOutline:keyboard.outline,pointerOutline:pointer});await page.close();
 }}finally{await browser.close();}
}
writeFileSync('../focus-checks/results/collection-checks.json',JSON.stringify(checks,null,2)+'\n');console.log('PASS four collection-card keyboard and mouse focus checks.');
