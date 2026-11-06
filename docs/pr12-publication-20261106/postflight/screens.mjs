import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const out='outputs/pr12-live-20261106'; const browser=await chromium.launch(); const checks=[];
try {
 for(const width of [1280,390])for(const portal of ['learner','teacher/plus']) {
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://klink.taalroute.nl/#'+portal); await page.locator(portal==='learner'?'.cp-home':'.kpd-lesson-choice').first().waitFor(); await page.locator('.klink-opening-loader').waitFor({state:'detached'}); await page.evaluate(()=>document.fonts.ready);
 const id=portal.replace('/','-')+'-'+width; await page.screenshot({path:out+'/'+id+'.png',fullPage:true});
 if(portal==='learner'){await page.locator('[data-chapter="words"]').click();await page.locator('[data-chapter-activity="meet"]').click();await page.locator('[data-collection]').first().click();await page.locator('[data-exercise-id]').waitFor();}else{await page.getByRole('button',{name:'Les openen: mat',exact:true}).click();await page.locator('.kpd-big-word').waitFor();}
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await page.screenshot({path:out+'/'+id+'-exercise.png',fullPage:true});checks.push({portal,width,errors});await page.close();
 }
 const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('https://inzicht.taalroute.nl/');await page.getByRole('button',{name:'Inloggen',exact:true}).waitFor();await page.screenshot({path:out+'/inzicht.png',fullPage:true});checks.push({portal:'inzicht',title:await page.title(),loginVisible:true});await page.close();
}finally{await browser.close();writeFileSync(out+'/screens.json',JSON.stringify(checks,null,2)+'\n')}
if(checks.some(c=>c.errors?.length))throw Error('Live page errors');
console.log('PASS visible live pages',checks.length);
