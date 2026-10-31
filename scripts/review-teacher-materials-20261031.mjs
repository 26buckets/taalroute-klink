import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {classroomLessons} from '../lib/teacher-classroom.ts';
const out='outputs/werkbladen-review-20261031';mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:18981/#teacher/materials');
 await page.getByLabel('Les',{exact:true}).waitFor();
 await page.screenshot({path:out+'/huidig-overzicht.png',fullPage:true});
 await page.locator('summary').filter({hasText:'Werkbladen printen'}).click();
 for(const lesson of classroomLessons){
  await page.getByLabel('Les',{exact:true}).selectOption(lesson.id);
  for(const route of ['a','b','c'])for(const variant of ['support','basic','extend']){
   await page.locator(`input[name="route"][value="${route}"]`).check();
   await page.locator(`input[name="variant"][value="${variant}"]`).check();
   const sheet=page.locator('[aria-label="Werkblad"]');const html=await sheet.innerHTML();const text=await sheet.innerText();
   checks.push({lesson:lesson.id,route,variant,hash:createHash('sha256').update(html).digest('hex'),text});
   if(lesson.id==='mat'&&variant==='basic'){
    await sheet.screenshot({path:`${out}/huidig-mat-${route}.png`});
    await page.pdf({path:`${out}/huidig-mat-${route}.pdf`,format:'A4',printBackground:true,preferCSSPageSize:true});
   }
  }
 }
 const material=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Werkbladen printen'})});
 await material.locator('select').selectOption('letters');checks.push({kind:'cards',text:await page.locator('.kpd-worksheet').innerText()});
 await material.locator('select').selectOption('observation');checks.push({kind:'observation',text:await page.locator('.kpd-worksheet').innerText()});
 await page.getByLabel('Les',{exact:true}).selectOption('tas');await page.reload();
 const afterReload=await page.getByLabel('Les',{exact:true}).inputValue();
 await page.goto('http://127.0.0.1:18981/#teacher/materials?lesson=tas');await page.reload();
 await page.getByLabel('Les',{exact:true}).waitFor({timeout:3000}).catch(()=>{});
 const deepLink=await page.getByLabel('Les',{exact:true}).count() ? await page.getByLabel('Les',{exact:true}).inputValue() : 'werkbladenpagina niet geopend';
 writeFileSync(out+'/app-review.json',JSON.stringify({checks,errors,afterReload,deepLink},null,2));
 console.log(JSON.stringify({checks:checks.length,errors,afterReload,deepLink,identicalBasicExtend:classroomLessons.flatMap(l=>['b','c'].filter(r=>checks.find(x=>x.lesson===l.id&&x.route===r&&x.variant==='basic').hash===checks.find(x=>x.lesson===l.id&&x.route===r&&x.variant==='extend').hash).map(r=>l.id+'/'+r))}));
}finally{await browser.close();}
