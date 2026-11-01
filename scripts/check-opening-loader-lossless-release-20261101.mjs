import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='6838c678d794469cd7a438a00f7e8e01a19ebf77',folder='docs/opening-loader-lossless-20261101/',asset='public/opening-loader-quick-20261101/klink-loader.svg';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyOpeningLoaderLosslessRelease(read=readFileSync){
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-opening-loader-lossless-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceUnchanged&&r.progressPreserved);
 assert.equal(r.userRequest,'Ja, deze is goed. Zet de kleinere versie nu op de website, met ‘Klink wordt geopend…’ eronder. Houd het formaat, de beweging en die twee seconden hetzelfde.');
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.deepEqual(changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)),[asset]);
 for(const[f,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(f)),h,f);
 const approved=json(folder+'approved-asset.json');assert.equal(read(asset).length,78160);assert.equal(sha(read(asset)),approved.optimizedSha256);assert.equal(sha(git('show',base+':'+asset)),approved.originalSha256);
 for(const f of ['components/product/klink-opening-loader.tsx','components/product/klink-opening-loader.css','components/product/classroom-boundary.tsx','public/opening-loader-v4-20261101/klink-static.svg','docs/appearance-floor-20261031/floor.json'])assert.equal(sha(read(f)),sha(git('show',base+':'+f)),f);
 const proof=json(folder+'local/equivalence.json');assert.equal(proof.imageLayers.length,3);assert(proof.imageLayers.every(x=>x.pixelIdentical));assert.equal(proof.timelines.length,2);assert(proof.timelines.every(x=>x.unchanged));assert.equal(proof.timelines.reduce((n,x)=>n+x.samples,0),20576);assert.equal(proof.browserFrames.length,104);assert(proof.browserFrames.every(x=>x.pixelIdentical));assert.deepEqual(proof.errors,[]);
 const browser=json(folder+'local/checks.json');assert.equal(browser.checks.length,16);assert.deepEqual(browser.errors,[]);
 for(const c of browser.checks){assert.equal(c.compactWidth,158);for(const k of ['visibleLabel','exactText','imageCentreUnchanged','labelBelow','noOverflow','accessible','minimumTwoSeconds','removedWhenReady','storagePreserved','routePreserved'])assert.equal(c[k],true,k);}
 const v=json(folder+'verification.json');for(const k of ['types','lint','exactApprovedAsset','pixelEquality','timelineEquality','labelAndTwoSecondsPreserved','allOtherRuntimeUnchanged','localOnly'])assert.equal(v[k],true,k);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeOpeningLoaderLossless(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
