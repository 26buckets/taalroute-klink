import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const folder='/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-twijfelgevallen-herstel-20261030';
const browser=await chromium.launch({headless:true});const checks=[];
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+folder+'/Klink-62-twijfelgevallen-hersteld.html');
  assert.equal(await page.locator('#cases article').count(),62);
  await page.locator('#kind').selectOption('changed');assert.equal(await page.locator('#cases article').count(),14);assert.equal(await page.locator('audio').count(),14);
  await page.locator('#search').fill('maximum');assert.equal(await page.locator('#cases article').count(),3);
  await page.locator('#search').fill('');await page.locator('#kind').selectOption('retained');assert.equal(await page.locator('#cases article').count(),48);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('#kind').selectOption('all');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:folder+'/overzicht-'+width+'.png'});
  assert.deepEqual(errors,[]);checks.push({width,all:62,changed:14,retained:48,maximumRepairs:3,overflow:false,errors});await page.close();
 }
}finally{await browser.close();}
writeFileSync('docs/sentence-second-review-20261030/report-check.json',JSON.stringify(checks,null,2)+'\n');console.log('Report filters, 62 cases, 14 recordings and mobile layout passed');
