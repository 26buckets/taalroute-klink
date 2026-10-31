import {verifyStartCompactRelease,readBeforeStartCompact} from './check-start-compact-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyPackageGridRelease(read=readFileSync){
 const successor=verifyStartCompactRelease(read),currentRead=read;read=file=>readBeforeStartCompact(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-package-grid-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'5702f1e56cc179947a1effe37372d985d011ad73');assert.equal(r.liveSourceCommit,'de60f8a4e3d62a8a717e9c4d5c1f3d36be7059f4');
 assert.equal(r.userRequest,'Deze mag een klein beetje beter op de witte kaart georganiseerd worden. Nu heb ik aan de rechterkant een heel groot wit vlak vrij. Dat wil ik niet.');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const allowed=['app/globals.css','scripts/check-word-coverage-release-20261031.mjs','scripts/check-package-grid-release-20261031.mjs','scripts/test-package-grid-release-20261031.mjs','scripts/test-sections-browser.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual([...r.changedFiles].sort((a,b)=>a.localeCompare(b)),allowed);for(const f of allowed)assert.equal(sha(read(f)),r.files[f],f);
 const before=git('show',r.baselineSourceCommit+':app/globals.css').toString();
 assert.equal(read('app/globals.css').toString(),before.replace('grid-template-columns: repeat(auto-fill, 200px); gap: 12px;','grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;').replace('grid-template-columns: repeat(2, minmax(0, 200px));','grid-template-columns: repeat(2, minmax(0, 1fr));'),'Only the two grid width declarations may change');
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.equal(approval.afterSha256,r.files['app/globals.css']);
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json'));assert(floor.approvedUpdates.includes(r.approval));
 for(const[f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 const review=JSON.parse(read('docs/package-grid-width-20261031/review.json'));for(const k of ['fullWidth','responsive','lightDark','imagesPreserved','navigation','progress','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/package-grid-width-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of allowed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforePackageGrid(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',r.baselineSourceCommit+':'+file):readBeforeStartCompact(file,r.successor,read);}
