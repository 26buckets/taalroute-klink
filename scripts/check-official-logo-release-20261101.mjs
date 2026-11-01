import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='9d231b1d9cced59374d3ab4d56083f6881c0b3e8';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyOfficialLogoRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-official-logo-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);
 assert(r.userRequest.includes('officiële Klink-logo')&&r.userRequest.includes('Publiceer alleen deze wijziging'));
 git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const f of changed)assert.equal(createHash('sha256').update(read(f)).digest('hex'),r.files[f],f);
 assert.equal(git('diff',base,'--','components','hooks','data','lib','db','drizzle','.github','package.json','package-lock.json','vite.config.ts',':(exclude)data/klink-compact-images-20261031.json',':(exclude)data/klink-image-preparation.json').length,0,'Keep application functions, content, audio, storage and dependencies');
 const runtime=changed.filter(f=>f.startsWith('public/')||f.startsWith('app/'));
 assert.deepEqual(runtime,sort(['app/layout.tsx','public/app-icon.svg','public/favicon.ico','public/favicon.svg','public/klink-logo.svg','public/klink-wordmark.svg','public/klink-wordmark-dark.svg','public/taalroute-menu/klink.svg','public/taalroute-menu/klink-dark.svg','public/taalroute-menu/klink-share-logo-20261101.png','public/taalroute-menu/menu-controls.js','public/compact-images-20261031/a154d8827ca7aa16a31a.webp']));
 const oldLayout=git('show',base+':app/layout.tsx').toString();
 assert.equal(read('app/layout.tsx').toString(),oldLayout.replaceAll('/favicon.svg?v=2','/favicon.svg?v=logo-20261101').replaceAll('/favicon.ico?v=2','/favicon.ico?v=logo-20261101').replaceAll('https://klink.taalroute.nl/taalroute-menu/share-card.png','https://klink.taalroute.nl/taalroute-menu/klink-share-logo-20261101.png'));
 const menu=git('show',base+':public/taalroute-menu/menu-controls.js').toString();
 assert.equal(read('public/taalroute-menu/menu-controls.js').toString(),menu.replace("['studio','klink'].includes(id) ? 'share-card.png' : 'share-card.webp'","id === 'klink' ? 'klink-share-logo-20261101.png' : id === 'studio' ? 'share-card.png' : 'share-card.webp'"));
 for(const file of ['data/klink-compact-images-20261031.json','data/klink-image-preparation.json']){const old=JSON.parse(git('show',base+':'+file)),current=JSON.parse(read(file));assert.deepEqual(Object.keys(current).filter(k=>!(k in old)),['/taalroute-menu/klink-share-logo-20261101.png']);for(const[k,v]of Object.entries(old))assert.deepEqual(current[k],v);}
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),oldFloor=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:oldFloor.approvedUpdates},oldFloor);
 assert.deepEqual(floor.approvedUpdates,[...oldFloor.approvedUpdates,'docs/appearance-floor-20261031/approved-updates/official-logo-20261101.json']);
 const proof=JSON.parse(read('docs/official-logo-20261101/verification.json'));
 for(const key of ['onlyLogoRuntimeChange','originalFramesPreserved','desktopMobileLightDark','functionsAndStoragePreserved','oldMediaPreserved','localOnly'])assert.equal(proof[key],true,key);
 return r;
}
export function readBeforeOfficialLogo(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
