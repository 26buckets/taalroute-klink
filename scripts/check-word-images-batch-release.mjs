import {verifyHiddenB2Release,readBeforeHiddenB2} from './check-hidden-b2-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
const root='docs/word-images-batch-20261030/';
export function verifyWordImagePreservation(read=readFileSync){
 const media=JSON.parse(read(root+'media.json')),before=f=>JSON.parse(git('show',media.baselineSourceCommit+':'+f)),json=f=>JSON.parse(read(f));
 assert.equal(media.assets.length,7);assert.deepEqual(media.assets.map(a=>a.word).sort(),['geboortedatum','gisteren','lezen','moe','morgen','rekeningnummer','verlof']);
 const mapping=new Map(media.assets.map(a=>[a.previousUrl,a.url]));assert.equal(new Set(mapping.values()).size,7);
 const replace=x=>Array.isArray(x)?x.map(replace):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='placeholderWord'||!mapping.has(x.src)).map(([k,v])=>[k,k==='src'&&mapping.has(v)?mapping.get(v):replace(v)])):x;
 const placeholders=x=>Array.isArray(x)?x.flatMap(placeholders):x&&typeof x==='object'?[...(x.placeholderWord?[x.placeholderWord]:[]),...Object.values(x).flatMap(placeholders)]:[];
 const old=before('data/klink-production-index.json'),index=json('data/klink-production-index.json'),aliases=json('data/klink-progress-image-aliases-20261030.json'),oldAliases=before('data/klink-progress-image-aliases-20261030.json');
 assert.equal(index.length,old.length);assert.equal(index.reduce((n,r)=>n+r.count,0),59532);
 for(const [i,row]of index.entries()){
  const b=old[i];assert.deepEqual({...row,url:b.url,placeholderCount:b.placeholderCount},{...b,placeholderCount:b.placeholderCount});
  const expected=replace(json('public'+b.url)),actual=json('public'+row.url);assert.deepEqual(actual,expected,row.id);
  if(row.url!==b.url){assert.equal(aliases[row.url],oldAliases[b.url]||b.url);if('placeholderCount'in row)assert.equal(row.placeholderCount,new Set(placeholders(actual)).size);}
 }
 for(const[k,v]of Object.entries(oldAliases))assert.equal(aliases[k],v);
 const reg=json('docs/placeholders-20261030/registry.json'),prior=before('docs/placeholders-20261030/registry.json');
 assert.deepEqual(reg.words,prior.words.map(w=>mapping.has(w.image)?{...w,image:mapping.get(w.image),status:'bestaande-afbeelding'}:w));
 assert.equal(reg.words.filter(w=>w.status==='placeholder').length,232);assert.deepEqual(reg.collections,index.filter(r=>r.id.startsWith('beta-images:')));
 for(const a of media.assets){assert.equal(sha(read('public'+a.url)),a.sha256);assert(a.bytes<50000);assert(a.handsReviewed&&a.meaningReviewed&&a.observerReviewed);assert(!media.excluded.some(e=>e.sourceSha256===a.sourceSha256||e.word===a.word));}
 assert.equal(git('diff','--name-only','--diff-filter=MD',media.baselineSourceCommit,'beff2e25e378a9fa723bc64831d1e96853d11113','--','public').length,0,'Existing public assets remain immutable within this image release');
 return media;
}
export function verifyWordImagesBatchRelease(read=readFileSync){
 const successor=verifyHiddenB2Release(read),currentRead=read;read=file=>readBeforeHiddenB2(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-word-images-batch-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.generateImages,false);assert(r.userRequest.includes('online'));assert.equal(r.ownerExcludedWord,'tandarts');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','scripts/check-direct-navigation-release.mjs','scripts/check-word-images-batch-release.mjs','scripts/test-word-images-batch-20261030.mjs','scripts/test-word-images-batch-browser-20261030.mjs'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/package-media\/klink-beeldchat-20261030\/[a-z]+-[a-f0-9]{10}\.webp$/.test(f)||/^public\/practice-content\/klink-20261029\/beeldchat-[A-Za-z0-9_-]+\.json$/.test(f)));
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const f of changed)assert(r.files[f],f);
 const media=verifyWordImagePreservation(read);assert.equal(media.baselineSourceCommit,r.baselineSourceCommit);assert.equal(sha(read(root+'media.json')),r.mediaSha256);
 const review=JSON.parse(read(root+'review.json'));for(const k of ['images','hands','content','answers','progress','browser','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(root+'backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeWordImagesBatch(file,r,read=readFileSync){return r.changedFiles.includes(file)||r.historicalFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeHiddenB2(file,r.successor,read);}
