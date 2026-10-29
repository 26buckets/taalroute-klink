import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {teacherGroups,teacherTasks} from '../lib/alfa-c-docent.ts';
const base=process.env.KLINK_TEST_URL||'http://localhost:18929',out=process.env.KLINK_LAYOUT_OUTPUT||'outputs/teacher-card-layout-20261029';mkdirSync(out,{recursive:true});const checks=[];
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{
  for(const width of [1366,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.goto(base+'/#learner/chapters?level=alfa-c&help=guided');
   const section=page.getByRole('region',{name:'Opdrachten met je docent'});await section.waitFor();
   assert.equal(await section.getByRole('heading',{name:'Opdrachten met je docent'}).count(),1);
   const cards=section.getByRole('link');assert.equal(await cards.count(),teacherGroups.length);
   for(let i=0;i<teacherGroups.length;i++){
    const g=teacherGroups[i],card=cards.nth(i),n=teacherTasks.filter(t=>t.group===g.id).length;
    assert.equal(await card.locator('strong').innerText(),g.title);
    assert.equal(await card.locator('small').innerText(),`${n} ${n===1?'opdracht':'opdrachten'}`);
    assert.equal(await card.getAttribute('href'),`#learner/alfa-c/docent-${g.id}`);
    assert(await card.evaluate(el=>{const t=el.querySelector('strong').getBoundingClientRect(),d=el.querySelector('small').getBoundingClientRect();return d.top>=t.bottom&&el.scrollWidth<=el.clientWidth+1;}));
   }
   assert(await section.evaluate(el=>{const previous=el.previousElementSibling.getBoundingClientRect(),heading=el.querySelector('h2').getBoundingClientRect();return heading.top-previous.bottom>=20;}));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await section.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});
   for(let i=0;i<teacherGroups.length;i++){
    await cards.nth(i).click();await page.locator('.ac-docent').waitFor();await page.goBack();await section.waitFor();
   }
   checks.push({browser:name,width,cards:teacherGroups.length,heading:true,separateLabels:true,linksAndHistory:true});await page.close();
  }
 }finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({checks},null,2)+'\n');console.log('PASS',checks.length,'teacher card layouts, headings and all five links');
