import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import {chapterHash} from '../../lib/practice-chapters.ts';
const root='docs/self-writing-ab-ready10-20261104',m=JSON.parse(readFileSync(root+'/manifest.json')),browser=await chromium.launch({channel:'chrome',headless:true});
try {for(const width of [390,1280]){const page=await browser.newPage({viewport:{width,height:844}});await page.goto('http://127.0.0.1:19112/'+chapterHash({chapter:'writing',activity:'write',collection:m.row.id,level:'alfa-b',help:'practice'}));await page.locator('[data-source-writing-text]').waitFor();await page.waitForTimeout(500);await page.screenshot({path:root+'/local/opening-'+width+'.png',fullPage:true});await page.close();}}finally{await browser.close();}
writeFileSync(root+'/local/opening.json',JSON.stringify({screens:[390,1280],purpose:'Visual inspection of current situation instruction before typing; no answer-flow retest'})+'\n');
