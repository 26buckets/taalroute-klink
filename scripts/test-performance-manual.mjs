import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:19120';
const out=process.env.KLINK_MANUAL_OUTPUT||'docs/performance-publication-20261104/local';
mkdirSync(out,{recursive:true});const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  try{for(const width of [1280,390]){
    const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/docenten#hoofdstuk-5');
    await page.waitForURL('**/docenten/hoofdstuk-5');
    await page.getByRole('heading',{name:'Een oefenblok met mat',exact:true}).waitFor();
    assert.equal(await page.locator('.wiki-article').count(),1);
    await page.getByRole('navigation',{name:'Verder in de handleiding'}).getByRole('link',{name:/Volgend onderwerp/}).click();
    await page.getByRole('heading',{name:'Individueel en samen oefenen',exact:true}).waitFor();
    await page.goBack();await page.getByRole('heading',{name:'Een oefenblok met mat',exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    checks.push({engine,width,legacyRedirect:true,nextAndBack:true,noOverflow:true});await context.close();
  }}finally{await browser.close();}
}
writeFileSync(out+'/manual.json',JSON.stringify({base,checks,errors},null,2)+'\n');
assert.deepEqual(errors,[]);assert.equal(checks.length,4);console.log('PASS four current manual bookmark/navigation flows');
