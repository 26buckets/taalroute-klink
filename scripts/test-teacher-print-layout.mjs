import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_URL||'http://127.0.0.1:18981',out=process.env.KLINK_DOCENT_OUTPUT||'outputs/docent-vormgeving-20261031';
fs.mkdirSync(out,{recursive:true});const checks=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
  for(const route of ['a','b','c']){
    const page=await browser.newPage();await page.goto(base+`/#teacher/materials?lesson=mat&round=${route}`);
    await page.locator('.kpd-worksheet-previews').waitFor();
    await page.evaluate(() => { window.print = () => {}; });
    assert.equal(await page.getByText('Extra materiaal', {exact:true}).count(),0);
    assert.equal(await page.getByLabel('Docentobservatie', {exact:true}).count(),0);
    await page.getByText('Antwoorden voor de docent', { exact: true }).click();
    assert.equal(await page.locator('.kpd-answers-print li').count(),10);
    await page.getByRole('button', { name: 'Print antwoorden', exact: true }).click();
    await page.emulateMedia({media:'print'});
    assert(await page.locator('.kpd-print-page:visible').isVisible());
    assert(await page.locator('.kpd-print-page:visible').evaluate(el=>{
     for(let n=el.parentElement;n;n=n.parentElement){const s=getComputedStyle(n);if(['hidden','clip','auto'].includes(s.overflow)||s.position==='fixed')return false;}return true;
    }),`print clipped: ${engine} ${route} answers`);
    await page.locator('.kpd-print-page:visible img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    if(engine==='chromium')await page.pdf({path:`${out}/print-${route}.pdf`,preferCSSPageSize:true});
    checks.push({engine,route,material:'answers'});await page.close();
  }
 }finally{await browser.close();}
}
fs.writeFileSync(out+'/print-checks.json',JSON.stringify(checks,null,2));console.log('PASS',checks.length,'print layouts with unclipped containers and decoded images');
