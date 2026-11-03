import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const folder='docs/writing-forms-20261102/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out,{recursive:true});
const json=p=>JSON.parse(readFileSync(p)),manifest=json(folder+'import-manifest.json'),delivery=manifest.deliveryBundle,rounds=[],failures=[],legacy=[],errors=[];
const url=row=>base+'/'+chapterHash({chapter:'writing',activity:row.activity,collection:row.id,level:row.level,help:row.help});
const original=json('data/klink-production-index.json').find(row=>row.activity==='copy'&&!row.bundleUrl&&row.url.startsWith('/practice-content/klink-writing-20261101/'));assert(original);
const response=await fetch(base+delivery.src);assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),delivery.sha256);assert.equal(bytes.length,delivery.bytes);
const bundle=JSON.parse(bytes);for(const{row,sha256}of manifest.newRows){const body=Buffer.from(bundle.banks[row.id]);assert(body.equals(readFileSync('public'+row.url)));assert.equal(createHash('sha256').update(body).digest('hex'),sha256);}
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),requests=[];page.on('pageerror',e=>errors.push({engine,message:e.message}));page.on('request',r=>requests.push(new URL(r.url()).pathname));
  await context.route('**/practice-content/klink-forms-20261102/**',route=>route.abort());
  for(const{row,sourceIds}of manifest.newRows){await page.goto(url(row));const form=page.locator(`[data-writing-form-source="${sourceIds[0]}"]`);await form.waitFor();assert.deepEqual(await form.locator('input').evaluateAll(xs=>xs.map(x=>x.value)),JSON.parse(bundle.banks[row.id]).exercises[0].fields.map(()=>''));rounds.push({engine,round:row.id,firstSourceId:sourceIds[0],originalBankSha256:createHash('sha256').update(bundle.banks[row.id]).digest('hex'),nativeRoundOpened:true});}
  assert(requests.includes(delivery.src));assert(!requests.some(src=>src.startsWith('/practice-content/klink-forms-20261102/')));
  await page.goto(url(original));const legacyId=json('public'+original.url).exercises[0].exerciseId;await page.locator(`[data-exercise-id="${legacyId}"]`).waitFor();assert(requests.includes(original.url));legacy.push({engine,existingBank:original.url,sourceId:legacyId,directAssetStillLoaded:true});await context.close();
  const retryContext=await browser.newContext(),retry=await retryContext.newPage();await retryContext.route('**'+delivery.src,route=>route.fulfill({status:503,body:'test temporarily unavailable'}));const first=manifest.newRows[0];await retry.goto(url(first.row));await retry.getByText('Deze oefening kon niet worden geladen.',{exact:true}).waitFor();assert.equal(await retry.locator('[data-writing-form-source]').count(),0);await retryContext.unroute('**'+delivery.src);await retry.getByRole('button',{name:'Probeer opnieuw',exact:true}).click();await retry.locator(`[data-writing-form-source="${first.sourceIds[0]}"]`).waitFor();failures.push({engine,missingBundleShowsHonestError:true,retryRestoresSameSourceRound:true});await retryContext.close();
 }finally{await browser.close();}
}}finally{writeFileSync(out+'/bundle.json',JSON.stringify({base,bundle:delivery.src,sha256:delivery.sha256,exactOriginalBankBytes:true,legacyDirectAssetPreserved:legacy.length===2,rounds,legacy,failures,errors,actualNetworkContentUsed:true},null,2)+'\n');}
assert.equal(rounds.length,42);assert.equal(failures.length,2);assert.equal(legacy.length,2);assert.deepEqual(errors,[]);console.log('Passed42 round loads from one byte-exact bundle, two existing direct banks and two bundle-error/retry flows.');
