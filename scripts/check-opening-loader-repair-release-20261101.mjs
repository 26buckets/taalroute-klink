import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='f7fb187b7901b824234d83478313dcafff7d69a4',folder='docs/opening-loader-repair-20261101/',floor='docs/appearance-floor-20261031/floor.json';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyOpeningLoaderRepair(read=readFileSync){
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-opening-loader-repair-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);assert(r.userRequests.includes('Op de Klink-website'));assert(r.userRequests.includes('Ook nog te groot, dus hij moet ook kleiner.'));git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,sort([...r.changedFiles,floor,r.approval]));assert.deepEqual(sort(Object.keys(r.files)),r.changedFiles);for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);
 const runtime=changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f));assert.deepEqual(runtime,sort(['components/product/klink-opening-loader.css','components/product/klink-opening-loader.tsx','public/opening-loader-quick-20261101/klink-loader.svg']));
 const css='components/product/klink-opening-loader.css',component='components/product/klink-opening-loader.tsx';
 assert.equal(read(css).toString(),git('show',base+':'+css).toString().replace('min(300px, 80vw)','min(158px, 80vw)'));
 assert.equal(read(component).toString(),git('show',base+':'+component).toString().replace('src="/opening-loader-v4-20261101/klink-loader.svg"','src="/opening-loader-quick-20261101/klink-loader.svg"'));
 const old=read('public/opening-loader-v4-20261101/klink-loader.svg').toString(),quick=read('public/opening-loader-quick-20261101/klink-loader.svg').toString();
 const normalize=s=>s.replaceAll('4.6s','DURATION').replaceAll('1.8s','DURATION').replace(/[\d.]+%\{/g,'TIME%{');assert.equal(normalize(old),normalize(quick),'Only retime the original artwork and route; retain all transforms and embedded images');assert(quick.includes('1.8s linear both'));
 const oldFloor=JSON.parse(git('show',base+':'+floor));assert.deepEqual(json(floor),{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,r.approval]});const approval=json(r.approval);assert.deepEqual(approval.userRequests,r.userRequests);assert.deepEqual(approval.files,Object.fromEntries(runtime.map(f=>[f,r.files[f]])));
 const browser=json(folder+'local/checks.json');assert.equal(browser.checks.length,32);assert.deepEqual(browser.errors,[]);for(const c of browser.checks){assert.equal(c.compactWidth,158);for(const k of ['visibleDuringLoad','removedWhenReady','storagePreserved','routePreserved','noFakeProgress'])assert.equal(c[k],true);if(c.reducedMotion==='reduce')assert(c.staticStable);else assert(c.actualMotion&&c.oneShot)}
 const views=json(folder+'screens/after/checks.json');assert.equal(views.checks.length,24);assert.deepEqual(views.errors,[]);assert(views.checks.every(c=>c.changedFraction<.001));
 const verification=json(folder+'verification.json');for(const k of ['types','lint','teacherRecovery','teacherPrivacy','originalArtworkPreserved','contentMediaAndStorageUnchanged','noExtraWait','localOnly'])assert.equal(verification[k],true,k);for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeOpeningLoaderRepair(file,r,read=readFileSync){return r.changedFiles.includes(file)||file===floor?git('show',base+':'+file):read(file)}
