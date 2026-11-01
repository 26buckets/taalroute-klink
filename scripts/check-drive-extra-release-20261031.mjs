import assert from 'node:assert/strict';
import { verifyImageSizeRelease, readBeforeImageSize } from './check-image-size-release-20261031.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {wordRoundActivities,wordRoundDefinitions} from '../lib/word-rounds.ts';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyExtraImagePreservation(read=readFileSync){
 const m=JSON.parse(read('docs/drive-images-extra-20261031/media.json')),before=f=>JSON.parse(git('show',m.baselineSourceCommit+':'+f)),json=f=>JSON.parse(read(f));
 assert.equal(m.assets.length,107);assert.equal(new Set(m.assets.map(a=>a.word)).size,107);
 const map=new Map(m.assets.map(a=>[a.previousUrl,a.url]));assert.equal(map.size,107);
 const replace=x=>Array.isArray(x)?x.map(replace):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='placeholderWord'||!map.has(x.src)).map(([k,v])=>[k,k==='src'&&map.has(v)?map.get(v):replace(v)])):x;
 const placeholders=x=>Array.isArray(x)?x.flatMap(placeholders):x&&typeof x==='object'?[...(x.placeholderWord?[x.placeholderWord]:[]),...Object.values(x).flatMap(placeholders)]:[];
 const old=before('data/klink-production-index.json'),idx=json('data/klink-production-index.json'),aliases=json('data/klink-progress-image-aliases-20261030.json'),priorAliases=before('data/klink-progress-image-aliases-20261030.json');
 assert.equal(idx.length,old.length);assert.equal(idx.reduce((n,r)=>n+r.count,0),old.reduce((n,r)=>n+r.count,0));
 const changed=[];
 for(const [i,r]of idx.entries()){
  const b=old[i];assert.deepEqual({...r,url:b.url,image:b.image,placeholderCount:b.placeholderCount},{...b,placeholderCount:b.placeholderCount});
  assert.equal(r.image,map.get(b.image)||b.image);
  const source=json('public'+b.url),actual=json('public'+r.url);assert.deepEqual(actual,replace(source),r.id);
  if(r.url!==b.url){changed.push(r.id);assert.equal(aliases[r.url],priorAliases[b.url]||b.url);if('placeholderCount'in r)assert.equal(r.placeholderCount,new Set(placeholders(actual)).size);}
 }
 assert.deepEqual(changed,m.collections.map(c=>c.id));
 for(const [k,v]of Object.entries(priorAliases))assert.equal(aliases[k],v);
 const reg=json('docs/placeholders-20261030/registry.json'),prior=before('docs/placeholders-20261030/registry.json');
 assert.deepEqual(reg.words,prior.words.map(w=>map.has(w.image)?{...w,image:map.get(w.image),status:'bestaande-afbeelding'}:w));
 assert.equal(reg.words.filter(w=>w.status==='placeholder').length,54);assert.deepEqual(reg.collections,idx.filter(r=>r.id.startsWith('beta-images:')));
 for(const a of m.assets){const w=reg.words.find(w=>w.word===a.word);for(const list of w.lists){const code=list.sourceId.replace(/_[^_]+$/,'');assert.equal(reg.words.filter(other=>other.image===a.url&&other.lists.some(l=>l.sourceId.replace(/_[^_]+$/,'')===code)).length,1,'Distinct image within '+code+': '+a.word);}}
 const rounds=Object.fromEntries(idx.filter(r=>wordRoundActivities.has(r.activity)).flatMap(r=>{const a=wordRoundDefinitions(json('public'+r.url).exercises);return a.length?[[r.url,a]]:[];}));assert.deepEqual(json('data/klink-word-round-index.json'),rounds);
 for(const a of m.assets){assert.equal(sha(read('public'+a.url)),a.sha256);assert(a.bytes<128000);assert(a.handsReviewed&&a.meaningReviewed&&a.observerReviewed&&a.compactReviewed);assert(!a.humanApproval);}
 for(const c of m.collections)assert.equal(sha(read('public'+c.url)),c.sha256);
 // Check this historical image release through its approved successor; later releases verify their own exact deltas.
 assert.equal(git('diff','--name-only','--diff-filter=MD',m.baselineSourceCommit,'b368996ce81590ddfa0afee1d5d488e415c9f58c','--','public').length,0,'No existing public asset was overwritten within the approved image release');
 return m;
}
export function verifyExtraImagesRelease(read=readFileSync){
 const successor=verifyImageSizeRelease(read),currentRead=read;read=file=>readBeforeImageSize(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-drive-extra-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.generateImages,false);
 assert.equal(r.userRequest,'Oké. Er staan op de Google Drive weer heel veel nieuwe afbeeldingen. Zorg dat deze gekoppeld worden, zo klein mogelijk formaat natuurlijk, en zet alles online.');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','data/klink-word-round-index.json','scripts/check-keyboard-consistency-release-20261031.mjs','scripts/check-drive-extra-release-20261031.mjs','scripts/test-drive-extra-20261031.mjs','scripts/test-drive-images-browser-20261031.mjs'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/package-media\/klink-drive-extra-20261031\/[a-z]+-[a-f0-9]{10}\.webp$/.test(f)||/^public\/practice-content\/klink-20261029\/[A-Za-z0-9_-]+-drive-extra-[a-f0-9]{16}\.json$/.test(f)));
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const f of changed)assert(r.files[f]);
 const m=verifyExtraImagePreservation(read);assert.equal(m.baselineSourceCommit,r.baselineSourceCommit);assert.equal(new Set(m.assets.map(a=>a.url)).size,107);
 const review=JSON.parse(read('docs/drive-images-extra-20261031/review.json'));for(const k of ['images','hands','compact','content','answers','progress','browser','build','types','scopedLint','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/drive-images-extra-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeExtraImages(file,r,read=readFileSync){return r.changedFiles.includes(file)||r.historicalFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeImageSize(file,r.successor,read);}
