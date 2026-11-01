import assert from 'node:assert/strict';
import {verifyWordUseRelease,readBeforeWordUse} from './check-word-use-release-20261101.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='9dd5c840cd7b6f9b819e9c683782b5920a3e829b',folder='docs/teacher-module-recovery-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=sort(['components/product/classroom-boundary.tsx','components/product/teacher-module-recovery.ts','scripts/test-teacher-module-recovery.mjs','scripts/check-dialogue-mobile-photo-release-20261101.mjs','scripts/check-teacher-module-recovery-release-20261101.mjs','scripts/test-teacher-module-recovery-release-20261101.mjs']);
export function verifyTeacherModuleRecoveryRelease(read=readFileSync){
 const successor=verifyWordUseRelease(read),currentRead=read;read=file=>readBeforeWordUse(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-teacher-module-recovery-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceUnchanged,true);assert.equal(r.baselineSourceCommit,base);
 assert(r.userRequest.includes('zet het online')&&r.userRequest.includes('alle lessen en voortgang'));
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(sort(Object.keys(r.files)),allowed);
 for(const f of allowed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','app','data','lib','public','hooks','db','drizzle','.github','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','wrangler.jsonc').length,0,'Appearance, content, media and existing storage stay unchanged');
 const boundary=read('components/product/classroom-boundary.tsx').toString(),before=git('show',base+':components/product/classroom-boundary.tsx').toString();
 assert.equal(boundary.slice(boundary.indexOf('// Check before')),before.slice(before.indexOf('// Check before')),'The existing boundary, markup and projection privacy remain unchanged');
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,4);assert.deepEqual(browser.errors,[]);assert.equal(browser.checks[0].lessons,58);assert.equal(browser.checks[0].automaticReloads,1);assert(browser.checks.slice(1).every(c=>c.lessonAndProgressIdentical));
 const appearance=JSON.parse(read(folder+'appearance-checks.json'));assert.equal(appearance.length,4);assert(appearance.every(c=>c.layoutAndStylesIdentical&&c.elementsCompared>100));
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['contentPreserved','audioPreserved','progressPreserved','appearancePreserved','projectionPrivacyPreserved','offlineNoReload','loopBounded','blockedStorageSafe','reloadKeepsHash','types','lint','curriculum','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId&&backup.sha256);assert.deepEqual(backup.files,r.files);
 return {...r,successor};
}
export function readBeforeTeacherModuleRecovery(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeWordUse(file,r.successor,read);}
