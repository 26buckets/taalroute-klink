import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=f=>JSON.parse(readFileSync(f)),sha=b=>createHash('sha256').update(b).digest('hex'),report=read('docs/archive-continuation-20261030/media.json'),baseline=f=>JSON.parse(execFileSync('git',['show',`${report.baselineSourceCommit}:${f}`],{maxBuffer:128e6}));
const old=baseline('data/klink-production-index.json'),index=read('data/klink-production-index.json'),aliases=read('data/klink-progress-image-aliases-20261030.json'),oldAliases=baseline('data/klink-progress-image-aliases-20261030.json'),mapping=new Map(report.assets.map(a=>[a.previousUrl,a.url]));
const replace=x=>{if(Array.isArray(x))return x.map(replace);if(x&&typeof x==='object'){const y=Object.fromEntries(Object.entries(x).map(([k,v])=>[k,replace(v)]));if(mapping.has(y.src)){y.src=mapping.get(y.src);delete y.placeholderWord;}return y;}return x;};
assert.equal(index.length,1462);assert.equal(index.reduce((n,r)=>n+r.count,0),59532);
for(const [i,before]of old.entries()){const row=index[i];assert.deepEqual({...row,url:before.url,placeholderCount:before.placeholderCount},before.placeholderCount===undefined?{...before,placeholderCount:undefined}:before);assert.deepEqual(read('public'+row.url),replace(read('public'+before.url)),row.id);if(row.url!==before.url)assert.equal(aliases[row.url],oldAliases[before.url]||before.url);}
for(const[k,v]of Object.entries(oldAliases))assert.equal(aliases[k],v);
const registry=read('docs/placeholders-20261030/registry.json'),oldRegistry=baseline('docs/placeholders-20261030/registry.json');assert.equal(registry.words.filter(w=>w.status==='placeholder').length,239);
for(const [i,w]of registry.words.entries()){const oldWord=oldRegistry.words[i],asset=report.assets.find(a=>a.word===w.word);assert.deepEqual(w,asset?{...oldWord,image:asset.url,status:'bestaande-afbeelding'}:oldWord);}
assert.deepEqual(registry.collections,index.filter(r=>r.id.startsWith('beta-images:')));
for(const row of registry.collections){const prefix=row.id.split(':').at(-1);assert.equal(row.placeholderCount,registry.words.filter(w=>w.status==='placeholder'&&w.lists.some(l=>l.sourceId.startsWith(prefix+'_'))).length,row.id);}
for(const a of report.assets){assert.equal(sha(readFileSync('public'+a.url)),a.sha256);assert(a.bytes<140000);assert(a.handsReviewed&&a.meaningReviewed&&a.observerReviewed&&!a.ownerRejectionFound);}
assert.equal(execFileSync('git',['diff','--name-only','--diff-filter=MD',report.baselineSourceCommit,'--','public']).length,0);
const result={existingExercisePlacementsPreserved:59532,images:29,remainingPlaceholders:239,contentAndAnswersPreserved:true,progressPreserved:true,immutableAssets:true,localOnly:true};writeFileSync('docs/archive-continuation-20261030/preservation.json',JSON.stringify(result,null,2));console.log(result);
