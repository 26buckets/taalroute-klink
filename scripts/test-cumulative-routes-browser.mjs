import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {importedActivities} from '../lib/imported-practice.ts';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1366,height:950},hasTouch:true});const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18830';const checks=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
const out=process.env.KLINK_TEST_OUTPUT||'outputs/cumulative-integration-20261018';mkdirSync(out,{recursive:true});
const geometryChecks=[];
async function checkControls(label) {
 for (const control of await page.locator('.cp-teacher-workflow button:visible, .cp-teacher-workflow textarea:visible, .cp-teacher-workflow select:visible, .cp-exercise-feedback > button:visible').all()) {
  await control.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  const result=await control.evaluate(node=>{
   const r=node.getBoundingClientRect(), footer=document.querySelector('.cp-exercise-feedback');
   const intersect=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+0.5&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+0.5;
   const blockedByFooter=!footer.contains(node)&&intersect(r,footer.getBoundingClientRect());
   const points=[r.left+3,r.right-3], rows=[r.top+3,r.bottom-3];
   for(let x=r.left+3;x<r.right-3;x+=8)points.push(x);
   for(let y=r.top+3;y<r.bottom-3;y+=8)rows.push(y);
   const covered=[];
   for(const x of points)for(const y of rows){
    const target=document.elementFromPoint(x,y);
    if(!node.contains(target)){covered.push({x,y,by:target?.className});if(covered.length===3)break;}
   }
   return {text:node.textContent||node.tagName,width:r.width,height:r.height,blockedByFooter,covered:covered.slice(0,3)};
  });
  assert(result.width>=47.5&&result.height>=47.5,JSON.stringify({label,result}));
  assert(!result.blockedByFooter,JSON.stringify({label,result}));
  assert.deepEqual(result.covered,[],JSON.stringify({label,result}));
 }
 geometryChecks.push(label);
}
async function checkScrollPositions(label) {
 for(const fraction of [0,0.5,1]){
  const layout=await page.evaluate(fraction=>{
   const main=document.querySelector('.learner-main'),stage=document.querySelector('.cp-exercise-stage'),card=document.querySelector('.cp-teacher-workflow'),footer=document.querySelector('.cp-exercise-feedback');
   for(const node of [document.scrollingElement,main,stage])node.scrollTop=(node.scrollHeight-node.clientHeight)*fraction;
   const r=stage.getBoundingClientRect(),c=card.getBoundingClientRect(),f=footer.getBoundingClientRect();
   return {horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,stageBottom:r.bottom,cardBottom:c.bottom,footerTop:f.top,overflow:getComputedStyle(stage).overflowY};
  },fraction);
  assert(!layout.horizontalOverflow,JSON.stringify({label,fraction,layout}));
  assert(layout.stageBottom<=layout.footerTop+1,JSON.stringify({label,fraction,layout}));
  if(layout.overflow==='visible')assert(layout.cardBottom<=layout.footerTop+1,JSON.stringify({label,fraction,layout}));
 }
 geometryChecks.push(`${label}: start, midden en einde`);
}
try{
for(const route of importedActivities){const collection=chapterCollections(route.id)[0];await page.goto(base+'/'+chapterHash({chapter:route.chapter,activity:route.id,collection:collection.id,level:collection.level}));await page.locator('[data-teacher-workflow], [data-content-player]').waitFor();assert.equal(await page.locator('.learner-nav nav button').count(),5);assert.equal(await page.locator('.cp-workflow-source').count(),0);assert(await page.getByRole('button',{name:await page.locator('.cp-guided-start').count()?'Begin samen':'De cursist kijkt niet mee',exact:true}).isVisible());const url=page.url();await page.reload();await page.locator('[data-teacher-workflow], [data-content-player]').waitFor();assert.equal(page.url(),url);checks.push(`${route.domain}: echte catalogusroute, besloten voorbereiding en herladen.`);}
for(const [literacy,language]of[['alfa-c','all'],['all','b1']]){await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();await page.evaluate(({literacy,language})=>localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy,language,pictures:'always'})),{literacy,language});await page.reload();await page.locator('.cp-home').waitFor();await page.locator('.cp-home-route > summary').click();await page.getByRole('button',{name:'Bekijk mijn oefeningen'}).click();assert(new URL(page.url()).hash.includes(`level=${literacy==='all'?language:literacy}`));await page.locator('.cp-practice-entry').getByRole('button',{name:/Met je docent/}).click();const activities=page.locator('[data-chapter-activity]:enabled');if(await activities.count())await activities.last().click();await page.locator('[data-collection]').first().waitFor();assert(await page.locator('[data-collection]').count()>0);await page.locator('[data-collection]').first().click();await page.locator('[data-exercise-id]').waitFor();checks.push(`${literacy==='all'?language:literacy}: aanbod vanaf start bereikbaar zonder terugval naar een lager niveau.`);}
await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();await page.evaluate(()=>localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy:'all',language:'all',pictures:'always'})));await page.reload();await page.locator('.cp-photo-section').first().click();await page.locator('.cp-tabs').getByRole('button',{name:'Gebruiken',exact:true}).click();await page.getByRole('button',{name:'Oefenen met zinnen en situaties',exact:true}).click();await page.locator('[data-activity="content-woordpakketten"]').click();await page.locator('[data-teacher-workflow]').waitFor();assert(!(await page.locator('.cp-step-scope').isVisible()));assert(!(await page.locator('.cp-player-bar strong').isVisible()));await page.getByText('Opdracht en voorbereiding',{exact:true}).click();await page.getByRole('button',{name:'De cursist kijkt niet mee'}).click();await page.getByRole('button',{name:'Begin samen',exact:true}).click();checks.push('Bestaande eerste lijst: nieuwe woordopdrachten bij Gebruiken; omliggende woordkeuze en titel lekken geen verborgen model.');
for(const [width,height]of[[320,480],[568,320],[844,390],[390,844],[768,1024],[1366,950]]){
 await page.setViewportSize({width,height});
 await checkScrollPositions(`${width}x${height}`);
 await checkControls(`${width}x${height}: nog niet ingevuld`);
 await page.getByRole('textbox',{name:/Docentnotitie/}).fill('De eerste respons is vastgelegd.');
 const performed=page.getByRole('button',{name:'Ik heb deze stap uitgevoerd',exact:true});
 if(await performed.count())await performed.click();
 await checkControls(`${width}x${height}: ingevuld`);
 await page.locator('.cp-exercise-feedback').evaluate(node=>node.scrollIntoView({block:'end',behavior:'instant'}));
 await page.screenshot({path:`${out}/real-list-${width}x${height}.png`,fullPage:false});
}
await page.setViewportSize({width:320,height:480});
await page.getByRole('button',{name:'Samen bekijken',exact:true}).click();
await checkControls('320x480: besloten docentweergave');
await page.getByRole('button',{name:'De cursist kijkt niet mee'}).click();
await checkScrollPositions('320x480: docentbeoordeling');
await checkControls('320x480: waarnemingen');
for(const input of await page.locator('.cp-observation select').all())await input.selectOption('Nog oefenen');
await page.getByRole('button',{name:'Waarnemingen vastleggen'}).click();
await checkControls('320x480: afgerond');
assert(await page.locator('.cp-exercise-feedback > button').isEnabled());
await page.locator('.cp-exercise-feedback > button').click();
await page.getByRole('button',{name:'Begin samen',exact:true}).waitFor();
checks.push('Werkelijke lijst: volledige knopvlakken en invulvelden, start/midden/einde, kleine/liggende/gewone schermen en doorklikken naar volgende opdracht.');
assert.deepEqual(errors,[]);writeFileSync(`${out}/routes-browser-checks.json`,JSON.stringify({checks,geometryChecks,errors},null,2));console.log(checks.join('\n'));
}finally{await browser.close();}
