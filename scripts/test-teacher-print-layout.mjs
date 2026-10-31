import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_URL||'http://127.0.0.1:18981',out=process.env.KLINK_DOCENT_OUTPUT||'outputs/docent-vormgeving-20261031';
fs.mkdirSync(out,{recursive:true});const checks=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
  for(const route of ['a','b','c']){
   for(const material of ['answers','letters','observation']){
    const page=await browser.newPage();await page.goto(base+`/#teacher/materials?lesson=mat&round=${route}`);
    await page.locator('.kpd-worksheet-previews').waitFor();
    await page.evaluate(() => { window.print = () => {}; });
    if (material === 'answers') {
      await page.getByText('Antwoorden voor de docent', { exact: true }).click();
      await page.getByRole('button', { name: 'Print antwoorden', exact: true }).click();
    } else {
      await page.getByText('Extra materiaal', { exact: true }).click();
      await page.getByLabel('Extra materiaal', { exact: true }).selectOption(material);
      await page.getByRole('button', { name: 'Print extra materiaal', exact: true }).click();
    }
    await page.emulateMedia({media:'print'});
    assert(await page.locator('.kpd-print-page:visible').isVisible());
    assert(await page.locator('.kpd-print-page:visible').evaluate(el=>{
     for(let n=el.parentElement;n;n=n.parentElement){const s=getComputedStyle(n);if(['hidden','clip','auto'].includes(s.overflow)||s.position==='fixed')return false;}return true;
    }),`print clipped: ${engine} ${route} ${material}`);
    await page.locator('.kpd-print-page:visible img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    if(engine==='chromium'&&material==='answers')await page.pdf({path:`${out}/print-${route}.pdf`,preferCSSPageSize:true});
    checks.push({engine,route,material});await page.close();
   }
  }
 }finally{await browser.close();}
}
fs.writeFileSync(out+'/print-checks.json',JSON.stringify(checks,null,2));console.log('PASS',checks.length,'print layouts with unclipped containers and decoded images');
